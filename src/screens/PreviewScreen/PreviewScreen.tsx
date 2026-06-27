import React, { useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Dimensions, Share, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import { LinearGradient } from 'expo-linear-gradient';

import { RootStackParamList } from '../../types/navigation.types';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius, Shadow } from '../../theme/spacing';
import { useCanvasStore } from '../../store/canvasStore';
import { useExport } from '../../hooks/useExport';
import { useUIStore } from '../../store/uiStore';
import { DecorCanvas } from '../EditorScreen/canvas/DecorCanvas';
import { SnackbarNotification } from '../../components/SnackbarNotification';
import * as Haptics from 'expo-haptics';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Preview'>;
};

const PreviewScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const canvasViewRef = useRef<ViewShot>(null);
  const { saveToGallery, share, isSaving } = useExport();
  const showSnackbar = useUIStore(s => s.showSnackbar);
  const items = useCanvasStore(s => s.items);

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
        colors={['#0F0F1A', '#1A1A2E']}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safe} edges={['top']}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Back to editor"
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.title}>Preview</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Stats bar */}
          <View style={styles.statsBar}>
            <View style={styles.stat}>
              <MaterialCommunityIcons name="layers" size={14} color={Colors.primary} />
              <Text style={styles.statText}>{items.length} items</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <MaterialCommunityIcons name="image" size={14} color={Colors.success} />
              <Text style={styles.statText}>Full Quality</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <MaterialCommunityIcons name="file-image" size={14} color={Colors.secondary} />
              <Text style={styles.statText}>PNG Format</Text>
            </View>
          </View>

          {/* Canvas Preview (captured as image) */}
          <View style={styles.canvasWrapper}>
            <ViewShot
              ref={canvasViewRef}
              options={{ format: 'png', quality: 1 }}
              style={styles.viewShot}
            >
              <DecorCanvas onItemSelect={() => {}} />
            </ViewShot>
          </View>

          {/* Export Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.primaryAction]}
              onPress={captureAndSave}
              disabled={isSaving}
              accessibilityLabel="Save design to gallery"
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                style={styles.actionBtnInner}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <MaterialCommunityIcons name="download" size={22} color={Colors.white} />
                )}
                <Text style={styles.actionBtnText}>
                  {isSaving ? 'Saving...' : 'Save to Gallery'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.secondaryAction]}
              onPress={captureAndShare}
              accessibilityLabel="Share design"
            >
              <MaterialCommunityIcons name="share-variant" size={22} color={Colors.primary} />
              <Text style={[styles.actionBtnText, { color: Colors.primary }]}>Share Design</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Continue editing"
            >
              <MaterialCommunityIcons name="pencil" size={18} color={Colors.textSecondaryDark} />
              <Text style={styles.editBtnText}>Back to Edit</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      <SnackbarNotification />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgDark },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
  },
  backBtn: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceElevatedDark,
    width: 44,
    alignItems: 'center',
  },
  title: { ...Typography.h3, color: Colors.white, flex: 1, textAlign: 'center' },
  scroll: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxxl },

  statsBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceDark,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    justifyContent: 'space-evenly',
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { ...Typography.label, color: Colors.textSecondaryDark },
  statDivider: { width: 1, height: '100%', backgroundColor: Colors.borderDark },

  canvasWrapper: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.borderDark,
    ...Shadow.lg,
  },
  viewShot: { backgroundColor: Colors.bgDark },

  actions: { gap: Spacing.md },
  actionBtn: { borderRadius: BorderRadius.xl, overflow: 'hidden' },
  primaryAction: { ...Shadow.md },
  actionBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  actionBtnText: { ...Typography.h4, color: Colors.white },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
    backgroundColor: Colors.primary + '15',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  editBtnText: { ...Typography.body, color: Colors.textSecondaryDark },
});

export default PreviewScreen;
