import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  Animated, AppState, AppStateStatus,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import ViewShot from 'react-native-view-shot';

import { RootStackParamList } from '../../types/navigation.types';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius, Shadow } from '../../theme/spacing';
import { useCanvasStore } from '../../store/canvasStore';
import { useUIStore } from '../../store/uiStore';
import { DecorCanvas } from './canvas/DecorCanvas';
import { SnackbarNotification } from '../../components/SnackbarNotification';
import { IconButton } from '../../components/common/IconButton';
import { GradientButton } from '../../components/common/GradientButton';
import { OutlineButton } from '../../components/common/OutlineButton';
import { useProjectStore } from '../../store/projectStore';
import { CanvasItem, Project } from '../../types/canvas.types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, AUTOSAVE_DEBOUNCE_MS } from '../../constants';
import {
  removeBackgroundLocal,
  removeBackgroundClipdrop,
} from '../../utils/backgroundRemoval';
import { persistThumbnail, deleteTemporaryFile } from '../../utils/exportUtils';
import { saveDraft, clearDraft } from '../../utils/storageManager';
import { generateDesignName } from '../../utils/naming';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Editor'>;
  route: RouteProp<RootStackParamList, 'Editor'>;
};

const EditorScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();

  // Canvas store
  const items = useCanvasStore(s => s.items);
  const selectedItemId = useCanvasStore(s => s.selectedItemId);
  const selectedItemIds = useCanvasStore(s => s.selectedItemIds);
  const undoStack = useCanvasStore(s => s.undoStack);
  const redoStack = useCanvasStore(s => s.redoStack);
  const roomImageUri = useCanvasStore(s => s.roomImageUri);
  const setRoomImage = useCanvasStore(s => s.setRoomImage);
  const addItem = useCanvasStore(s => s.addItem);
  const updateItem = useCanvasStore(s => s.updateItem);
  const deleteSelected = useCanvasStore(s => s.deleteSelected);
  const duplicateSelected = useCanvasStore(s => s.duplicateSelected);
  const undo = useCanvasStore(s => s.undo);
  const redo = useCanvasStore(s => s.redo);
  const selectItem = useCanvasStore(s => s.selectItem);
  const selectedItem = useCanvasStore(s => s.selectedItem());

  // UI store
  const showSnackbar = useUIStore(s => s.showSnackbar);

  const handleGroupDelete = () => {
    deleteSelected();
  };

  // Project
  const { saveProject } = useProjectStore();
  const canvasViewRef = useRef<ViewShot>(null);

  const [currentProjectId, setCurrentProjectId] = useState<string | null>(route.params?.projectId ?? null);
  const [saving, setSaving] = useState(false);
  const [projectName] = useState(() => {
    const existing = route.params?.projectId
      ? useProjectStore.getState().getProjectById(route.params.projectId)
      : undefined;
    if (existing?.name) return existing.name;
    // Friendly auto-generated name for a brand-new design (user can rename in Preview)
    return generateDesignName();
  });
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const panelAnim = useRef(new Animated.Value(0)).current;

  // Bottom source-picker sheet: which target it applies to
  const [pickerFor, setPickerFor] = useState<'room' | 'decor' | null>(null);

  const handlePickSource = (source: 'camera' | 'gallery') => {
    const target = pickerFor;
    setPickerFor(null);
    if (target === 'decor') {
      source === 'camera' ? addDecorFromCamera() : addDecorFromGallery();
    } else if (target === 'room') {
      source === 'camera' ? handleChangeRoomFromCamera() : handleChangeRoomFromGallery();
    }
  };

  // Open the compact action bar when an item is selected
  useEffect(() => {
    if (selectedItemId) {
      setPropertiesOpen(true);
      Animated.spring(panelAnim, { toValue: 1, tension: 140, friction: 16, useNativeDriver: true }).start();
    } else {
      Animated.timing(panelAnim, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
        setPropertiesOpen(false);
      });
    }
  }, [selectedItemId]);

  const barTranslate = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });

  // ── Autosave draft ─────────────────────────────────────────────────────────
  const hasContent = items.length > 0 || !!roomImageUri;
  // Snapshot of the as-loaded (or last explicitly saved) state — only autosave
  // once the canvas actually diverges from this, so merely opening an
  // unmodified project doesn't surface a false "unsaved changes" draft.
  const baselineRef = useRef(JSON.stringify({ items, roomImageUri }));
  const isDirty = JSON.stringify({ items, roomImageUri }) !== baselineRef.current;

  useEffect(() => {
    if (!hasContent || !isDirty) return;
    const timer = setTimeout(() => {
      saveDraft({ items, roomImageUri, projectId: currentProjectId, projectName, updatedAt: Date.now() });
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [items, roomImageUri, currentProjectId, projectName, hasContent, isDirty]);

  // Flush immediately when backgrounded so a killed app doesn't lose recent edits
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state !== 'active' && hasContent && isDirty) {
        saveDraft({ items, roomImageUri, projectId: currentProjectId, projectName, updatedAt: Date.now() });
      }
    });
    return () => sub.remove();
  }, [items, roomImageUri, currentProjectId, projectName, hasContent, isDirty]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const requestPermissions = async () => {
    const { status: camStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return camStatus === 'granted' && libStatus === 'granted';
  };

  const addDecorFromGallery = async () => {
    const granted = await requestPermissions();
    if (!granted) {
      showSnackbar('Camera/gallery permission denied', 'error');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      addDecorItem(asset.uri, asset.width, asset.height);
    }
  };

  const addDecorFromCamera = async () => {
    const granted = await requestPermissions();
    if (!granted) {
      showSnackbar('Camera permission denied', 'error');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.9,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      addDecorItem(asset.uri, asset.width, asset.height);
    }
  };

  const addDecorItem = (uri: string, imgW: number, imgH: number) => {
    // Fit item into ~30% of canvas width, maintain aspect ratio
    const targetW = CANVAS_WIDTH * 0.3;
    const aspect = imgH / imgW;
    const targetH = targetW * aspect;

    const newItem: CanvasItem = {
      id: `item_${Date.now()}`,
      imageUri: uri,
      label: 'Decor Item',
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      width: targetW,
      height: targetH,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      opacity: 1,
      zIndex: items.length,
      isLocked: false,
      isFlippedH: false,
      isFlippedV: false,
    };
    addItem(newItem);
    // Auto-remove the background so the item drops onto the room instantly.
    // Silent on failure (e.g. unsupported device) — the original photo just stays as-is.
    runBackgroundRemoval(newItem.id, 'normal');
  };

  const handleChangeRoomFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      setRoomImage(result.assets[0].uri);
    }
  };

  const handleChangeRoomFromCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({ quality: 0.9 });
    if (!result.canceled && result.assets[0]) {
      setRoomImage(result.assets[0].uri);
    }
  };

  // Launch the requested picker as soon as the Editor mounts, so the user goes
  // straight from Home into this screen instead of flashing back to Home while
  // the native picker resolves.
  const hasAutoPicked = useRef(false);
  useEffect(() => {
    if (hasAutoPicked.current || !route.params?.autoPick) return;
    hasAutoPicked.current = true;
    if (route.params.autoPick === 'gallery') {
      handleChangeRoomFromGallery();
    } else {
      handleChangeRoomFromCamera();
    }
  }, []);

  const handleDelete = () => {
    deleteSelected();
    selectItem(null);
  };

  const handleSaveAndPreview = async () => {
    if (saving) return;
    setSaving(true);
    // Deselect so the captured thumbnail is clean (no selection outline/handles),
    // and give the canvas a frame to re-render before capturing.
    selectItem(null);
    await new Promise(resolve => setTimeout(resolve, 80));
    try {
      const existing = currentProjectId
        ? useProjectStore.getState().getProjectById(currentProjectId)
        : undefined;

      let thumbnailUri: string | null = existing?.thumbnailUri ?? null;
      if (canvasViewRef.current?.capture) {
        try {
          const captured = await canvasViewRef.current.capture();
          thumbnailUri = await persistThumbnail(captured);
          if (existing?.thumbnailUri) {
            deleteTemporaryFile(existing.thumbnailUri);
          }
        } catch {
          // Keep the previous thumbnail (or none) if capture fails.
        }
      }

      const projectId = currentProjectId ?? `proj_${Date.now()}`;
      const project: Project = {
        id: projectId,
        name: projectName,
        thumbnailUri,
        roomImageUri,
        canvasJSON: JSON.stringify(items),
        createdAt: existing?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
        itemCount: items.length,
      };
      await saveProject(project);
      setCurrentProjectId(projectId);
      clearDraft();
      baselineRef.current = JSON.stringify({ items, roomImageUri });
      navigation.navigate('Preview', { projectId });
    } catch {
      showSnackbar('Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleItemSelect = useCallback((id: string | null) => {
    selectItem(id);
  }, [selectItem]);

  // ── Background Removal Handlers ────────────────────────────────────────────

  const runBackgroundRemoval = useCallback(async (itemId: string, mode: 'normal' | 'advanced'): Promise<boolean> => {
    const item = useCanvasStore.getState().items.find(i => i.id === itemId);
    if (!item) return false;
    updateItem(itemId, { isProcessing: true });
    try {
      const resultUri = mode === 'normal'
        ? await removeBackgroundLocal(item.imageUri)
        : await removeBackgroundClipdrop(item.imageUri);
      // Replace image while preserving all transform properties
      updateItem(itemId, { imageUri: resultUri, isProcessing: false });
      return true;
    } catch (err) {
      updateItem(itemId, { isProcessing: false });
      return false;
    }
  }, [updateItem]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <IconButton
          icon="arrow-left" size={40} variant="elevated" iconColor={Colors.white}
          onPress={() => navigation.goBack()} accessibilityLabel="Go back"
        />

        <Text style={styles.headerTitle} numberOfLines={1}>{projectName}</Text>

        <View style={styles.headerRight}>
          <IconButton
            icon="undo" size={40} variant="elevated" iconColor={Colors.white}
            onPress={undo} disabled={!undoStack.length} accessibilityLabel="Undo"
          />
          <IconButton
            icon="redo" size={40} variant="elevated" iconColor={Colors.white}
            onPress={redo} disabled={!redoStack.length} accessibilityLabel="Redo"
          />
          {/* Save → auto-saves and opens Preview */}
          <TouchableOpacity
            style={[styles.saveHeaderBtn, saving && styles.disabled]}
            onPress={handleSaveAndPreview}
            disabled={saving}
            accessibilityLabel="Save design"
          >
            <MaterialCommunityIcons name="content-save" size={18} color={Colors.white} />
            <Text style={styles.saveHeaderBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Canvas Area ── */}
      <View style={styles.canvasArea}>
        <ViewShot ref={canvasViewRef} options={{ format: 'png', quality: 0.8 }}>
          <DecorCanvas onItemSelect={handleItemSelect} />
        </ViewShot>
      </View>

      {/* ── Bottom Panel: Group Actions, Properties, or Action Bar ── */}
      {selectedItemIds.length > 0 ? (
        <View style={styles.groupBar}>
          <View style={styles.groupBarActions}>
            <TouchableOpacity style={styles.dupBtn} onPress={duplicateSelected}>
              <MaterialCommunityIcons name="content-copy" size={18} color={Colors.primary} />
              <Text style={styles.actionChipTextPrimary}>Duplicate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.delBtn} onPress={handleGroupDelete}>
              <MaterialCommunityIcons name="delete" size={18} color={Colors.white} />
              <Text style={styles.actionChipText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : propertiesOpen && selectedItem ? (
        /* ── Compact single-item action bar ── */
        <Animated.View
          style={[
            styles.itemActionBar,
            { opacity: panelAnim, transform: [{ translateY: barTranslate }] },
          ]}
        >
          <TouchableOpacity
            style={styles.itemActionBtn}
            onPress={() => navigation.navigate('CropScreen', { itemId: selectedItem.id, imageUri: selectedItem.imageUri })}
            accessibilityLabel="Crop item"
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="crop" size={22} color={Colors.white} />
            <Text style={styles.itemActionLabel}>Crop</Text>
          </TouchableOpacity>

          <View style={styles.itemActionDivider} />

          <TouchableOpacity
            style={styles.itemActionBtn}
            onPress={duplicateSelected}
            accessibilityLabel="Duplicate item"
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="content-copy" size={22} color={Colors.primary} />
            <Text style={styles.itemActionLabelPrimary}>Duplicate</Text>
          </TouchableOpacity>

          <View style={styles.itemActionDivider} />

          <TouchableOpacity
            style={styles.itemActionBtn}
            onPress={handleDelete}
            accessibilityLabel="Delete item"
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="delete-outline" size={22} color={Colors.error} />
            <Text style={styles.itemActionLabelError}>Delete</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        /* ── Bottom Action Bar ── */
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
          <OutlineButton
            label="Change Room"
            icon="image-edit-outline"
            variant="neutral"
            onPress={() => setPickerFor('room')}
            accessibilityLabel="Change room photo"
            style={styles.roomBtn}
          />
          <GradientButton
            label="Add Décor"
            icon="plus-circle"
            onPress={() => setPickerFor('decor')}
            accessibilityLabel="Add decor item"
            paddingVertical={Spacing.md}
            style={styles.addDecorBtn}
          />
        </View>
      )}

      {/* Source picker sheet */}
      <Modal
        visible={pickerFor !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerFor(null)}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setPickerFor(null)}
        >
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>
              {pickerFor === 'decor' ? 'Add a décor item' : 'Change room photo'}
            </Text>
            <Text style={styles.sheetSub}>
              {pickerFor === 'decor'
                ? 'Its background is removed automatically.'
                : 'Choose the room you want to decorate.'}
            </Text>

            <TouchableOpacity style={styles.sheetOption} onPress={() => handlePickSource('camera')} activeOpacity={0.85}>
              <View style={styles.sheetIcon}>
                <MaterialCommunityIcons name="camera" size={22} color={Colors.primary} />
              </View>
              <View style={styles.sheetOptTextWrap}>
                <Text style={styles.sheetOptTitle}>Take a Photo</Text>
                <Text style={styles.sheetOptSub}>Use your camera</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.textSecondaryDark} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetOption} onPress={() => handlePickSource('gallery')} activeOpacity={0.85}>
              <View style={styles.sheetIcon}>
                <MaterialCommunityIcons name="image-multiple" size={22} color={Colors.primary} />
              </View>
              <View style={styles.sheetOptTextWrap}>
                <Text style={styles.sheetOptTitle}>Choose from Gallery</Text>
                <Text style={styles.sheetOptSub}>Pick an existing photo</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.textSecondaryDark} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Snackbar */}
      <SnackbarNotification />
    </View>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgDark },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.surfaceDark,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
    gap: Spacing.sm,
  },
  headerTitle: { ...Typography.bodyMedium, color: Colors.white, flex: 1, textAlign: 'center' },
  headerRight: { flexDirection: 'row', gap: 4 },
  disabled: { opacity: 0.4 },

  canvasArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',  // ← hug the canvas width so ViewShot doesn't capture extra side margin
    paddingVertical: Spacing.sm,
    overflow: 'hidden',   // ← prevents canvas items bleeding into header
  },

  // Group selection bar
  groupBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceDark,
    borderTopWidth: 1,
    borderTopColor: Colors.borderDark,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  groupBarActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },

  // Bottom Action Bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceDark,
    borderTopWidth: 1,
    borderTopColor: Colors.borderDark,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  roomBtn: { paddingHorizontal: Spacing.lg },
  addDecorBtn: { flex: 1 },

  // Source picker sheet
  sheetOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surfaceDark,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.borderDark, alignSelf: 'center', marginBottom: Spacing.md,
  },
  sheetTitle: { ...Typography.h3, color: Colors.textPrimaryDark },
  sheetSub: { ...Typography.body, color: Colors.textSecondaryDark, marginBottom: Spacing.sm },
  sheetOption: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surfaceElevatedDark,
    borderRadius: BorderRadius.xl, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.borderDark,
  },
  sheetIcon: {
    width: 44, height: 44, borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary + '1F',
    alignItems: 'center', justifyContent: 'center',
  },
  sheetOptTextWrap: { flex: 1 },
  sheetOptTitle: { ...Typography.bodyMedium, color: Colors.textPrimaryDark },
  sheetOptSub: { ...Typography.caption, color: Colors.textSecondaryDark, marginTop: 1 },

  // Compact single-item action bar
  itemActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceDark,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    paddingHorizontal: Spacing.xs,
    ...Shadow.lg,
  },
  itemActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  itemActionLabel: { ...Typography.label, color: Colors.white },
  itemActionLabelPrimary: { ...Typography.label, color: Colors.primary },
  itemActionLabelError: { ...Typography.label, color: Colors.error },
  itemActionDivider: { width: 1, height: 24, backgroundColor: Colors.borderDark },

  // Group selection action buttons (multi-select)
  actionChipText: { ...Typography.caption, color: Colors.white },
  actionChipTextPrimary: { ...Typography.caption, color: Colors.primary },
  dupBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary + '15',
    borderWidth: 1, borderColor: Colors.primary + '50',
  },
  delBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.error + '20',
    borderWidth: 1, borderColor: Colors.error + '60',
  },

  // Save button (header)
  saveHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
  },
  saveHeaderBtnText: { ...Typography.bodyMedium, color: Colors.white },
});

export default EditorScreen;
