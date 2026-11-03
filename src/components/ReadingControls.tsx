import React from 'react';
import { Text, View } from 'react-native';
import { useI18n } from '../lib/i18n';
import { appStore } from '../lib/store';
import { LINE_HEIGHT_STEPS, snapFontScale, snapLineHeight, snapMargin, type ReaderMargin } from '../theme';
import { Chip, Muted, Row } from './ui';

export function ReadingControls({ color, muted }: { color: string; muted: string }) {
  const { t, lang } = useI18n();
  const s = appStore.useStore();
  const line = snapLineHeight(s.lineHeight);
  const margin = snapMargin(s.readerMargin);
  const margins: { id: ReaderMargin; label: string }[] = [
    { id: 'compact', label: t('marginCompact') },
    { id: 'normal', label: t('marginNormal') },
    { id: 'wide', label: t('marginWide') },
  ];
  const num = (n: number) => (lang === 'en' ? n.toFixed(1) : n.toFixed(1).replace('.', ','));
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ color, fontWeight: '700' }}>{t('lineHeightLabel')}</Text>
      <Row style={{ flexWrap: 'wrap' }}>
        {LINE_HEIGHT_STEPS.map((step) => (
          <Chip key={step} label={num(step)} active={line === step} onPress={() => appStore.set({ lineHeight: step })} />
        ))}
      </Row>
      <Text style={{ color, fontWeight: '700' }}>{t('margins')}</Text>
      <Row style={{ flexWrap: 'wrap' }}>
        {margins.map((item) => (
          <Chip key={item.id} label={item.label} active={margin === item.id} onPress={() => appStore.set({ readerMargin: item.id })} />
        ))}
      </Row>
      <Text style={{ color, fontWeight: '700' }}>{t('dyslexia')}</Text>
      <Row style={{ flexWrap: 'wrap' }}>
        <Chip label={t('dyslexia')} active={s.dyslexia} onPress={() => appStore.set({ dyslexia: !s.dyslexia })} />
        <Muted style={{ color: muted, flex: 1 }}>{t('dyslexiaHint')}</Muted>
      </Row>
      <Row>
        <Chip label="A-" onPress={() => appStore.set({ fontScale: snapFontScale(s.fontScale - 0.1) })} />
        <Muted style={{ color: muted }}>{Math.round(snapFontScale(s.fontScale) * 100)} %</Muted>
        <Chip label="A+" onPress={() => appStore.set({ fontScale: snapFontScale(s.fontScale + 0.1) })} />
      </Row>
    </View>
  );
}
