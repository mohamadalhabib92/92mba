import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { mix } from '../theme';
import { useColors, useIsDark } from './colors';
import { announce, useLargeText } from './a11y';
import { useSystemReduceMotion } from './motion';
import { useI18n } from './i18n';
import { FOCUS_PATH, focusNav, formatClock, remainingMs, type FocusTarget } from './focus';
import { makeFocus, useFocusEngine, useFocusNow } from './focusRuntime';
import { FocusNotice, FocusPill, FocusStrip, FocusSuccess, type FocusTheme } from './FocusUI';
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

/** Écrans accessibles pendant une session : le lecteur (et la bibliothèque s’il n’y a pas encore de document). */
export const FOCUS_CONTENT = ['/doc', '/library'] as const;

/** Ouvre la lecture de la session PAR-DESSUS l’écran Focus, qui reste dessous. */
export function openFocusTarget(target: FocusTarget | undefined) {
  if (target?.kind === 'doc' && target.id) router.push({ pathname: '/doc/[id]', params: { id: target.id } });
  else router.push('/library');
}

/** Retour au minuteur (pastille, écran hors contenu) : on dépile jusqu’à l’écran Focus. */
export function backToFocusTimer() {
  router.dismissTo(FOCUS_PATH);
}

/** Depuis l’écran /focus : la session démarre et la lecture s’ouvre par-dessus. */
export function startFocusSession(minutes: number, target: FocusTarget | undefined, startedText: string) {
  focus.start(minutes, target);
  announce(startedText);
  openFocusTarget(target);
}

/**
 * Couche racine : moteur (horloge, AppState = pause, écran allumé, toasts en sourdine,
 * Retour Android) + pastille mm:ss dans la lecture + message de pause au retour
 * + garde de navigation (hors lecture ⇒ écran Focus) + moment de réussite.
 */
export function FocusLayer({ children }: { children: React.ReactNode }) {
  const snap = useFocusEngine(focus, () => router.canGoBack());
  const theme = useFocusTheme();
  const { ui } = useFocusText();
  const pathname = usePathname();
  const a = snap.data.active;
  const now = useFocusNow(!!a);
  const nav = focusNav(pathname, !!a, FOCUS_CONTENT);
  const notice = a ? snap.notice : null;
  const noticeText = notice ? ui.notice(notice.awayMs, notice.interruptions) : '';

  useEffect(() => {
    if (snap.hydrated && nav.redirect) backToFocusTimer();
  }, [snap.hydrated, nav.redirect, pathname]);

  useEffect(() => {
    if (!noticeText) return;
    announce(noticeText);
    const id = setTimeout(() => focus.dismissNotice(), 10000);
    return () => clearTimeout(id);
  }, [noticeText, notice?.at]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>{children}</View>
      {a && (nav.showPill || notice) ? (
        <FocusStrip theme={theme}>
          {notice ? <FocusNotice theme={theme} s={ui} text={noticeText} onClose={() => focus.dismissNotice()} /> : null}
          {nav.showPill ? <FocusPill theme={theme} s={ui} clock={formatClock(remainingMs(a, now), ui.num)} onPress={backToFocusTimer} /> : null}
        </FocusStrip>
      ) : null}
      <FocusSuccess record={snap.finished} theme={theme} s={ui} onClose={() => focus.dismissFinished()} />
    </View>
  );
}
