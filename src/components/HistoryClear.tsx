import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors, hit } from '../theme';

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
  if (!confirming) {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={askLabel} onPress={onAsk} hitSlop={10} style={{ minHeight: hit.min, justifyContent: 'center' }}>
        <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 15 }}>{askLabel}</Text>
      </Pressable>
    );
  }
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: colors.text, fontSize: 15, lineHeight: 22 }}>{prompt}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
          onPress={onCancel}
          style={{ minHeight: hit.min, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}
        >
          <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 15 }}>{cancelLabel}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={eraseLabel}
          onPress={onErase}
          style={{ minHeight: hit.min, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 12, backgroundColor: colors.danger }}
        >
          <Text style={{ color: colors.onPrimary, fontWeight: '700', fontSize: 15 }}>{eraseLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}
