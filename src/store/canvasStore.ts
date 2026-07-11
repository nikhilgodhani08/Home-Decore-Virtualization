import { create } from 'zustand';
import { CanvasItem, CanvasSnapshot } from '../types/canvas.types';
import { HISTORY_LIMIT } from '../constants';
import { clearDraft } from '../utils/storageManager';

// ── helpers ────────────────────────────────────────────────────────────────

function normalizeZIndexes(items: CanvasItem[]): CanvasItem[] {
  return items.map((item, i) => ({ ...item, zIndex: i }));
}

function sortByZIndex(items: CanvasItem[]): CanvasItem[] {
  return [...items].sort((a, b) => a.zIndex - b.zIndex);
}

function bringForward(items: CanvasItem[], id: string): CanvasItem[] {
  const sorted = sortByZIndex(items);
  const idx = sorted.findIndex(i => i.id === id);
  if (idx === sorted.length - 1) return items;
  [sorted[idx], sorted[idx + 1]] = [sorted[idx + 1], sorted[idx]];
  return normalizeZIndexes(sorted);
}

function sendBackward(items: CanvasItem[], id: string): CanvasItem[] {
  const sorted = sortByZIndex(items);
  const idx = sorted.findIndex(i => i.id === id);
  if (idx === 0) return items;
  [sorted[idx], sorted[idx - 1]] = [sorted[idx - 1], sorted[idx]];
  return normalizeZIndexes(sorted);
}

function bringToFront(items: CanvasItem[], id: string): CanvasItem[] {
  const sorted = sortByZIndex(items);
  const idx = sorted.findIndex(i => i.id === id);
  const [item] = sorted.splice(idx, 1);
  sorted.push(item);
  return normalizeZIndexes(sorted);
}

function sendToBack(items: CanvasItem[], id: string): CanvasItem[] {
  const sorted = sortByZIndex(items);
  const idx = sorted.findIndex(i => i.id === id);
  const [item] = sorted.splice(idx, 1);
  sorted.unshift(item);
  return normalizeZIndexes(sorted);
}

function duplicateItem(item: CanvasItem): CanvasItem {
  return {
    ...item,
    id: `${item.id}_copy_${Date.now()}`,
    x: item.x + 20,
    y: item.y + 20,
    isProcessing: false,
  };
}

// ── Store ───────────────────────────────────────────────────────────────────

interface CanvasStore {
  roomImageUri: string | null;
  items: CanvasItem[];
  selectedItemId: string | null;
  selectedItemIds: string[];   // multi-select set; when non-empty, selectedItemId is null
  undoStack: CanvasSnapshot[];
  redoStack: CanvasSnapshot[];
  snapToGrid: boolean;
  showGuides: boolean;
  isExporting: boolean;

  // Getters
  selectedItem: () => CanvasItem | null;
  sortedItems: () => CanvasItem[];

  // Room image
  setRoomImage: (uri: string | null) => void;

  // Canvas items
  addItem: (item: CanvasItem) => void;
  updateItem: (id: string, changes: Partial<CanvasItem>) => void;
  deleteItem: (id: string) => void;
  deleteItems: (ids: string[]) => void;
  duplicateItems: (ids: string[]) => void;
  moveItemsBy: (ids: string[], dx: number, dy: number) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  clearCanvas: () => void;
  clearItems: () => void;

  // Selection
  selectItem: (id: string | null) => void;
  toggleMultiSelect: (id: string) => void;
  clearMultiSelect: () => void;

  // Layers
  bringForward: () => void;
  sendBackward: () => void;
  bringToFront: () => void;
  sendToBack: () => void;

  // History
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  // Settings
  setSnapToGrid: (v: boolean) => void;
  setShowGuides: (v: boolean) => void;
  setExporting: (v: boolean) => void;

  // Load full state (from saved project)
  loadCanvas: (items: CanvasItem[], roomImageUri: string | null) => void;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  roomImageUri: null,
  items: [],
  selectedItemId: null,
  selectedItemIds: [],
  undoStack: [],
  redoStack: [],
  snapToGrid: false,
  showGuides: true,
  isExporting: false,

  selectedItem: () => {
    const { items, selectedItemId } = get();
    return items.find(i => i.id === selectedItemId) ?? null;
  },

  sortedItems: () => sortByZIndex(get().items),

  setRoomImage: (uri) => {
    get().pushHistory();
    set({ roomImageUri: uri });
  },

  addItem: (item) => {
    get().pushHistory();
    set(state => ({
      items: normalizeZIndexes([...state.items, { ...item, zIndex: state.items.length }]),
      selectedItemId: item.id,
    }));
  },

  updateItem: (id, changes) => {
    set(state => ({
      items: state.items.map(i => (i.id === id ? { ...i, ...changes } : i)),
    }));
  },

  deleteItem: (id) => {
    get().pushHistory();
    set(state => ({
      items: state.items.filter(i => i.id !== id),
      selectedItemId: state.selectedItemId === id ? null : state.selectedItemId,
    }));
  },

  deleteItems: (ids) => {
    get().pushHistory();
    set(state => ({
      items: state.items.filter(i => !ids.includes(i.id)),
      selectedItemIds: [],
      selectedItemId: state.selectedItemId && ids.includes(state.selectedItemId) ? null : state.selectedItemId,
    }));
  },

  duplicateItems: (ids) => {
    const { items } = get();
    const toDuplicate = items.filter(i => ids.includes(i.id));
    if (toDuplicate.length === 0) return;
    get().pushHistory();
    const duplicates = toDuplicate.map(duplicateItem);
    set(state => ({
      items: normalizeZIndexes([...state.items, ...duplicates]),
      selectedItemIds: duplicates.map(d => d.id),
      selectedItemId: null,
    }));
  },

  moveItemsBy: (ids, dx, dy) => {
    set(state => ({
      items: state.items.map(i => (ids.includes(i.id) ? { ...i, x: i.x + dx, y: i.y + dy } : i)),
    }));
  },

  deleteSelected: () => {
    const { selectedItemId, selectedItemIds, deleteItem, deleteItems } = get();
    if (selectedItemIds.length > 0) {
      deleteItems(selectedItemIds);
      return;
    }
    if (selectedItemId) deleteItem(selectedItemId);
  },

  duplicateSelected: () => {
    const { selectedItemId, selectedItemIds, items, addItem, duplicateItems } = get();
    if (selectedItemIds.length > 0) {
      duplicateItems(selectedItemIds);
      return;
    }
    const item = items.find(i => i.id === selectedItemId);
    if (item) addItem(duplicateItem(item));
  },

  clearCanvas: () => {
    get().pushHistory();
    set({ items: [], selectedItemId: null, selectedItemIds: [], roomImageUri: null });
    clearDraft();
  },

  clearItems: () => {
    get().pushHistory();
    set({ items: [], selectedItemId: null, selectedItemIds: [] });
  },

  selectItem: (id) => set({ selectedItemId: id, selectedItemIds: [] }),

  toggleMultiSelect: (id) => set(state => {
    const exists = state.selectedItemIds.includes(id);
    const next = exists ? state.selectedItemIds.filter(i => i !== id) : [...state.selectedItemIds, id];
    return { selectedItemIds: next, selectedItemId: null };
  }),

  clearMultiSelect: () => set({ selectedItemIds: [] }),

  bringForward: () => {
    const { selectedItemId, items } = get();
    if (!selectedItemId) return;
    get().pushHistory();
    set({ items: bringForward(items, selectedItemId) });
  },

  sendBackward: () => {
    const { selectedItemId, items } = get();
    if (!selectedItemId) return;
    get().pushHistory();
    set({ items: sendBackward(items, selectedItemId) });
  },

  bringToFront: () => {
    const { selectedItemId, items } = get();
    if (!selectedItemId) return;
    get().pushHistory();
    set({ items: bringToFront(items, selectedItemId) });
  },

  sendToBack: () => {
    const { selectedItemId, items } = get();
    if (!selectedItemId) return;
    get().pushHistory();
    set({ items: sendToBack(items, selectedItemId) });
  },

  pushHistory: () => {
    const { items, roomImageUri, undoStack } = get();
    const snapshot: CanvasSnapshot = {
      items: JSON.parse(JSON.stringify(items)),
      roomImageUri,
    };
    const newStack = [...undoStack, snapshot].slice(-HISTORY_LIMIT);
    set({ undoStack: newStack, redoStack: [] });
  },

  undo: () => {
    const { undoStack, items, roomImageUri, redoStack } = get();
    if (undoStack.length === 0) return;
    const currentSnapshot: CanvasSnapshot = {
      items: JSON.parse(JSON.stringify(items)),
      roomImageUri,
    };
    const snapshot = undoStack[undoStack.length - 1];
    set({
      items: snapshot.items,
      roomImageUri: snapshot.roomImageUri,
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, currentSnapshot].slice(-HISTORY_LIMIT),
      selectedItemId: null,
      selectedItemIds: [],
    });
  },

  redo: () => {
    const { redoStack, items, roomImageUri, undoStack } = get();
    if (redoStack.length === 0) return;
    const currentSnapshot: CanvasSnapshot = {
      items: JSON.parse(JSON.stringify(items)),
      roomImageUri,
    };
    const snapshot = redoStack[redoStack.length - 1];
    set({
      items: snapshot.items,
      roomImageUri: snapshot.roomImageUri,
      redoStack: redoStack.slice(0, -1),
      undoStack: [...undoStack, currentSnapshot].slice(-HISTORY_LIMIT),
      selectedItemId: null,
      selectedItemIds: [],
    });
  },

  setSnapToGrid: (v) => set({ snapToGrid: v }),
  setShowGuides: (v) => set({ showGuides: v }),
  setExporting: (v) => set({ isExporting: v }),

  loadCanvas: (items, roomImageUri) => {
    set({ items, roomImageUri, selectedItemId: null, selectedItemIds: [], undoStack: [], redoStack: [] });
  },
}));
