import { router } from 'expo-router';
import React from 'react';
import { BackButton, PageTitle } from '../components/learnChrome';
import { Body, Button, Card, H3, Muted, ProgressBar, Screen } from '../components/ui';
import { setComfort } from '../learn/actions';
import { PATH_92, modules } from '../learn/content/catalog';
import { learnText } from '../learn/copy';
import { pick } from '../learn/l10n';
import { expectedModule, moduleRatio, pathDayIndex } from '../learn/study';
import { useI18n } from '../lib/i18n';
import { appStore } from '../lib/store';

export default function PathScreen() {
  const { lang, dir } = useI18n();
  const study = appStore.useStore().study;
  const t = (key: Parameters<typeof learnText>[1], vars?: Record<string, string | number>) => learnText(lang, key, vars);
  const started = study.pathId === PATH_92.id && study.pathStartedAt;
  const day = started ? pathDayIndex(study.pathStartedAt as number, Date.now(), PATH_92.days) : 1;
  const todayId = started ? expectedModule(PATH_92, study.pathStartedAt as number, Date.now()) : PATH_92.steps[0].moduleId;
  const today = modules.find((mod) => mod.id === todayId);
  return (
    <Screen dir={dir}>
      <BackButton />
      <PageTitle title={pick(PATH_92.title, lang)} text={pick(PATH_92.summary, lang)} />
      {!started ? (
        <Button
          label={t('startPath')}
          onPress={() => setComfort({ pathId: PATH_92.id, pathStartedAt: Date.now(), onboarded: true, badges: study.badges.includes('path') ? study.badges : [...study.badges, 'path'] })}
        />
      ) : (
        <Card>
          <Muted>{t('dayOf', { d: day, n: PATH_92.days })}</Muted>
          <H3>{t('planToday')}</H3>
          <Body>{today ? pick(today.title, lang) : t('capstone')}</Body>
          <ProgressBar value={day / PATH_92.days} height={8} />
          <Button
            label={todayId === 'capstone' ? t('capstone') : t('continueLesson')}
            onPress={() => (todayId === 'capstone' ? router.push('/capstone') : router.push({ pathname: '/module/[id]', params: { id: todayId } }))}
          />
        </Card>
      )}
      {PATH_92.steps.map((step) => {
        const mod = modules.find((item) => item.id === step.moduleId);
        return (
          <Card key={`${step.from}-${step.moduleId}`} onPress={() => (step.moduleId === 'capstone' ? router.push('/capstone') : router.push({ pathname: '/module/[id]', params: { id: step.moduleId } }))}>
            <Muted>
              {step.from}–{step.to}
            </Muted>
            <H3>{mod ? pick(mod.title, lang) : t('capstone')}</H3>
            {mod ? <ProgressBar value={moduleRatio(mod, study)} /> : null}
          </Card>
        );
      })}
    </Screen>
  );
}
