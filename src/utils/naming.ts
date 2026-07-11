// Friendly, decor-themed default names for new designs, e.g. "Cozy Lounge 4821".
// Uses a random suffix instead of an exact date/time so names read nicely.

const ADJECTIVES = [
  'Cozy', 'Modern', 'Elegant', 'Warm', 'Serene', 'Chic', 'Rustic',
  'Bright', 'Bold', 'Minimal', 'Vibrant', 'Classic', 'Sunny', 'Calm',
];

const SPACES = [
  'Living Room', 'Bedroom', 'Studio', 'Lounge', 'Nook', 'Space',
  'Corner', 'Retreat', 'Haven', 'Setup', 'Interior', 'Room',
];

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const generateDesignName = (): string => {
  const suffix = Math.floor(1000 + Math.random() * 9000); // 4-digit
  return `${pick(ADJECTIVES)} ${pick(SPACES)} ${suffix}`;
};
