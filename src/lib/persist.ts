import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

/**
 * Petit store persistant (AsyncStorage → localStorage sur le web).
 * L'hydratation a un timeout : l'app ne reste jamais bloquée sur « Loading ».
 */
export function createPersistedStore<T extends object>(key: string, initial: T, timeoutMs = 2500) {
  let state: T = initial;
  let hydrated = false;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  const hydration = (async () => {
    try {
      const raw = await Promise.race<string | null>([
        AsyncStorage.getItem(key),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
      ]);
      if (raw) state = { ...initial, ...(JSON.parse(raw) as Partial<T>) };
    } catch {
      // Données locales corrompues : on repart des valeurs par défaut.
    }
    hydrated = true;
    emit();
  })();

  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  const persist = () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      AsyncStorage.setItem(key, JSON.stringify(state)).catch(() => undefined);
    }, 150);
  };

  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  };

  return {
    get: () => state,
    set(patch: Partial<T> | ((s: T) => Partial<T>)) {
      const p = typeof patch === 'function' ? patch(state) : patch;
      state = { ...state, ...p };
      emit();
      persist();
    },
    reset() {
      state = initial;
      emit();
      AsyncStorage.removeItem(key).catch(() => undefined);
    },
    hydration,
    useStore(): T {
      return useSyncExternalStore(subscribe, () => state, () => state);
    },
    useHydrated(): boolean {
      return useSyncExternalStore(subscribe, () => hydrated, () => hydrated);
    },
  };
}
