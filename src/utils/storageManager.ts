import AsyncStorage from '@react-native-async-storage/async-storage';
import { CanvasDraft, Project } from '../types/canvas.types';
import { STORAGE_KEYS } from '../constants';

// ── Projects ──────────────────────────────────────────────────────────────

export const loadProjects = async (): Promise<Project[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.PROJECTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveProjects = async (projects: Project[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  } catch {}
};

export const saveProject = async (project: Project): Promise<void> => {
  const all = await loadProjects();
  const idx = all.findIndex(p => p.id === project.id);
  if (idx >= 0) {
    all[idx] = project;
  } else {
    all.unshift(project);
  }
  await saveProjects(all);
};

export const deleteProjectById = async (id: string): Promise<void> => {
  const all = await loadProjects();
  await saveProjects(all.filter(p => p.id !== id));
};

// ── Draft (autosave) ─────────────────────────────────────────────────────

export const loadDraft = async (): Promise<CanvasDraft | null> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.DRAFT);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveDraft = async (draft: CanvasDraft): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(draft));
  } catch {}
};

export const clearDraft = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.DRAFT);
  } catch {}
};
