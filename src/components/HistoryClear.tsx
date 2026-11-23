import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { hit } from '../theme';
import { dangerInk } from '../theme/glass';
import { useTheme } from './theme';

/** Confirmation visible Annuler / Effacer. Pas de boîte native. */
export function HistoryClearConfirm({
  confirming,
  prompt,
  askLabel,
  cancelLabel,
  eraseLabel,
  onAsk,
  onCancel,
  onErase,
}: {
  confirming: boolean;
  prompt: string;
  askLabel: string;
  cancelLabel: string;
  eraseLabel: string;
  onAsk: () => void;
  onCancel: () => void;
  onErase: () => void;
}) {
  const theme = useTheme();
  const danger = dangerInk(theme.dark, theme.highContrast);
  if (!confirming) {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={askLabel} onPress={onAsk} hitSlop={10} style={{ minHeight: hit.min, justifyContent: 'center' }}>
        <Text allowFontScaling maxFontSizeMultiplier={2} style={{ color: theme.palette.primary, fontWeight: '700', fontSize: 15 }}>{askLabel}</Text>
      </Pressable>
    );
  }
  return (
    <View style={{ gap: 8 }}>
      <Text allowFontScaling maxFontSizeMultiplier={2} style={{ color: theme.palette.text, fontSize: 15, lineHeight: 22 }}>{prompt}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
          onPress={onCancel}
          style={{ minHeight: hit.min, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 12, borderTopWidth: 1, borderBottomWidth: 2, borderLeftWidth: 1, borderRightWidth: 1, borderTopColor: theme.glass.highlight, borderBottomColor: theme.glass.shade, borderLeftColor: theme.glass.hairline, borderRightColor: theme.glass.hairline, backgroundColor: theme.glass.surface }}
        >
          <Text allowFontScaling maxFontSizeMultiplier={2} style={{ color: theme.palette.primary, fontWeight: '700', fontSize: 15 }}>{cancelLabel}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={eraseLabel}
          onPress={onErase}
          style={{ minHeight: hit.min, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 12, backgroundColor: danger.bg, borderTopWidth: 1, borderBottomWidth: 3, borderTopColor: theme.glass.solid ? '#FFFFFF' : 'rgba(255,255,255,0.4)', borderBottomColor: '#3B0907' }}
        >
          <Text allowFontScaling maxFontSizeMultiplier={2} style={{ color: danger.fg, fontWeight: '700', fontSize: 15 }}>{eraseLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}
