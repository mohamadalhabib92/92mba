import { Ionicons } from '@expo/vector-icons';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { softShadow, useColors, useIsDark } from '../lib/colors';
import { haptic } from '../lib/haptics';
import { toastsMuted } from '../lib/quiet';
import { announce, useLargeText } from '../lib/a11y';
import { toastColors, toastIconInk } from '../theme';
import { nativeDriver, SPRING, useSystemReduceMotion } from '../lib/motion';

type Kind = 'success' | 'info' | 'error';
type Toast = { id: number; text: string; kind: Kind };
type Celebration = { title: string; sub?: string; icon?: keyof typeof Ionicons.glyphMap };
type Ctx = { toast: (text: string, kind?: Kind) => void; celebrate: (c: Celebration) => void };

const FeedbackCtx = createContext<Ctx>({ toast: () => undefined, celebrate: () => undefined });

/** `const { toast, celebrate } = useFeedback()` : un retour visible après chaque action. */
export const useFeedback = () => useContext(FeedbackCtx);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toastState, setToast] = useState<Toast | null>(null);
  const [party, setParty] = useState<(Celebration & { id: number }) | null>(null);
  const t1 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t2 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toast = useCallback((text: string, kind: Kind = 'success') => {
    // Mode Focus : toasts en sourdine (ni affichage, ni annonce, ni vibration).
    if (toastsMuted()) return;
    if (t1.current) clearTimeout(t1.current);
    if (kind === 'error') haptic.error();
    else if (kind === 'success') haptic.success();
    else haptic.select();
    announce(text);
    setToast({ id: Date.now(), text, kind });
    t1.current = setTimeout(() => setToast(null), kind === 'error' ? 4200 : 2600);
  }, []);
  const celebrate = useCallback((c: Celebration) => {
    if (t2.current) clearTimeout(t2.current);
    haptic.success();
    announce(c.sub ? `${c.title}. ${c.sub}` : c.title);
    setParty({ ...c, id: Date.now() });
    t2.current = setTimeout(() => setParty(null), 1700);
  }, []);
  useEffect(
    () => () => {
      if (t1.current) clearTimeout(t1.current);
      if (t2.current) clearTimeout(t2.current);
    },
    [],
  );
  return (
    <FeedbackCtx.Provider value={{ toast, celebrate }}>
      {children}
      {party ? <CelebrationView key={party.id} c={party} onDone={() => setParty(null)} /> : null}
      {toastState ? <ToastView key={toastState.id} toast={toastState} onDone={() => setToast(null)} /> : null}
    </FeedbackCtx.Provider>
  );
}

function ToastView({ toast, onDone }: { toast: Toast; onDone: () => void }) {
  const colors = useColors();
  const dark = useIsDark();
  const insets = useSafeAreaInsets();
  const reduce = useSystemReduceMotion();
  const v = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) return;
    Animated.spring(v, { toValue: 1, useNativeDriver: nativeDriver, ...SPRING.enter }).start();
  }, [v, reduce]);
  // Toast neutre (encre sur fond inversé) : AA dans les deux thèmes.
  const { bg, fg } = dark ? toastColors.dark : toastColors.light;
  const tint = toast.kind === 'error' ? colors.danger : toast.kind === 'success' ? colors.success : colors.accent;
  const icon = toast.kind === 'error' ? 'alert' : toast.kind === 'success' ? 'checkmark' : 'information';
  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end', alignItems: 'center', paddingBottom: insets.bottom + 72, paddingHorizontal: 16 }]}>
      <Animated.View
        accessibilityLiveRegion="polite"
        style={[
          {
            opacity: v,
            transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
            maxWidth: 520,
            width: '100%',
            backgroundColor: bg,
            borderRadius: 16,
          },
          softShadow(dark, 3),
        ]}
      >
        <Pressable accessibilityRole="button" accessibilityLabel={toast.text} onPress={onDone} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, minHeight: 52 }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={icon} size={17} color={toastIconInk(tint)} />
          </View>
          <Text style={{ color: fg, fontSize: 15, fontWeight: '600', flex: 1 }}>{toast.text}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function CelebrationView({ c, onDone }: { c: Celebration; onDone: () => void }) {
  const colors = useColors();
  const dark = useIsDark();
  const reduce = useSystemReduceMotion();
  const large = useLargeText();
  const pop = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    Animated.parallel([
      Animated.spring(pop, { toValue: 1, useNativeDriver: nativeDriver, damping: 12, stiffness: 220, mass: 0.9 }),
      Animated.timing(ring, { toValue: 1, duration: 900, useNativeDriver: nativeDriver }),
    ]).start();
  }, [pop, ring, reduce]);
  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={c.title} onPress={onDone}>
        <Animated.View
          style={[
            {
              alignItems: 'center',
              gap: 10,
              paddingVertical: 24,
              paddingHorizontal: 30,
              borderRadius: 24,
              backgroundColor: colors.surface,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.border,
              maxWidth: 320,
              opacity: pop,
              transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }) }],
            },
            softShadow(dark, 3),
          ]}
        >
          <View style={{ width: 64, height: 64, alignItems: 'center', justifyContent: 'center' }}>
            {!reduce ? (
              <Animated.View
                style={{
                  position: 'absolute',
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  borderWidth: 2,
                  borderColor: colors.accent,
                  opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
                  transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }],
                }}
              />
            ) : null}
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={c.icon ?? 'checkmark'} size={28} color={colors.accent} />
            </View>
          </View>
          <Text style={{ color: colors.text, fontSize: 17, fontWeight: '700', textAlign: 'center' }}>{c.title}</Text>
          {c.sub ? (
            <Text numberOfLines={large ? undefined : 2} style={{ color: colors.muted, fontSize: 13, lineHeight: 18, textAlign: 'center' }}>
              {c.sub}
            </Text>
          ) : null}
        </Animated.View>
      </Pressable>
    </View>
  );
}
