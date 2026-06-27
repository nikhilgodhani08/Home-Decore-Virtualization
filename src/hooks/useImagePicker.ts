import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useCanvasStore } from '../store/canvasStore';
import { useUIStore } from '../store/uiStore';

export const useImagePicker = () => {
  const [isLoading, setIsLoading] = useState(false);
  const setRoomImage = useCanvasStore(s => s.setRoomImage);
  const showSnackbar = useUIStore(s => s.showSnackbar);

  const pickFromGallery = useCallback(async (): Promise<string | null> => {
    setIsLoading(true);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showSnackbar('Permission needed to access gallery', 'error');
        return null;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
      });
      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setRoomImage(uri);
        showSnackbar('Room photo set!', 'success');
        return uri;
      }
      return null;
    } catch (e) {
      showSnackbar('Failed to pick image', 'error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [setRoomImage, showSnackbar]);

  const pickFromCamera = useCallback(async (): Promise<string | null> => {
    setIsLoading(true);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showSnackbar('Camera permission needed', 'error');
        return null;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.9,
      });
      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setRoomImage(uri);
        showSnackbar('Photo captured!', 'success');
        return uri;
      }
      return null;
    } catch (e) {
      showSnackbar('Camera error', 'error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [setRoomImage, showSnackbar]);

  return { pickFromGallery, pickFromCamera, isLoading };
};
