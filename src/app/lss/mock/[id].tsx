import { useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { AttestationNote } from '../../../components/AttestationNote';
import { BackButton, Choice, PageTitle, ScreenProgress } from '../../../components/learnChrome';
import { Body, Button, Card, H2, Muted, Screen } from '../../../components/ui';
import { useTheme } from '../../../components/theme';
import { findBelt, lssBelts, mockQuestions } from '../../../learn/content/lss';
import { useMockRun } from '../../../learn/content/lss/useMockRun';
import { beltIsHeld, beltIsOpen } from '../../../learn/content/resolve';
import { learnText } from '../../../learn/copy';
import { pick } from '../../../learn/l10n';
import { formatClock } from '../../../learn/content/lss/score';
import { PASS_RATIO } from '../../../learn/study';
import { useI18n } from '../../../lib/i18n';
import { appStore } from '../../../lib/store';

export default function LssMock() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const belt = findBelt(String(id));
  if (!belt) {
    return (
      <Screen>
        <BackButton />
      </Screen>
    );
  }
  return <MockRun key={belt.id} beltId={belt.id} />;
}

function MockRun({ beltId }: { beltId: string }) {
  const { lang, dir } = useI18n();
  const theme = useTheme();
  const study = appStore.useStore().study;
  const belt = findBelt(beltId);
  const questions = useMemo(() => (belt ? mockQuestions(belt) : []), [belt]);
  const answers = useMemo(() => questions.map((question) => question.answer), [questions]);
  const run = useMockRun(beltId, answers, (belt?.mockMinutes ?? 0) * 60);
  const t = (key: Parameters<typeof learnText>[1], vars?: Record<string, string | number>) => learnText(lang, key, vars);
  if (!belt || !beltIsOpen(belt.id, study)) {
    return (
      <Screen dir={dir}>
        <BackButton />
        <Body>{t('lssLocked')}</Body>
      </Screen>
    );
  }
  const item = questions[run.step];
  const ratio = run.result && run.result.total ? run.result.correct / run.result.total : 0;
  const held = beltIsHeld(belt.id, study);
  return (
    <Screen dir={dir}>
      <BackButton />
      <PageTitle kicker={pick(belt.title, lang)} title={t('lssMock')} />
      {run.phase === 'ready' ? (
        <Card>
          <Body>{t('lssMockLead', { n: questions.length, m: belt.mockMinutes })}</Body>
          <Body>{t('lssPassMark')}</Body>
          <AttestationNote text={belt.attestation} />
          <Button label={t('lssStart')} onPress={run.start} />
        </Card>
      ) : null}
      {run.phase === 'run' && item ? (
        <Card>
          <Muted style={{ color: run.left <= 60 ? theme.palette.noticeText : theme.palette.muted }}>
            {t('lssTime')} · {formatClock(run.left)}
          </Muted>
          <ScreenProgress value={(run.step + 1) / questions.length} label={`${run.step + 1} / ${questions.length}`} />
          <H2>{pick(item.prompt, lang)}</H2>
          {item.options.map((option, index) => (
            <Choice key={`${item.id}-${index}`} label={pick(option, lang)} selected={run.picked === index} onPress={() => run.setPicked(index)} />
          ))}
          <Button label={t('check')} disabled={run.picked === null} onPress={run.commit} />
        </Card>
      ) : null}
      {run.phase === 'review' && run.result ? (
        <Card>
          <H2>{ratio >= PASS_RATIO ? t('pass') : t('keep')}</H2>
          <Body>
            {run.result.correct} / {run.result.total}
          </Body>
          {held && lssBelts.some((item) => item.order === belt.order + 1) ? <Body>{t('lssNextBelt')}</Body> : null}
          <AttestationNote text={belt.attestation} />
          <H2>{t('lssReview')}</H2>
          {run.result.misses.map((miss) => {
            const question = questions[miss.index];
            if (!question) return null;
            const yours = miss.picked === null ? t('lssUnanswered') : pick(question.options[miss.picked], lang);
            return (
              <Card key={question.id}>
                <Body>{pick(question.prompt, lang)}</Body>
                <Body>
                  {t('lssYourAnswer')} · {yours}
                </Body>
                <Body>
                  {t('lssRightAnswer')} · {pick(question.options[question.answer], lang)}
                </Body>
                <Body>{pick(question.why, lang)}</Body>
              </Card>
            );
          })}
          <Button variant="secondary" label={t('lssRetry')} onPress={run.start} />
        </Card>
      ) : null}
    </Screen>
  );
}
