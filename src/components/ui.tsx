import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  GestureResponderEvent,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n } from '../lib/i18n';
import { uiFontStyle, useAppFonts } from '../lib/fonts';
import { radius, space } from '../theme';
import { makeStyles, softShadow, useBadgeTones, useColors, useIsDark } from '../lib/colors';
import { haptic } from '../lib/haptics';
import { nativeDriver, SPRING, useEntrance, usePressScale, useSystemReduceMotion } from '../lib/motion';

export function Screen({
  children,
  scroll = true,
  style,
  contentStyle,
  dir,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  dir?: 'ltr' | 'rtl';
}) {
  const styles = useStyles();
  const inner = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.content, contentStyle]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.maxWidth}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[styles.content, { flex: 1 }, contentStyle]}>
      <View style={[styles.maxWidth, { flex: 1 }]}>{children}</View>
    </View>
  );
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, dir ? { direction: dir } : null, style]}>
      {inner}
    </SafeAreaView>
  );
}

type TProps = TextProps & { color?: string; center?: boolean };
const mk = (base: TextStyle, tone: 'text' | 'muted' = 'text') =>
  function T({ style, color, center, ...p }: TProps) {
    const colors = useColors();
    const { dir } = useI18n();
    const fonts = useAppFonts();
    const face = uiFontStyle(base.fontWeight, dir === 'rtl', fonts);
    return (
      <Text {...p} style={[base, face, dir === 'rtl' && base.letterSpacing ? { letterSpacing: 0 } : null, { color: color ?? colors[tone] }, center ? { textAlign: 'center' } : null, style]} />
    );
  };
export const H1 = mk({ fontSize: 30, fontWeight: '800', letterSpacing: -0.5 });
export const H2 = mk({ fontSize: 21, fontWeight: '700', letterSpacing: -0.2 });
export const H3 = mk({ fontSize: 16, fontWeight: '700' });
export const Body = mk({ fontSize: 15, lineHeight: 22 });
export const Muted = mk({ fontSize: 13, lineHeight: 18 }, 'muted');

export function Card({
  children,
  style,
  onPress,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const styles = useStyles();
  const reduce = useSystemReduceMotion();
  const press = usePressScale(reduce, 0.98);
  if (onPress) {
    return (
      <Animated.View style={{ transform: [{ scale: press.scale }] }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          onPressIn={press.onPressIn}
          onPressOut={press.onPressOut}
          onPress={() => {
            haptic.select();
            onPress();
          }}
          style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }, style]}
        >
          {children}
        </Pressable>
      </Animated.View>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  style,
  small,
  labelColor,
  backgroundColor,
  borderColor,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: React.ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
  labelColor?: string;
  backgroundColor?: string;
  borderColor?: string;
}) {
  const styles = useStyles();
  const { dir } = useI18n();
  const fonts = useAppFonts();
  const face = uiFontStyle('700', dir === 'rtl', fonts);
  const colors = useColors();
  const reduce = useSystemReduceMotion();
  const press = usePressScale(reduce, 0.97);
  const isDark = useIsDark();
  const bg =
    backgroundColor ??
    (variant === 'primary' ? colors.primary : variant === 'secondary' ? colors.primarySoft : variant === 'danger' ? colors.danger : 'transparent');
  const fg = labelColor ?? (variant === 'primary' || variant === 'danger' ? colors.onPrimary : colors.primary);
  const flat = StyleSheet.flatten(style) || {};
  const outer: ViewStyle = {};
  for (const k of ['flex', 'flexGrow', 'flexShrink', 'flexBasis', 'alignSelf', 'width', 'minWidth', 'maxWidth', 'margin', 'marginTop', 'marginBottom', 'marginHorizontal', 'marginVertical', 'marginStart', 'marginEnd', 'marginLeft', 'marginRight'] as const) {
    if (flat[k] !== undefined) (outer as Record<string, unknown>)[k] = flat[k];
  }
  const solid = variant === 'primary' || variant === 'danger';
  return (
    <Animated.View style={[outer, { transform: [{ scale: press.scale }] }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: !!disabled }}
        disabled={disabled}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        onPress={
          onPress
            ? () => {
                if (variant === 'danger') haptic.warning();
                else haptic.tap();
                onPress();
              }
            : undefined
        }
        style={({ pressed }) => [
          styles.button,
          small && { minHeight: 44, paddingHorizontal: space.md },
          { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.9 : 1 },
          solid && !disabled && !backgroundColor ? softShadow(isDark, 1) : null,
          variant === 'ghost' && { borderWidth: 1, borderColor: borderColor ?? colors.border },
          style,
          // la mise en page externe est portée par l’enveloppe animée
          outer.flex !== undefined ? { flex: undefined, width: '100%' } : null,
          Object.keys(outer).some((k) => k.startsWith('margin')) ? { margin: 0, marginTop: 0, marginBottom: 0, marginHorizontal: 0, marginVertical: 0, marginStart: 0, marginEnd: 0, marginLeft: 0, marginRight: 0 } : null,
        ]}
      >
        {icon}
        <Text style={[styles.buttonText, face, { color: fg }, small && { fontSize: 14 }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function Chip({
  label,
  active,
  onPress,
  onLongPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}) {
  const colors = useColors();
  const styles = useStyles();
  const { dir } = useI18n();
  const fonts = useAppFonts();
  const face = uiFontStyle('600', dir === 'rtl', fonts);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active }}
      onPress={
        onPress
          ? () => {
              haptic.select();
              onPress();
            }
          : undefined
      }
      onLongPress={onLongPress}
      style={[styles.chip, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
    >
      <Text style={[styles.chipText, face, active && { color: colors.onPrimary }]}>{label}</Text>
    </Pressable>
  );
}

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'warn' | 'ok' | 'info' }) {
  const styles = useStyles();
  const { dir } = useI18n();
  const fonts = useAppFonts();
  const face = uiFontStyle('700', dir === 'rtl', fonts);
  const toneStyle = useBadgeTones()[tone];
  const bg = toneStyle.bg;
  const fg = toneStyle.fg;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, face, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function ProgressBar({ value, color, height = 6 }: { value: number; color?: string; height?: number }) {
  const colors = useColors();
  const reduce = useSystemReduceMotion();
  const v = Math.max(0, Math.min(1, value || 0));
  const anim = useRef(new Animated.Value(v)).current;
  useEffect(() => {
    if (reduce) {
      anim.setValue(v);
      return;
    }
    const a = Animated.spring(anim, { toValue: v, useNativeDriver: false, ...SPRING.enter });
    a.start();
    return () => a.stop();
  }, [anim, v, reduce]);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(v * 100) }}
      style={{ height, borderRadius: height, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }}
    >
      <Animated.View
        style={{
          width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          height,
          backgroundColor: color ?? colors.primary,
          borderRadius: height,
        }}
      />
    </View>
  );
}

/** Slider maison (pas de dépendance native) : fonctionne sur iOS, Android et web. */
export function Slider({
  value,
  min = 0,
  max = 1,
  step = 0,
  onChange,
  onComplete,
  accessibilityLabel,
  rtl,
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (v: number) => void;
  onComplete?: (v: number) => void;
  accessibilityLabel?: string;
  rtl?: boolean;
}) {
  const styles = useStyles();
  const [width, setWidth] = useState(0);
  const last = useRef(value);
  const range = max - min || 1;
  const ratio = Math.max(0, Math.min(1, (value - min) / range));
  const compute = (e: GestureResponderEvent) => {
    if (!width) return value;
    let r = Math.max(0, Math.min(1, e.nativeEvent.locationX / width));
    if (rtl) r = 1 - r;
    let v = min + r * range;
    if (step) v = Math.round(v / step) * step;
    last.current = v;
    return v;
  };
  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min, max, now: Math.round(value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        const d = (step || range / 20) * (e.nativeEvent.actionName === 'increment' ? 1 : -1);
        const v = Math.max(min, Math.min(max, value + d));
        onChange?.(v);
        onComplete?.(v);
      }}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={(e) => onChange?.(compute(e))}
      onResponderMove={(e) => onChange?.(compute(e))}
      onResponderRelease={() => onComplete?.(last.current)}
      style={styles.sliderHit}
    >
      <View pointerEvents="none" style={styles.sliderTrack}>
        <View
          style={[
            styles.sliderFill,
            { width: `${ratio * 100}%` },
            rtl ? { right: 0 } : { left: 0 },
          ]}
        />
      </View>
      <View
        pointerEvents="none"
        style={[styles.sliderThumb, rtl ? { right: `${ratio * 100}%`, marginRight: -11 } : { left: `${ratio * 100}%`, marginLeft: -11 }]}
      />
    </View>
  );
}

export function Skeleton({ height = 18, width = '100%', style }: { height?: number; width?: number | `${number}%`; style?: StyleProp<ViewStyle> }) {
  const colors = useColors();
  const a = useRef(new Animated.Value(0.4)).current;
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (alive) setReduce(value);
      })
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(a, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(a, { toValue: 0.4, duration: 700, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [a, reduce]);
  if (reduce) return <View style={[{ height, width, borderRadius: 8, backgroundColor: colors.surfaceAlt, opacity: 0.85 }, style]} />;
  return <Animated.View style={[{ height, width, borderRadius: 8, backgroundColor: colors.surfaceAlt, opacity: a }, style]} />;
}

/** Carte fantôme : la forme du contenu à venir, jamais un spinner. */
export function SkeletonCard({ lines = 2 }: { lines?: number }) {
  const styles = useStyles();
  return (
    <View style={styles.card} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Skeleton height={20} width="62%" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={14} width={i === lines - 1 ? '48%' : '92%'} />
      ))}
    </View>
  );
}

export function SkeletonList({ count = 3, label }: { count?: number; label?: string }) {
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={label} style={{ gap: space.md }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

export function EmptyState({ icon, title, text, action }: { icon?: React.ReactNode; title: string; text?: string; action?: React.ReactNode }) {
  const styles = useStyles();
  const reduce = useSystemReduceMotion();
  const enter = useEntrance(reduce, 60, 12);
  return (
    <Animated.View style={[styles.empty, enter]}>
      {icon ? (
        <View style={styles.haloOuter}>
          <View style={styles.haloInner}>{icon}</View>
        </View>
      ) : null}
      <H3 center>{title}</H3>
      {text ? <Muted center style={{ maxWidth: 420 }}>{text}</Muted> : null}
      {action ? <View style={{ marginTop: space.sm }}>{action}</View> : null}
    </Animated.View>
  );
}

/** Erreur bienveillante avec « Réessayer ». */
export function ErrorState({ title, text, retryLabel, onRetry, icon }: { title: string; text?: string; retryLabel?: string; onRetry?: () => void; icon?: React.ReactNode }) {
  return (
    <View accessibilityRole="alert">
      <EmptyState icon={icon} title={title} text={text} action={onRetry && retryLabel ? <Button label={retryLabel} onPress={onRetry} /> : undefined} />
    </View>
  );
}

export function Row({ children, style, gap = space.sm }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function Spacer({ h = space.md }: { h?: number }) {
  return <View style={{ height: h }} />;
}

/** Attente courte : squelettes, jamais le mot « Loading » ni un écran blanc. */
export function BootSkeleton() {
  const colors = useColors();
  const styles = useStyles();
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel="92'MBA" style={[styles.screen, { padding: space.xl, justifyContent: 'center' }]}>
      <View style={{ width: '100%', maxWidth: 760, alignSelf: 'center', gap: space.lg }}>
        <Text style={{ color: colors.primary, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 }}>92'MBA</Text>
        <Skeleton height={92} style={{ borderRadius: radius.lg }} />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    </View>
  );
}

export function BootFallback({ onRetry, onOffline }: { onRetry: () => void; onOffline: () => void }) {
  const styles = useStyles();
  const { t, dir } = useI18n();
  return (
    <View style={[styles.screen, { padding: space.xl, justifyContent: 'center', direction: dir }]}>
      <View style={{ width: '100%', maxWidth: 520, alignSelf: 'center', gap: space.md }}>
        <H2>{t('bootFallbackTitle')}</H2>
        <Body>{t('bootFallbackText')}</Body>
        <Button label={t('bootRetry')} onPress={onRetry} />
        <Button label={t('bootOffline')} variant="secondary" onPress={onOffline} />
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, paddingTop: space.xl, paddingBottom: 56, alignItems: 'center' },
  maxWidth: { width: '100%', maxWidth: 760, gap: space.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: space.sm,
    shadowColor: '#000',
    shadowOpacity: colors.bg === '#0E1424' ? 0.3 : 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  button: {
    minHeight: 46,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buttonText: { fontSize: 15, fontWeight: '700' },
  chip: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.text },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  sliderHit: { height: 44, justifyContent: 'center' },
  sliderTrack: { height: 6, borderRadius: 3, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  sliderFill: { position: 'absolute', top: 0, bottom: 0, backgroundColor: colors.primary },
  sliderThumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 44, paddingHorizontal: 24 },
  haloOuter: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 6, opacity: 0.95 },
  haloInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
}));
