import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

/** Au-delà, l'écran de repli propose Réessayer et Continuer hors ligne. Jamais un Loading infini. */
export const BOOT_TIMEOUT_MS = 8000;

export type KeyValueStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

export type StorageWarning = 'unreadable' | null;

/** Copie brute, jamais la clé d'origine. `92mba:v1` reste la clé de l'app. */
export function unreadableStorageKey(key: string): string {
  return `${key}:unreadable`;
}

export type PersistOptions<T> = {
  merge?: (stored: Partial<T>) => T;
  mergeLate?: (current: T, stored: Partial<T>, touched: ReadonlySet<string>) => T;
  /** Par défaut AsyncStorage. Les tests injectent un stockage en mémoire. */
  storage?: KeyValueStorage;
  /** Délai avant écriture. 150 ms dans l'app. */
  saveDelayMs?: number;
};

/**
 * Store persistant (AsyncStorage, localStorage sur le web).
 *
 * Aucune écriture tant que getItem n'a pas réussi. Sinon « Continuer hors ligne »
 * ou un timeout (sur main : course à 2,5 s qui résout `null`) laisse l'état vide
 * en mémoire, et le setItem suivant écrase la sauvegarde réelle.
 * Une lecture ratée ne compte pas comme un succès : on n'écrit pas non plus.
 */
export function createPersistedStore<T extends object>(key: string, initial: T, options: PersistOptions<T> = {}) {
  const storage = options.storage ?? AsyncStorage;
  const saveDelayMs = options.saveDelayMs ?? 150;
  let state: T = initial;
  let hydrated = false;
  let dirty = false;
  let storageReady = false;
  let pendingWipe = false;
  let warning: StorageWarning = null;
  let loadGen = 0;
  const touched = new Set<string>();
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());

  const preserveUnreadable = async (gen: number, raw: string) => {
    try {
      await storage.setItem(unreadableStorageKey(key), raw);
    } catch {
      // La copie a échoué. La clé principale n'est pas réécrite pour autant.
    }
    if (gen !== loadGen) return;
    warning = 'unreadable';
    hydrated = true;
    emit();
  };

  const applyParsed = (parsed: Partial<T>) => {
    if (dirty && options.mergeLate) state = options.mergeLate(state, parsed, touched);
    else if (options.merge) state = options.merge(parsed);
    else state = { ...initial, ...parsed };
  };

  const load = async (gen: number) => {
    let raw: string | null;
    try {
      raw = await storage.getItem(key);
    } catch {
      if (gen !== loadGen) return;
      if (pendingWipe) {
        pendingWipe = false;
        storageReady = true;
        hydrated = true;
        storage.removeItem(key).catch(() => undefined);
      }
      emit();
      return;
    }
    if (gen !== loadGen) return;
    if (pendingWipe) {
      pendingWipe = false;
      state = initial;
      storageReady = true;
      hydrated = true;
      emit();
      storage.removeItem(key).catch(() => undefined);
      return;
    }
    if (raw) {
      let parsed: Partial<T>;
      try {
        parsed = JSON.parse(raw) as Partial<T>;
      } catch {
        // Donnée illisible : on ne débloque pas l'écriture, sinon le prochain setItem écrase le cache.
        if (gen !== loadGen) return;
        await preserveUnreadable(gen, raw);
        return;
      }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        if (gen !== loadGen) return;
        await preserveUnreadable(gen, raw);
        return;
      }
      applyParsed(parsed);
    }
    storageReady = true;
    hydrated = true;
    emit();
    if (dirty) persist();
  };

  const start = () => {
    loadGen += 1;
    storageReady = false;
    void load(loadGen);
  };

  start();

  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  const persist = () => {
    if (!storageReady || pendingWipe) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      if (!storageReady || pendingWipe) return;
      storage.setItem(key, JSON.stringify(state)).catch(() => undefined);
    }, saveDelayMs);
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return {
    get: () => state,
    set(patch: Partial<T> | ((current: T) => Partial<T>)) {
      const next = typeof patch === 'function' ? patch(state) : patch;
      const keys = Object.keys(next);
      if (keys.length === 0) return;
      if (!storageReady) {
        dirty = true;
        for (const field of keys) {
          if (!Object.is(state[field as keyof T], next[field as keyof T])) touched.add(field);
        }
      }
      state = { ...state, ...next };
      emit();
      persist();
    },
    reset() {
      state = initial;
      dirty = true;
      touched.clear();
      hydrated = true;
      emit();
      if (!storageReady) {
        pendingWipe = true;
        if (saveTimer) clearTimeout(saveTimer);
        return;
      }
      loadGen += 1;
      pendingWipe = false;
      storage.removeItem(key).catch(() => undefined);
    },
    retryHydration() {
      hydrated = false;
      emit();
      start();
    },
    continueOffline() {
      hydrated = true;
      emit();
    },
    isStorageReady: () => storageReady,
    getWarning: () => warning,
    useStorageReady(): boolean {
      return useSyncExternalStore(subscribe, () => storageReady, () => false);
    },
    useStorageWarning(): StorageWarning {
      return useSyncExternalStore(subscribe, () => warning, () => null);
    },
    useStore(): T {
      return useSyncExternalStore(subscribe, () => state, () => state);
    },
    useHydrated(): boolean {
      return useSyncExternalStore(subscribe, () => hydrated, () => false);
    },
  };
}
