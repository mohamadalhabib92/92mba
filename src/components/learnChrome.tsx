import { router } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';
import { useI18n } from '../lib/i18n';
import type { Provenance } from '../learn/types';
import { useTheme } from './theme';
import { useMacPress } from './mac';
import { Body, Button, H1, Muted, ProgressBar } from './ui';

export function BackButton() {
  const { t } = useI18n();
  return <Button variant="ghost" label={t('back')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />;
}

export function ProvenanceLine({ provenance }: { provenance: Provenance }) {
  const bits = [provenance.author, provenance.date, provenance.licence];
  return (
    <Muted>
      {bits.join(' · ')}
      {provenance.verify ? ` · ${provenance.verify}` : ''}
    </Muted>
  );
}

export function ScreenProgress({ value, label }: { value: number; label: string }) {
  const theme = useTheme();
  return (
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }} style={{ gap: 6 }}>
      <Muted>{label}</Muted>
      <ProgressBar value={value} color={theme.palette.primary} height={8} />
    </View>
  );
}

export function PageTitle({ kicker, title, text }: { kicker?: string; title: string; text?: string }) {
  const theme = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {kicker ? <Muted style={{ color: theme.palette.accentInk, fontWeight: '800', letterSpacing: 1 }}>{kicker}</Muted> : null}
      <H1>{title}</H1>
      {text ? <Body>{text}</Body> : null}
    </View>
  );
}

export function Choice({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  const theme = useTheme();
  const mac = useMacPress(onPress);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      {...mac.bind}
      style={{
        minHeight: 52,
        borderRadius: 16,
        padding: 14,
        justifyContent: 'center',
        borderTopWidth: mac.focused ? 3 : 1,
        borderBottomWidth: mac.focused ? 3 : 2,
        borderLeftWidth: mac.focused ? 3 : 1,
        borderRightWidth: mac.focused ? 3 : 1,
        borderTopColor: mac.focused || mac.hovered ? theme.palette.accent : theme.glass.highlight,
        borderBottomColor: mac.focused || mac.hovered || selected ? theme.palette.primary : theme.glass.shade,
        borderLeftColor: mac.focused || mac.hovered || selected ? theme.palette.primary : theme.glass.hairline,
        borderRightColor: mac.focused || mac.hovered || selected ? theme.palette.primary : theme.glass.hairline,
        backgroundColor: selected || mac.hovered ? theme.palette.primarySoft : theme.glass.surface,
      }}
    >
      <Body>{label}</Body>
    </Pressable>
  );
}
