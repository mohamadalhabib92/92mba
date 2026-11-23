import React, { useMemo, useState } from 'react';
import { BackButton, PageTitle, ProvenanceLine } from '../components/learnChrome';
import { Body, Card, H3, Screen } from '../components/ui';
import { TextInput } from 'react-native';
import { glossary } from '../learn/content/catalog';
import { learnText } from '../learn/copy';
import { pick } from '../learn/l10n';
import { useI18n } from '../lib/i18n';
import { useTheme } from '../components/theme';

export default function GlossaryScreen() {
  const { lang, dir } = useI18n();
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const t = (key: Parameters<typeof learnText>[1]) => learnText(lang, key);
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return glossary;
    return glossary.filter((entry) => `${entry.term.fr} ${entry.term.en} ${entry.term.ar} ${entry.definition.fr}`.toLowerCase().includes(q));
  }, [query]);
  return (
    <Screen dir={dir}>
      <BackButton />
      <PageTitle title={t('glossary')} />
      <TextInput
        accessibilityLabel={t('searchGlossary')}
        value={query}
        onChangeText={setQuery}
        placeholder={t('searchGlossary')}
        placeholderTextColor={theme.palette.muted}
        allowFontScaling
        maxFontSizeMultiplier={2}
        style={{
          minHeight: 48,
          borderTopWidth: 1,
          borderBottomWidth: 2,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderTopColor: theme.glass.highlight,
          borderBottomColor: theme.glass.shade,
          borderLeftColor: theme.glass.hairline,
          borderRightColor: theme.glass.hairline,
          borderRadius: 14,
          paddingHorizontal: 14,
          color: theme.palette.text,
          backgroundColor: theme.glass.surface,
          textAlign: dir === 'rtl' ? 'right' : 'left',
        }}
      />
      {rows.map((entry) => (
        <Card key={entry.id}>
          <H3>{pick(entry.term, lang)}</H3>
          <Body>{pick(entry.definition, lang)}</Body>
          <ProvenanceLine provenance={entry.provenance} />
        </Card>
      ))}
    </Screen>
  );
}
