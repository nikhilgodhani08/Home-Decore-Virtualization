import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Dimensions, Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../types/navigation.types';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius, Shadow } from '../../theme/spacing';
import { useProjectStore } from '../../store/projectStore';
import { useCanvasStore } from '../../store/canvasStore';
import { useImagePicker } from '../../hooks/useImagePicker';
import { v4 as uuidv4 } from 'uuid';
import { AppFooter } from '../../components/AppFooter';


const { width: SCREEN_W } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const FEATURES = [
  { icon: 'gesture-swipe', title: 'Drag & Drop', desc: 'Place furniture with a tap or drag', color: Colors.primary },
  { icon: 'resize', title: 'Pinch to Resize', desc: 'Scale and rotate items freely', color: Colors.secondary },
  { icon: 'export', title: 'Export Design', desc: 'Save to gallery in full quality', color: Colors.success },
];

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { projects, fetchProjects } = useProjectStore();
  const clearCanvas = useCanvasStore(s => s.clearCanvas);
  const loadCanvas = useCanvasStore(s => s.loadCanvas);
  const { pickFromGallery, pickFromCamera } = useImagePicker();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    fetchProjects();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleGalleryPick = async () => {
    clearCanvas();
    const uri = await pickFromGallery();
    if (uri) navigation.navigate('Editor', {});
  };

  const handleCameraPick = async () => {
    clearCanvas();
    const uri = await pickFromCamera();
    if (uri) navigation.navigate('Editor', {});
  };

  const handleNewBlank = () => {
    clearCanvas();
    navigation.navigate('Editor', {});
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

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#0F0F1A', '#1A1A2E', '#16213E']}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* ── Hero Section ── */}
          <Animated.View style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}>
              <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.logoBg}>
                <MaterialCommunityIcons name="sofa" size={48} color={Colors.white} />
              </LinearGradient>
            </Animated.View>

            <Text style={styles.appName}>Bapasitaram home decore & gift</Text>
            <Text style={styles.tagline}>Design your dream room.{'\n'}Tap. Drag. Decorate.</Text>

            {/* CTA Buttons */}
            <View style={styles.ctaGroup}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleCameraPick}
                accessibilityLabel="Take a photo of your room"
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryDark]}
                  style={styles.primaryBtnInner}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <MaterialCommunityIcons name="camera" size={22} color={Colors.white} />
                  <Text style={styles.primaryBtnText}>Take a Photo</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={handleGalleryPick}
                accessibilityLabel="Choose photo from gallery"
              >
                <MaterialCommunityIcons name="image" size={22} color={Colors.primary} />
                <Text style={styles.secondaryBtnText}>Choose from Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.ghostBtn}
                onPress={handleNewBlank}
                accessibilityLabel="Start with blank canvas"
              >
                <MaterialCommunityIcons name="plus-circle-outline" size={20} color={Colors.textSecondaryDark} />
                <Text style={styles.ghostBtnText}>Start with Blank Canvas</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* ── Feature Cards ── */}
          <Animated.View style={[styles.featuresSection, { opacity: fadeAnim }]}>
            <Text style={styles.sectionTitle}>What you can do</Text>
            <View style={styles.featureCards}>
              {FEATURES.map((f, i) => (
                <View key={i} style={styles.featureCard}>
                  <View style={[styles.featureIcon, { backgroundColor: f.color + '22' }]}>
                    <MaterialCommunityIcons name={f.icon as any} size={26} color={f.color} />
                  </View>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* ── Recent Designs ── */}
          {projects.length > 0 && (
            <Animated.View style={[styles.recentsSection, { opacity: fadeAnim }]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>My Designs</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Projects')}>
                  <Text style={styles.seeAll}>See all</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {projects.slice(0, 6).map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.projectCard}
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
                    <View style={styles.projectInfo}>
                      <Text style={styles.projectName} numberOfLines={1}>{p.name}</Text>
                      <Text style={styles.projectMeta}>
                        {p.itemCount} items · {new Date(p.updatedAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animated.View>
          )}

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      </SafeAreaView>
      <AppFooter />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgDark },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.lg },

  // Hero
  hero: { alignItems: 'center', paddingTop: Spacing.xxl, paddingBottom: Spacing.xl },
  logoContainer: { marginBottom: Spacing.lg },
  logoBg: {
    width: 96, height: 96, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.lg,
  },
  appName: { ...Typography.h1, color: Colors.white, marginBottom: 4, textAlign: 'center' },
  appNameAccent: { ...Typography.h1, color: Colors.primary, marginBottom: Spacing.sm },
  tagline: {
    ...Typography.body, color: Colors.textSecondaryDark,
    textAlign: 'center', lineHeight: 24, marginBottom: Spacing.xl,
  },

  // CTA
  ctaGroup: { width: '100%', gap: Spacing.md },
  primaryBtn: { borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadow.md },
  primaryBtnInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl, gap: Spacing.sm,
  },
  primaryBtnText: { ...Typography.h4, color: Colors.white },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, gap: Spacing.sm,
    borderRadius: BorderRadius.xl, borderWidth: 1.5, borderColor: Colors.primary,
    backgroundColor: Colors.primary + '15',
  },
  secondaryBtnText: { ...Typography.bodyMedium, color: Colors.primary },
  ghostBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.sm, gap: Spacing.xs,
  },
  ghostBtnText: { ...Typography.body, color: Colors.textSecondaryDark },

  // Features
  featuresSection: { marginTop: Spacing.xl },
  sectionTitle: { ...Typography.h3, color: Colors.white, marginBottom: Spacing.lg },
  featureCards: { flexDirection: 'row', gap: Spacing.sm },
  featureCard: {
    flex: 1, backgroundColor: Colors.surfaceDark, borderRadius: BorderRadius.xl,
    padding: Spacing.md, alignItems: 'center', gap: Spacing.xs, ...Shadow.sm,
    borderWidth: 1, borderColor: Colors.borderDark,
  },
  featureIcon: { padding: Spacing.sm, borderRadius: BorderRadius.lg, marginBottom: Spacing.xs },
  featureTitle: { ...Typography.label, color: Colors.white, textAlign: 'center' },
  featureDesc: { ...Typography.caption, color: Colors.textSecondaryDark, textAlign: 'center' },

  // Recents
  recentsSection: { marginTop: Spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  seeAll: { ...Typography.label, color: Colors.primary },
  projectCard: {
    width: 150, marginRight: Spacing.md, backgroundColor: Colors.surfaceDark,
    borderRadius: BorderRadius.xl, overflow: 'hidden', borderWidth: 1, borderColor: Colors.borderDark,
  },
  projectThumb: { width: '100%', height: 100, resizeMode: 'cover' },
  projectThumbPlaceholder: {
    width: '100%', height: 100, backgroundColor: Colors.surfaceElevatedDark,
    alignItems: 'center', justifyContent: 'center',
  },
  projectInfo: { padding: Spacing.sm },
  projectName: { ...Typography.label, color: Colors.white, marginBottom: 2 },
  projectMeta: { ...Typography.caption, color: Colors.textSecondaryDark },
});

export default HomeScreen;
