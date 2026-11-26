import { router } from 'expo-router';
import React from 'react';
import { BackButton, PageTitle } from '../../components/learnChrome';
import { Badge, Body, Card, H3, Muted, ProgressBar, Screen } from '../../components/ui';
import { LSS_TRACK, lssBelts } from '../../learn/content/lss';
import { beltIsHeld, beltIsOpen } from '../../learn/content/resolve';
import { learnText } from '../../learn/copy';
import { pick } from '../../learn/l10n';
import { mockExamId } from '../../learn/content/lss/progress';
import { useI18n } from '../../lib/i18n';
import { appStore } from '../../lib/store';

export default function LssTrack() {
  const { lang, dir } = useI18n();
  const study = appStore.useStore().study;
  const t = (key: Parameters<typeof learnText>[1], vars?: Record<string, string | number>) => learnText(lang, key, vars);
  return (
    <Screen dir={dir}>
      <BackButton />
      <PageTitle kicker={t('lssKicker')} title={pick(LSS_TRACK.title, lang)} text={pick(LSS_TRACK.summary, lang)} />
      {lssBelts.map((belt) => {
        const open = beltIsOpen(belt.id, study);
        const held = beltIsHeld(belt.id, study);
        const done = belt.lessons.filter((lesson) => study.lessons[lesson.id]?.doneAt).length;
        const exam = study.exams[mockExamId(belt.id)];
        return (
          <Card
            key={belt.id}
            accessibilityLabel={pick(belt.title, lang)}
            onPress={open ? () => router.push({ pathname: '/lss/[id]', params: { id: belt.id } }) : undefined}
          >
            <Badge label={held ? t('lssComplete') : open ? t('lssOpen') : t('lssLocked')} tone={held ? 'ok' : open ? 'info' : 'neutral'} />
            <H3>{pick(belt.title, lang)}</H3>
            <Body>{pick(belt.promise, lang)}</Body>
            <Muted>
              {done}/{belt.lessons.length}
              {exam ? ` · ${exam.correct}/${exam.total}` : ''}
            </Muted>
            <ProgressBar value={belt.lessons.length ? done / belt.lessons.length : 0} height={8} />
          </Card>
        );
      })}
    </Screen>
  );
}
