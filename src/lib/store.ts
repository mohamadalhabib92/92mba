import { createPersistedStore, BOOT_TIMEOUT_MS } from './persist';
import { defaultAppState, mergeLate, mergeStored, type AppState, type Progress } from './stateMerge';
import { cleanHistory as cleanHistoryList, sanitizeSearchQuery } from './textGuard';

export type { AppState, Progress };
export { BOOT_TIMEOUT_MS };

/** Clé historique. Ne pas la renommer : la progression et les signets des appareils déjà installés en dépendent. */
export const STORAGE_KEY = '92mba:v1';

export const appStore = createPersistedStore<AppState>(STORAGE_KEY, defaultAppState(), {
  merge: mergeStored,
  mergeLate,
});

/** Ajoute une recherche à l'historique — jamais de valeur vide, « undefined » ou « null ». */
export function pushSearchHistory(raw: unknown) {
  const q = sanitizeSearchQuery(raw);
  if (!q) return;
  appStore.set((s) => ({
    searchHistory: [q, ...s.searchHistory.filter((h) => h.toLowerCase() !== q.toLowerCase())].slice(0, 12),
  }));
}

export function cleanHistory(list: unknown): string[] {
  return cleanHistoryList(list);
}

type ProgressWriter = {
  isStorageReady(): boolean;
  set(patch: Partial<AppState> | ((current: AppState) => Partial<AppState>)): void;
};

/** N'écrit pas tant que le cache n'est pas lu : un page 0 automatique ne doit pas naître avant. */
export function recordProgress(store: ProgressWriter, id: string, page: number, pages: number) {
  if (!id || !Number.isFinite(page) || !Number.isFinite(pages) || pages <= 0) return;
  if (!store.isStorageReady()) return;
  store.set((s) => {
    const prev = s.progress[id];
    if (prev && prev.page === page && prev.pages === pages) return {};
    return { progress: { ...s.progress, [id]: { page, pages, updatedAt: Date.now() } } };
  });
}

export function setProgress(id: string, page: number, pages: number) {
  recordProgress(appStore, id, page, pages);
}

export function toggleBookmark(id: string, page: number) {
  if (!id || !Number.isFinite(page)) return;
  appStore.set((s) => {
    const cur = s.bookmarks[id] ?? [];
    const next = cur.includes(page) ? cur.filter((p) => p !== page) : [...cur, page].sort((a, b) => a - b);
    return { bookmarks: { ...s.bookmarks, [id]: next } };
  });
}
