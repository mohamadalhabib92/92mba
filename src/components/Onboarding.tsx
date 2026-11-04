import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '../lib/colors';
import { haptic } from '../lib/haptics';
import { useI18n } from '../lib/i18n';
import { useEntrance, useSystemReduceMotion } from '../lib/motion';
import { appStore } from '../lib/store';
import { Body, Button, H1, Muted } from './ui';

/** Introduction légère (3 écrans), passable, affichée une seule fois. Textes existants réutilisés. */
const SLIDES = [
  { icon: 'library-outline', title: 'obWelcome', text: 'tagline' },
  { icon: 'phone-portrait-outline', title: 'dataLocal', text: 'dataLocalText' },
  { icon: 'shield-checkmark-outline', title: 'aboutContent', text: 'rightsNotice' },
] as const;

export function Onboarding() {
  const colors = useColors();
  const { t, dir } = useI18n();
  const [i, setI] = useState(0);
  const done = () => {
    haptic.success();
    appStore.set({ onboarded: true });
  };
  const slide = SLIDES[i];
  const last = i === SLIDES.length - 1;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]} accessibilityViewIsModal>
      <SafeAreaView style={{ flex: 1, direction: dir }}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 8 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('skip')}
            onPress={done}
            hitSlop={8}
            style={{ minHeight: 44, minWidth: 44, paddingHorizontal: 12, justifyContent: 'center' }}
          >
            <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '700' }}>{t('skip')}</Text>
          </Pressable>
        </View>
        <Slide key={i} icon={slide.icon} title={t(slide.title)} text={t(slide.text)} />
        <View style={{ padding: 24, gap: 18, width: '100%', maxWidth: 520, alignSelf: 'center' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {SLIDES.map((_, k) => (
              <View key={k} style={{ height: 8, width: k === i ? 22 : 8, borderRadius: 4, backgroundColor: k === i ? colors.accent : colors.border }} />
            ))}
          </View>
          <Muted center>{`${i + 1} / ${SLIDES.length}`}</Muted>
          <Button label={last ? t('start') : t('next')} onPress={() => (last ? done() : setI(i + 1))} />
        </View>
      </SafeAreaView>
    </View>
  );
}

function Slide({ icon, title, text }: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string }) {
  const colors = useColors();
  const reduce = useSystemReduceMotion();
  const enter = useEntrance(reduce, 0, 16);
  return (
    <Animated.View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28, gap: 16 }, enter]}>
      <View style={{ width: 112, height: 112, borderRadius: 56, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
        <Ionicons name={icon} size={48} color={colors.accent} />
      </View>
      <H1 center accessibilityRole="header">
        {title}
      </H1>
      <Body center style={{ maxWidth: 440, color: colors.muted }}>
        {text}
      </Body>
    </Animated.View>
  );
}
