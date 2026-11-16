import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { Linking } from 'react-native';
import { BackButton, PageTitle, ProvenanceLine } from '../../components/learnChrome';
import { Badge, Body, Button, Card, H3, Muted, Screen } from '../../components/ui';
import { modules } from '../../learn/content/catalog';
import { learnText } from '../../learn/copy';
import { pick } from '../../learn/l10n';
import { nextLessonId } from '../../learn/study';
import { useI18n } from '../../lib/i18n';
import { findDoc } from '../../lib/library';
import { appStore } from '../../lib/store';

export default function ModuleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lang, dir } = useI18n();
  const state = appStore.useStore();
  const mod = useMemo(() => modules.find((item) => item.id === id), [id]);
  const t = (key: Parameters<typeof learnText>[1], vars?: Record<string, string | number>) => learnText(lang, key, vars);
  if (!mod) {
    return (
      <Screen dir={dir}>
        <BackButton />
        <Body>{t('dueNone')}</Body>
      </Screen>
    );
  }
  const next = nextLessonId(mod, state.study);
  return (
    <Screen dir={dir}>
      <BackButton />
      <PageTitle kicker={t(mod.richness)} title={pick(mod.title, lang)} text={pick(mod.promise, lang)} />
      {mod.lessons.map((lesson, index) => {
        const done = !!state.study.lessons[lesson.id]?.doneAt;
        return (
          <Card key={lesson.id} onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: lesson.id } })}>
            <Muted>
              {index + 1} · {t('minutes', { n: lesson.minutes })} · {t('oneConcept')}
            </Muted>
            <H3>{pick(lesson.title, lang)}</H3>
            {done ? <Badge label={t('lessonDone')} tone="ok" /> : null}
          </Card>
        );
      })}
      <Button label={t('continueLesson')} onPress={() => next && router.push({ pathname: '/lesson/[id]', params: { id: next } })} />
      <Button variant="secondary" label={t('exam')} onPress={() => router.push({ pathname: '/quiz/[id]', params: { id: mod.id } })} />
      {mod.cases[0] ? (
        <Button variant="ghost" label={t('case')} onPress={() => router.push({ pathname: '/case/[id]', params: { id: mod.cases[0].id } })} />
      ) : null}
      {mod.libraryDocIds.map((docId) => {
        const doc = findDoc(docId, state.userDocs);
        if (!doc) return null;
        return (
          <Card key={docId} onPress={() => router.push({ pathname: '/doc/[id]', params: { id: docId } })}>
            <Muted>{t('libraryOf')}</Muted>
            <H3>{doc.title}</H3>
            <ProvenanceLine provenance={{ author: doc.author, date: doc.license.date ?? doc.year ?? '', source: doc.license.source ?? '', licence: doc.license.label, status: 'original' }} />
          </Card>
        );
      })}
      {mod.readings.map((reading) => (
        <Card key={reading.id}>
          <H3>{pick(reading.title, lang)}</H3>
          <Body>{pick(reading.note, lang)}</Body>
          <ProvenanceLine provenance={reading.provenance} />
          {reading.provenance.url ? (
            <Button variant="ghost" label={t('openReading')} onPress={() => Linking.openURL(reading.provenance.url!).catch(() => undefined)} />
          ) : null}
        </Card>
      ))}
      {mod.formulas.length ? <Button variant="ghost" label={t('formulas')} onPress={() => router.push({ pathname: '/formulas', params: { module: mod.id } })} /> : null}
    </Screen>
  );
}
