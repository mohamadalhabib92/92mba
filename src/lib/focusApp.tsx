import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { mix } from '../theme';
import { useColors, useIsDark } from './colors';
import { announce, useLargeText } from './a11y';
import { useSystemReduceMotion } from './motion';
import { useI18n } from './i18n';
import { progressOf, remainingMinutes, type FocusTarget } from './focus';
import { makeFocus, useFocusEngine, useFocusNow } from './focusRuntime';
import { FocusDock, FocusSuccess, type FocusTheme } from './FocusUI';
import { focusText } from './focusStrings';
import { uiFontStyle, useAppFonts } from './fonts';

/** Mode Focus de 92'MBA : historique sous la NOUVELLE clé `92mba:focus@v1`. */
export const FOCUS_KEY = '92mba:focus@v1';
export const { controller: focus, useFocus } = makeFocus(FOCUS_KEY);

export function useFocusTheme(): FocusTheme {
  const c = useColors();
  const dark = useIsDark();
  const { dir } = useI18n();
  const reduce = useSystemReduceMotion();
  const large = useLargeText();
  const fonts = useAppFonts();
  const rtl = dir === 'rtl';
  return {
    bg: c.bg,
    surface: c.surface,
    text: c.text,
    muted: c.muted,
    accent: c.primary,
    onAccent: c.onPrimary,
    track: mix(c.muted, c.surface, 0.28),
    danger: c.danger,
    onDanger: dark ? c.bg : '#FFFFFF',
    border: c.border,
    fontScale: 1,
    rtl,
    reduceMotion: reduce,
    largeText: large,
    face: (w) => uiFontStyle(w, rtl, fonts),
  };
}

export function useFocusText() {
  const { lang } = useI18n();
  return useMemo(() => focusText(lang), [lang]);
}

/** Ouvre la lecture de la session — à l’intérieur du Mode Focus. */
export function openFocusTarget(target: FocusTarget | undefined, replace = false) {
  const go = (href: Parameters<typeof router.push>[0]) => (replace ? router.replace(href) : router.push(href));
  if (target?.kind === 'doc' && target.id) go({ pathname: '/doc/[id]', params: { id: target.id } });
  else go('/library');
}

/** Depuis l’écran /focus : la session démarre et remplace l’écran de réglage par la lecture. */
export function startFocusSession(minutes: number, target: FocusTarget | undefined, startedText: string) {
  focus.start(minutes, target);
  announce(startedText);
  openFocusTarget(target, true);
}

/**
 * Couche racine : moteur (horloge, AppState, écran allumé, toasts en sourdine,
 * Retour Android) + barre de session à la place des onglets + moment de réussite.
 */
export function FocusLayer({ children }: { children: React.ReactNode }) {
  const snap = useFocusEngine(focus, () => router.canGoBack());
  const theme = useFocusTheme();
  const { ui } = useFocusText();
  const a = snap.data.active;
  const now = useFocusNow(!!a);
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>{children}</View>
      {a ? (
        <FocusDock
          theme={theme}
          s={ui}
          progress={progressOf(a, now)}
          remainingMin={remainingMinutes(a, now)}
          plannedMin={Math.round(a.durationMs / 60000)}
          onEmergency={(ms) => focus.emergency(ms, true)}
        />
      ) : null}
      <FocusSuccess record={snap.finished} theme={theme} s={ui} onClose={() => focus.dismissFinished()} />
    </View>
  );
}
