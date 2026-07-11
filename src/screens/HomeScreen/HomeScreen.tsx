import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Dimensions, Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../types/navigation.types';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius, Shadow } from '../../theme/spacing';
import { useProjectStore } from '../../store/projectStore';
import { useCanvasStore } from '../../store/canvasStore';
import { v4 as uuidv4 } from 'uuid';
import { loadDraft, clearDraft } from '../../utils/storageManager';
import { CanvasDraft } from '../../types/canvas.types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../constants';
import { IconButton } from '../../components/common/IconButton';


const { width: SCREEN_W } = Dimensions.get('window');
const PROJECT_CARD_W = SCREEN_W * 0.4;
const PROJECT_THUMB_H = PROJECT_CARD_W * (CANVAS_HEIGHT / CANVAS_WIDTH);

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const FEATURES = [
  { icon: 'auto-fix', title: 'Auto Background Removal', desc: 'Items drop onto your room instantly', color: Colors.primary },
  { icon: 'crop-rotate', title: 'Rotate, Resize & Crop', desc: 'Fine-tune every item with a tap', color: Colors.secondary },
  { icon: 'export-variant', title: 'Save & Share', desc: 'Export your design in full quality', color: Colors.success },
];

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { projects, fetchProjects } = useProjectStore();
  const clearCanvas = useCanvasStore(s => s.clearCanvas);
  const loadCanvas = useCanvasStore(s => s.loadCanvas);

  const [draft, setDraft] = useState<CanvasDraft | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  // Entrance animation (once on mount)
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
    ]).start();
  }, []);

  // Refresh projects + draft each time Home regains focus (e.g. returning from
  // the editor), so the Resume banner and recent designs stay up to date.
  useFocusEffect(
    useCallback(() => {
      fetchProjects();
      loadDraft().then(d => {
        setDraft(d && (d.items.length > 0 || d.roomImageUri) ? d : null);
      });
    }, [])
  );

  const handleGalleryPick = () => {
    clearCanvas();
    navigation.navigate('Editor', { autoPick: 'gallery' });
  };

  const handleCameraPick = () => {
    clearCanvas();
    navigation.navigate('Editor', { autoPick: 'camera' });
  };

  const handleLoadProject = (projectId: string) => {
    const { projects } = useProjectStore.getState();
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    try {
      const items = JSON.parse(project.canvasJSON || '[]');
      loadCanvas(items, project.roomImageUri);
      navigation.navigate('Editor', { projectId });
    } catch { }
  };

  const handleResumeDraft = () => {
    if (!draft) return;
    loadCanvas(draft.items, draft.roomImageUri);
    navigation.navigate('Editor', draft.projectId ? { projectId: draft.projectId } : {});
    setDraft(null);
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setDraft(null);
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* ── App Header ── */}
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            <View style={styles.brandRow}>
              <Animated.View style={{ transform: [{ scale: logoScale }] }}>
                <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.brandChip}>
                  <MaterialCommunityIcons name="sofa" size={22} color={Colors.white} />
                </LinearGradient>
              </Animated.View>
              <View>
                <Text style={styles.brandName}>Home Decor</Text>
                <Text style={styles.brandSub}>Visualizer</Text>
              </View>
            </View>
            {projects.length > 0 && (
              <IconButton
                icon="view-grid-outline"
                onPress={() => navigation.navigate('Projects')}
                accessibilityLabel="View all designs"
              />
            )}
          </Animated.View>

          {/* ── Hero ── */}
          <Animated.View style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.heroTitle}>Design your{'\n'}dream room</Text>
            <Text style={styles.heroSub}>Snap your space, drop in décor, and watch it come to life.</Text>

            {/* Action tiles */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionTile}
                activeOpacity={0.9}
                onPress={handleCameraPick}
                accessibilityLabel="Take a photo of your room"
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryDark]}
                  style={styles.actionTileInner}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                  <View style={styles.actionIconLight}>
                    <MaterialCommunityIcons name="camera" size={24} color={Colors.white} />
                  </View>
                  <Text style={styles.actionTitleLight}>Take a Photo</Text>
                  <Text style={styles.actionSubLight}>Use your camera</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionTile, styles.actionTileOutline]}
                activeOpacity={0.9}
                onPress={handleGalleryPick}
                accessibilityLabel="Choose photo from gallery"
              >
                <View style={styles.actionIconDark}>
                  <MaterialCommunityIcons name="image-multiple" size={24} color={Colors.primary} />
                </View>
                <Text style={styles.actionTitleDark}>From Gallery</Text>
                <Text style={styles.actionSubDark}>Pick a photo</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* ── Resume Draft ── */}
          {draft && (
            <Animated.View style={[styles.draftCard, { opacity: fadeAnim }]}>
              <View style={styles.draftIconWrap}>
                <MaterialCommunityIcons name="history" size={22} color={Colors.primary} />
              </View>
              <View style={styles.flexFill}>
                <Text style={styles.draftTitle}>Unsaved design in progress</Text>
                <Text style={styles.draftSub}>Pick up where you left off</Text>
              </View>
              <TouchableOpacity
                style={styles.draftDiscardBtn}
                onPress={handleDiscardDraft}
                accessibilityLabel="Discard unsaved design"
              >
                <MaterialCommunityIcons name="close" size={18} color={Colors.textSecondaryDark} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.draftResumeBtn}
                onPress={handleResumeDraft}
                accessibilityLabel="Resume unsaved design"
              >
                <Text style={styles.draftResumeText}>Resume</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ── Recent Designs ── */}
          {projects.length > 0 && (
            <Animated.View style={[styles.recentsSection, { opacity: fadeAnim }]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>My Designs</Text>
                <TouchableOpacity
                  style={styles.seeAllBtn}
                  onPress={() => navigation.navigate('Projects')}
                >
                  <Text style={styles.seeAll}>See all</Text>
                  <MaterialCommunityIcons name="chevron-right" size={16} color={Colors.primary} />
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recentsScroll}
              >
                {projects.slice(0, 6).map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.projectCard}
                    activeOpacity={0.85}
                    onPress={() => handleLoadProject(p.id)}
                    accessibilityLabel={`Load design: ${p.name}`}
                  >
                    {p.thumbnailUri ? (
                      <Image source={{ uri: p.thumbnailUri }} style={styles.projectThumb} />
                    ) : (
                      <View style={styles.projectThumbPlaceholder}>
                        <MaterialCommunityIcons name="floor-plan" size={32} color={Colors.primary} />
                      </View>
                    )}
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.85)']}
                      style={styles.projectNameOverlay}
                      pointerEvents="none"
                    >
                      <Text style={styles.projectName} numberOfLines={1}>{p.name}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* ── Features ── */}
          <Animated.View style={[styles.featuresSection, { opacity: fadeAnim }]}>
            <Text style={styles.sectionTitle}>What you can do</Text>
            <View style={styles.featureList}>
              {FEATURES.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <View style={[styles.featureIcon, { backgroundColor: f.color + '22' }]}>
                    <MaterialCommunityIcons name={f.icon as any} size={22} color={f.color} />
                  </View>
                  <View style={styles.flexFill}>
                    <Text style={styles.featureTitle}>{f.title}</Text>
                    <Text style={styles.featureDesc}>{f.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgDark },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.lg },
  flexFill: { flex: 1 },
  bottomSpacer: { height: Spacing.xxl },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Spacing.md, paddingBottom: Spacing.lg,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  brandChip: {
    width: 44, height: 44, borderRadius: BorderRadius.lg,
    alignItems: 'center', justifyContent: 'center', ...Shadow.sm,
  },
  brandName: { ...Typography.h4, color: Colors.textPrimaryDark },
  brandSub: { ...Typography.caption, color: Colors.primary, letterSpacing: 1, textTransform: 'uppercase' },

  // Hero
  hero: { paddingTop: Spacing.sm, paddingBottom: Spacing.lg },
  heroTitle: { ...Typography.h1, fontSize: 34, lineHeight: 40, color: Colors.textPrimaryDark },
  heroSub: {
    ...Typography.body, color: Colors.textSecondaryDark,
    marginTop: Spacing.sm, marginBottom: Spacing.xl, maxWidth: '88%',
  },

  // Action tiles
  actionRow: { flexDirection: 'row', gap: Spacing.md },
  actionTile: {
    flex: 1, borderRadius: BorderRadius.xxl, overflow: 'hidden', minHeight: 148,
    ...Shadow.md,
  },
  actionTileInner: { flex: 1, padding: Spacing.lg, justifyContent: 'space-between' },
  actionTileOutline: {
    backgroundColor: Colors.surfaceDark, padding: Spacing.lg, justifyContent: 'space-between',
    borderWidth: 1, borderColor: Colors.borderDark,
  },
  actionIconLight: {
    width: 46, height: 46, borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center',
  },
  actionIconDark: {
    width: 46, height: 46, borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary + '1F', alignItems: 'center', justifyContent: 'center',
  },
  actionTitleLight: { ...Typography.h4, color: Colors.white, marginTop: Spacing.lg },
  actionSubLight: { ...Typography.caption, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  actionTitleDark: { ...Typography.h4, color: Colors.textPrimaryDark, marginTop: Spacing.lg },
  actionSubDark: { ...Typography.caption, color: Colors.textSecondaryDark, marginTop: 2 },

  // Resume draft
  draftCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surfaceDark, borderRadius: BorderRadius.xl,
    padding: Spacing.md, marginTop: Spacing.lg,
    borderWidth: 1, borderColor: Colors.primary + '50',
  },
  draftIconWrap: {
    width: 40, height: 40, borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary + '22',
    alignItems: 'center', justifyContent: 'center',
  },
  draftTitle: { ...Typography.label, color: Colors.textPrimaryDark },
  draftSub: { ...Typography.caption, color: Colors.textSecondaryDark },
  draftDiscardBtn: { padding: Spacing.xs },
  draftResumeBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
  },
  draftResumeText: { ...Typography.label, color: Colors.white },

  // Section header
  sectionTitle: { ...Typography.h3, color: Colors.textPrimaryDark },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center' },
  seeAll: { ...Typography.label, color: Colors.primary },

  // Recents
  recentsSection: { marginTop: Spacing.xxl },
  recentsScroll: { paddingRight: Spacing.lg, gap: Spacing.md },
  projectCard: {
    width: PROJECT_CARD_W, height: PROJECT_THUMB_H,
    borderRadius: BorderRadius.xl, overflow: 'hidden', backgroundColor: Colors.surfaceDark,
    ...Shadow.sm,
  },
  projectThumb: { width: '100%', height: '100%', resizeMode: 'cover' },
  projectThumbPlaceholder: {
    width: '100%', height: '100%', backgroundColor: Colors.surfaceElevatedDark,
    alignItems: 'center', justifyContent: 'center',
  },
  projectNameOverlay: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  projectName: { ...Typography.caption, color: Colors.white },

  // Features
  featuresSection: { marginTop: Spacing.xxl },
  featureList: { gap: Spacing.sm, marginTop: Spacing.sm },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surfaceDark, borderRadius: BorderRadius.xl,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.borderDark,
  },
  featureIcon: {
    width: 44, height: 44, borderRadius: BorderRadius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  featureTitle: { ...Typography.bodyMedium, color: Colors.textPrimaryDark },
  featureDesc: { ...Typography.caption, color: Colors.textSecondaryDark, marginTop: 1 },
});

export default HomeScreen;
