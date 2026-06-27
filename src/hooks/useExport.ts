import { useState, useCallback } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { useUIStore } from '../store/uiStore';
import { saveImageToGallery, shareImage } from '../utils/exportUtils';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';

export const useExport = () => {
  const [exportUri, setExportUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const showSnackbar = useUIStore(s => s.showSnackbar);

  const saveToGallery = useCallback(async (uri: string) => {
    setIsSaving(true);
    try {
      const success = await saveImageToGallery(uri);
      if (success) {
        showSnackbar('Saved to gallery! 🎉', 'success');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        showSnackbar('Could not save to gallery', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  }, [showSnackbar]);

  const share = useCallback(async (uri: string) => {
    try {
      await shareImage(uri);
    } catch (e) {
      showSnackbar('Could not share design', 'error');
    }
  }, [showSnackbar]);

  const clearExport = useCallback(async () => {
    if (exportUri) {
      try {
        await FileSystem.deleteAsync(exportUri, { idempotent: true });
      } catch {}
      setExportUri(null);
    }
  }, [exportUri]);

  return { exportUri, setExportUri, saveToGallery, share, clearExport, isSaving };
};
