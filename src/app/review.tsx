import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { BackButton, Choice, PageTitle } from '../components/learnChrome';
import { haptic } from '../components/haptics';
import { Body, Button, Card, H2, Muted, Screen } from '../components/ui';
import { gradeCard } from '../learn/actions';
import { modules } from '../learn/content/catalog';
import { learnText } from '../learn/copy';
import { pick } from '../learn/l10n';
import type { Grade } from '../learn/srs';
import { queuePreview, reviewIds } from '../learn/study';
import { useI18n } from '../lib/i18n';
import { appStore } from '../lib/store';

export default function ReviewScreen() {
  const { lang, dir } = useI18n();
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
    void haptic(grade === 'again' ? 'warn' : 'success');
    setShown(false);
  };
  return (
    <Screen dir={dir}>
      <BackButton />
      <PageTitle title={t('reviewNow')} text={ids.length ? t('dueSome', { n: ids.length }) : t('dueNone')} />
      {!cardId ? (
        <Card>
          <Body>{t('sessionDone')}</Body>
        </Card>
      ) : (
        <Card>
          <Muted>{ids.length}</Muted>
          <H2>{front}</H2>
          {shown ? <Body>{back}</Body> : <Button label={t('show')} onPress={() => setShown(true)} />}
          {shown ? (
            <View style={{ gap: 8 }}>
              {(['again', 'hard', 'good', 'easy'] as Grade[]).map((grade) => (
                <Choice key={grade} label={t(grade)} onPress={() => answer(grade)} />
              ))}
            </View>
          ) : null}
        </Card>
      )}
    </Screen>
  );
}
