// Canvas Item — a real photo placed on top of the room background
export interface CanvasItem {
  id: string;
  imageUri: string;         // local URI of the decor photo (from gallery/camera)
  label: string;            // e.g. "Sofa", "Lamp" — user can name it
  x: number;                // center X on canvas (in canvas space)
  y: number;                // center Y on canvas (in canvas space)
  width: number;            // display width in canvas space
  height: number;           // display height in canvas space
  scaleX: number;
  scaleY: number;
  rotation: number;         // degrees
  opacity: number;          // 0–1
  zIndex: number;
  isLocked: boolean;
  isFlippedH: boolean;
  isFlippedV: boolean;
  isProcessing?: boolean;   // background removal running on this item
}

// Snapshot for undo/redo
export interface CanvasSnapshot {
  items: CanvasItem[];
  roomImageUri: string | null;
}

// Autosaved in-progress canvas, distinct from an explicitly saved Project
export interface CanvasDraft {
  items: CanvasItem[];
  roomImageUri: string | null;
  projectId: string | null;   // set when the draft belongs to an already-saved project
  projectName: string;
  updatedAt: number;
}

// Saved project
export interface Project {
  id: string;
  name: string;
  thumbnailUri: string | null;
  roomImageUri: string | null;
  canvasJSON: string;        // JSON.stringify(CanvasItem[])
  createdAt: number;
  updatedAt: number;
  itemCount: number;
}
