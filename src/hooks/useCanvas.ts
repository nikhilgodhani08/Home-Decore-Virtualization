import { useCallback } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { useUIStore } from '../store/uiStore';
import { useProjectStore } from '../store/projectStore';
import { CanvasItem, Project } from '../types/canvas.types';

export const useCanvas = () => {
  const store = useCanvasStore();
  const ui = useUIStore();
  const projectStore = useProjectStore();

  const handleDelete = useCallback(() => {
    store.deleteSelected();
    store.selectItem(null);
  }, [store]);

  const handleDuplicate = useCallback(() => {
    store.duplicateSelected();
  }, [store]);

  const handleUndo = useCallback(() => {
    store.undo();
  }, [store]);

  const handleRedo = useCallback(() => {
    store.redo();
  }, [store]);

  const saveNewProject = useCallback(async (name: string): Promise<string> => {
    const { items, roomImageUri } = useCanvasStore.getState();
    const id = `proj_${Date.now()}`;
    const project: Project = {
      id,
      name,
      thumbnailUri: null,
      roomImageUri,
      canvasJSON: JSON.stringify(items),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      itemCount: items.length,
    };
    await projectStore.saveProject(project);
    ui.setActiveProjectId(id);
    ui.showSnackbar('Design saved!', 'success');
    return id;
  }, [projectStore, ui]);

  const loadProject = useCallback((project: Project) => {
    try {
      const items: CanvasItem[] = JSON.parse(project.canvasJSON || '[]');
      store.loadCanvas(items, project.roomImageUri);
      ui.setActiveProjectId(project.id);
    } catch (e) {
      ui.showSnackbar('Failed to load project', 'error');
    }
  }, [store, ui]);

  return {
    handleDelete,
    handleDuplicate,
    handleUndo,
    handleRedo,
    saveNewProject,
    loadProject,
  };
};
