import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, Alert, TextInput, Dimensions,
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
import { useUIStore } from '../../store/uiStore';
import { Project } from '../../types/canvas.types';
import { SnackbarNotification } from '../../components/SnackbarNotification';
import { IconButton } from '../../components/common/IconButton';
import { GradientButton } from '../../components/common/GradientButton';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../constants';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = (SCREEN_W - Spacing.lg * 2 - Spacing.md) / 2;

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Projects'>;
};

const ProjectsScreen: React.FC<Props> = ({ navigation }) => {
  const { projects, fetchProjects, deleteProject } = useProjectStore();
  const loadCanvas = useCanvasStore(s => s.loadCanvas);
  const clearCanvas = useCanvasStore(s => s.clearCanvas);
  const setActiveProjectId = useUIStore(s => s.setActiveProjectId);
  const showSnackbar = useUIStore(s => s.showSnackbar);

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenProject = useCallback((project: Project) => {
    try {
      const items = JSON.parse(project.canvasJSON || '[]');
      loadCanvas(items, project.roomImageUri);
      setActiveProjectId(project.id);
      navigation.navigate('Editor', { projectId: project.id });
    } catch (e) {
      showSnackbar('Failed to open project', 'error');
    }
  }, [loadCanvas, navigation, setActiveProjectId, showSnackbar]);

  const handleDeleteProject = useCallback((project: Project) => {
    Alert.alert(
      'Delete Design',
      `Delete "${project.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteProject(project.id);
          },
        },
      ]
    );
  }, [deleteProject, showSnackbar]);

  const handleNewDesign = () => {
    clearCanvas();
    setActiveProjectId(null);
    navigation.navigate('Editor', {});
  };

  const renderProject = ({ item }: { item: Project }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleOpenProject(item)}
      onLongPress={() => handleDeleteProject(item)}
      accessibilityLabel={`Open design: ${item.name}`}
    >
      {/* Thumbnail */}
      {item.thumbnailUri ? (
        <Image source={{ uri: item.thumbnailUri }} style={styles.cardThumb} resizeMode="cover" />
      ) : (
        <LinearGradient
          colors={[Colors.surfaceElevatedDark, Colors.bgDark]}
          style={styles.cardThumbPlaceholder}
        >
          <MaterialCommunityIcons name="floor-plan" size={40} color={Colors.primary + '80'} />
        </LinearGradient>
      )}

      {/* Name overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.nameOverlay}
        pointerEvents="none"
      >
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
      </LinearGradient>

      {/* Delete button */}
      <TouchableOpacity
        style={styles.cardActions}
        onPress={() => handleDeleteProject(item)}
        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        accessibilityLabel="Delete design"
      >
        <MaterialCommunityIcons name="delete-outline" size={18} color={Colors.white} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safe} edges={['top']}>

        {/* Header */}
        <View style={styles.header}>
          <IconButton icon="arrow-left" onPress={() => navigation.goBack()} accessibilityLabel="Go back" />
          <View style={styles.flexFill}>
            <Text style={styles.headerTitle}>My Designs</Text>
            <Text style={styles.headerSub}>
              {projects.length} {projects.length === 1 ? 'design' : 'designs'} saved
            </Text>
          </View>
          <IconButton
            icon="plus"
            variant="filled"
            onPress={handleNewDesign}
            accessibilityLabel="Create new design"
          />
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color={Colors.textSecondaryDark} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search designs..."
            placeholderTextColor={Colors.textSecondaryDark}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Project grid */}
        {filteredProjects.length > 0 ? (
          <FlatList
            data={filteredProjects}
            renderItem={renderProject}
            keyExtractor={p => p.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <MaterialCommunityIcons name="image-multiple-outline" size={44} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No results found' : 'No saved designs yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try a different search' : 'Create your first design from the home screen'}
            </Text>
            {!searchQuery && (
              <GradientButton
                label="New Design"
                icon="plus"
                iconSize={20}
                onPress={handleNewDesign}
                radius={BorderRadius.xl}
                textVariant="bodyMedium"
                shadow={false}
                style={styles.createBtn}
              />
            )}
          </View>
        )}
      </SafeAreaView>

      <SnackbarNotification />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgDark },
  safe: { flex: 1 },
  flexFill: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: { ...Typography.h2, color: Colors.textPrimaryDark },
  headerSub: { ...Typography.caption, color: Colors.textSecondaryDark, marginTop: 1 },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceDark,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    margin: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  searchInput: {
    ...Typography.body,
    color: Colors.white,
    flex: 1,
    padding: 0,
  },

  grid: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  row: { gap: Spacing.md, marginBottom: Spacing.md },

  card: {
    width: CARD_W,
    aspectRatio: CANVAS_WIDTH / CANVAS_HEIGHT,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceDark,
    ...Shadow.sm,
  },
  cardThumb: { width: '100%', height: '100%' },
  cardThumbPlaceholder: {
    width: '100%', height: '100%',
    alignItems: 'center', justifyContent: 'center',
  },
  nameOverlay: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  cardName: { ...Typography.label, color: Colors.white },
  cardActions: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.overlay,
    borderRadius: BorderRadius.full,
    padding: Spacing.xs,
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyIconWrap: {
    width: 96, height: 96, borderRadius: BorderRadius.xxl,
    backgroundColor: Colors.primary + '18',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emptyTitle: { ...Typography.h3, color: Colors.textPrimaryDark, textAlign: 'center' },
  emptySubtitle: { ...Typography.body, color: Colors.textSecondaryDark, textAlign: 'center', lineHeight: 24 },
  createBtn: { marginTop: Spacing.md },
});

export default ProjectsScreen;
