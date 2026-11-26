import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { BackButton, PageTitle, ProvenanceLine } from '../components/learnChrome';
import { Body, Card, H3, Screen } from '../components/ui';
import { formulas } from '../learn/content/catalog';
import { lssFormulas } from '../learn/content/lss';
import { learnText } from '../learn/copy';
import { pick } from '../learn/l10n';
import { useI18n } from '../lib/i18n';

export default function FormulasScreen() {
  const { module } = useLocalSearchParams<{ module?: string }>();
  const { lang, dir } = useI18n();
  const t = (key: Parameters<typeof learnText>[1]) => learnText(lang, key);
  const rows = [...formulas, ...lssFormulas].filter((item) => !module || item.moduleId === module);
  return (
    <Screen dir={dir}>
      <BackButton />
      <PageTitle title={t('formulas')} />
      {rows.map((item) => (
        <Card key={item.id}>
          <H3>{pick(item.name, lang)}</H3>
          <Body>{item.expression}</Body>
          <Body>{pick(item.meaning, lang)}</Body>
          <ProvenanceLine provenance={item.provenance} />
        </Card>
      ))}
    </Screen>
  );
}
