import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, LayoutChangeEvent,
  TextInput, Modal,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import { LinearGradient } from 'expo-linear-gradient';

import { RootStackParamList } from '../../types/navigation.types';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius, Shadow } from '../../theme/spacing';
import { useCanvasStore } from '../../store/canvasStore';
import { useProjectStore } from '../../store/projectStore';
import { useExport } from '../../hooks/useExport';
import { useUIStore } from '../../store/uiStore';
import { DecorCanvas, DISPLAY_W, DISPLAY_H } from '../EditorScreen/canvas/DecorCanvas';
import { SnackbarNotification } from '../../components/SnackbarNotification';
import { IconButton } from '../../components/common/IconButton';
import { GradientButton } from '../../components/common/GradientButton';
import { OutlineButton } from '../../components/common/OutlineButton';
import * as Haptics from 'expo-haptics';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Preview'>;
  route: RouteProp<RootStackParamList, 'Preview'>;
};

const PreviewScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const canvasViewRef = useRef<ViewShot>(null);
  const { saveToGallery, share, isSaving } = useExport();
  const showSnackbar = useUIStore(s => s.showSnackbar);
  const items = useCanvasStore(s => s.items);
  const saveProject = useProjectStore(s => s.saveProject);

  // Design name (editable here after saving from the editor)
  const projectId = route.params?.projectId;
  const [name, setName] = useState('');
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [draftName, setDraftName] = useState('');

  // Scale the preview to fit the available space so the screen never scrolls.
  const [previewArea, setPreviewArea] = useState({ w: 0, h: 0 });
  const previewScale = previewArea.h > 0
    ? Math.min(previewArea.w / DISPLAY_W, previewArea.h / DISPLAY_H, 1)
    : 0;
  const onPreviewAreaLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setPreviewArea({ w: width, h: height });
  };

  useEffect(() => {
    if (!projectId) return;
    const project = useProjectStore.getState().getProjectById(projectId);
    if (project) setName(project.name);
  }, [projectId]);

  const openNameModal = () => {
    setDraftName(name);
    setNameModalVisible(true);
  };

  const handleSaveName = useCallback(() => {
    const trimmed = draftName.trim();
    if (trimmed && projectId) {
      const project = useProjectStore.getState().getProjectById(projectId);
      if (project) {
        saveProject({ ...project, name: trimmed, updatedAt: Date.now() });
        setName(trimmed);
      }
    }
    setNameModalVisible(false);
  }, [draftName, projectId, saveProject]);

  const captureAndSave = useCallback(async () => {
    try {
      if (!canvasViewRef.current?.capture) {
        showSnackbar('Capture not ready', 'error');
        return;
      }
      const uri = await canvasViewRef.current.capture();
      await saveToGallery(uri);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      showSnackbar('Export failed', 'error');
    }
  }, [saveToGallery, showSnackbar]);

  const captureAndShare = useCallback(async () => {
    try {
      if (!canvasViewRef.current?.capture) return;
      const uri = await canvasViewRef.current.capture();
      await share(uri);
    } catch (e) {
      showSnackbar('Share failed', 'error');
    }
  }, [share, showSnackbar]);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safe} edges={['top']}>

        {/* Header */}
        <View style={styles.header}>
          <IconButton icon="arrow-left" onPress={() => navigation.goBack()} accessibilityLabel="Back to editor" />
          <Text style={styles.headerTitle}>Preview</Text>
          <IconButton icon="home-outline" onPress={() => navigation.navigate('Home')} accessibilityLabel="Back to home" />
        </View>

        <View style={styles.body}>

          {/* Ready hero + editable name */}
          <View style={styles.hero}>
            <Text style={styles.heroKicker}>YOUR DESIGN IS READY</Text>
            <TouchableOpacity
              style={styles.nameRow}
              onPress={openNameModal}
              disabled={!projectId}
              activeOpacity={0.7}
              accessibilityLabel="Edit design name"
            >
              <Text style={styles.nameText} numberOfLines={1}>{name || 'Untitled design'}</Text>
              <MaterialCommunityIcons name="pencil" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Canvas Preview — scaled to fit the available space (no scrolling) */}
          <View style={styles.previewWrap} onLayout={onPreviewAreaLayout}>
            {previewScale > 0 && (
              <View style={[styles.previewBox, {
                width: DISPLAY_W * previewScale,
                height: DISPLAY_H * previewScale,
              }]}>
                <View style={[styles.previewInner, {
                  width: DISPLAY_W,
                  height: DISPLAY_H,
                  transform: [{ scale: previewScale }],
                  transformOrigin: 'top left',
                }]}>
                  <ViewShot
                    ref={canvasViewRef}
                    options={{ format: 'png', quality: 1 }}
                    style={styles.viewShot}
                  >
                    <DecorCanvas onItemSelect={() => {}} />
                  </ViewShot>
                </View>
              </View>
            )}
          </View>

          {/* Stat chips */}
          <View style={styles.chipsRow}>
            <View style={styles.chip}>
              <MaterialCommunityIcons name="layers-outline" size={14} color={Colors.primary} />
              <Text style={styles.chipText}>{items.length} items</Text>
            </View>
            <View style={styles.chip}>
              <MaterialCommunityIcons name="check-decagram" size={14} color={Colors.success} />
              <Text style={styles.chipText}>Full quality</Text>
            </View>
            <View style={styles.chip}>
              <MaterialCommunityIcons name="file-image-outline" size={14} color={Colors.secondary} />
              <Text style={styles.chipText}>PNG</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <GradientButton
              label={isSaving ? 'Saving…' : 'Save to Gallery'}
              icon="download"
              loading={isSaving}
              onPress={captureAndSave}
              accessibilityLabel="Save design to gallery"
            />
            <OutlineButton
              label="Share Design"
              icon="share-variant"
              onPress={captureAndShare}
              accessibilityLabel="Share design"
            />
          </View>

        </View>
      </SafeAreaView>

      <SnackbarNotification />

      {/* Edit design name modal */}
      <Modal
        visible={nameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Design Name</Text>
            <TextInput
              style={styles.modalInput}
              value={draftName}
              onChangeText={setDraftName}
              placeholder="Name your design"
              placeholderTextColor={Colors.textSecondaryDark}
              autoFocus
              selectTextOnFocus
              returnKeyType="done"
              maxLength={60}
              onSubmitEditing={handleSaveName}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setNameModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveName}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgDark },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  headerTitle: { ...Typography.h4, color: Colors.textPrimaryDark, flex: 1, textAlign: 'center' },

  // Body (fills screen, no scroll)
  body: { flex: 1, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, gap: Spacing.md },

  // Hero
  hero: { alignItems: 'center', gap: 2 },
  heroKicker: {
    ...Typography.caption, color: Colors.primary,
    letterSpacing: 1.5, textTransform: 'uppercase',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, maxWidth: '100%' },
  nameText: { ...Typography.h3, color: Colors.textPrimaryDark, textAlign: 'center', flexShrink: 1 },

  // Preview (scaled to fit)
  previewWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  previewBox: {
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderDark,
    backgroundColor: Colors.bgDark,
    ...Shadow.lg,
  },
  previewInner: { position: 'absolute', top: 0, left: 0 },
  viewShot: { backgroundColor: Colors.bgDark },

  // Stat chips
  chipsRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.surfaceDark,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderWidth: 1, borderColor: Colors.borderDark,
  },
  chipText: { ...Typography.caption, color: Colors.textSecondaryDark },

  // Actions
  actions: { gap: Spacing.sm },

  // Edit name modal
  modalOverlay: {
    flex: 1, backgroundColor: Colors.overlay,
    alignItems: 'center', justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '85%',
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadow.lg,
  },
  modalTitle: { ...Typography.h3, color: Colors.white, marginBottom: Spacing.lg },
  modalInput: {
    ...Typography.body, color: Colors.white,
    backgroundColor: Colors.surfaceElevatedDark,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderWidth: 1, borderColor: Colors.primary + '60',
    marginBottom: Spacing.lg,
  },
  modalBtns: { flexDirection: 'row', gap: Spacing.md },
  modalCancelBtn: {
    flex: 1, paddingVertical: Spacing.md, alignItems: 'center',
    borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.borderDark,
  },
  modalCancelText: { ...Typography.bodyMedium, color: Colors.textSecondaryDark },
  modalSaveBtn: {
    flex: 1, paddingVertical: Spacing.md, alignItems: 'center',
    borderRadius: BorderRadius.lg, backgroundColor: Colors.primary,
  },
  modalSaveText: { ...Typography.bodyMedium, color: Colors.white },
});

export default PreviewScreen;
