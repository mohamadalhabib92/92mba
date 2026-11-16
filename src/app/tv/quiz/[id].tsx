import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import { TvBody, TvFocusable, TvScreen, TvTitle } from '../../../components/tv/ui';
import { saveExam } from '../../../learn/actions';
import { modules } from '../../../learn/content/catalog';
import { learnText } from '../../../learn/copy';
import { pick } from '../../../learn/l10n';
import { PASS_RATIO } from '../../../learn/study';
import { useI18n } from '../../../lib/i18n';

export default function TvQuiz() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lang } = useI18n();
  const mod = modules.find((item) => item.id === id);
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const t = (key: Parameters<typeof learnText>[1]) => learnText(lang, key);
  if (!mod) {
    return (
      <TvScreen>
        <TvFocusable preferred label={t('leave')} onPress={() => router.back()} />
      </TvScreen>
    );
  }
  const item = mod.quiz[step];
  const commit = () => {
    if (!item || picked === null) return;
    const next = correct + (picked === item.answer ? 1 : 0);
    if (step + 1 >= mod.quiz.length) {
      setCorrect(next);
      setDone(true);
      saveExam(mod.id, next, mod.quiz.length);
      return;
    }
    setCorrect(next);
    setPicked(null);
    setStep(step + 1);
  };
  return (
    <TvScreen>
      <TvFocusable label={t('leave')} onPress={() => router.back()} />
      <TvTitle>{pick(mod.title, lang)}</TvTitle>
      {done ? (
        <View style={{ gap: 16 }}>
          <TvBody>{correct / mod.quiz.length >= PASS_RATIO ? t('pass') : t('keep')}</TvBody>
          <TvBody>{`${correct} / ${mod.quiz.length}`}</TvBody>
        </View>
      ) : item ? (
        <View style={{ gap: 16 }}>
          <TvBody>{pick(item.prompt, lang)}</TvBody>
          {item.options.map((option, index) => (
            <TvFocusable
              key={option.fr}
              preferred={index === 0 && picked === null}
              label={pick(option, lang)}
              hint={picked === index && index !== item.answer ? pick(item.why, lang) : undefined}
              onPress={() => setPicked(index)}
            />
          ))}
          <TvFocusable label={t('check')} onPress={commit} />
        </View>
      ) : null}
    </TvScreen>
  );
}
