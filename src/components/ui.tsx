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
import { badgeTones, colors, radius, space } from '../theme';
import { haptic } from './haptics';
import { useTheme } from './theme';

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
  const theme = useTheme();
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
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, { backgroundColor: theme.palette.bg }, dir ? { direction: dir } : null, style]}>
      {inner}
    </SafeAreaView>
  );
}

type TProps = TextProps & { color?: string; center?: boolean };
const mk = (role: 'text' | 'muted', base: TextStyle) =>
  function T({ style, color, center, ...p }: TProps) {
    const { dir } = useI18n();
    const fonts = useAppFonts();
    const theme = useTheme();
    const face = uiFontStyle(base.fontWeight, dir === 'rtl', fonts);
    const ink = color ?? (role === 'muted' ? theme.palette.muted : theme.palette.text);
    return (
      <Text {...p} style={[base, face, { color: ink }, center ? { textAlign: 'center' } : null, style]} />
    );
  };
export const H1 = mk('text', { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 });
export const H2 = mk('text', { fontSize: 20, fontWeight: '700' });
export const H3 = mk('text', { fontSize: 16, fontWeight: '700' });
export const Body = mk('text', { fontSize: 16, lineHeight: 24 });
export const Muted = mk('muted', { fontSize: 13, lineHeight: 18 });

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
  const theme = useTheme();
  const cardStyle = [
    styles.card,
    {
      backgroundColor: theme.palette.surface,
      borderColor: theme.palette.border,
      shadowColor: theme.palette.shadow,
      shadowOpacity: theme.reduceMotion ? 0 : theme.dark ? 0.35 : 0.08,
    },
  ];
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [cardStyle, pressed && { opacity: 0.92, transform: theme.reduceMotion ? [] : [{ scale: 0.99 }] }, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[cardStyle, style]}>{children}</View>;
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
  const { dir } = useI18n();
  const fonts = useAppFonts();
  const theme = useTheme();
  const face = uiFontStyle('700', dir === 'rtl', fonts);
  const bg =
    backgroundColor ??
    (variant === 'primary' ? theme.palette.primary : variant === 'secondary' ? theme.palette.primarySoft : variant === 'danger' ? colors.danger : 'transparent');
  const fg = labelColor ?? (variant === 'primary' || variant === 'danger' ? theme.palette.onPrimary : theme.palette.primary);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => {
        if (!disabled && (variant === 'primary' || variant === 'danger')) void haptic(variant === 'danger' ? 'warn' : 'select');
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.button,
        small && { minHeight: 36, paddingHorizontal: space.md },
        { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
        variant === 'ghost' && { borderWidth: 1, borderColor: borderColor ?? colors.border },
        style,
      ]}
    >
      {icon}
      <Text style={[styles.buttonText, face, { color: fg }, small && { fontSize: 13 }]}>{label}</Text>
    </Pressable>
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
  const { dir } = useI18n();
  const fonts = useAppFonts();
  const theme = useTheme();
  const face = uiFontStyle('600', dir === 'rtl', fonts);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.chip, { borderColor: theme.palette.border, backgroundColor: active ? theme.palette.primary : theme.palette.surface }]}
    >
      <Text style={[styles.chipText, face, { color: active ? theme.palette.onPrimary : theme.palette.text }]}>{label}</Text>
    </Pressable>
  );
}

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'warn' | 'ok' | 'info' }) {
  const { dir } = useI18n();
  const fonts = useAppFonts();
  const face = uiFontStyle('700', dir === 'rtl', fonts);
  const toneStyle = badgeTones[tone];
  const bg = toneStyle.bg;
  const fg = toneStyle.fg;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, face, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function ProgressBar({ value, color, height = 6 }: { value: number; color?: string; height?: number }) {
  const theme = useTheme();
  const v = Math.max(0, Math.min(1, value || 0));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(v * 100) }}
      style={{ height, borderRadius: height, backgroundColor: theme.palette.surfaceAlt, overflow: 'hidden' }}
    >
      <View style={{ width: `${v * 100}%`, height, backgroundColor: color ?? theme.palette.primary, borderRadius: height }} />
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

export function EmptyState({ icon, title, text, action }: { icon?: React.ReactNode; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <View style={styles.empty}>
      {icon}
      <H3 center>{title}</H3>
      {text ? <Muted center>{text}</Muted> : null}
      {action}
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
  return (
    <View accessibilityLabel="92'MBA" style={[styles.screen, { padding: space.xl, justifyContent: 'center' }]}>
      <View style={{ width: '100%', maxWidth: 760, alignSelf: 'center', gap: space.lg }}>
        <Text style={{ color: colors.primary, fontSize: 28, fontWeight: '800' }}>92'MBA</Text>
        <Skeleton height={92} />
        <Skeleton height={68} />
        <Skeleton height={68} />
      </View>
    </View>
  );
}

export function BootFallback({ onRetry, onOffline }: { onRetry: () => void; onOffline: () => void }) {
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, paddingBottom: 48, alignItems: 'center' },
  maxWidth: { width: '100%', maxWidth: 760, gap: space.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: space.sm,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
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
    minHeight: 36,
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
  empty: { alignItems: 'center', gap: 10, paddingVertical: 40, paddingHorizontal: 20 },
});
