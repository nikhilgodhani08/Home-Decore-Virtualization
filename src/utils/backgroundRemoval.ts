/**
 * Background Removal Service
 *
 * Supports two modes:
 *  1. Normal  – uses @six33/react-native-bg-removal (on-device, free)
 *  2. Advanced – uses Clipdrop API (cloud HD quality)
 */

import { File, Paths } from 'expo-file-system';
import * as LegacyFileSystem from 'expo-file-system/legacy';
// ── Config ────────────────────────────────────────────────────────────────────
const CLIPDROP_API_KEY =
  'bb51f90e3cee89c24e92df60527cb6085272232dbb61a3b0d52d14f16dc59633d83d6ecf7a988d76bd0b8570de05f9bc';

const CLIPDROP_URL = 'https://clipdrop-api.co/remove-background/v1';

// ── Type guard for six33 module ───────────────────────────────────────────────
let bgRemovalModule: {
  removeBackground: (uri: string) => Promise<string>;
  isNativeBackgroundRemovalSupported: () => Promise<boolean>;
} | null = null;

try {
  bgRemovalModule = require('@six33/react-native-bg-removal');
} catch {
  bgRemovalModule = null;
}

// ── Normal Remove (local / free) ──────────────────────────────────────────────
export async function removeBackgroundLocal(
  imageUri: string
): Promise<string> {
  if (!bgRemovalModule) {
    throw new Error(
      'Native background removal is not available in Expo Go.\n' +
      'Please use Advanced Remove (Clipdrop) or build a development client.'
    );
  }

  const supported =
    await bgRemovalModule.isNativeBackgroundRemovalSupported();

  if (!supported) {
    throw new Error(
      'Your device does not support on-device background removal.'
    );
  }

  return await bgRemovalModule.removeBackground(imageUri);
}

// ── Advanced Remove (Clipdrop API) ────────────────────────────────────────────
export async function removeBackgroundClipdrop(
  imageUri: string
): Promise<string> {

  // ✅ Convert content:// → file:// (important for Android)
  if (imageUri.startsWith('content://')) {
    const tempFile = new File(Paths.cache, `temp_${Date.now()}.jpg`);

    await LegacyFileSystem.copyAsync({
      from: imageUri,
      to: tempFile.uri,
    });

    imageUri = tempFile.uri;
  }

  const formData = new FormData();

  formData.append('image_file', {
    uri: imageUri,
    name: 'photo.jpg',
    type: 'image/jpeg',
  } as any);

  const response = await fetch(CLIPDROP_URL, {
    method: 'POST',
    headers: {
      'x-api-key': CLIPDROP_API_KEY,
      Accept: 'application/json',

    },
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    console.log('Clipdrop Error:', response.status, errText);
    throw new Error(
      `Clipdrop API error (${response.status}): ${errText}`
    );
  }

  // ✅ Get binary response
  const arrayBuffer = await response.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);

  // ✅ Save using NEW Expo FileSystem API (File class, no base64 needed)
  const outputFile = new File(Paths.cache, `bg_removed_${Date.now()}.png`);
  outputFile.write(uint8);

  return outputFile.uri;

}