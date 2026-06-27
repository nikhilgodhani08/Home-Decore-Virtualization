import { create } from 'zustand';
import { Project } from '../types/canvas.types';
import {
  loadProjects, saveProject as persistProject,
  deleteProjectById as removeProject,
} from '../utils/storageManager';

interface ProjectStore {
  projects: Project[];
  isLoading: boolean;

  // Actions
  fetchProjects: () => Promise<void>;
  saveProject: (project: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  getProjectById: (id: string) => Project | undefined;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  isLoading: false,

  fetchProjects: async () => {
    set({ isLoading: true });
    try {
      const projects = await loadProjects();
      set({ projects });
    } finally {
      set({ isLoading: false });
    }
  },

  saveProject: async (project) => {
    await persistProject(project);
    const projects = await loadProjects();
    set({ projects });
  },

  deleteProject: async (id) => {
    await removeProject(id);
    set(state => ({ projects: state.projects.filter(p => p.id !== id) }));
  },

  getProjectById: (id) => {
    return get().projects.find(p => p.id === id);
  },
}));
