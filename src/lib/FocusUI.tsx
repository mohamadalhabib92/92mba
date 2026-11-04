import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityActionEvent, Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, TextStyle, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { announce } from './a11y';
import { haptic } from './haptics';
import { nativeDriver } from './motion';
import { EMERGENCY_HOLD_MS, holdDone, holdProgress, type FocusRecord } from './focus';

/**
 * Mode Focus — composants visuels partagés (anneau, pastille mm:ss,
 * message de pause, sortie d’urgence, moment de réussite, guide). Thème et textes injectés par l’app.
 */
export type FocusTheme = {
  bg: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  onAccent: string;
  track: string;
  danger: string;
  onDanger: string;
  border: string;
  fontScale: number;
  rtl: boolean;
  reduceMotion: boolean;
  largeText: boolean;
  /** Optionnel : police de l’app pour un poids donné (sinon police système). */
  face?: (weight: TextStyle['fontWeight']) => TextStyle;
};

function faceOf(theme: FocusTheme, w: TextStyle['fontWeight']): TextStyle {
  return theme.face ? theme.face(w) : {};
}

export type FocusStrings = {
  title: string;
  ringLabel: string;
  remaining: (min: number) => string;
  minShort: string;
  calm: string;
  emergency: string;
  emergencyHint: string;
  holding: (s: number) => string;
  confirmTitle: string;
  confirmText: (min: number) => string;
  stay: string;
  leave: string;
  left: string;
  successTitle: string;
  successText: (r: FocusRecord) => string;
  successButton: string;
  /** Pastille mm:ss dans le contenu : libellé lu (temps restant) et indice (revenir au minuteur). */
  pillLabel: (clock: string) => string;
  pillHint: string;
  /** Message discret au retour dans l’app (pause pendant l’absence). */
  notice: (awayMs: number, interruptions: number) => string;
  noticeOk: string;
  /** Chiffres affichés (latins ou indo-arabes selon l’app). */
  num: (n: number) => string;
};

const TICKS = 48;

/** Anneau de progression en traits (sans SVG) : rempli selon le temps écoulé. */
export function FocusRing({ progress, size, theme, children }: { progress: number; size: number; theme: FocusTheme; children?: React.ReactNode }) {
  const filled = Math.round(Math.min(1, Math.max(0, progress)) * TICKS);
  const tickH = Math.max(5, Math.round(size * 0.11));
  const tickW = Math.max(2, Math.round(size * 0.035));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {Array.from({ length: TICKS }, (_, i) => (
        <View key={i} pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', transform: [{ rotate: `${(i / TICKS) * 360}deg` }] }]}>
          <View style={{ width: tickW, height: tickH, borderRadius: tickW, backgroundColor: i < filled ? theme.accent : theme.track }} />
        </View>
      ))}
      {children}
    </View>
  );
}

/** Point qui « respire » lentement (immobile si Réduire les animations). */
function BreathDot({ theme }: { theme: FocusTheme }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (theme.reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver }),
        Animated.timing(v, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [theme.reduceMotion, v]);
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1.25] });
  const opacity = v.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.accent, transform: theme.reduceMotion ? undefined : [{ scale }], opacity: theme.reduceMotion ? 1 : opacity }}
    />
  );
}

/**
 * Sortie d’urgence : maintenir ≈ 3 s (le bouton se remplit), puis confirmer.
 * Lecteur d’écran : action « Sortie d’urgence » (rotor VoiceOver / actions TalkBack) → même confirmation.
 */
function EmergencyHold({ theme, s, onHeld }: { theme: FocusTheme; s: FocusStrings; onHeld: (heldMs: number) => void }) {
  const [held, setHeld] = useState(0);
  const startRef = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSecond = useRef(0);
  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    startRef.current = null;
    lastSecond.current = 0;
    setHeld(0);
  };
  useEffect(() => stop, []);
  const begin = () => {
    stop();
    startRef.current = Date.now();
    haptic.tap();
    timer.current = setInterval(() => {
      if (startRef.current === null) return;
      const ms = Date.now() - startRef.current;
      const sec = Math.floor(ms / 1000);
      if (sec > lastSecond.current && !holdDone(ms)) {
        lastSecond.current = sec;
        haptic.select();
      }
      if (holdDone(ms)) {
        stop();
        haptic.warning();
        onHeld(ms);
        return;
      }
      setHeld(ms);
    }, 100);
  };
  const p = holdProgress(held);
  // Réduire les animations : remplissage par paliers d’une seconde.
  const shown = theme.reduceMotion ? Math.floor(p * 3) / 3 : p;
  const left = Math.max(1, Math.ceil((EMERGENCY_HOLD_MS - held) / 1000));
  const onAction = (e: AccessibilityActionEvent) => {
    if (e.nativeEvent.actionName === 'longpress' || e.nativeEvent.actionName === 'emergency') onHeld(EMERGENCY_HOLD_MS);
    else if (e.nativeEvent.actionName === 'activate') announce(s.emergencyHint);
  };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={s.emergency}
      accessibilityHint={s.emergencyHint}
      accessibilityActions={[{ name: 'activate' }, { name: 'longpress', label: s.emergency }, { name: 'emergency', label: s.emergency }]}
      onAccessibilityAction={onAction}
      onPressIn={begin}
      onPressOut={stop}
      hitSlop={6}
      style={{ minHeight: 44, minWidth: 44, borderRadius: 12, borderWidth: 1, borderColor: theme.border, overflow: 'hidden', justifyContent: 'center', paddingHorizontal: 12 }}
    >
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, [theme.rtl ? 'right' : 'left']: 0, width: `${shown * 100}%`, backgroundColor: theme.danger, opacity: 0.22 }} />
      <Text style={{ color: theme.text, fontWeight: '600', fontSize: 13 * Math.min(theme.fontScale, 1.4), textAlign: 'center' , ...faceOf(theme, '600') }}>
        {held > 0 ? s.holding(left) : s.emergency}
      </Text>
    </Pressable>
  );
}

/** Confirmation après l’appui long. « Rester concentré » est le choix mis en avant. */
function ConfirmLeave({ visible, theme, s, remainingMin, onStay, onLeave }: { visible: boolean; theme: FocusTheme; s: FocusStrings; remainingMin: number; onStay: () => void; onLeave: () => void }) {
  return (
    <Modal visible={visible} transparent animationType={theme.reduceMotion ? 'none' : 'fade'} onRequestClose={onStay}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View accessibilityViewIsModal style={{ width: '100%', maxWidth: 420, backgroundColor: theme.surface, borderRadius: 20, padding: 20, gap: 12, direction: theme.rtl ? 'rtl' : 'ltr' }}>
          <Text accessibilityRole="header" style={{ color: theme.text, fontSize: 19 * theme.fontScale, fontWeight: '700', textAlign: theme.rtl ? 'right' : 'left' , ...faceOf(theme, '700') }}>{s.confirmTitle}</Text>
          <Text style={{ color: theme.muted, fontSize: 15 * theme.fontScale, lineHeight: 21 * theme.fontScale, textAlign: theme.rtl ? 'right' : 'left' , ...faceOf(theme, '400') }}>{s.confirmText(remainingMin)}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={s.stay} onPress={() => { haptic.tap(); onStay(); }} style={{ minHeight: 48, borderRadius: 12, backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}>
            <Text style={{ color: theme.onAccent, fontWeight: '700', fontSize: 15 * theme.fontScale , ...faceOf(theme, '700') }}>{s.stay}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={s.leave} onPress={() => { haptic.warning(); onLeave(); }} style={{ minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: theme.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}>
            <Text style={{ color: theme.danger, fontWeight: '700', fontSize: 15 * theme.fontScale , ...faceOf(theme, '700') }}>{s.leave}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/** Sortie d’urgence complète (appui long ≈ 3 s puis confirmation) — affichée sur l’écran Focus. */
export function FocusEmergency({
  theme,
  s,
  remainingMin,
  onEmergency,
}: {
  theme: FocusTheme;
  s: FocusStrings;
  remainingMin: number;
  onEmergency: (heldMs: number) => void;
}) {
  const [confirm, setConfirm] = useState<number | null>(null);
  return (
    <View style={{ gap: 6 }}>
      <EmergencyHold theme={theme} s={s} onHeld={(ms) => setConfirm(ms)} />
      <ConfirmLeave
        visible={confirm !== null}
        theme={theme}
        s={s}
        remainingMin={remainingMin}
        onStay={() => setConfirm(null)}
        onLeave={() => {
          const ms = confirm ?? EMERGENCY_HOLD_MS;
          setConfirm(null);
          onEmergency(ms);
          announce(s.left);
        }}
      />
    </View>
  );
}

/** Bande basse (pastille et/ou message) : ne recouvre pas le contenu, respecte la zone sûre. */
export function FocusStrip({ theme, children }: { theme: FocusTheme; children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        backgroundColor: theme.bg,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.border,
        paddingTop: 8,
        paddingBottom: Math.max(insets.bottom, 8),
        paddingHorizontal: 14,
        gap: 8,
        direction: theme.rtl ? 'rtl' : 'ltr',
      }}
    >
      <View style={{ maxWidth: 820, width: '100%', alignSelf: 'center', gap: 8, alignItems: 'center' }}>{children}</View>
    </View>
  );
}

/** Pastille flottante mm:ss : temps restant, un appui ramène au minuteur. */
export function FocusPill({ theme, s, clock, onPress }: { theme: FocusTheme; s: FocusStrings; clock: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={s.pillLabel(clock)}
      accessibilityHint={s.pillHint}
      onPress={() => {
        haptic.tap();
        onPress();
      }}
      hitSlop={6}
      style={({ pressed }) => ({
        minHeight: 44,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: theme.surface,
        borderWidth: 1,
        borderColor: theme.accent,
        opacity: pressed ? 0.85 : 1,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
      })}
    >
      <BreathDot theme={theme} />
      <Text
        style={{ color: theme.text, fontWeight: '800', fontSize: 16 * Math.min(theme.fontScale, 1.6), fontVariant: ['tabular-nums'], ...faceOf(theme, '800') }}
      >
        {clock}
      </Text>
      <Ionicons name="timer-outline" size={18} color={theme.accent} />
    </Pressable>
  );
}

/** Message discret au retour : le minuteur était en pause pendant l’absence. */
export function FocusNotice({ theme, s, text, onClose }: { theme: FocusTheme; s: FocusStrings; text: string; onClose: () => void }) {
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{ width: '100%', flexDirection: theme.largeText ? 'column' : 'row', alignItems: theme.largeText ? 'stretch' : 'center', gap: 10, padding: 12, borderRadius: 14, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }}
    >
      <Ionicons name="pause-circle-outline" size={22} color={theme.accent} />
      <Text style={{ flex: theme.largeText ? undefined : 1, color: theme.text, fontSize: 14 * theme.fontScale, lineHeight: 20 * theme.fontScale, textAlign: theme.rtl ? 'right' : 'left', ...faceOf(theme, '400') }}>{text}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={s.noticeOk}
        onPress={onClose}
        hitSlop={6}
        style={{ minHeight: 44, minWidth: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, backgroundColor: theme.accent }}
      >
        <Text style={{ color: theme.onAccent, fontWeight: '700', fontSize: 14 * theme.fontScale, ...faceOf(theme, '700') }}>{s.noticeOk}</Text>
      </Pressable>
    </View>
  );
}

/** Moment de réussite : calme, annoncé au lecteur d’écran, vibration douce (si activée). */
export function FocusSuccess({ record, theme, s, onClose }: { record: FocusRecord | null; theme: FocusTheme; s: FocusStrings; onClose: () => void }) {
  const fade = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();
  const ring = Math.min(160, Math.round(width * 0.4));
  useEffect(() => {
    if (!record) return;
    haptic.success();
    announce(`${s.successTitle}. ${s.successText(record)}`);
    fade.setValue(theme.reduceMotion ? 1 : 0);
    if (!theme.reduceMotion) Animated.timing(fade, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: nativeDriver }).start();
  }, [record, fade, s, theme.reduceMotion]);
  if (!record) return null;
  const scale = fade.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });
  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <Animated.View accessibilityViewIsModal style={{ alignItems: 'center', gap: 18, opacity: fade, transform: theme.reduceMotion ? undefined : [{ scale }], maxWidth: 440, direction: theme.rtl ? 'rtl' : 'ltr' }}>
            <FocusRing progress={1} size={ring} theme={theme}>
              <Ionicons name="checkmark" size={Math.round(ring * 0.36)} color={theme.accent} />
            </FocusRing>
            <Text accessibilityRole="header" style={{ color: theme.text, fontSize: 26 * theme.fontScale, fontWeight: '800', textAlign: 'center' , ...faceOf(theme, '800') }}>{s.successTitle}</Text>
            <Text style={{ color: theme.muted, fontSize: 16 * theme.fontScale, lineHeight: 23 * theme.fontScale, textAlign: 'center' , ...faceOf(theme, '400') }}>{s.successText(record)}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={s.successButton} onPress={() => { haptic.tap(); onClose(); }} style={{ minHeight: 48, minWidth: 200, borderRadius: 14, backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
              <Text style={{ color: theme.onAccent, fontWeight: '700', fontSize: 16 * theme.fontScale , ...faceOf(theme, '700') }}>{s.successButton}</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ---------- Guide de réglage (une seule fois) ---------- */
export type GuideSection = { title: string; steps: string[] };
export type GuideStrings = { title: string; honest: string; sections: GuideSection[]; footnote: string; ok: string; num: (n: number) => string };

export function FocusGuide({ g, theme, onOk }: { g: GuideStrings; theme: FocusTheme; onOk?: () => void }) {
  const align = theme.rtl ? 'right' : 'left';
  return (
    <View style={{ gap: 14, direction: theme.rtl ? 'rtl' : 'ltr' }}>
      <Text accessibilityRole="header" style={{ color: theme.text, fontSize: 17 * theme.fontScale, fontWeight: '700', textAlign: align , ...faceOf(theme, '700') }}>{g.title}</Text>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
        <Ionicons name="information-circle-outline" size={20} color={theme.accent} />
        <Text style={{ flex: 1, color: theme.text, fontSize: 14 * theme.fontScale, lineHeight: 20 * theme.fontScale, textAlign: align , ...faceOf(theme, '400') }}>{g.honest}</Text>
      </View>
      {g.sections.map((sec) => (
        <View key={sec.title} style={{ gap: 6 }}>
          <Text accessibilityRole="header" style={{ color: theme.text, fontSize: 15 * theme.fontScale, fontWeight: '700', textAlign: align , ...faceOf(theme, '700') }}>{sec.title}</Text>
          {sec.steps.map((step, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
              <View style={{ minWidth: 22, height: 22, borderRadius: 11, backgroundColor: theme.track, alignItems: 'center', justifyContent: 'center' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <Text style={{ color: theme.text, fontSize: 12, fontWeight: '700' , ...faceOf(theme, '700') }}>{g.num(i + 1)}</Text>
              </View>
              <Text style={{ flex: 1, color: theme.text, fontSize: 14 * theme.fontScale, lineHeight: 20 * theme.fontScale, textAlign: align , ...faceOf(theme, '400') }} accessibilityLabel={`${g.num(i + 1)}. ${step}`}>{step}</Text>
            </View>
          ))}
        </View>
      ))}
      <Text style={{ color: theme.muted, fontSize: 12.5 * theme.fontScale, lineHeight: 18 * theme.fontScale, textAlign: align , ...faceOf(theme, '400') }}>{g.footnote}</Text>
      {onOk ? (
        <Pressable accessibilityRole="button" accessibilityLabel={g.ok} onPress={() => { haptic.tap(); onOk(); }} style={{ minHeight: 48, borderRadius: 12, backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}>
          <Text style={{ color: theme.onAccent, fontWeight: '700', fontSize: 15 * theme.fontScale , ...faceOf(theme, '700') }}>{g.ok}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
