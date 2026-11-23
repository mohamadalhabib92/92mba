/**
 * Couches ajoutées au-dessus des tokens historiques de `src/theme.ts`.
 * `colors` ne change pas : les tests de contraste de la liseuse s'y réfèrent.
 */

export const typeScale = {
  display: 34,
  h1: 28,
  h2: 20,
  h3: 16,
  body: 16,
  small: 13,
  caption: 12,
} as const;

export const motion = {
  fast: 160,
  base: 240,
  slow: 420,
} as const;

export type Palette = {
  bg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
  primarySoft: string;
  onPrimary: string;
  accent: string;
  accentInk: string;
  danger: string;
  success: string;
  successSoft: string;
  noticeBg: string;
  noticeText: string;
  shadow: string;
};

export const lightPalette: Palette = {
  bg: '#F7F4EE',
  surface: '#FFFFFF',
  surfaceAlt: '#ECE7DD',
  text: '#16213A',
  muted: '#5F6577',
  border: '#DDD6C8',
  primary: '#1B2A4A',
  primarySoft: '#E4E8F1',
  onPrimary: '#FFFFFF',
  accent: '#C9A227',
  accentInk: '#6B4F10',
  danger: '#B3261E',
  success: '#145C32',
  successSoft: '#E3F6EA',
  noticeBg: '#FFF6DC',
  noticeText: '#6B4700',
  shadow: '#1B2A4A',
};

export const darkPalette: Palette = {
  bg: '#12151C',
  surface: '#1C2230',
  surfaceAlt: '#2A3142',
  text: '#F4F1EA',
  muted: '#C5CDD8',
  border: '#3A4254',
  primary: '#D5E2F7',
  primarySoft: '#2A3548',
  onPrimary: '#12151C',
  accent: '#E0C36A',
  accentInk: '#E0C36A',
  danger: '#FFB4AB',
  success: '#9EE0B8',
  successSoft: '#1A3326',
  noticeBg: '#3A3118',
  noticeText: '#F3E2B0',
  shadow: '#000000',
};

export const highContrastLight: Palette = {
  ...lightPalette,
  bg: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#E6E6E6',
  text: '#000000',
  muted: '#1A1A1A',
  border: '#000000',
  primary: '#0B1B33',
  primarySoft: '#E8EEF8',
  accentInk: '#4A3408',
  noticeBg: '#FFF4CC',
  noticeText: '#1A1A1A',
};

export const highContrastDark: Palette = {
  ...darkPalette,
  bg: '#000000',
  surface: '#000000',
  surfaceAlt: '#1A1A1A',
  text: '#FFFFFF',
  muted: '#F2F2F2',
  border: '#FFFFFF',
  primary: '#FFFFFF',
  primarySoft: '#1A1A1A',
  onPrimary: '#000000',
  accent: '#FFE58A',
  accentInk: '#FFE58A',
  noticeBg: '#1A1A1A',
  noticeText: '#FFFFFF',
};

export function paletteFor(appearance: 'light' | 'dark', highContrast: boolean): Palette {
  if (highContrast) return appearance === 'dark' ? highContrastDark : highContrastLight;
  return appearance === 'dark' ? darkPalette : lightPalette;
}

export function shadowStyle(palette: Palette, reduced: boolean) {
  if (reduced) return { borderWidth: 1, borderColor: palette.border };
  return {
    shadowColor: palette.shadow,
    shadowOpacity: appearanceOpacity(palette),
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    borderWidth: 1,
    borderColor: palette.border,
  };
}

function appearanceOpacity(palette: Palette): number {
  return palette.bg === '#000000' || palette.bg === '#12151C' ? 0.35 : 0.08;
}
