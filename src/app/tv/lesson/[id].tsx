import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { TvBody, TvFocusable, TvHint, TvScreen, TvTitle } from '../../../components/tv/ui';
import { finishLesson, moveLesson } from '../../../learn/actions';
import { findLesson, lessonAllowed } from '../../../learn/content/resolve';
import { learnText } from '../../../learn/copy';
import { pick } from '../../../learn/l10n';
import { useI18n } from '../../../lib/i18n';
import { appStore } from '../../../lib/store';

export default function TvLesson() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lang } = useI18n();
  const study = appStore.useStore().study;
  const saved = study.lessons[String(id)]?.screen ?? 0;
  const found = useMemo(() => findLesson(String(id)), [id]);
  const [index, setIndex] = useState(saved);
  const [picked, setPicked] = useState<number | null>(null);
  const t = (key: Parameters<typeof learnText>[1]) => learnText(lang, key);
  if (!found || !lessonAllowed(found.mod.id, study)) {
    return (
      <TvScreen>
        <TvBody>{found ? t('lssLocked') : ''}</TvBody>
        <TvFocusable preferred label={t('leave')} onPress={() => router.back()} />
      </TvScreen>
    );
  }
  const { mod, lesson } = found;
  const screen = lesson.screens[Math.min(index, lesson.screens.length - 1)];
  const last = index >= lesson.screens.length - 1;
  const advance = () => {
    if (screen.kind === 'check' && picked === null) return;
    if (!last) {
      const next = index + 1;
      setIndex(next);
      setPicked(null);
      moveLesson(lesson.id, next);
      return;
    }
    finishLesson(lesson.id, mod.id, mod.lessons.map((item) => item.id));
    router.back();
  };
  return (
    <TvScreen>
      <TvFocusable label={t('leave')} onPress={() => router.back()} />
      <TvHint>{pick(mod.title, lang)}</TvHint>
      <TvTitle>{pick(lesson.title, lang)}</TvTitle>
      <TvHint>{`${index + 1} / ${lesson.screens.length}`}</TvHint>
      {screen.kind === 'check' ? (
        <View style={{ gap: 16 }}>
          <TvBody>{pick(screen.prompt, lang)}</TvBody>
          {screen.options.map((option, optionIndex) => (
            <TvFocusable
              key={option.fr}
              preferred={optionIndex === 0}
              label={pick(option, lang)}
              hint={picked === optionIndex ? (optionIndex === screen.answer ? t('nice') : pick(screen.why, lang)) : undefined}
              onPress={() => setPicked(optionIndex)}
            />
          ))}
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          <TvBody>{pick(screen.title, lang)}</TvBody>
          <TvBody>{pick(screen.body, lang)}</TvBody>
        </View>
      )}
      <TvFocusable preferred={screen.kind !== 'check'} label={last ? t('lessonDone') : t('next')} onPress={advance} />
    </TvScreen>
  );
}
