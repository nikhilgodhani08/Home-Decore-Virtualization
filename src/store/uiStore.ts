import { create } from 'zustand';

interface UIStore {
  isDrawerOpen: boolean;
  isPropertiesPanelOpen: boolean;
  activeCategory: string;
  searchQuery: string;
  snackbarMessage: string | null;
  snackbarType: 'success' | 'error' | 'info';
  isSaveDialogOpen: boolean;
  isExportDialogOpen: boolean;
  isDeleteConfirmOpen: boolean;
  activeProjectId: string | null;

  // Drawer
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;

  // Properties panel
  openPropertiesPanel: () => void;
  closePropertiesPanel: () => void;

  // Filters
  setActiveCategory: (cat: string) => void;
  setSearchQuery: (q: string) => void;

  // Snackbar
  showSnackbar: (msg: string, type?: 'success' | 'error' | 'info') => void;
  hideSnackbar: () => void;

  // Dialogs
  openSaveDialog: () => void;
  closeSaveDialog: () => void;
  openExportDialog: () => void;
  closeExportDialog: () => void;
  openDeleteConfirm: () => void;
  closeDeleteConfirm: () => void;

  // Project
  setActiveProjectId: (id: string | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isDrawerOpen: false,
  isPropertiesPanelOpen: false,
  activeCategory: 'all',
  searchQuery: '',
  snackbarMessage: null,
  snackbarType: 'info',
  isSaveDialogOpen: false,
  isExportDialogOpen: false,
  isDeleteConfirmOpen: false,
  activeProjectId: null,

  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  toggleDrawer: () => set(s => ({ isDrawerOpen: !s.isDrawerOpen })),

  openPropertiesPanel: () => set({ isPropertiesPanelOpen: true }),
  closePropertiesPanel: () => set({ isPropertiesPanelOpen: false }),

  setActiveCategory: (cat) => set({ activeCategory: cat }),
  setSearchQuery: (q) => set({ searchQuery: q }),

  showSnackbar: (msg, type = 'info') =>
    set({ snackbarMessage: msg, snackbarType: type }),
  hideSnackbar: () => set({ snackbarMessage: null }),

  openSaveDialog: () => set({ isSaveDialogOpen: true }),
  closeSaveDialog: () => set({ isSaveDialogOpen: false }),
  openExportDialog: () => set({ isExportDialogOpen: true }),
  closeExportDialog: () => set({ isExportDialogOpen: false }),
  openDeleteConfirm: () => set({ isDeleteConfirmOpen: true }),
  closeDeleteConfirm: () => set({ isDeleteConfirmOpen: false }),

  setActiveProjectId: (id) => set({ activeProjectId: id }),
}));
