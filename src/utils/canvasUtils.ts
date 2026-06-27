import { CanvasItem } from '../types/canvas.types';

// Sort items by zIndex for rendering order
export const sortByZIndex = (items: CanvasItem[]): CanvasItem[] =>
  [...items].sort((a, b) => a.zIndex - b.zIndex);

// Clamp value between min and max
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

// Check if a point is within an item's bounding box (center-based)
export const isPointInItem = (px: number, py: number, item: CanvasItem): boolean => {
  const w = (item.width * item.scaleX) / 2;
  const h = (item.height * item.scaleY) / 2;
  return (
    px >= item.x - w &&
    px <= item.x + w &&
    py >= item.y - h &&
    py <= item.y + h
  );
};

// Find topmost item at a point (highest zIndex wins)
export const getItemAtPoint = (
  items: CanvasItem[],
  px: number,
  py: number
): CanvasItem | null => {
  const sorted = sortByZIndex(items).reverse(); // top-first
  return sorted.find(item => !item.isLocked && isPointInItem(px, py, item)) ?? null;
};
