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
  accent: '#C9A227',
  danger: '#B3261E',
  highlight: '#FFE27A',
};
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const radius = { sm: 8, md: 12, lg: 18 };

export type ReaderTheme = 'light' | 'sepia' | 'dark';
export const readerThemes: Record<ReaderTheme, { bg: string; text: string; muted: string; bar: string }> = {
  light: { bg: '#FFFFFF', text: '#1A1A1A', muted: '#6B6B6B', bar: '#F3F1EC' },
  sepia: { bg: '#F6EEDC', text: '#3B2F22', muted: '#7A6A55', bar: '#EDE2C9' },
  dark: { bg: '#121418', text: '#E7E4DD', muted: '#9A9AA2', bar: '#1C1F25' },
};
