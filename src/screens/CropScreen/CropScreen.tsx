import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  PanResponder, LayoutChangeEvent, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import { RootStackParamList } from '../../types/navigation.types';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { useCanvasStore } from '../../store/canvasStore';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CropScreen'>;
  route: RouteProp<RootStackParamList, 'CropScreen'>;
};

type Rect = { x: number; y: number; w: number; h: number };
type Disp = { dispW: number; dispH: number; offsetX: number; offsetY: number };
type CropMode = 'move' | 'tl' | 'tr' | 'bl' | 'br';

const HANDLE_TOUCH = 44; // px radius to grab a corner
const MIN_SIZE = 48;

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

const CropScreen: React.FC<Props> = ({ navigation, route }) => {
  const { itemId, imageUri } = route.params;
  const updateItem = useCanvasStore(s => s.updateItem);

  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [container, setContainer] = useState<{ w: number; h: number } | null>(null);
  const [crop, setCrop] = useState<Rect | null>(null);
  const [applying, setApplying] = useState(false);

  // Live refs so the (single) PanResponder always sees current values
  const cropRef = useRef<Rect | null>(null);
  const dispRef = useRef<Disp | null>(null);
  const startRef = useRef<Rect | null>(null);
  const modeRef = useRef<CropMode>('move');

  // Load natural image dimensions
  useEffect(() => {
    Image.getSize(
      imageUri,
      (width, height) => setImageSize({ width, height }),
      () => setImageSize({ width: 1, height: 1 }),
    );
  }, [imageUri]);

  // Compute the displayed (contain-fit) image rect and seed the crop box
  const disp: Disp | null = React.useMemo(() => {
    if (!imageSize || !container) return null;
    const scale = Math.min(container.w / imageSize.width, container.h / imageSize.height);
    const dispW = imageSize.width * scale;
    const dispH = imageSize.height * scale;
    return {
      dispW,
      dispH,
      offsetX: (container.w - dispW) / 2,
      offsetY: (container.h - dispH) / 2,
    };
  }, [imageSize, container]);

  useEffect(() => {
    dispRef.current = disp;
    if (disp && !cropRef.current) {
      const seed: Rect = {
        x: disp.dispW * 0.1,
        y: disp.dispH * 0.1,
        w: disp.dispW * 0.8,
        h: disp.dispH * 0.8,
      };
      cropRef.current = seed;
      setCrop(seed);
    }
  }, [disp]);

  const onContainerLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setContainer({ w: width, h: height });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (e) => {
        const d = dispRef.current;
        const c = cropRef.current;
        if (!d || !c) return;
        const { locationX, locationY } = e.nativeEvent;
        const rx = d.offsetX + c.x;
        const ry = d.offsetY + c.y;
        const corners: Record<Exclude<CropMode, 'move'>, [number, number]> = {
          tl: [rx, ry],
          tr: [rx + c.w, ry],
          bl: [rx, ry + c.h],
          br: [rx + c.w, ry + c.h],
        };
        let picked: CropMode = 'move';
        let best = HANDLE_TOUCH;
        (Object.keys(corners) as Array<Exclude<CropMode, 'move'>>).forEach(k => {
          const [hx, hy] = corners[k];
          const dist = Math.hypot(locationX - hx, locationY - hy);
          if (dist <= best) { best = dist; picked = k; }
        });
        modeRef.current = picked;
        startRef.current = { ...c };
      },

      onPanResponderMove: (_, gs) => {
        const d = dispRef.current;
        const s = startRef.current;
        if (!d || !s) return;
        let { x, y, w, h } = s;
        const { dx, dy } = gs;

        switch (modeRef.current) {
          case 'move':
            x = clamp(s.x + dx, 0, d.dispW - s.w);
            y = clamp(s.y + dy, 0, d.dispH - s.h);
            break;
          case 'br':
            w = clamp(s.w + dx, MIN_SIZE, d.dispW - s.x);
            h = clamp(s.h + dy, MIN_SIZE, d.dispH - s.y);
            break;
          case 'tl': {
            const nx = clamp(s.x + dx, 0, s.x + s.w - MIN_SIZE);
            const ny = clamp(s.y + dy, 0, s.y + s.h - MIN_SIZE);
            w = s.w + (s.x - nx);
            h = s.h + (s.y - ny);
            x = nx; y = ny;
            break;
          }
          case 'tr': {
            const ny = clamp(s.y + dy, 0, s.y + s.h - MIN_SIZE);
            w = clamp(s.w + dx, MIN_SIZE, d.dispW - s.x);
            h = s.h + (s.y - ny);
            y = ny;
            break;
          }
          case 'bl': {
            const nx = clamp(s.x + dx, 0, s.x + s.w - MIN_SIZE);
            w = s.w + (s.x - nx);
            h = clamp(s.h + dy, MIN_SIZE, d.dispH - s.y);
            x = nx;
            break;
          }
        }
        const next = { x, y, w, h };
        cropRef.current = next;
        setCrop(next);
      },
    })
  ).current;

  const handleApply = async () => {
    const d = dispRef.current;
    const c = cropRef.current;
    if (!d || !c || !imageSize) {
      navigation.goBack();
      return;
    }
    setApplying(true);
    try {
      const scale = imageSize.width / d.dispW; // image px per display px
      const originX = clamp(Math.round(c.x * scale), 0, imageSize.width - 1);
      const originY = clamp(Math.round(c.y * scale), 0, imageSize.height - 1);
      const width = clamp(Math.round(c.w * scale), 1, imageSize.width - originX);
      const height = clamp(Math.round(c.h * scale), 1, imageSize.height - originY);

      const result = await manipulateAsync(
        imageUri,
        [{ crop: { originX, originY, width, height } }],
        { compress: 1, format: SaveFormat.PNG },
      );
      updateItem(itemId, { imageUri: result.uri });
      navigation.goBack();
    } catch {
      setApplying(false);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Cancel crop"
          >
            <MaterialCommunityIcons name="close" size={22} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.title}>Crop Item</Text>
          <TouchableOpacity
            style={[styles.applyBtn, applying && styles.disabled]}
            onPress={handleApply}
            disabled={applying}
            accessibilityLabel="Apply crop"
          >
            {applying
              ? <ActivityIndicator size="small" color={Colors.white} />
              : <Text style={styles.applyBtnText}>Done</Text>}
          </TouchableOpacity>
        </View>

        {/* Crop area */}
        <View style={styles.cropArea} onLayout={onContainerLayout} {...panResponder.panHandlers}>
          {disp && (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: disp.offsetX,
                top: disp.offsetY,
                width: disp.dispW,
                height: disp.dispH,
              }}
            >
              <Image
                source={{ uri: imageUri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            </View>
          )}

          {disp && crop && (
            <>
              {/* Dim overlay outside the crop box (four bands) */}
              <View pointerEvents="none" style={[styles.dim, {
                left: disp.offsetX, top: disp.offsetY, width: disp.dispW, height: crop.y,
              }]} />
              <View pointerEvents="none" style={[styles.dim, {
                left: disp.offsetX, top: disp.offsetY + crop.y + crop.h,
                width: disp.dispW, height: disp.dispH - crop.y - crop.h,
              }]} />
              <View pointerEvents="none" style={[styles.dim, {
                left: disp.offsetX, top: disp.offsetY + crop.y, width: crop.x, height: crop.h,
              }]} />
              <View pointerEvents="none" style={[styles.dim, {
                left: disp.offsetX + crop.x + crop.w, top: disp.offsetY + crop.y,
                width: disp.dispW - crop.x - crop.w, height: crop.h,
              }]} />

              {/* Crop rectangle */}
              <View
                pointerEvents="none"
                style={[styles.cropBox, {
                  left: disp.offsetX + crop.x,
                  top: disp.offsetY + crop.y,
                  width: crop.w,
                  height: crop.h,
                }]}
              >
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
              </View>
            </>
          )}

          {!disp && (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          )}
        </View>

        <Text style={styles.hint}>Drag inside to move · drag a corner to resize</Text>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerBtn: {
    width: 44, height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surfaceElevatedDark,
  },
  title: { ...Typography.h4, color: Colors.white },
  applyBtn: {
    minWidth: 64, height: 44, paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  applyBtnText: { ...Typography.bodyMedium, color: Colors.white },
  disabled: { opacity: 0.5 },

  cropArea: { flex: 1, overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%' },
  dim: { position: 'absolute', backgroundColor: Colors.overlay },
  cropBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  corner: {
    position: 'absolute',
    width: 18, height: 18,
    borderColor: Colors.primary,
  },
  cornerTL: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4 },
  cornerTR: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4 },
  cornerBL: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4 },
  cornerBR: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4 },

  loading: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  hint: {
    ...Typography.caption,
    color: Colors.textSecondaryDark,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
});

export default CropScreen;
