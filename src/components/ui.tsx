import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { colors, radius, space } from '../theme';

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
const mk = (base: TextStyle) =>
  function T({ style, color, center, ...p }: TProps) {
    return (
      <Text
        {...p}
        style={[base, color ? { color } : null, center ? { textAlign: 'center' } : null, style]}
      />
    );
  };
export const H1 = mk({ fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 });
export const H2 = mk({ fontSize: 20, fontWeight: '700', color: colors.text });
export const H3 = mk({ fontSize: 16, fontWeight: '700', color: colors.text });
export const Body = mk({ fontSize: 15, lineHeight: 22, color: colors.text });
export const Muted = mk({ fontSize: 13, lineHeight: 18, color: colors.muted });

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
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }, style]}
      >
        {children}
      </Pressable>
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
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: React.ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  const bg =
    variant === 'primary'
      ? colors.primary
      : variant === 'secondary'
        ? colors.primarySoft
        : variant === 'danger'
          ? colors.danger
          : 'transparent';
  const fg = variant === 'primary' || variant === 'danger' ? colors.onPrimary : colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        small && { minHeight: 36, paddingHorizontal: space.md },
        { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
        variant === 'ghost' && { borderWidth: 1, borderColor: colors.border },
        style,
      ]}
    >
      {icon}
      <Text style={[styles.buttonText, { color: fg }, small && { fontSize: 13 }]}>{label}</Text>
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.chip, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
    >
      <Text style={[styles.chipText, active && { color: colors.onPrimary }]}>{label}</Text>
    </Pressable>
  );
}

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'warn' | 'ok' | 'info' }) {
  const map = {
    neutral: [colors.surfaceAlt, colors.muted],
    warn: ['#FFF4DB', '#8A5A00'],
    ok: ['#E3F6EA', '#1D6B3A'],
    info: [colors.primarySoft, colors.primary],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function ProgressBar({ value, color = colors.primary, height = 6 }: { value: number; color?: string; height?: number }) {
  const v = Math.max(0, Math.min(1, value || 0));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }}>
      <View style={{ width: `${v * 100}%`, height, backgroundColor: color, borderRadius: height }} />
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
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(a, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(a, { toValue: 0.4, duration: 700, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [a]);
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

export function BootScreen({ label }: { label: string }) {
  return (
    <View style={[styles.screen, { alignItems: 'center', justifyContent: 'center', gap: 12 }]}>
      <ActivityIndicator color={colors.primary} />
      <Muted>{label}</Muted>
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
