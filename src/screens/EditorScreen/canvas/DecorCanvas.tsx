import React, { useRef } from 'react';
import {
  View, StyleSheet, Image, Dimensions, Text,
  PanResponder, PanResponderGestureState,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCanvasStore } from '../../../store/canvasStore';
import { Colors } from '../../../theme/colors';
import { Spacing, BorderRadius } from '../../../theme/spacing';
import { Typography } from '../../../theme/typography';
import { getItemAtPoint, sortByZIndex } from '../../../utils/canvasUtils';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../utils/constants';
import { CanvasItemRenderer } from './CanvasItem';
import { CanvasItem } from '../../../types/canvas.types';

const { width: SCREEN_W } = Dimensions.get('window');
const CANVAS_SCALE = (SCREEN_W - Spacing.lg * 2) / CANVAS_WIDTH;
const DISPLAY_W = CANVAS_WIDTH * CANVAS_SCALE;
const DISPLAY_H = CANVAS_HEIGHT * CANVAS_SCALE;

// How many SCREEN pixels away from a handle counts as a hit
const HANDLE_HIT_RADIUS = 24;

interface DecorCanvasProps {
  onItemSelect: (id: string | null) => void;
}

type GestureMode = 'idle' | 'drag' | 'resize' | 'pinch';

export const DecorCanvas: React.FC<DecorCanvasProps> = ({ onItemSelect }) => {
  const items = useCanvasStore(s => s.items);
  const roomImageUri = useCanvasStore(s => s.roomImageUri);
  const selectedItemId = useCanvasStore(s => s.selectedItemId);
  const updateItem = useCanvasStore(s => s.updateItem);
  const pushHistory = useCanvasStore(s => s.pushHistory);
  const showGuides = useCanvasStore(s => s.showGuides);

  // Gesture state refs (no re-render overhead)
  const mode = useRef<GestureMode>('idle');
  const activeId = useRef<string | null>(null);
  const interactionStarted = useRef(false);

  // Drag refs
  const itemStartX = useRef(0);
  const itemStartY = useRef(0);

  // Resize refs
  const initialScaleX = useRef(1);
  const initialScaleY = useRef(1);
  const initialItemW = useRef(0);  // item.width * scaleX in canvas units
  const initialItemH = useRef(0);  // item.height * scaleY in canvas units
  const initialDistFromCenter = useRef(1); // screen pixels
  const initialPinchDist = useRef(1); // screen pixels for 2-finger zoom

  // Tap detection
  const tapX = useRef(0);
  const tapY = useRef(0);
  const tapTime = useRef(0);

  // ── Helper: screen px → canvas coords ──────────────────────────────────
  const toCanvas = (px: number, py: number) => ({
    x: px / CANVAS_SCALE,
    y: py / CANVAS_SCALE,
  });

  // ── Helper: check if screen point (sx,sy) is near a corner handle ───────
  const getHitHandle = (
    sx: number, sy: number,
    item: CanvasItem,
  ): boolean => {
    const halfW = (item.width * item.scaleX * CANVAS_SCALE) / 2;
    const halfH = (item.height * item.scaleY * CANVAS_SCALE) / 2;
    // Item centre in screen pixels
    const cx = item.x * CANVAS_SCALE;
    const cy = item.y * CANVAS_SCALE;
    // 4 corners in screen pixels
    const corners = [
      { x: cx - halfW, y: cy - halfH }, // TL
      { x: cx + halfW, y: cy - halfH }, // TR
      { x: cx - halfW, y: cy + halfH }, // BL
      { x: cx + halfW, y: cy + halfH }, // BR
    ];
    return corners.some(
      c => Math.hypot(sx - c.x, sy - c.y) <= HANDLE_HIT_RADIUS
    );
  };

  // ── PanResponder ────────────────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 3 || Math.abs(gs.dy) > 3,

      onPanResponderGrant: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        tapX.current = locationX;
        tapY.current = locationY;
        tapTime.current = Date.now();
        mode.current = 'idle';
        activeId.current = null;
        interactionStarted.current = false;

        const currentItems = useCanvasStore.getState().items;
        const currentSelectedId = useCanvasStore.getState().selectedItemId;
        const selectedItem = currentItems.find(i => i.id === currentSelectedId);

        // 1️⃣ Check if touching a corner handle of the selected item
        if (selectedItem && !selectedItem.isLocked) {
          if (getHitHandle(locationX, locationY, selectedItem)) {
            mode.current = 'resize';
            activeId.current = selectedItem.id;

            // Record initial dimensions and distance from center in screen px
            const cx = selectedItem.x * CANVAS_SCALE;
            const cy = selectedItem.y * CANVAS_SCALE;
            initialScaleX.current = selectedItem.scaleX;
            initialScaleY.current = selectedItem.scaleY;
            initialItemW.current = selectedItem.width * selectedItem.scaleX;
            initialItemH.current = selectedItem.height * selectedItem.scaleY;
            initialDistFromCenter.current =
              Math.hypot(locationX - cx, locationY - cy) || 1;
            return;
          }
        }

        // 2️⃣ Check if touching an item body → drag
        const { x, y } = toCanvas(locationX, locationY);
        const hit = getItemAtPoint(currentItems, x, y);
        if (hit && !hit.isLocked) {
          mode.current = 'drag';
          activeId.current = hit.id;
          itemStartX.current = hit.x;
          itemStartY.current = hit.y;
        }
      },

      onPanResponderMove: (e, gs: PanResponderGestureState) => {
        const touches = e.nativeEvent.touches;

        if (touches.length >= 2 && activeId.current) {
          // ── Pinch to zoom ───────────────────────────────────────────────
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const currentDist = Math.hypot(dx, dy) || 1;

          if (mode.current !== 'pinch') {
            mode.current = 'pinch';
            initialPinchDist.current = currentDist;

            const currentItems = useCanvasStore.getState().items;
            const item = currentItems.find(i => i.id === activeId.current);
            if (item) {
              initialScaleX.current = item.scaleX;
              initialScaleY.current = item.scaleY;
            }
          } else {
            const ratio = currentDist / initialPinchDist.current;
            const newScaleX = Math.max(0.1, Math.min(5, initialScaleX.current * ratio));
            const newScaleY = Math.max(0.1, Math.min(5, initialScaleY.current * ratio));
            updateItem(activeId.current, { scaleX: newScaleX, scaleY: newScaleY });
          }

          if (!interactionStarted.current) {
            interactionStarted.current = true;
            onItemSelect(null);
          }
          return;
        }

        if (!interactionStarted.current && (Math.abs(gs.dx) > 3 || Math.abs(gs.dy) > 3)) {
          interactionStarted.current = true;
          onItemSelect(null);
        }

        if (mode.current === 'drag' && activeId.current) {
          // ── Drag: use total delta from gesture start ──────────────────
          const newX = itemStartX.current + gs.dx / CANVAS_SCALE;
          const newY = itemStartY.current + gs.dy / CANVAS_SCALE;
          updateItem(activeId.current, {
            x: Math.max(0, Math.min(CANVAS_WIDTH, newX)),
            y: Math.max(0, Math.min(CANVAS_HEIGHT, newY)),
          });

        } else if (mode.current === 'resize' && activeId.current) {
          // ── Resize: scale based on distance from item centre ──────────
          const { locationX, locationY } = e.nativeEvent;
          const currentItems = useCanvasStore.getState().items;
          const item = currentItems.find(i => i.id === activeId.current);
          if (!item) return;

          const cx = item.x * CANVAS_SCALE;
          const cy = item.y * CANVAS_SCALE;
          const currentDist = Math.hypot(locationX - cx, locationY - cy);

          // ratio of how much the distance changed
          const ratio = currentDist / initialDistFromCenter.current;

          // New scale values (keep aspect ratio)
          const newScaleX = Math.max(0.1, Math.min(5, initialScaleX.current * ratio));
          const newScaleY = Math.max(0.1, Math.min(5, initialScaleY.current * ratio));

          updateItem(activeId.current, { scaleX: newScaleX, scaleY: newScaleY });
        }
      },

      onPanResponderRelease: (e) => {
        const elapsed = Date.now() - tapTime.current;
        const { locationX, locationY } = e.nativeEvent;
        const movedFar =
          Math.abs(locationX - tapX.current) > 8 ||
          Math.abs(locationY - tapY.current) > 8;

        if (!movedFar && elapsed < 350) {
          // Pure tap → select / deselect
          const { x, y } = toCanvas(locationX, locationY);
          const currentItems = useCanvasStore.getState().items;
          const hit = getItemAtPoint(currentItems, x, y);
          onItemSelect(hit?.id ?? null);
        } else {
          // It was a drag, resize, or pinch
          if ((mode.current === 'drag' || mode.current === 'resize' || mode.current === 'pinch') && activeId.current) {
            pushHistory();
            // We intentionally DO NOT call onItemSelect here.
            // Dragging an unselected item should not pop open the drawer.
          }
        }

        mode.current = 'idle';
        activeId.current = null;
      },

      onPanResponderTerminate: () => {
        mode.current = 'idle';
        activeId.current = null;
      },
    })
  ).current;

  const sortedItems = sortByZIndex(items);

  return (
    <View style={styles.wrapper}>
      <View
        style={[styles.canvas, { width: DISPLAY_W, height: DISPLAY_H }]}
        {...panResponder.panHandlers}
      >
        {/* Room background */}
        {roomImageUri ? (
          <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <Image
              source={{ uri: roomImageUri }}
              style={styles.bgImage}
              resizeMode="cover"
            />
          </View>
        ) : (
          <View style={styles.emptyBg} pointerEvents="none">
            <MaterialCommunityIcons name="floor-plan" size={60} color={Colors.borderDark} />
            <Text style={styles.emptyText}>
              {'Use the buttons below\nto choose a room photo'}
            </Text>
          </View>
        )}

        {/* Alignment guides */}
        {showGuides && selectedItemId && (
          <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
            <View style={[styles.guideLine, styles.guideH, { top: DISPLAY_H / 2 }]} />
            <View style={[styles.guideLine, styles.guideV, { left: DISPLAY_W / 2 }]} />
          </View>
        )}

        {/* Decor items — pointerEvents="none" so touches reach canvas */}
        {sortedItems.map(item => (
          <CanvasItemRenderer
            key={item.id}
            item={item}
            scale={CANVAS_SCALE}
            isSelected={item.id === selectedItemId}
          />
        ))}

        {/* Hint when no items added yet */}
        {items.length === 0 && roomImageUri && (
          <View style={styles.hintContainer} pointerEvents="none">
            <Text style={styles.hintText}>
              👆 Tap "Add Decor Item" below to start
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.lg,
  },
  canvas: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceElevatedDark,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
  },
  emptyBg: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondaryDark,
    textAlign: 'center',
    lineHeight: 24,
  },
  guideLine: {
    position: 'absolute',
    backgroundColor: Colors.primary + '60',
  },
  guideH: { left: 0, right: 0, height: 1 },
  guideV: { top: 0, bottom: 0, width: 1 },
  hintContainer: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintText: {
    ...Typography.caption,
    color: Colors.white,
    backgroundColor: Colors.overlay,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
});

export { DISPLAY_W, DISPLAY_H, CANVAS_SCALE };
