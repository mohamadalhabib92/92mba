import type { Lang } from '../i18n/strings';
import type { ReaderTheme } from '../theme';
import type { Doc } from './library';
import { createPersistedStore } from './persist';

export type Progress = { page: number; pages: number; updatedAt: number };

export type AppState = {
  lang: Lang;
  fontScale: number;
  readerTheme: ReaderTheme;
  progress: Record<string, Progress>;
  bookmarks: Record<string, number[]>;
  searchHistory: string[];
  userDocs: Doc[];
};

export const appStore = createPersistedStore<AppState>('92mba:v1', {
  lang: 'fr',
  fontScale: 1,
  readerTheme: 'light',
  progress: {},
  bookmarks: {},
  searchHistory: [],
  userDocs: [],
});

/** Ajoute une recherche à l'historique — jamais de valeur vide, « undefined » ou « null ». */
export function pushSearchHistory(raw: unknown) {
  if (typeof raw !== 'string') return;
  const q = raw.trim();
  if (q.length < 2 || q === 'undefined' || q === 'null') return;
  appStore.set((s) => ({
    searchHistory: [q, ...s.searchHistory.filter((h) => typeof h === 'string' && h.toLowerCase() !== q.toLowerCase())].slice(0, 12),
  }));
}

export function cleanHistory(list: unknown): string[] {
  if (!Array.isArray(list)) return [];
  return list.filter((h): h is string => typeof h === 'string' && h.trim().length > 1 && h !== 'undefined' && h !== 'null');
}

export function setProgress(id: string, page: number, pages: number) {
  appStore.set((s) => ({ progress: { ...s.progress, [id]: { page, pages, updatedAt: Date.now() } } }));
}

export function toggleBookmark(id: string, page: number) {
  appStore.set((s) => {
    const cur = s.bookmarks[id] ?? [];
    const next = cur.includes(page) ? cur.filter((p) => p !== page) : [...cur, page].sort((a, b) => a - b);
    return { bookmarks: { ...s.bookmarks, [id]: next } };
  });
}
