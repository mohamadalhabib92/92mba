import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

/** Au-delà, l'écran de repli propose Réessayer et Continuer hors ligne. Jamais un Loading infini. */
export const BOOT_TIMEOUT_MS = 8000;

export type KeyValueStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

export type StorageWarning = 'unreadable' | 'copy-failed' | null;
export type ResetResult = 'idle' | 'pending' | 'wiped' | 'refused';

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
  /** Horodatage injectable pour le suffixe de copie. */
  now?: () => string;
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
  let copyVerified = false;
  let resetResult: ResetResult = 'idle';
  let loadGen = 0;
  const touched = new Set<string>();
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());
  const stamp = () => (options.now ?? (() => new Date().toISOString()))();

  const markCopyFailed = () => {
    warning = 'copy-failed';
    copyVerified = false;
    hydrated = true;
    if (pendingWipe || resetResult === 'pending') {
      pendingWipe = false;
      resetResult = 'refused';
    }
    emit();
  };

  /** Écrit la copie, la relit, et ne la considère vraie que si elle est identique à l'original. */
  const preserveUnreadable = async (gen: number, raw: string): Promise<boolean> => {
    try {
      const base = unreadableStorageKey(key);
      let dest = base;
      const existing = await storage.getItem(base);
      if (existing !== null && existing !== raw) {
        const dated = `${base}:${stamp().replace(/[:.]/g, '-')}`;
        dest = dated;
        let n = 2;
        while (n < 50) {
          const taken = await storage.getItem(dest);
          if (taken === null || taken === raw) break;
          dest = `${dated}-${n}`;
          n += 1;
        }
      }
      await storage.setItem(dest, raw);
      const back = await storage.getItem(dest);
      if (back !== raw) throw new Error('copy mismatch');
      if (gen !== loadGen) return false;
      warning = 'unreadable';
      copyVerified = true;
      hydrated = true;
      emit();
      return true;
    } catch {
      if (gen !== loadGen) return false;
      markCopyFailed();
      return false;
    }
  };

  const wipeOriginal = async () => {
    pendingWipe = true;
    try {
      await storage.removeItem(key);
    } catch {
      pendingWipe = false;
      resetResult = 'refused';
      emit();
      return;
    }
    pendingWipe = false;
    state = initial;
    dirty = false;
    touched.clear();
    storageReady = true;
    warning = null;
    resetResult = 'wiped';
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
      // Pas d'octets à copier : on ne supprime pas l'original.
      if (pendingWipe || resetResult === 'pending') markCopyFailed();
      else emit();
      return;
    }
    if (gen !== loadGen) return;
    if (raw) {
      let parsed: Partial<T> | undefined;
      let unreadable = false;
      try {
        parsed = JSON.parse(raw) as Partial<T>;
      } catch {
        unreadable = true;
      }
      if (!unreadable && (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))) unreadable = true;
      if (unreadable) {
        if (gen !== loadGen) return;
        const verified = await preserveUnreadable(gen, raw);
        if (gen !== loadGen) return;
        if (pendingWipe || resetResult === 'pending') {
          if (verified) await wipeOriginal();
          else if (resetResult !== 'refused') markCopyFailed();
        }
        return;
      }
      if (pendingWipe) {
        await wipeOriginal();
        return;
      }
      applyParsed(parsed as Partial<T>);
      warning = null;
      copyVerified = false;
    } else if (pendingWipe) {
      await wipeOriginal();
      return;
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
    reset(): ResetResult {
      if (warning === 'copy-failed' || (warning === 'unreadable' && !copyVerified)) {
        markCopyFailed();
        resetResult = 'refused';
        emit();
        return 'refused';
      }
      if (warning === 'unreadable' && copyVerified) {
        void wipeOriginal();
        return 'wiped';
      }
      if (!storageReady) {
        pendingWipe = true;
        resetResult = 'pending';
        if (saveTimer) clearTimeout(saveTimer);
        emit();
        return 'pending';
      }
      loadGen += 1;
      void wipeOriginal();
      return 'wiped';
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
    isCopyVerified: () => copyVerified,
    getWarning: () => warning,
    getResetResult: () => resetResult,
    useStorageReady(): boolean {
      return useSyncExternalStore(subscribe, () => storageReady, () => false);
    },
    useCopyVerified(): boolean {
      return useSyncExternalStore(subscribe, () => copyVerified, () => false);
    },
    useStorageWarning(): StorageWarning {
      return useSyncExternalStore(subscribe, () => warning, () => null);
    },
    useResetResult(): ResetResult {
      return useSyncExternalStore(subscribe, () => resetResult, () => 'idle');
    },
    useStore(): T {
      return useSyncExternalStore(subscribe, () => state, () => state);
    },
    useHydrated(): boolean {
      return useSyncExternalStore(subscribe, () => hydrated, () => false);
    },
  };
}
