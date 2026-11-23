import { router } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';
import { BackButton, PageTitle } from '../components/learnChrome';
import { Body, Button, Card, Muted, Screen } from '../components/ui';
import { keepMark, promoteMark } from '../learn/actions';
import { learnText } from '../learn/copy';
import { findDoc } from '../lib/library';
import { useI18n } from '../lib/i18n';
import { appStore } from '../lib/store';
import { highlightColors, type HighlightName } from '../theme';

const COLOR_KEY = {
  yellow: 'colorYellow',
  green: 'colorGreen',
  blue: 'colorBlue',
  rose: 'colorRose',
} as const;

export default function HighlightsScreen() {
  const { lang, dir } = useI18n();
  const state = appStore.useStore();
  const marks = state.study.marks;
  const t = (key: Parameters<typeof learnText>[1]) => learnText(lang, key);
  const makeCard = (markId: string) => {
    const mark = state.study.marks.find((item) => item.id === markId);
    if (!mark || mark.cardId) return;
    const doc = findDoc(mark.docId, state.userDocs);
    promoteMark(mark.id, t('highlight'), mark.text, {
      lang: doc?.lang ?? 'fr',
      docId: mark.docId,
      author: doc?.author ?? '',
      date: doc?.license.date || doc?.year || 'à vérifier',
      source: doc?.title ?? mark.docId,
      licence: doc?.license.label ?? '',
      status: doc?.license.statusCode ?? doc?.license.kind ?? 'needs-review',
    });
  };
  return (
    <Screen dir={dir}>
      <BackButton />
      <PageTitle title={t('highlights')} text={t('highlightsLead')} />
      {marks.length ? (
        <Button label={t('reviewNow')} onPress={() => router.push('/review')} />
      ) : (
        <Card>
          <Body>{t('highlightsEmpty')}</Body>
        </Card>
      )}
      {marks.map((mark) => {
        const color = (mark.color ?? 'yellow') as HighlightName;
        const swatch = highlightColors[color] ?? highlightColors.yellow;
        const doc = findDoc(mark.docId, state.userDocs);
        return (
          <Card key={mark.id}>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
              <View
                accessibilityLabel={t(COLOR_KEY[color] ?? 'colorYellow')}
                style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: swatch.bg }}
              />
              <View style={{ flex: 1, gap: 6 }}>
                <Muted>{doc?.title ?? mark.docId}</Muted>
                <Body numberOfLines={4}>{mark.text}</Body>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('openReading')}
                  onPress={() => router.push({ pathname: '/doc/[id]', params: { id: mark.docId, page: String(mark.page) } })}
                  style={{ minHeight: 44, justifyContent: 'center' }}
                >
                  <Muted style={{ fontWeight: '700' }}>{t('openReading')}</Muted>
                </Pressable>
                {mark.cardId ? (
                  <Muted>{t('cardReady')}</Muted>
                ) : (
                  <Button
                    label={t('toCard')}
                    onPress={() => {
                      if (!state.study.marks.some((item) => item.id === mark.id)) {
                        keepMark(mark);
                      }
                      makeCard(mark.id);
                    }}
                  />
                )}
              </View>
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}
