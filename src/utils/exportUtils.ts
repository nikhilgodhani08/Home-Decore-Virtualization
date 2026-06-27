import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
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
      console.warn('[Export] Permission not granted');
      return false;
    }

    const asset = await MediaLibrary.createAssetAsync(uri);
    await MediaLibrary.createAlbumAsync('HomeDecore', asset, false);

    return true;
  } catch (e) {
    console.error('[Export] saveImageToGallery error:', e);
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
  } catch (e) {
    console.error('[Export] shareImage error:', e);
  }
};

export const deleteTemporaryFile = async (uri: string): Promise<void> => {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch { }
};

export const generateThumbnailPath = (): string => {
  const base = (FileSystem as any).cacheDirectory
    ?? (FileSystem as any).documentDirectory
    ?? '';
  return `${base}thumb_${Date.now()}.png`;
};
