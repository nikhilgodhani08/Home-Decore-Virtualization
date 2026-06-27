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
            showSnackbar('Design deleted', 'info');
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

      {/* Info */}
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.cardMeta}>{item.itemCount} items</Text>
        <Text style={styles.cardDate}>{new Date(item.updatedAt).toLocaleDateString()}</Text>
      </View>

      {/* Action buttons */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          onPress={() => handleDeleteProject(item)}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <MaterialCommunityIcons name="delete-outline" size={18} color={Colors.error + 'A0'} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

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
            accessibilityLabel="Go back"
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Designs</Text>
          <TouchableOpacity
            style={styles.newBtn}
            onPress={handleNewDesign}
            accessibilityLabel="Create new design"
          >
            <MaterialCommunityIcons name="plus" size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={18} color={Colors.textSecondaryDark} />
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
            <MaterialCommunityIcons name="folder-open" size={64} color={Colors.borderDark} />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No results found' : 'No saved designs'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try a different search' : 'Create your first design from the home screen'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity style={styles.createBtn} onPress={handleNewDesign}>
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryDark]}
                  style={styles.createBtnInner}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <MaterialCommunityIcons name="plus" size={20} color={Colors.white} />
                  <Text style={styles.createBtnText}>New Design</Text>
                </LinearGradient>
              </TouchableOpacity>
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
  headerTitle: { ...Typography.h3, color: Colors.white, flex: 1, textAlign: 'center' },
  newBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

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
    backgroundColor: Colors.surfaceDark,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderDark,
    ...Shadow.sm,
  },
  cardThumb: { width: '100%', height: 120 },
  cardThumbPlaceholder: {
    width: '100%', height: 120,
    alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { padding: Spacing.md, flex: 1 },
  cardName: { ...Typography.bodyMedium, color: Colors.white, marginBottom: 4 },
  cardMeta: { ...Typography.caption, color: Colors.primary, marginBottom: 2 },
  cardDate: { ...Typography.caption, color: Colors.textSecondaryDark },
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
  emptyTitle: { ...Typography.h3, color: Colors.white, textAlign: 'center' },
  emptySubtitle: { ...Typography.body, color: Colors.textSecondaryDark, textAlign: 'center', lineHeight: 24 },
  createBtn: { borderRadius: BorderRadius.xl, overflow: 'hidden', marginTop: Spacing.md },
  createBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  createBtnText: { ...Typography.bodyMedium, color: Colors.white },
});

export default ProjectsScreen;
