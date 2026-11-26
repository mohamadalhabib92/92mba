import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Linking } from 'react-native';
import { AttestationNote } from '../../components/AttestationNote';
import { BackButton, PageTitle, ProvenanceLine } from '../../components/learnChrome';
import { Badge, Body, Button, Card, H3, Muted, Screen } from '../../components/ui';
import { findBelt } from '../../learn/content/lss';
import { beltIsHeld, beltIsOpen } from '../../learn/content/resolve';
import { learnText } from '../../learn/copy';
import { pick } from '../../learn/l10n';
import { useI18n } from '../../lib/i18n';
import { appStore } from '../../lib/store';

export default function LssBeltScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lang, dir } = useI18n();
  const study = appStore.useStore().study;
  const belt = findBelt(String(id));
  const [openCard, setOpenCard] = useState<string | null>(null);
  const t = (key: Parameters<typeof learnText>[1], vars?: Record<string, string | number>) => learnText(lang, key, vars);
  if (!belt) {
    return (
      <Screen dir={dir}>
        <BackButton />
        <Body>{t('dueNone')}</Body>
      </Screen>
    );
  }
  const open = beltIsOpen(belt.id, study);
  const held = beltIsHeld(belt.id, study);
  return (
    <Screen dir={dir}>
      <BackButton />
      <PageTitle kicker={t('lssKicker')} title={pick(belt.title, lang)} text={pick(belt.promise, lang)} />
      {held ? <Badge label={t('lssComplete')} tone="ok" /> : null}
      <AttestationNote text={belt.attestation} />
      {open ? null : <Body>{t('lssLocked')}</Body>}
      {open
        ? belt.lessons.map((lesson, index) => {
            const done = !!study.lessons[lesson.id]?.doneAt;
            return (
              <Card key={lesson.id} onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: lesson.id } })}>
                <Muted>
                  {index + 1} · {t('minutes', { n: lesson.minutes })}
                </Muted>
                <H3>{pick(lesson.title, lang)}</H3>
                {done ? <Badge label={t('lessonDone')} tone="ok" /> : null}
              </Card>
            );
          })
        : null}
      {open ? (
        <Button label={t('lssBank')} onPress={() => router.push({ pathname: '/lss/bank/[id]', params: { id: belt.id } })} />
      ) : null}
      {open ? (
        <Button
          variant="secondary"
          label={t('lssMock')}
          onPress={() => router.push({ pathname: '/lss/mock/[id]', params: { id: belt.id } })}
        />
      ) : null}
      {open && belt.cases[0] ? (
        <Button variant="ghost" label={t('case')} onPress={() => router.push({ pathname: '/case/[id]', params: { id: belt.cases[0].id } })} />
      ) : null}
      {open && belt.formulas.length ? (
        <Button variant="ghost" label={t('formulas')} onPress={() => router.push({ pathname: '/formulas', params: { module: belt.id } })} />
      ) : null}
      {open ? <H3>{t('lssCards')}</H3> : null}
      {open
        ? belt.cards.map((item) => (
            <Card key={item.id} onPress={() => setOpenCard(openCard === item.id ? null : item.id)}>
              <Body>{pick(item.front, lang)}</Body>
              {openCard === item.id ? <Body>{pick(item.back, lang)}</Body> : null}
            </Card>
          ))
        : null}
      {open
        ? belt.readings.map((reading) => (
            <Card key={reading.id}>
              <H3>{pick(reading.title, lang)}</H3>
              <Body>{pick(reading.note, lang)}</Body>
              <ProvenanceLine provenance={reading.provenance} />
              {reading.provenance.url ? (
                <Button variant="ghost" label={t('openReading')} onPress={() => Linking.openURL(reading.provenance.url!).catch(() => undefined)} />
              ) : null}
            </Card>
          ))
        : null}
    </Screen>
  );
}
