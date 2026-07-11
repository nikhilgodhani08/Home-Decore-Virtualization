import * as Sharing from 'expo-sharing';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';

/**
 * Save image by opening Android's share sheet.
 * The user can tap "Save to Photos" / "Download" in the share sheet.
 *
 * NOTE: expo-media-library requires a custom dev build on Expo Go (Android 13+
 * audio permission issue). expo-sharing works everywhere out of the box.
 */
export const saveImageToGallery = async (uri: string): Promise<boolean> => {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();

    if (status !== 'granted') {
      return false;
    }

    // Just create the asset in the gallery. We intentionally do NOT move it into
    // a custom album with createAlbumAsync(..., copyAsset=false), because moving
    // an existing asset triggers Android's per-photo "allow this app to modify
    // this photo?" confirmation on every save.
    await MediaLibrary.createAssetAsync(uri);

    return true;
  } catch {
    return false;
  }
};

export const shareImage = async (uri: string): Promise<void> => {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) return;
    await Sharing.shareAsync(uri, {
      mimeType: 'image/png',
      dialogTitle: 'Share your design',
    });
  } catch {
    // Sharing was cancelled or failed silently; caller's snackbar covers this.
  }
};

export const deleteTemporaryFile = async (uri: string): Promise<void> => {
  try {
    const info = await LegacyFileSystem.getInfoAsync(uri);
    if (info.exists) {
      await LegacyFileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch { }
};

// Persistent folder for project thumbnails. Using documentDirectory (app data)
// rather than the cache means previews survive OS cache eviction and app
// reinstalls, so saved designs keep their thumbnails instead of going blank.
const THUMBNAIL_DIR = `${LegacyFileSystem.documentDirectory}thumbnails/`;

const ensureThumbnailDir = async (): Promise<void> => {
  const info = await LegacyFileSystem.getInfoAsync(THUMBNAIL_DIR);
  if (!info.exists) {
    await LegacyFileSystem.makeDirectoryAsync(THUMBNAIL_DIR, { intermediates: true });
  }
};

// Copy a captured (often temporary) snapshot into persistent storage so it
// survives beyond the ViewShot capture's own lifetime.
export const persistThumbnail = async (sourceUri: string): Promise<string> => {
  await ensureThumbnailDir();
  const dest = `${THUMBNAIL_DIR}thumb_${Date.now()}.png`;
  await LegacyFileSystem.copyAsync({ from: sourceUri, to: dest });
  return dest;
};
