import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { TvBody, TvFocusable, TvScreen, TvTitle } from '../../../components/tv/ui';
import { findBelt, mockQuestions } from '../../../learn/content/lss';
import { formatClock } from '../../../learn/content/lss/score';
import { useMockRun } from '../../../learn/content/lss/useMockRun';
import { beltIsOpen } from '../../../learn/content/resolve';
import { learnText } from '../../../learn/copy';
import { pick } from '../../../learn/l10n';
import { PASS_RATIO } from '../../../learn/study';
import { useI18n } from '../../../lib/i18n';
import { appStore } from '../../../lib/store';

export default function TvLssMock() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const belt = findBelt(String(id));
  if (!belt) {
    return (
      <TvScreen>
        <TvFocusable preferred label="←" onPress={() => router.back()} />
      </TvScreen>
    );
  }
  return <Run key={belt.id} beltId={belt.id} />;
}

function Run({ beltId }: { beltId: string }) {
  const { lang } = useI18n();
  const study = appStore.useStore().study;
  const belt = findBelt(beltId);
  const questions = useMemo(() => (belt ? mockQuestions(belt) : []), [belt]);
  const answers = useMemo(() => questions.map((question) => question.answer), [questions]);
  const run = useMockRun(beltId, answers, (belt?.mockMinutes ?? 0) * 60);
  const t = (key: Parameters<typeof learnText>[1], vars?: Record<string, string | number>) => learnText(lang, key, vars);
  if (!belt || !beltIsOpen(belt.id, study)) {
    return (
      <TvScreen>
        <TvBody>{t('lssLocked')}</TvBody>
        <TvFocusable preferred label={t('leave')} onPress={() => router.back()} />
      </TvScreen>
    );
  }
  const item = questions[run.step];
  const ratio = run.result && run.result.total ? run.result.correct / run.result.total : 0;
  return (
    <TvScreen>
      <TvFocusable label={t('leave')} onPress={() => router.back()} />
      <TvTitle>{pick(belt.title, lang)}</TvTitle>
      {run.phase === 'ready' ? (
        <View style={{ gap: 16 }}>
          <TvBody>{t('lssMockLead', { n: questions.length, m: belt.mockMinutes })}</TvBody>
          <TvBody>{pick(belt.attestation, lang)}</TvBody>
          <TvFocusable preferred label={t('lssStart')} onPress={run.start} />
        </View>
      ) : null}
      {run.phase === 'run' && item ? (
        <View style={{ gap: 16 }}>
          <TvBody>
            {t('lssTime')} · {formatClock(run.left)}
          </TvBody>
          <TvBody>{pick(item.prompt, lang)}</TvBody>
          {item.options.map((option, index) => (
            <TvFocusable
              key={`${item.id}-${index}`}
              preferred={index === 0 && run.picked === null}
              label={pick(option, lang)}
              onPress={() => run.setPicked(index)}
            />
          ))}
          <TvFocusable label={t('check')} onPress={run.commit} />
        </View>
      ) : null}
      {run.phase === 'review' && run.result ? (
        <View style={{ gap: 16 }}>
          <TvBody>{ratio >= PASS_RATIO ? t('pass') : t('keep')}</TvBody>
          <TvBody>
            {run.result.correct} / {run.result.total}
          </TvBody>
          <TvBody>{pick(belt.attestation, lang)}</TvBody>
          {run.result.misses.map((miss) => {
            const question = questions[miss.index];
            if (!question) return null;
            const yours = miss.picked === null ? t('lssUnanswered') : pick(question.options[miss.picked], lang);
            return (
              <TvBody key={question.id}>
                {pick(question.prompt, lang)} · {t('lssYourAnswer')} {yours} · {t('lssRightAnswer')} {pick(question.options[question.answer], lang)} · {pick(question.why, lang)}
              </TvBody>
            );
          })}
          <TvFocusable label={t('lssRetry')} onPress={run.start} />
        </View>
      ) : null}
    </TvScreen>
  );
}
