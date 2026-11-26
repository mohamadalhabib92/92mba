import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { AttestationNote } from '../../../components/AttestationNote';
import { BackButton, Choice, PageTitle, ScreenProgress } from '../../../components/learnChrome';
import { haptic } from '../../../components/haptics';
import { Body, Button, Card, H2, Screen } from '../../../components/ui';
import { useTheme } from '../../../components/theme';
import { findBelt } from '../../../learn/content/lss';
import { beltIsOpen } from '../../../learn/content/resolve';
import { learnText } from '../../../learn/copy';
import { pick } from '../../../learn/l10n';
import { useI18n } from '../../../lib/i18n';
import { appStore } from '../../../lib/store';

export default function LssBank() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lang, dir } = useI18n();
  const theme = useTheme();
  const study = appStore.useStore().study;
  const belt = findBelt(String(id));
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const t = (key: Parameters<typeof learnText>[1]) => learnText(lang, key);
  if (!belt || !beltIsOpen(belt.id, study)) {
    return (
      <Screen dir={dir}>
        <BackButton />
        <Body>{t('lssLocked')}</Body>
      </Screen>
    );
  }
  const item = belt.questions[step];
  const total = belt.questions.length;
  const advance = () => {
    if (!item || picked === null) return;
    const hit = picked === item.answer;
    if (hit) void haptic('success');
    const nextCorrect = correct + (hit ? 1 : 0);
    if (step + 1 >= total) {
      setCorrect(nextCorrect);
      setDone(true);
      return;
    }
    setCorrect(nextCorrect);
    setPicked(null);
    setStep(step + 1);
  };
  return (
    <Screen dir={dir}>
      <BackButton />
      <PageTitle kicker={pick(belt.title, lang)} title={t('lssBank')} text={t('lssBankNote')} />
      {done ? (
        <Card>
          <H2>
            {correct} / {total}
          </H2>
          <Body>{t('lssScoreLocal')}</Body>
          <AttestationNote text={belt.attestation} />
        </Card>
      ) : item ? (
        <Card>
          <ScreenProgress value={(step + 1) / total} label={`${step + 1} / ${total}`} />
          <H2>{pick(item.prompt, lang)}</H2>
          {item.options.map((option, index) => (
            <Choice key={`${item.id}-${index}`} label={pick(option, lang)} selected={picked === index} onPress={() => setPicked(index)} />
          ))}
          {picked !== null ? (
            <>
              <Body style={{ color: picked === item.answer ? theme.palette.success : theme.palette.noticeText }}>{pick(item.why, lang)}</Body>
              <Body>
                {t('lssRightAnswer')} · {pick(item.options[item.answer], lang)}
              </Body>
            </>
          ) : null}
          <Button label={step + 1 >= total ? t('lssBankEnd') : t('next')} disabled={picked === null} onPress={advance} />
        </Card>
      ) : null}
    </Screen>
  );
}
