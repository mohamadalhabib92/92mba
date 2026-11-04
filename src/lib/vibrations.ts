/**
 * Réglage « Vibrations » (activé par défaut).
 *
 * Stocké sous sa PROPRE clé, ajoutée à côté des données existantes :
 * aucune migration, aucune clé existante lue, réécrite ou supprimée.
 * Valeur : "on" | "off". Absente ou illisible ⇒ activé.
 */
export type VibrationStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

export type VibrationPref = {
  key: string;
  get: () => boolean;
  set: (on: boolean) => void;
  subscribe: (l: () => void) => () => void;
  hydrate: () => Promise<void>;
};

export function createVibrationPref(storage: VibrationStorage, key: string): VibrationPref {
  let on = true;
  let touched = false;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());
  return {
    key,
    get: () => on,
    set(next) {
      touched = true;
      if (next === on) return;
      on = next;
      emit();
      storage.setItem(key, next ? 'on' : 'off').catch(() => undefined);
    },
    subscribe(l) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    async hydrate() {
      try {
        const raw = await storage.getItem(key);
        // Un choix fait pendant le chargement l’emporte sur la valeur lue.
        if (touched) return;
        const next = raw !== 'off';
        if (next !== on) {
          on = next;
          emit();
        }
      } catch {
        /* stockage indisponible : on garde « activé » */
      }
    },
  };
}
