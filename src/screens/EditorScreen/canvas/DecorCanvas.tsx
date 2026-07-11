import React, { useRef, useState } from 'react';
import {
  View, StyleSheet, Image, Dimensions, Text,
  PanResponder, PanResponderGestureState,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCanvasStore } from '../../../store/canvasStore';
import { useUIStore } from '../../../store/uiStore';
import { Colors } from '../../../theme/colors';
import { Spacing, BorderRadius } from '../../../theme/spacing';
import { Typography } from '../../../theme/typography';
import { getItemAtPoint, sortByZIndex } from '../../../utils/canvasUtils';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';
import { CanvasItemRenderer, ROTATE_HANDLE_GAP } from './CanvasItem';
import { CanvasItem } from '../../../types/canvas.types';

const { width: SCREEN_W } = Dimensions.get('window');
const CANVAS_SCALE = (SCREEN_W - Spacing.lg * 2) / CANVAS_WIDTH;
const DISPLAY_W = CANVAS_WIDTH * CANVAS_SCALE;
const DISPLAY_H = CANVAS_HEIGHT * CANVAS_SCALE;

// How many SCREEN pixels away from a handle counts as a hit
const HANDLE_HIT_RADIUS = 24;

// How close (in screen px) a dragged edge/center needs to be to a guide to snap
const SNAP_PX = 8;
const SNAP_THRESHOLD = SNAP_PX / CANVAS_SCALE; // canvas-space units

// Collect candidate snap lines (canvas center + every other item's center/edges)
function getSnapTargets(items: CanvasItem[]) {
  const xs: number[] = [CANVAS_WIDTH / 2];
  const ys: number[] = [CANVAS_HEIGHT / 2];
  items.forEach(it => {
    const halfW = (it.width * it.scaleX) / 2;
    const halfH = (it.height * it.scaleY) / 2;
    xs.push(it.x, it.x - halfW, it.x + halfW);
    ys.push(it.y, it.y - halfH, it.y + halfH);
  });
  return { xs, ys };
}

// Check the dragged item's center + both edges on one axis against candidate
// targets; snap the axis value if any of the three lands within threshold.
function snapAxis(center: number, halfSize: number, targets: number[]): { value: number; guide: number | null } {
  const candidates = [
    { pos: center, offset: 0 },
    { pos: center - halfSize, offset: -halfSize },
    { pos: center + halfSize, offset: halfSize },
  ];
  for (const target of targets) {
    for (const c of candidates) {
      if (Math.abs(c.pos - target) <= SNAP_THRESHOLD) {
        return { value: target - c.offset, guide: target };
      }
    }
  }
  return { value: center, guide: null };
}

interface DecorCanvasProps {
  onItemSelect: (id: string | null) => void;
}

type GestureMode = 'idle' | 'drag' | 'resize' | 'pinch' | 'group-drag' | 'rotate';

export const DecorCanvas: React.FC<DecorCanvasProps> = ({ onItemSelect }) => {
  const items = useCanvasStore(s => s.items);
  const roomImageUri = useCanvasStore(s => s.roomImageUri);
  const selectedItemId = useCanvasStore(s => s.selectedItemId);
  const selectedItemIds = useCanvasStore(s => s.selectedItemIds);
  const updateItem = useCanvasStore(s => s.updateItem);
  const moveItemsBy = useCanvasStore(s => s.moveItemsBy);
  const toggleMultiSelect = useCanvasStore(s => s.toggleMultiSelect);
  const pushHistory = useCanvasStore(s => s.pushHistory);
  const showGuides = useCanvasStore(s => s.showGuides);
  const isMultiSelectMode = useUIStore(s => s.isMultiSelectMode);

  // Active snap guide lines (canvas-space coords), shown only while dragging
  const [activeGuides, setActiveGuides] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });

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
  const initialPinchAngle = useRef(0); // degrees, for 2-finger rotate
  const initialRotation = useRef(0); // item.rotation at pinch/rotate start
  const rotateStartAngle = useRef(0); // center→touch angle at rotate-handle grab

  // Group-drag refs (multi-select mode)
  const groupDragIds = useRef<string[]>([]);
  const lastGroupDx = useRef(0);
  const lastGroupDy = useRef(0);

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

  // ── Helper: check if screen point is near the rotation handle ───────────
  const getHitRotateHandle = (sx: number, sy: number, item: CanvasItem): boolean => {
    const halfH = (item.height * item.scaleY * CANVAS_SCALE) / 2;
    const cx = item.x * CANVAS_SCALE;
    const cy = item.y * CANVAS_SCALE;
    const rad = (item.rotation * Math.PI) / 180;
    const dist = halfH + ROTATE_HANDLE_GAP;
    // Handle sits above the top-center, rotated around the item's center
    const hx = cx + dist * Math.sin(rad);
    const hy = cy - dist * Math.cos(rad);
    return Math.hypot(sx - hx, sy - hy) <= HANDLE_HIT_RADIUS;
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

        // 1️⃣ Check if touching the rotation handle of the selected item
        if (selectedItem && !selectedItem.isLocked) {
          if (getHitRotateHandle(locationX, locationY, selectedItem)) {
            mode.current = 'rotate';
            activeId.current = selectedItem.id;
            const cx = selectedItem.x * CANVAS_SCALE;
            const cy = selectedItem.y * CANVAS_SCALE;
            initialRotation.current = selectedItem.rotation;
            rotateStartAngle.current = Math.atan2(locationY - cy, locationX - cx) * (180 / Math.PI);
            return;
          }
        }

        // 2️⃣ Check if touching a corner handle of the selected item
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

        // 2️⃣ Check if touching an item that's part of the active multi-selection → move the whole group
        const { x, y } = toCanvas(locationX, locationY);
        const hit = getItemAtPoint(currentItems, x, y);
        const currentSelectedIds = useCanvasStore.getState().selectedItemIds;
        if (isMultiSelectMode && currentSelectedIds.length > 0 && hit && currentSelectedIds.includes(hit.id) && !hit.isLocked) {
          mode.current = 'group-drag';
          groupDragIds.current = currentSelectedIds;
          lastGroupDx.current = 0;
          lastGroupDy.current = 0;
          return;
        }

        // 3️⃣ Otherwise, touching an item body → single drag
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
          // ── Pinch to zoom + rotate ───────────────────────────────────────
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const currentDist = Math.hypot(dx, dy) || 1;
          const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);

          if (mode.current !== 'pinch') {
            mode.current = 'pinch';
            initialPinchDist.current = currentDist;
            initialPinchAngle.current = currentAngle;

            const currentItems = useCanvasStore.getState().items;
            const item = currentItems.find(i => i.id === activeId.current);
            if (item) {
              initialScaleX.current = item.scaleX;
              initialScaleY.current = item.scaleY;
              initialRotation.current = item.rotation;
            }
          } else {
            const ratio = currentDist / initialPinchDist.current;
            const newScaleX = Math.max(0.1, Math.min(5, initialScaleX.current * ratio));
            const newScaleY = Math.max(0.1, Math.min(5, initialScaleY.current * ratio));
            const angleDelta = currentAngle - initialPinchAngle.current;
            const newRotation = ((initialRotation.current + angleDelta) % 360 + 360) % 360;
            updateItem(activeId.current, { scaleX: newScaleX, scaleY: newScaleY, rotation: newRotation });
          }

          if (!interactionStarted.current) {
            interactionStarted.current = true;
            onItemSelect(null);
          }
          return;
        }

        if (!interactionStarted.current && (Math.abs(gs.dx) > 3 || Math.abs(gs.dy) > 3)) {
          interactionStarted.current = true;
          // Only dragging the item body should collapse the selection UI;
          // resize/rotate keep the item selected so their handles stay visible.
          if (mode.current === 'drag') onItemSelect(null);
        }

        if (mode.current === 'rotate' && activeId.current) {
          // ── Rotate: angle of center→touch, offset by the grab angle ──────
          const { locationX, locationY } = e.nativeEvent;
          const currentItems = useCanvasStore.getState().items;
          const item = currentItems.find(i => i.id === activeId.current);
          if (item) {
            const cx = item.x * CANVAS_SCALE;
            const cy = item.y * CANVAS_SCALE;
            const currentAngle = Math.atan2(locationY - cy, locationX - cx) * (180 / Math.PI);
            const delta = currentAngle - rotateStartAngle.current;
            const newRotation = (((initialRotation.current + delta) % 360) + 360) % 360;
            updateItem(activeId.current, { rotation: newRotation });
          }
        } else if (mode.current === 'drag' && activeId.current) {
          // ── Drag: use total delta from gesture start ──────────────────
          const rawX = itemStartX.current + gs.dx / CANVAS_SCALE;
          const rawY = itemStartY.current + gs.dy / CANVAS_SCALE;
          const clampedX = Math.max(0, Math.min(CANVAS_WIDTH, rawX));
          const clampedY = Math.max(0, Math.min(CANVAS_HEIGHT, rawY));

          const currentItems = useCanvasStore.getState().items;
          const activeItem = currentItems.find(i => i.id === activeId.current);
          const others = currentItems.filter(i => i.id !== activeId.current);
          const halfW = activeItem ? (activeItem.width * activeItem.scaleX) / 2 : 0;
          const halfH = activeItem ? (activeItem.height * activeItem.scaleY) / 2 : 0;
          const { xs, ys } = getSnapTargets(others);

          const snapX = snapAxis(clampedX, halfW, xs);
          const snapY = snapAxis(clampedY, halfH, ys);

          updateItem(activeId.current, { x: snapX.value, y: snapY.value });
          setActiveGuides({ x: snapX.guide, y: snapY.guide });

        } else if (mode.current === 'group-drag' && groupDragIds.current.length > 0) {
          // ── Group drag: apply the incremental screen delta to every selected item ──
          const dxDelta = (gs.dx - lastGroupDx.current) / CANVAS_SCALE;
          const dyDelta = (gs.dy - lastGroupDy.current) / CANVAS_SCALE;
          lastGroupDx.current = gs.dx;
          lastGroupDy.current = gs.dy;
          moveItemsBy(groupDragIds.current, dxDelta, dyDelta);

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
          // Pure tap → select / deselect (or toggle membership, in multi-select mode)
          const { x, y } = toCanvas(locationX, locationY);
          const currentItems = useCanvasStore.getState().items;
          const hit = getItemAtPoint(currentItems, x, y);
          if (isMultiSelectMode) {
            if (hit) toggleMultiSelect(hit.id);
          } else {
            onItemSelect(hit?.id ?? null);
          }
        } else if (mode.current === 'group-drag' && groupDragIds.current.length > 0) {
          pushHistory();
        } else {
          // It was a drag, resize, pinch, or rotate
          if (
            (mode.current === 'drag' || mode.current === 'resize' ||
              mode.current === 'pinch' || mode.current === 'rotate') &&
            activeId.current
          ) {
            pushHistory();
            // We intentionally DO NOT call onItemSelect here.
            // Dragging an unselected item should not pop open the drawer.
          }
        }

        mode.current = 'idle';
        activeId.current = null;
        groupDragIds.current = [];
        setActiveGuides({ x: null, y: null });
      },

      onPanResponderTerminate: () => {
        mode.current = 'idle';
        activeId.current = null;
        groupDragIds.current = [];
        setActiveGuides({ x: null, y: null });
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

        {/* Smart snap guides — only shown for the axis currently snapped while dragging */}
        {showGuides && (activeGuides.x !== null || activeGuides.y !== null) && (
          <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
            {activeGuides.y !== null && (
              <View style={[styles.guideLine, styles.guideH, { top: activeGuides.y * CANVAS_SCALE }]} />
            )}
            {activeGuides.x !== null && (
              <View style={[styles.guideLine, styles.guideV, { left: activeGuides.x * CANVAS_SCALE }]} />
            )}
          </View>
        )}

        {/* Decor items — pointerEvents="none" so touches reach canvas */}
        {sortedItems.map(item => (
          <CanvasItemRenderer
            key={item.id}
            item={item}
            scale={CANVAS_SCALE}
            isSelected={isMultiSelectMode ? selectedItemIds.includes(item.id) : item.id === selectedItemId}
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
