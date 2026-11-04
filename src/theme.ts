/**
 * Tokens uniques de 92'MBA.
 * Palette conservée : #F7F4EE / #16213A / #1B2A4A, or #C9A227.
 * L'or est décoratif ou posé sur fond foncé. Le texte sur fond clair utilise accentInk.
 */

export const colors = {
  bg: '#F7F4EE',
  surface: '#FFFFFF',
  surfaceAlt: '#ECE7DD',
  text: '#16213A',
  muted: '#5F6577',
  border: '#DDD6C8',
  primary: '#1B2A4A',
  primarySoft: '#E4E8F1',
  onPrimary: '#FFFFFF',
  /** Or — décoration, ou texte/icône sur fond foncé uniquement. */
  accent: '#C9A227',
  /** Bronze lisible (AA) sur crème, blanc et sépia. */
  accentInk: '#6B4F10',
  danger: '#B3261E',
  success: '#145C32',
  noticeBg: '#FFF6DC',
  /** Surfaces de marque (bandeau, couvertures) : marine dans les deux thèmes. */
  brand: '#1B2A4A',
  onBrand: '#FFFFFF',
  onBrandMuted: '#D7DCEA',
};

export type Colors = { [K in keyof typeof colors]: string };

/**
 * Mode sombre (suit le système). Marine profond en fond, or conservé,
 * textes clairs : tous les couples texte/fond restent AA (voir passe1.check).
 */
export const darkColors: Colors = {
  bg: '#0E1424',
  surface: '#161E33',
  surfaceAlt: '#1F2942',
  text: '#ECE8DF',
  muted: '#A9AEBD',
  border: '#2C3754',
  primary: '#C7D3EE',
  primarySoft: '#24304D',
  onPrimary: '#0E1424',
  accent: '#C9A227',
  accentInk: '#D9B54A',
  danger: '#F2867E',
  success: '#6FCF97',
  noticeBg: '#2A2412',
  brand: '#1E2D52',
  onBrand: '#FFFFFF',
  onBrandMuted: '#D7DCEA',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 40 };
export const radius = { sm: 8, md: 12, lg: 18 };
export const hit = { min: 44 };

export const badgeTones = {
  neutral: { bg: '#ECE7DD', fg: '#3E4456' },
  warn: { bg: '#FFF4DB', fg: '#6B4700' },
  ok: { bg: '#E3F6EA', fg: '#145C32' },
  info: { bg: '#E4E8F1', fg: '#1B2A4A' },
} as const;

export const badgeTonesDark: Record<keyof typeof badgeTones, { bg: string; fg: string }> = {
  neutral: { bg: '#262F47', fg: '#D8DCE6' },
  warn: { bg: '#3A2E0F', fg: '#F3D27A' },
  ok: { bg: '#12301F', fg: '#8FE0B0' },
  info: { bg: '#24304D', fg: '#C7D3EE' },
};

/** Quatre surlignages lisibles dans les trois thèmes : texte sombre sur pastille claire. */
export const highlightColors = {
  yellow: { bg: '#F3D36B', text: '#1A1400' },
  green: { bg: '#8FD4A8', text: '#062214' },
  blue: { bg: '#8EBFEC', text: '#06182A' },
  rose: { bg: '#F0A8B4', text: '#2A0A12' },
} as const;

export type HighlightName = keyof typeof highlightColors;

/** @deprecated préférez highlightColors.yellow — conservé pour les appelants existants. */
export const highlight = highlightColors.yellow.bg;

export type ReaderTheme = 'light' | 'sepia' | 'dark';

export const readerThemes: Record<
  ReaderTheme,
  { bg: string; text: string; muted: string; bar: string; accent: string; link: string }
> = {
  light: {
    bg: '#FFFFFF',
    text: '#1A1A1A',
    muted: '#5C5C5C',
    bar: '#F3F1EC',
    accent: colors.accentInk,
    link: colors.accentInk,
  },
  sepia: {
    bg: '#F6EEDC',
    text: '#3B2F22',
    muted: '#5C4A38',
    bar: '#EDE2C9',
    accent: colors.accentInk,
    link: colors.accentInk,
  },
  dark: {
    bg: '#121418',
    text: '#E7E4DD',
    muted: '#A3A3AB',
    bar: '#1C1F25',
    accent: colors.accent,
    link: colors.accent,
  },
};

export const LINE_HEIGHT_STEPS = [1.5, 1.6, 1.7] as const;
export type LineHeightStep = (typeof LINE_HEIGHT_STEPS)[number];
export type ReaderMargin = 'compact' | 'normal' | 'wide';

/** Largeur de colonne vise 60 à 75 caractères quand l'écran le permet. */
export function readingColumnWidth(fontSize: number, margin: ReaderMargin): number {
  const chars = margin === 'wide' ? 60 : margin === 'compact' ? 75 : 68;
  return Math.round(fontSize * 0.5 * chars);
}

export function readingPadding(margin: ReaderMargin): number {
  if (margin === 'wide') return 36;
  if (margin === 'compact') return 12;
  return 22;
}

export function snapLineHeight(value: unknown): LineHeightStep {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 1.6;
  return LINE_HEIGHT_STEPS.reduce((best, step) => (Math.abs(step - n) < Math.abs(best - n) ? step : best));
}

export function snapMargin(value: unknown): ReaderMargin {
  return value === 'compact' || value === 'wide' || value === 'normal' ? value : 'normal';
}

export function snapFontScale(value: unknown): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 1;
  const clamped = Math.max(0.8, Math.min(2, n));
  return Math.round(clamped * 10) / 10;
}

export function contrastRatio(a: string, b: string): number {
  const lum = (hex: string) => {
    const h = hex.replace('#', '');
    const channel = (pair: string) => {
      const s = parseInt(pair, 16) / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    const r = channel(h.slice(0, 2));
    const g = channel(h.slice(2, 4));
    const bl = channel(h.slice(4, 6));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const l1 = lum(a);
  const l2 = lum(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Polices embarquées (SIL OFL), pas de téléchargement au démarrage.
 * Source Serif 4 (corps), Source Sans 3 (interface), Noto Naskh Arabic (arabe).
 * Licences : assets/fonts/OFL-*.txt
 */
export const fontNames = {
  ui: 'SourceSans3',
  uiBold: 'SourceSans3Bold',
  serif: 'SourceSerif4',
  arabic: 'NotoNaskhArabic',
  arabicBold: 'NotoNaskhArabicBold',
} as const;
