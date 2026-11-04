import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AppState, BackHandler, Platform } from 'react-native';
import { createFocusController, type FocusController } from './focusController';
import { setToastsMuted } from './quiet';

type KeepAwake = typeof import('expo-keep-awake');
let keepAwakeMod: KeepAwake | null | undefined;
function keepAwake(): KeepAwake | null {
  if (keepAwakeMod !== undefined) return keepAwakeMod;
  try {
    // Absent d’un ancien binaire : on continue sans garder l’écran allumé.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    keepAwakeMod = require('expo-keep-awake') as KeepAwake;
  } catch {
    keepAwakeMod = null;
  }
  return keepAwakeMod;
}
const KEEP_AWAKE_TAG = 'focus-mode';

export function makeFocus(key: string) {
  const controller = createFocusController(AsyncStorage, key);
  const useFocus = () => useSyncExternalStore(controller.subscribe, controller.get, controller.get);
  return { controller, useFocus };
}

/**
 * Moteur du Mode Focus, monté une seule fois à la racine :
 * horloge (1 s), AppState (interruptions), écran allumé, toasts en sourdine,
 * bouton Retour Android qui ne fait pas quitter l’app pendant la session.
 */
export function useFocusEngine(controller: FocusController, canGoBack: () => boolean) {
  const snap = useSyncExternalStore(controller.subscribe, controller.get, controller.get);
  const active = !!snap.data.active;
  const canGoBackRef = useRef(canGoBack);
  canGoBackRef.current = canGoBack;

  useEffect(() => {
    void controller.hydrate();
  }, [controller]);

  useEffect(() => {
    setToastsMuted(active);
    if (!active) return;
    // Le moment de réussite (vibration + annonce) est géré par l’écran de fin.
    const id = setInterval(() => controller.tick(), 1000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') controller.background();
      else if (state === 'active') controller.foreground();
    });
    const ka = keepAwake();
    try {
      ka?.activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => undefined);
    } catch {
      /* non pris en charge (navigateur) */
    }
    const back =
      Platform.OS === 'android'
        ? BackHandler.addEventListener('hardwareBackPress', () => !canGoBackRef.current())
        : null;
    return () => {
      clearInterval(id);
      sub.remove();
      back?.remove();
      try {
        ka?.deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => undefined);
      } catch {
        /* rien à libérer */
      }
      setToastsMuted(false);
    };
  }, [active, controller]);

  return snap;
}

/** Horloge d’affichage : rafraîchit chaque seconde tant qu’une session est active. */
export function useFocusNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}
