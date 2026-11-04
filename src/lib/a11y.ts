import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, useWindowDimensions } from 'react-native';

/**
 * Annonce VoiceOver / TalkBack. Sur iOS, mise en file d’attente pour ne pas
 * couper la lecture en cours (changement d’écran, toast précédent).
 */
export function announce(message: string | null | undefined) {
  if (!message) return;
  const A = AccessibilityInfo as typeof AccessibilityInfo & {
    announceForAccessibilityWithOptions?: (m: string, o: { queue?: boolean }) => void;
  };
  try {
    if (Platform.OS === 'ios' && typeof A.announceForAccessibilityWithOptions === 'function') A.announceForAccessibilityWithOptions(message, { queue: true });
    else A.announceForAccessibility?.(message);
  } catch {
    /* lecteur d’écran indisponible (web, tests) */
  }
}

function useA11yFlag(read: (() => Promise<boolean>) | undefined, event: string): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let alive = true;
    if (typeof read === 'function')
      read
        .call(AccessibilityInfo)
        .then((v) => {
          if (alive) setOn(!!v);
        })
        .catch(() => undefined);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sub = (AccessibilityInfo.addEventListener as any)?.(event, (v: boolean) => setOn(!!v));
    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, [read, event]);
  return on;
}

/** Préférence iOS « Réduire la transparence » : fonds pleins au lieu de voiles. */
export function useReduceTransparency(): boolean {
  return useA11yFlag(Platform.OS === 'ios' ? AccessibilityInfo.isReduceTransparencyEnabled : undefined, 'reduceTransparencyChanged');
}

/** Lecteur d’écran actif (VoiceOver / TalkBack). */
export function useScreenReader(): boolean {
  return useA11yFlag(AccessibilityInfo.isScreenReaderEnabled, 'screenReaderChanged');
}

/** Taille de texte système (Dynamic Type) × réglage de l’app ≥ 1,3 : mise en page souple. */
export function useLargeText(appScale = 1): boolean {
  const { fontScale } = useWindowDimensions();
  return (fontScale || 1) * appScale >= 1.3;
}
