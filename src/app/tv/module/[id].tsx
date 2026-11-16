import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { TvBody, TvFocusable, TvScreen, TvTitle } from '../../../components/tv/ui';
import { modules } from '../../../learn/content/catalog';
import { learnText } from '../../../learn/copy';
import { pick } from '../../../learn/l10n';
import { useI18n } from '../../../lib/i18n';
import { appStore } from '../../../lib/store';

export default function TvModule() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lang } = useI18n();
  const study = appStore.useStore().study;
  const mod = useMemo(() => modules.find((item) => item.id === id), [id]);
  const t = (key: Parameters<typeof learnText>[1]) => learnText(lang, key);
  if (!mod) {
    return (
      <TvScreen>
        <TvFocusable label={t('leave')} onPress={() => router.back()} preferred />
      </TvScreen>
    );
  }
  return (
    <TvScreen>
      <TvFocusable label={t('leave')} onPress={() => router.back()} />
      <TvTitle>{pick(mod.title, lang)}</TvTitle>
      <TvBody>{pick(mod.promise, lang)}</TvBody>
      <View style={{ gap: 16 }}>
        {mod.lessons.map((lesson, index) => (
          <TvFocusable
            key={lesson.id}
            preferred={index === 0}
            label={pick(lesson.title, lang)}
            hint={study.lessons[lesson.id]?.doneAt ? t('lessonDone') : learnText(lang, 'minutes', { n: lesson.minutes })}
            onPress={() => router.push({ pathname: '/tv/lesson/[id]', params: { id: lesson.id } })}
          />
        ))}
        <TvFocusable label={t('exam')} onPress={() => router.push({ pathname: '/tv/quiz/[id]', params: { id: mod.id } })} />
      </View>
    </TvScreen>
  );
}
