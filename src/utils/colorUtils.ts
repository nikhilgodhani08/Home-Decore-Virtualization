// Convert hex color to rgba
export const hexToRGBA = (hex: string, alpha = 1): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

// Get luminance for contrast calculation
export const getLuminance = (hex: string): number => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
};

// Returns whether text on this background should be black or white
export const getContrastColor = (hex: string): '#000000' | '#FFFFFF' => {
  const lum = getLuminance(hex);
  return lum > 0.179 ? '#000000' : '#FFFFFF';
};

// Generate a lighter version of a color
export const lightenColor = (hex: string, amount: number): string => {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

// Blend two colors by alpha
export const blendColors = (bg: string, fg: string, alpha: number): string => {
  const bgR = parseInt(bg.slice(1, 3), 16);
  const bgG = parseInt(bg.slice(3, 5), 16);
  const bgB = parseInt(bg.slice(5, 7), 16);
  const fgR = parseInt(fg.slice(1, 3), 16);
  const fgG = parseInt(fg.slice(3, 5), 16);
  const fgB = parseInt(fg.slice(5, 7), 16);
  const r = Math.round(bgR * (1 - alpha) + fgR * alpha);
  const g = Math.round(bgG * (1 - alpha) + fgG * alpha);
  const b = Math.round(bgB * (1 - alpha) + fgB * alpha);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

// Category colors
export const CATEGORY_COLORS: Record<string, string> = {
  furniture: '#F59E0B',
  decor: '#EC4899',
  lighting: '#8B5CF6',
  accessories: '#10B981',
  all: '#6B7280',
};
