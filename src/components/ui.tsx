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
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n } from '../lib/i18n';
import { uiFontStyle, useAppFonts } from '../lib/fonts';
import { badgeTones, colors, hit, radius, space } from '../theme';
import { dangerInk, layeredShadow, pressedFill, reliefEdges } from '../theme/glass';
import { typeScale } from '../theme/system';
import { haptic } from './haptics';
import { useMacPress, useStage } from './mac';
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
  const { maxWidth } = useStage();
  const column = [styles.maxWidth, { maxWidth }];
  const inner = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.content, contentStyle]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={column}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[styles.content, { flex: 1 }, contentStyle]}>
      <View style={[column, { flex: 1 }]}>{children}</View>
    </View>
  );
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, { backgroundColor: theme.glass.canvas }, dir ? { direction: dir } : null, style]}>
      {theme.glass.solid ? null : (
        <View pointerEvents="none" style={styles.atmosphere}>
          <View style={[styles.orb, { width: 280, height: 280, borderRadius: 140, top: -90, right: -70, backgroundColor: theme.glass.wash }]} />
          <View style={[styles.orb, { width: 220, height: 220, borderRadius: 110, bottom: 72, left: -80, backgroundColor: theme.glass.washAlt }]} />
        </View>
      )}
      {inner}
    </SafeAreaView>
  );
}

type TProps = TextProps & { color?: string; center?: boolean };
const mk = (role: 'header' | 'text' | 'muted', base: TextStyle) =>
  function T({ style, color, center, numberOfLines, ...p }: TProps) {
    const { dir } = useI18n();
    const fonts = useAppFonts();
    const theme = useTheme();
    const { isMac } = useStage();
    const { fontScale } = useWindowDimensions();
    const face = uiFontStyle(base.fontWeight, dir === 'rtl', fonts);
    const ink = color ?? (role === 'muted' ? theme.palette.muted : theme.palette.text);
    const size = Number(base.fontSize) || typeScale.body;
    const bump = isMac
      ? {
          fontSize: Math.round(size * 1.15),
          lineHeight: base.lineHeight ? Math.round(Number(base.lineHeight) * 1.15) : undefined,
        }
      : null;
    return (
      <Text
        {...p}
        allowFontScaling
        maxFontSizeMultiplier={2.5}
        numberOfLines={fontScale >= 1.3 ? undefined : numberOfLines}
        accessibilityRole={role === 'header' ? 'header' : p.accessibilityRole}
        style={[
          base,
          bump,
          face,
          { color: ink, letterSpacing: dir === 'rtl' ? 0 : base.letterSpacing },
          center ? { textAlign: 'center' } : null,
          style,
        ]}
      />
    );
  };
export const H1 = mk('header', { fontSize: typeScale.h1, lineHeight: 34, fontWeight: '800', letterSpacing: -0.4 });
export const H2 = mk('text', { fontSize: typeScale.h2, lineHeight: 26, fontWeight: '700' });
export const H3 = mk('text', { fontSize: typeScale.h3, lineHeight: 22, fontWeight: '700' });
export const Body = mk('text', { fontSize: typeScale.body, lineHeight: 24 });
export const Muted = mk('muted', { fontSize: typeScale.small, lineHeight: 18 });

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
  const mac = useMacPress(onPress);
  const ring = mac.focused || mac.hovered;
  const shadow = layeredShadow(theme.glass.shadow, false, !theme.highContrast);
  const plate = [
    styles.card,
    shadow.near,
    {
      backgroundColor: theme.glass.surface,
      borderTopColor: ring ? theme.palette.accent : theme.glass.highlight,
      borderBottomColor: ring ? theme.palette.accent : theme.glass.shade,
      borderLeftColor: ring ? theme.palette.accent : theme.glass.hairline,
      borderRightColor: ring ? theme.palette.accent : theme.glass.hairline,
      borderTopWidth: mac.focused ? 3 : 1,
      borderBottomWidth: mac.focused ? 3 : 2,
      borderLeftWidth: mac.focused ? 3 : StyleSheet.hairlineWidth,
      borderRightWidth: mac.focused ? 3 : StyleSheet.hairlineWidth,
    },
  ];
  const body = (
    <View style={[shadow.far, { borderRadius: radius.lg }, style, { backgroundColor: 'transparent', alignSelf: 'stretch' }]}>
      <View style={[plate, style, { alignSelf: 'stretch', flexGrow: 1 }]}>{children}</View>
    </View>
  );
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        {...mac.bind}
        style={({ pressed }) => [
          style,
          pressed && !theme.reduceMotion ? { transform: [{ translateY: 1 }] } : pressed ? { opacity: 0.94 } : null,
        ]}
      >
        {body}
      </Pressable>
    );
  }
  return body;
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
  decorative,
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
  /** Visuel seulement, quand la carte parente est déjà le bouton. */
  decorative?: boolean;
}) {
  const { dir } = useI18n();
  const fonts = useAppFonts();
  const theme = useTheme();
  const mac = useMacPress(disabled || decorative ? undefined : onPress);
  const faceFont = uiFontStyle('700', dir === 'rtl', fonts);
  const danger = dangerInk(theme.dark, theme.highContrast);
  const bg =
    backgroundColor ??
    (variant === 'primary'
      ? theme.palette.primary
      : variant === 'secondary'
        ? theme.palette.primarySoft
        : variant === 'danger'
          ? danger.bg
          : theme.glass.solid
            ? theme.palette.surface
            : theme.glass.surface);
  const fg =
    labelColor ??
    (variant === 'primary' ? theme.palette.onPrimary : variant === 'danger' ? danger.fg : theme.palette.primary);
  const ring = mac.focused || mac.hovered;
  const plate = (pressed: boolean) => {
    const fill =
      pressed && !disabled
        ? pressedFill(
            backgroundColor ??
              (variant === 'danger' ? danger.bg : variant === 'primary' ? theme.palette.primary : variant === 'secondary' ? theme.palette.primarySoft : theme.dark ? theme.palette.surfaceAlt : '#FFFFFF'),
            theme.dark,
          )
        : bg;
    const edges = reliefEdges(variant === 'ghost' && !backgroundColor ? (theme.dark ? theme.palette.surfaceAlt : '#FFFFFF') : fill, theme.dark);
    const shadow = layeredShadow(theme.palette.shadow, !!pressed && !disabled, !theme.highContrast);
    return (
      <View style={[shadow.far, { borderRadius: radius.md }]}>
        <View style={[shadow.near, { borderRadius: radius.md }]}>
          <View
            style={[
              styles.button,
              small && { paddingHorizontal: space.md },
              {
                minHeight: hit.min,
                backgroundColor: fill,
                borderTopWidth: ring ? (mac.focused ? 3 : 2) : 1,
                borderBottomWidth: ring ? (mac.focused ? 3 : 2) : 3,
                borderLeftWidth: ring ? (mac.focused ? 3 : 2) : StyleSheet.hairlineWidth,
                borderRightWidth: ring ? (mac.focused ? 3 : 2) : StyleSheet.hairlineWidth,
                borderTopColor: ring ? theme.palette.accent : borderColor ?? edges.highlight,
                borderBottomColor: ring ? theme.palette.accent : borderColor ?? edges.shade,
                borderLeftColor: ring ? theme.palette.accent : borderColor ?? theme.glass.hairline,
                borderRightColor: ring ? theme.palette.accent : borderColor ?? theme.glass.hairline,
              },
            ]}
          >
            {icon}
            <Text
              allowFontScaling
              maxFontSizeMultiplier={2}
              style={[styles.buttonText, faceFont, { color: fg, textAlign: 'center', flexShrink: 1 }, small && { fontSize: typeScale.small }]}
            >
              {label}
            </Text>
          </View>
        </View>
      </View>
    );
  };
  if (decorative) return <View pointerEvents="none">{plate(false)}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={() => {
        if (!disabled && (variant === 'primary' || variant === 'danger')) void haptic(variant === 'danger' ? 'warn' : 'select');
        onPress?.();
      }}
      {...mac.bind}
      style={({ pressed }) => [
        pressed && !disabled && !theme.reduceMotion ? { transform: [{ translateY: 2 }] } : null,
        disabled ? { opacity: 0.45 } : null,
        style,
      ]}
    >
      {({ pressed }) => plate(pressed)}
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
  const mac = useMacPress(onPress);
  const face = uiFontStyle('600', dir === 'rtl', fonts);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      onLongPress={onLongPress}
      {...mac.bind}
      style={[
        styles.chip,
        {
          backgroundColor: active ? theme.palette.primary : theme.glass.surface,
          borderTopColor: mac.focused || mac.hovered ? theme.palette.accent : theme.glass.highlight,
          borderBottomColor: mac.focused || mac.hovered ? theme.palette.accent : theme.glass.shade,
          borderLeftColor: mac.focused || mac.hovered ? theme.palette.accent : theme.glass.hairline,
          borderRightColor: mac.focused || mac.hovered ? theme.palette.accent : theme.glass.hairline,
          borderTopWidth: mac.focused ? 3 : 1,
          borderBottomWidth: mac.focused ? 3 : 2,
        },
      ]}
    >
      <Text allowFontScaling maxFontSizeMultiplier={2} style={[styles.chipText, face, { color: active ? theme.palette.onPrimary : theme.palette.text, textAlign: 'center' }]}>
        {label}
      </Text>
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
      style={{ height, borderRadius: height, backgroundColor: theme.palette.surfaceAlt, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: theme.glass.hairline }}
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
  const theme = useTheme();
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
      <View pointerEvents="none" style={[styles.sliderTrack, { backgroundColor: theme.palette.surfaceAlt }]}>
        <View
          style={[
            styles.sliderFill,
            { width: `${ratio * 100}%`, backgroundColor: theme.palette.primary },
            rtl ? { right: 0 } : { left: 0 },
          ]}
        />
      </View>
      <View
        pointerEvents="none"
        style={[
          styles.sliderThumb,
          {
            backgroundColor: theme.palette.surface,
            borderColor: theme.palette.primary,
            borderTopColor: theme.glass.highlight,
          },
          rtl ? { right: `${ratio * 100}%`, marginRight: -11 } : { left: `${ratio * 100}%`, marginLeft: -11 },
        ]}
      />
    </View>
  );
}

export function Skeleton({ height = 18, width = '100%', style }: { height?: number; width?: number | `${number}%`; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
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
  const tone = theme.glass.solid ? theme.palette.surfaceAlt : theme.glass.surfaceOpaque;
  if (reduce || theme.reduceMotion) return <View style={[{ height, width, borderRadius: 8, backgroundColor: tone, opacity: 0.85 }, style]} />;
  return <Animated.View style={[{ height, width, borderRadius: 8, backgroundColor: tone, opacity: a }, style]} />;
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
  const theme = useTheme();
  return (
    <View accessibilityLabel="92'MBA" style={[styles.screen, { padding: space.xl, justifyContent: 'center', backgroundColor: theme.glass.canvas }]}>
      <View style={{ width: '100%', maxWidth: 760, alignSelf: 'center', gap: space.lg }}>
        <Text allowFontScaling maxFontSizeMultiplier={2} style={{ color: theme.palette.primary, fontSize: typeScale.h1, fontWeight: '800' }}>92'MBA</Text>
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
  atmosphere: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden' },
  orb: { position: 'absolute' },
  content: { padding: space.lg, paddingBottom: 48, alignItems: 'center' },
  maxWidth: { width: '100%', maxWidth: 760, gap: space.md },
  card: {
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.sm,
  },
  button: {
    minHeight: hit.min,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buttonText: { fontSize: 15, fontWeight: '700' },
  chip: {
    minHeight: hit.min,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    justifyContent: 'center',
  },
  chipText: { fontSize: typeScale.small, fontWeight: '600' },
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
