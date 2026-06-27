import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { CanvasItem } from '../../../types/canvas.types';
import { Colors } from '../../../theme/colors';

interface Props {
  item: CanvasItem;
  scale: number;
  isSelected: boolean;
}

const HANDLE_SIZE = 18;

export const CanvasItemRenderer: React.FC<Props> = ({ item, scale, isSelected }) => {
  const displayW = item.width * item.scaleX * scale;
  const displayH = item.height * item.scaleY * scale;
  const displayX = item.x * scale - displayW / 2;
  const displayY = item.y * scale - displayH / 2;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.container,
        {
          left: displayX,
          top: displayY,
          width: displayW,
          height: displayH,
          opacity: item.opacity,
          transform: [
            { rotate: `${item.rotation}deg` },
            { scaleX: item.isFlippedH ? -1 : 1 },
            { scaleY: item.isFlippedV ? -1 : 1 },
          ],
        },
      ]}
    >
      {/* Selection border */}
      {isSelected && !item.isLocked && (
        <View style={styles.selectionBorder} />
      )}
      {isSelected && item.isLocked && (
        <View style={styles.lockedBorder} />
      )}

      {/* The actual decor photo */}
      <Image
        source={{ uri: item.imageUri }}
        style={styles.image}
        resizeMode="contain"
      />

      {/* Resize handles shown when selected */}
      {isSelected && !item.isLocked && (
        <>
          <View style={[styles.handle, styles.handleTL]} />
          <View style={[styles.handle, styles.handleTR]} />
          <View style={[styles.handle, styles.handleBL]} />
          <View style={[styles.handle, styles.handleBR]} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  selectionBorder: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 4,
    borderStyle: 'dashed',
    zIndex: 10,
  },
  lockedBorder: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: 4,
    borderStyle: 'dashed',
    zIndex: 10,
  },
  handle: {
    position: 'absolute',
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
    zIndex: 11,
  },
  handleTL: { top: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2 },
  handleTR: { top: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2 },
  handleBL: { bottom: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2 },
  handleBR: { bottom: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2 },
});
