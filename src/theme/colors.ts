export const colors = {
  background: '#0B0B0C',
  surface: '#151412',
  surfaceElevated: '#1C1A17',
  primaryText: '#F7F3EC',
  secondaryText: '#AAA49A',
  accentChampagne: '#D8B76E',
  accentHover: '#E3C783',
  accentMuted: '#2A2418',
  hairline: '#2B2925',
} as const;

export type ColorKey = keyof typeof colors;
