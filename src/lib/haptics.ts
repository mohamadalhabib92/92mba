import { Platform } from 'react-native';

/**
 * Haptique douce (expo-haptics). Silencieuse sur le web et si le module
 * natif n’est pas présent dans le binaire (ancien build) : jamais d’erreur.
 */
type HapticsModule = typeof import('expo-haptics');

let mod: HapticsModule | null | undefined;
let enabled = true;

function load(): HapticsModule | null {
  if (mod !== undefined) return mod;
  if (Platform.OS === 'web') return (mod = null);
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require('expo-haptics') as HapticsModule;
  } catch {
    mod = null;
  }
  return mod;
}

/** Coupe ou rétablit toute l’haptique (réglage utilisateur). */
export function setHapticsEnabled(on: boolean) {
  enabled = on;
}

function run(fn: (h: HapticsModule) => Promise<void> | void) {
  if (!enabled) return;
  const h = load();
  if (!h) return;
  try {
    const p = fn(h);
    if (p && typeof (p as Promise<void>).catch === 'function') (p as Promise<void>).catch(() => undefined);
  } catch {
    /* module natif absent : on ignore */
  }
}

export const haptic = {
  /** Appui sur un bouton principal. */
  tap: () => run((h) => h.impactAsync(h.ImpactFeedbackStyle.Light)),
  /** Changement de sélection (puce, onglet, segment). */
  select: () => run((h) => h.selectionAsync()),
  success: () => run((h) => h.notificationAsync(h.NotificationFeedbackType.Success)),
  warning: () => run((h) => h.notificationAsync(h.NotificationFeedbackType.Warning)),
  error: () => run((h) => h.notificationAsync(h.NotificationFeedbackType.Error)),
};
