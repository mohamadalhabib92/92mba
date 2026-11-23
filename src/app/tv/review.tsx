import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { TvBody, TvFocusable, TvScreen, TvTitle } from '../../components/tv/ui';
import { gradeCard } from '../../learn/actions';
import { modules } from '../../learn/content/catalog';
import { learnText } from '../../learn/copy';
import { pick } from '../../learn/l10n';
import type { Grade } from '../../learn/srs';
import { queuePreview, reviewIds } from '../../learn/study';
import { useI18n } from '../../lib/i18n';
import { appStore } from '../../lib/store';

export default function TvReview() {
  const { lang } = useI18n();
  const study = appStore.useStore().study;
  const ids = useMemo(() => queuePreview(study, reviewIds(modules, study, Date.now())).map((item) => item.id), [study]);
  const [shown, setShown] = useState(false);
  const t = (key: Parameters<typeof learnText>[1], vars?: Record<string, string | number>) => learnText(lang, key, vars);
  const cardId = ids[0];
  const content = modules.flatMap((mod) => mod.cards).find((card) => card.id === cardId);
  const user = study.userCards.find((card) => card.id === cardId);
  const front = content ? pick(content.front, lang) : user?.front ?? '';
  const back = content ? pick(content.back, lang) : user?.back ?? '';
  const answer = (grade: Grade) => {
    if (!cardId) return;
    gradeCard(cardId, grade);
    setShown(false);
  };
  return (
    <TvScreen>
      <TvFocusable label={t('leave')} onPress={() => router.back()} />
      <TvTitle>{t('reviewNow')}</TvTitle>
      {!cardId ? (
        <TvBody>{t('sessionDone')}</TvBody>
      ) : (
        <View style={{ gap: 16 }}>
          <TvBody>{front}</TvBody>
          {shown ? <TvBody>{back}</TvBody> : <TvFocusable preferred label={t('show')} onPress={() => setShown(true)} />}
          {shown
            ? (['again', 'hard', 'good', 'easy'] as Grade[]).map((grade, index) => (
                <TvFocusable key={grade} preferred={index === 2} label={t(grade)} onPress={() => answer(grade)} />
              ))
            : null}
        </View>
      )}
    </TvScreen>
  );
}
