import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { BackButton, Choice, PageTitle, ProvenanceLine } from '../../components/learnChrome';
import { haptic } from '../../components/haptics';
import { Body, Card, H2, Screen } from '../../components/ui';
import { useTheme } from '../../components/theme';
import { modules } from '../../learn/content/catalog';
import { learnText } from '../../learn/copy';
import { pick } from '../../learn/l10n';
import { touchStreak } from '../../learn/study';
import { useI18n } from '../../lib/i18n';
import { appStore } from '../../lib/store';

export default function CaseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lang, dir } = useI18n();
  const theme = useTheme();
  const item = modules.flatMap((mod) => mod.cases).find((entry) => entry.id === id);
  const [picked, setPicked] = useState<number | null>(null);
  const t = (key: Parameters<typeof learnText>[1]) => learnText(lang, key);
  if (!item) return <Screen dir={dir}><BackButton /></Screen>;
  return (
    <Screen dir={dir}>
      <BackButton />
      <PageTitle kicker={t('case')} title={pick(item.title, lang)} text={pick(item.context, lang)} />
      <Card>
        <H2>{pick(item.prompt, lang)}</H2>
        {item.options.map((option, index) => (
          <Choice
            key={option.fr}
            label={pick(option, lang)}
            selected={picked === index}
            onPress={() => {
              setPicked(index);
              void haptic(index === item.answer ? 'success' : 'warn');
              appStore.set((state) => ({ study: { ...state.study, ...touchStreak(state.study, Date.now()) } }));
            }}
          />
        ))}
        {picked !== null ? <Body style={{ color: picked === item.answer ? theme.palette.success : theme.palette.noticeText }}>{pick(item.why, lang)}</Body> : null}
      </Card>
      <ProvenanceLine provenance={item.provenance} />
    </Screen>
  );
}
