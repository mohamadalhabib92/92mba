import { router } from 'expo-router';
import React, { useState } from 'react';
import { BackButton, PageTitle } from '../components/learnChrome';
import { Body, Button, Card, Screen } from '../components/ui';
import { setComfort } from '../learn/actions';
import { learnText } from '../learn/copy';
import { useI18n } from '../lib/i18n';

const steps = ['studyTitle', 'oneConcept', 'notMedical'] as const;

export default function Onboarding() {
  const { lang, dir } = useI18n();
  const [step, setStep] = useState(0);
  const t = (key: Parameters<typeof learnText>[1]) => learnText(lang, key);
  const finish = (path: boolean) => {
    setComfort({ onboarded: true, ...(path ? { pathId: 'mba-92', pathStartedAt: Date.now() } : { pathId: null }) });
    router.replace(path ? '/path' : '/curriculum');
  };
  return (
    <Screen dir={dir}>
      <BackButton />
      <PageTitle kicker="92'MBA" title={t(steps[step])} text={step === 0 ? t('studyLead') : step === 1 ? t('dueNone') : t('notMedical')} />
      <Card>
        <Body>{step + 1} / 3</Body>
      </Card>
      {step < 2 ? (
        <Button label={t('next')} onPress={() => setStep(step + 1)} />
      ) : (
        <>
          <Button label={t('startPath')} onPress={() => finish(true)} />
          <Button variant="secondary" label={t('exploreCta')} onPress={() => finish(false)} />
        </>
      )}
      <Button variant="ghost" label={t('leave')} onPress={() => { setComfort({ onboarded: true }); router.back(); }} />
    </Screen>
  );
}
