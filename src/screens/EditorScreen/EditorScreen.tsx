import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  TextInput, Dimensions, Animated, Alert, ScrollView, Image,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';

import { RootStackParamList } from '../../types/navigation.types';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius, Shadow } from '../../theme/spacing';
import { useCanvasStore } from '../../store/canvasStore';
import { useUIStore } from '../../store/uiStore';
import { DecorCanvas } from './canvas/DecorCanvas';
import { SnackbarNotification } from '../../components/SnackbarNotification';
import { useProjectStore } from '../../store/projectStore';
import { CanvasItem } from '../../types/canvas.types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../utils/constants';
import {
  removeBackgroundLocal,
  removeBackgroundClipdrop,
} from '../../utils/backgroundRemoval';
import { AppFooter } from '../../components/AppFooter';

const { height: SCREEN_H } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Editor'>;
  route: RouteProp<RootStackParamList, 'Editor'>;
};

const EditorScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();

  // Canvas store
  const items = useCanvasStore(s => s.items);
  const selectedItemId = useCanvasStore(s => s.selectedItemId);
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
  const bringForward = useCanvasStore(s => s.bringForward);
  const sendBackward = useCanvasStore(s => s.sendBackward);

  // UI store
  const showSnackbar = useUIStore(s => s.showSnackbar);

  // Project
  const { saveProject } = useProjectStore();

  const [saveDialogVisible, setSaveDialogVisible] = useState(false);
  const [projectName, setProjectName] = useState('My Design');
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const panelAnim = useRef(new Animated.Value(0)).current;

  // Background removal state
  const [bgRemoving, setBgRemoving] = useState<'normal' | 'advanced' | null>(null);

  const PANEL_H = SCREEN_H * 0.5;

  // Open properties when item selected
  useEffect(() => {
    if (selectedItemId) {
      setPropertiesOpen(true);
      Animated.spring(panelAnim, { toValue: 1, tension: 120, friction: 14, useNativeDriver: false }).start();
    } else {
      Animated.timing(panelAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start(() => {
        setPropertiesOpen(false);
      });
    }
  }, [selectedItemId]);

  const panelHeight = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, PANEL_H],
  });

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
    showSnackbar('Decor item added! Drag to position it.', 'success');
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

  const handleDelete = () => {
    Alert.alert('Delete Item', 'Remove this decor item from the canvas?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => { deleteSelected(); selectItem(null); },
      },
    ]);
  };

  const handleSave = async () => {
    setSaveDialogVisible(false);
    try {
      const project = {
        id: `proj_${Date.now()}`,
        name: projectName,
        thumbnailUri: null,
        roomImageUri,
        canvasJSON: JSON.stringify(items),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        itemCount: items.length,
      };
      await saveProject(project);
      showSnackbar('Design saved!', 'success');
    } catch {
      showSnackbar('Save failed', 'error');
    }
  };

  const handleItemSelect = useCallback((id: string | null) => {
    selectItem(id);
  }, [selectItem]);

  // ── Background Removal Handlers ────────────────────────────────────────────

  const handleRemoveBackground = async (mode: 'normal' | 'advanced') => {
    if (!selectedItem) return;
    setBgRemoving(mode);
    try {
      let resultUri: string;
      if (mode === 'normal') {
        resultUri = await removeBackgroundLocal(selectedItem.imageUri);
      } else {
        resultUri = await removeBackgroundClipdrop(selectedItem.imageUri);
      }
      // Replace image while preserving all transform properties
      updateItem(selectedItem.id, { imageUri: resultUri });
      showSnackbar('Background removed successfully!', 'success');
    } catch (err: any) {
      const message = err?.message ?? 'Background removal failed';
      Alert.alert(
        mode === 'normal' ? 'Normal Remove Failed' : 'Advanced Remove Failed',
        message,
        [{ text: 'OK' }]
      );
    } finally {
      setBgRemoving(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { backgroundColor: Colors.bgDark }]}>

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.white} />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>{projectName}</Text>

        <View style={styles.headerRight}>
          {/* Undo */}
          <TouchableOpacity
            style={[styles.iconBtn, !undoStack.length && styles.disabled]}
            onPress={undo}
            disabled={!undoStack.length}
          >
            <MaterialCommunityIcons name="undo" size={20} color={undoStack.length ? Colors.white : Colors.textSecondaryDark} />
          </TouchableOpacity>
          {/* Redo */}
          <TouchableOpacity
            style={[styles.iconBtn, !redoStack.length && styles.disabled]}
            onPress={redo}
            disabled={!redoStack.length}
          >
            <MaterialCommunityIcons name="redo" size={20} color={redoStack.length ? Colors.white : Colors.textSecondaryDark} />
          </TouchableOpacity>
          {/* Save */}
          <TouchableOpacity style={styles.iconBtn} onPress={() => setSaveDialogVisible(true)}>
            <MaterialCommunityIcons name="content-save" size={20} color={Colors.white} />
          </TouchableOpacity>
          {/* Export */}
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: Colors.primary }]}
            onPress={() => navigation.navigate('Preview')}
          >
            <MaterialCommunityIcons name="export-variant" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Canvas Area ── */}
      <View style={styles.canvasArea}>
        <DecorCanvas onItemSelect={handleItemSelect} />
      </View>

      {/* ── Bottom Panel: Properties or Action Bar ── */}
      {propertiesOpen && selectedItem ? (
        <Animated.View style={[styles.propertiesPanel, { height: panelHeight }]}>
          <View style={styles.panelDragHandle} />

          {/* Decor item thumbnail + label */}
          <View style={styles.propHeader}>
            <Image source={{ uri: selectedItem.imageUri }} style={styles.propThumb} />
            <View style={{ flex: 1 }}>
              <Text style={styles.propTitle}>Selected Item</Text>
              <Text style={styles.propSub}>Drag on canvas to reposition</Text>
            </View>
            <TouchableOpacity onPress={() => selectItem(null)} style={styles.closePropBtn}>
              <MaterialCommunityIcons name="close" size={20} color={Colors.textSecondaryDark} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.propContent}>

            {/* Opacity */}
            <View style={styles.propRow}>
              <Text style={styles.propLabel}>OPACITY</Text>
              <Text style={styles.propValue}>{Math.round(selectedItem.opacity * 100)}%</Text>
            </View>
            <View style={styles.sliderTrack}>
              {[0.1, 0.25, 0.5, 0.75, 1].map(val => (
                <TouchableOpacity
                  key={val}
                  style={[styles.sliderChip, selectedItem.opacity === val && styles.sliderChipActive]}
                  onPress={() => updateItem(selectedItem.id, { opacity: val })}
                >
                  <Text style={[styles.sliderChipText, selectedItem.opacity === val && { color: Colors.white }]}>
                    {Math.round(val * 100)}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Scale */}
            <View style={styles.propRow}>
              <Text style={styles.propLabel}>SIZE</Text>
              <Text style={styles.propValue}>{Math.round(selectedItem.scaleX * 100)}%</Text>
            </View>
            <View style={styles.sliderTrack}>
              {[0.25, 0.5, 0.75, 1, 1.5, 2].map(val => (
                <TouchableOpacity
                  key={val}
                  style={[styles.sliderChip, selectedItem.scaleX === val && styles.sliderChipActive]}
                  onPress={() => updateItem(selectedItem.id, { scaleX: val, scaleY: val })}
                >
                  <Text style={[styles.sliderChipText, selectedItem.scaleX === val && { color: Colors.white }]}>
                    {Math.round(val * 100)}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Rotation */}
            <View style={styles.propRow}>
              <Text style={styles.propLabel}>ROTATION</Text>
              <Text style={styles.propValue}>{Math.round(selectedItem.rotation)}°</Text>
            </View>
            <View style={styles.sliderTrack}>
              {[0, 45, 90, 135, 180, 270].map(val => (
                <TouchableOpacity
                  key={val}
                  style={[styles.sliderChip, selectedItem.rotation === val && styles.sliderChipActive]}
                  onPress={() => updateItem(selectedItem.id, { rotation: val })}
                >
                  <Text style={[styles.sliderChipText, selectedItem.rotation === val && { color: Colors.white }]}>
                    {val}°
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Flip + Lock */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionChip}
                onPress={() => updateItem(selectedItem.id, { isFlippedH: !selectedItem.isFlippedH })}
              >
                <MaterialCommunityIcons name="flip-horizontal" size={16} color={Colors.white} />
                <Text style={styles.actionChipText}>Flip H</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionChip}
                onPress={() => updateItem(selectedItem.id, { isFlippedV: !selectedItem.isFlippedV })}
              >
                <MaterialCommunityIcons name="flip-vertical" size={16} color={Colors.white} />
                <Text style={styles.actionChipText}>Flip V</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionChip}
                onPress={bringForward}
              >
                <MaterialCommunityIcons name="arrange-bring-forward" size={16} color={Colors.white} />
                <Text style={styles.actionChipText}>Forward</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionChip}
                onPress={sendBackward}
              >
                <MaterialCommunityIcons name="arrange-send-backward" size={16} color={Colors.white} />
                <Text style={styles.actionChipText}>Backward</Text>
              </TouchableOpacity>
            </View>

            {/* ── Background Removal ── */}
            <View style={styles.bgRemoveSection}>
              <Text style={styles.propLabel}>BACKGROUND REMOVAL</Text>
              <View style={styles.bgRemoveRow}>
                {/* Normal Remove */}
                <TouchableOpacity
                  style={[
                    styles.bgBtn,
                    styles.bgBtnNormal,
                    bgRemoving !== null && styles.bgBtnDisabled,
                  ]}
                  onPress={() => handleRemoveBackground('normal')}
                  disabled={bgRemoving !== null}
                  activeOpacity={0.8}
                >
                  {bgRemoving === 'normal' ? (
                    <ActivityIndicator size="small" color={Colors.success} />
                  ) : (
                    <MaterialCommunityIcons name="eraser" size={18} color={Colors.success} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.bgBtnTitle, { color: Colors.success }]}>
                      {bgRemoving === 'normal' ? 'Removing…' : 'Normal Remove'}
                    </Text>
                    <Text style={styles.bgBtnSub}>Free · On-device</Text>
                  </View>
                </TouchableOpacity>

                {/* Advanced Remove */}
                <TouchableOpacity
                  style={[
                    styles.bgBtn,
                    styles.bgBtnAdvanced,
                    bgRemoving !== null && styles.bgBtnDisabled,
                  ]}
                  onPress={() => handleRemoveBackground('advanced')}
                  disabled={bgRemoving !== null}
                  activeOpacity={0.8}
                >
                  {bgRemoving === 'advanced' ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <MaterialCommunityIcons name="auto-fix" size={18} color={Colors.primary} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.bgBtnTitle, { color: Colors.primary }]}>
                      {bgRemoving === 'advanced' ? 'Processing…' : 'Advanced Remove'}
                    </Text>
                    <Text style={styles.bgBtnSub}>HD · Clipdrop AI</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Delete / Duplicate */}
            <View style={styles.dangerRow}>
              <TouchableOpacity
                style={styles.dupBtn}
                onPress={duplicateSelected}
              >
                <MaterialCommunityIcons name="content-copy" size={18} color={Colors.primary} />
                <Text style={[styles.actionChipText, { color: Colors.primary }]}>Duplicate</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.delBtn}
                onPress={handleDelete}
              >
                <MaterialCommunityIcons name="delete" size={18} color={Colors.white} />
                <Text style={styles.actionChipText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      ) : (
        /* ── Bottom Action Bar ── */
        <View style={styles.bottomBar}>
          {/* Change room image */}
          <View style={styles.bottomSection}>
            <Text style={styles.bottomLabel}>ROOM PHOTO</Text>
            <View style={styles.bottomBtns}>
              <TouchableOpacity style={styles.bottomBtn} onPress={handleChangeRoomFromCamera}>
                <MaterialCommunityIcons name="camera" size={20} color={Colors.white} />
                <Text style={styles.bottomBtnText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.bottomBtn} onPress={handleChangeRoomFromGallery}>
                <MaterialCommunityIcons name="image" size={20} color={Colors.white} />
                <Text style={styles.bottomBtnText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.vertDivider} />

          {/* Add decor items */}
          <View style={styles.bottomSection}>
            <Text style={styles.bottomLabel}>ADD DECOR ITEM</Text>
            <View style={styles.bottomBtns}>
              <TouchableOpacity style={[styles.bottomBtn, styles.addBtn]} onPress={addDecorFromCamera}>
                <MaterialCommunityIcons name="camera-plus" size={20} color={Colors.white} />
                <Text style={styles.bottomBtnText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.bottomBtn, styles.addBtn]} onPress={addDecorFromGallery}>
                <MaterialCommunityIcons name="image-plus" size={20} color={Colors.white} />
                <Text style={styles.bottomBtnText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Footer */}
      <AppFooter />

      {/* Snackbar */}
      <SnackbarNotification />

      {/* Save Modal */}
      <Modal visible={saveDialogVisible} transparent animationType="fade" onRequestClose={() => setSaveDialogVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.saveDialog}>
            <Text style={styles.dialogTitle}>Save Design</Text>
            <Text style={styles.dialogSub}>Give your design a name</Text>
            <TextInput
              style={styles.nameInput}
              value={projectName}
              onChangeText={setProjectName}
              placeholder="e.g. Living Room 2026"
              placeholderTextColor={Colors.textSecondaryDark}
              autoFocus
              selectTextOnFocus
            />
            <View style={styles.dialogBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setSaveDialogVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.saveBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={styles.saveBtnText}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

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
  iconBtn: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceElevatedDark,
  },
  disabled: { opacity: 0.4 },

  canvasArea: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    overflow: 'hidden',   // ← prevents canvas items bleeding into header
  },

  // Bottom Action Bar
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceDark,
    borderTopWidth: 1,
    borderTopColor: Colors.borderDark,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  bottomSection: { flex: 1, gap: Spacing.xs },
  bottomLabel: { ...Typography.caption, color: Colors.textSecondaryDark, letterSpacing: 0.8 },
  bottomBtns: { flexDirection: 'row', gap: Spacing.sm },
  bottomBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceElevatedDark,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  addBtn: {
    backgroundColor: Colors.primary + '25',
    borderColor: Colors.primary + '60',
  },
  bottomBtnText: { ...Typography.caption, color: Colors.white },
  vertDivider: { width: 1, backgroundColor: Colors.borderDark },

  // Properties Panel
  propertiesPanel: {
    backgroundColor: Colors.surfaceDark,
    borderTopWidth: 1,
    borderTopColor: Colors.borderDark,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  panelDragHandle: {
    width: 36, height: 4, backgroundColor: Colors.borderDark,
    borderRadius: 2, alignSelf: 'center', marginTop: Spacing.sm, marginBottom: 4,
  },
  propHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
  },
  propThumb: {
    width: 48, height: 48, borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceElevatedDark,
  },
  propTitle: { ...Typography.bodyMedium, color: Colors.white },
  propSub: { ...Typography.caption, color: Colors.textSecondaryDark },
  closePropBtn: { padding: Spacing.xs },
  propContent: { padding: Spacing.lg, paddingTop: Spacing.md, gap: Spacing.md },

  propRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  propLabel: { ...Typography.caption, color: Colors.textSecondaryDark, letterSpacing: 0.8 },
  propValue: { ...Typography.label, color: Colors.primary },

  sliderTrack: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap' },
  sliderChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceElevatedDark,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  sliderChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  sliderChipText: { ...Typography.caption, color: Colors.textSecondaryDark },

  actionRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceElevatedDark,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  actionChipText: { ...Typography.caption, color: Colors.white },

  // BG Removal
  bgRemoveSection: { gap: Spacing.xs },
  bgRemoveRow: { flexDirection: 'row', gap: Spacing.sm },
  bgBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  bgBtnNormal: {
    backgroundColor: Colors.success + '15',
    borderColor: Colors.success + '50',
  },
  bgBtnAdvanced: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary + '50',
  },
  bgBtnDisabled: { opacity: 0.45 },
  bgBtnTitle: { ...Typography.caption, fontWeight: '600' },
  bgBtnSub: { ...Typography.caption, color: Colors.textSecondaryDark, fontSize: 9, opacity: 0.8 },

  dangerRow: { flexDirection: 'row', gap: Spacing.sm },
  dupBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary + '15',
    borderWidth: 1, borderColor: Colors.primary + '50',
  },
  delBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.error + '20',
    borderWidth: 1, borderColor: Colors.error + '60',
  },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: Colors.overlay,
    alignItems: 'center', justifyContent: 'center',
  },
  saveDialog: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '85%',
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadow.lg,
  },
  dialogTitle: { ...Typography.h3, color: Colors.white, marginBottom: 4 },
  dialogSub: { ...Typography.body, color: Colors.textSecondaryDark, marginBottom: Spacing.lg },
  nameInput: {
    ...Typography.body, color: Colors.white,
    backgroundColor: Colors.surfaceElevatedDark,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderWidth: 1, borderColor: Colors.primary + '60',
    marginBottom: Spacing.lg,
  },
  dialogBtns: { flexDirection: 'row', gap: Spacing.md },
  cancelBtn: {
    flex: 1, paddingVertical: Spacing.md, alignItems: 'center',
    borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.borderDark,
  },
  cancelBtnText: { ...Typography.bodyMedium, color: Colors.textSecondaryDark },
  saveBtn: { flex: 1, borderRadius: BorderRadius.lg, overflow: 'hidden' },
  saveBtnInner: { paddingVertical: Spacing.md, alignItems: 'center' },
  saveBtnText: { ...Typography.bodyMedium, color: Colors.white },
});

export default EditorScreen;
