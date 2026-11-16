import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { BackButton, Choice, PageTitle, ScreenProgress } from '../../components/learnChrome';
import { haptic } from '../../components/haptics';
import { Body, Button, Card, H2, Screen } from '../../components/ui';
import { useTheme } from '../../components/theme';
import { saveExam } from '../../learn/actions';
import { modules } from '../../learn/content/catalog';
import { learnText } from '../../learn/copy';
import { pick } from '../../learn/l10n';
import { PASS_RATIO } from '../../learn/study';
import { useI18n } from '../../lib/i18n';

export default function QuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lang, dir } = useI18n();
  const theme = useTheme();
  const mod = modules.find((item) => item.id === id);
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const t = (key: Parameters<typeof learnText>[1]) => learnText(lang, key);
  if (!mod) {
    return <Screen dir={dir}><BackButton /></Screen>;
  }
  const item = mod.quiz[step];
  const total = mod.quiz.length;
  const commit = () => {
    if (!item || picked === null) return;
    const hit = picked === item.answer;
    if (hit) void haptic('success');
    const nextCorrect = correct + (hit ? 1 : 0);
    if (step + 1 >= total) {
      setCorrect(nextCorrect);
      setDone(true);
      saveExam(mod.id, nextCorrect, total);
      return;
    }
    setCorrect(nextCorrect);
    setPicked(null);
    setStep(step + 1);
  };
  const ratio = total ? correct / total : 0;
  return (
    <Screen dir={dir}>
      <BackButton />
      <PageTitle kicker={pick(mod.title, lang)} title={t('exam')} />
      {done ? (
        <Card>
          <H2>{ratio >= PASS_RATIO ? t('pass') : t('keep')}</H2>
          <Body>{correct} / {total}</Body>
        </Card>
      ) : item ? (
        <Card>
          <ScreenProgress value={(step + 1) / total} label={`${step + 1} / ${total}`} />
          <H2>{pick(item.prompt, lang)}</H2>
          {item.options.map((option, index) => (
            <Choice key={option.fr} label={pick(option, lang)} selected={picked === index} onPress={() => setPicked(index)} />
          ))}
          {picked !== null && picked !== item.answer ? <Body style={{ color: theme.palette.noticeText }}>{pick(item.why, lang)}</Body> : null}
          <Button label={t('check')} disabled={picked === null} onPress={commit} />
        </Card>
      ) : null}
    </Screen>
  );
}
