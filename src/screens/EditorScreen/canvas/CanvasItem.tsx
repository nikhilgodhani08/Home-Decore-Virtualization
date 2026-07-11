import React from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CanvasItem } from '../../../types/canvas.types';
import { Colors } from '../../../theme/colors';

interface Props {
  item: CanvasItem;
  scale: number;
  isSelected: boolean;
}

const HANDLE_SIZE = 18;
const ROTATE_SIZE = 24;
// Visual gap (screen px) between the item's top edge and the rotation handle.
export const ROTATE_HANDLE_GAP = 28;

// Renders one decor item on the canvas at its current position/transform
const CanvasItemRendererBase: React.FC<Props> = ({ item, scale, isSelected }) => {
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

      {/* Resize + rotate handles shown when selected */}
      {isSelected && !item.isLocked && (
        <>
          <View style={[styles.handle, styles.handleTL]} />
          <View style={[styles.handle, styles.handleTR]} />
          <View style={[styles.handle, styles.handleBL]} />
          <View style={[styles.handle, styles.handleBR]} />

          {/* Rotation handle (top-center) */}
          <View style={styles.rotateStem} pointerEvents="none" />
          <View style={styles.rotateHandle} pointerEvents="none">
            <MaterialCommunityIcons name="rotate-right" size={14} color={Colors.primary} />
          </View>
        </>
      )}

      {/* Background removal in progress */}
      {item.isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="small" color={Colors.white} />
        </View>
      )}
    </View>
  );
};

// Memoized: only the item whose props actually changed re-renders, instead of
// every item on every drag/resize/rotate gesture frame (60fps).
export const CanvasItemRenderer = React.memo(CanvasItemRendererBase);

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
    borderColor: Colors.warning,
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
  rotateStem: {
    position: 'absolute',
    top: -ROTATE_HANDLE_GAP + ROTATE_SIZE / 2,
    left: '50%',
    marginLeft: -1,
    width: 2,
    height: ROTATE_HANDLE_GAP - ROTATE_SIZE / 2,
    backgroundColor: Colors.primary,
    zIndex: 11,
  },
  rotateHandle: {
    position: 'absolute',
    top: -ROTATE_HANDLE_GAP - ROTATE_SIZE / 2,
    left: '50%',
    marginLeft: -ROTATE_SIZE / 2,
    width: ROTATE_SIZE,
    height: ROTATE_SIZE,
    borderRadius: ROTATE_SIZE / 2,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 12,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
});
