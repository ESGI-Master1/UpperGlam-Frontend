export const colors = {
  background: '#0B0B0C',
  surface: '#111114',
  primaryText: '#F5F5F5',
  secondaryText: '#B9B9B9',
  accentChampagne: '#D6B36A',
  accentHover: '#E2C27D',
} as const;

export type ColorKey = keyof typeof colors;
