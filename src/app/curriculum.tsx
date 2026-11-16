import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { PageTitle } from '../components/learnChrome';
import { Badge, Body, Card, H3, Muted, ProgressBar, Screen } from '../components/ui';
import { modules } from '../learn/content/catalog';
import { learnText } from '../learn/copy';
import { pick } from '../learn/l10n';
import { moduleRatio } from '../learn/study';
import { useI18n } from '../lib/i18n';
import { appStore } from '../lib/store';

export default function Curriculum() {
  const { lang, dir } = useI18n();
  const study = appStore.useStore().study;
  const width = useWindowDimensions().width;
  const columns = width >= 840;
  const t = (key: Parameters<typeof learnText>[1], vars?: Record<string, string | number>) => learnText(lang, key, vars);
  const cards = useMemo(() => modules, []);
  return (
    <Screen dir={dir}>
      <PageTitle kicker="92'MBA" title={t('browseModules')} text={t('studyLead')} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {cards.map((mod) => {
          const ratio = moduleRatio(mod, study);
          return (
            <Card
              key={mod.id}
              accessibilityLabel={pick(mod.title, lang)}
              onPress={() => router.push({ pathname: '/module/[id]', params: { id: mod.id } })}
              style={{ width: columns ? '47%' : '100%' }}
            >
              <Badge label={t(mod.richness)} tone={mod.richness === 'rich' ? 'info' : 'neutral'} />
              <H3>{pick(mod.title, lang)}</H3>
              <Body>{pick(mod.promise, lang)}</Body>
              <Muted>
                {mod.lessons.length} · {t('minutes', { n: mod.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0) })}
              </Muted>
              <ProgressBar value={ratio} height={8} />
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}
