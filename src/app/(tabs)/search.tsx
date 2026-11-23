import { Ionicons } from '@expo/vector-icons';
import { router, useIsFocused } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Highlight } from '../../components/Highlight';
import { HistoryClearConfirm } from '../../components/HistoryClear';
import { Badge, Card, Chip, EmptyState, H1, H3, Muted, Row, Screen } from '../../components/ui';
import { historyClearIntent, type HistoryClearChoice, type HistoryClearStep } from '../../lib/historyClear';
import { useI18n } from '../../lib/i18n';
import { allDocs, CATEGORY_LABELS, Category, licenseBadgeLabel, searchDocs } from '../../lib/library';
import { appStore, cleanHistory, pushSearchHistory } from '../../lib/store';
import { sanitizeSearchQuery } from '../../lib/textGuard';
import { useDebounced } from '../../lib/useDebounced';
import { LANGS, Lang } from '../../i18n/strings';
import { useTheme } from '../../components/theme';
import { useMacFind } from '../../components/mac';

export default function Search() {
  const { t, lang, dir } = useI18n();
  const theme = useTheme();
  const s = appStore.useStore();
  const [q, setQ] = useState('');
  const [clearStep, setClearStep] = useState<HistoryClearStep>('idle');
  const [docLang, setDocLang] = useState<Lang | 'all'>('all');
  const [cat, setCat] = useState<Category | 'all'>('all');
  const dq = useDebounced(sanitizeSearchQuery(q), 250);
  const docs = useMemo(() => allDocs(s.userDocs), [s.userDocs]);
  const pool = useMemo(
    () => docs.filter((d) => (docLang === 'all' || d.lang === docLang) && (cat === 'all' || d.category === cat)),
    [docs, docLang, cat],
  );
  const hits = useMemo(() => searchDocs(pool, dq), [pool, dq]);
  const focused = useIsFocused();
  const inputRef = useRef<{ focus: () => void } | null>(null);
  useMacFind(() => {
    if (!focused) return false;
    inputRef.current?.focus();
    return true;
  });
  // Plafond d'affichage seulement. pushSearchHistory ne retire pas l'historique déjà stocké.
  const history = cleanHistory(s.searchHistory);

  useEffect(() => {
    if (dq.trim().length < 2) return;
    const id = setTimeout(() => pushSearchHistory(dq), 1200);
    return () => clearTimeout(id);
  }, [dq]);

  const chooseClear = (choice: HistoryClearChoice) => {
    const next = historyClearIntent(clearStep, choice);
    setClearStep(next.step);
    if (next.erase) appStore.set({ searchHistory: [] });
  };

  const open = (id: string, page: number) => {
    pushSearchHistory(q);
    router.push({ pathname: '/doc/[id]', params: { id, page: String(page), q: dq.trim() } });
  };

  return (
    <Screen dir={dir}>
      <H1>{t('tabSearch')}</H1>
      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: theme.glass.surface,
            borderColor: theme.glass.hairline,
            borderTopColor: theme.glass.highlight,
            borderBottomColor: theme.glass.shade,
          },
        ]}
      >
        <Ionicons name="search" size={18} color={theme.palette.muted} />
        <TextInput
          ref={(node) => {
            inputRef.current = node;
          }}
          value={q}
          onChangeText={setQ}
          placeholder={t('searchPlaceholder')}
          placeholderTextColor={theme.palette.muted}
          allowFontScaling
          maxFontSizeMultiplier={2}
          style={[styles.input, { color: theme.palette.text, textAlign: dir === 'rtl' ? 'right' : 'left' }]}
          returnKeyType="search"
          onSubmitEditing={() => pushSearchHistory(q)}
          accessibilityLabel={t('searchPlaceholder')}
          autoCorrect={false}
        />
        {q ? (
          <Pressable accessibilityRole="button" accessibilityLabel={t('clearHistory')} onPress={() => setQ('')} hitSlop={8} style={styles.clear}>
            <Ionicons name="close-circle" size={18} color={theme.palette.muted} />
          </Pressable>
        ) : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        <Chip label={`🌐 ${t('allDocs')}`} active={docLang === 'all'} onPress={() => setDocLang('all')} />
        {LANGS.map((l) => (
          <Chip key={l.code} label={l.label} active={docLang === l.code} onPress={() => setDocLang(l.code)} />
        ))}
        {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
          <Chip key={c} label={CATEGORY_LABELS[c][lang]} active={cat === c} onPress={() => setCat(cat === c ? 'all' : c)} />
        ))}
      </ScrollView>

      {dq.trim().length < 2 ? (
        history.length ? (
          <Card>
            <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <H3>{t('searchHistory')}</H3>
              <HistoryClearConfirm
                confirming={clearStep === 'confirming'}
                prompt={t('clearHistoryPrompt')}
                askLabel={t('clearHistory')}
                cancelLabel={t('cancel')}
                eraseLabel={t('confirmClearHistory')}
                onAsk={() => chooseClear('ask')}
                onCancel={() => chooseClear('cancel')}
                onErase={() => chooseClear('erase')}
              />
            </Row>
            <Row style={{ flexWrap: 'wrap' }}>
              {history.map((h) => (
                <Chip key={h} label={h} onPress={() => setQ(h)} />
              ))}
            </Row>
          </Card>
        ) : (
          <EmptyState icon={<Ionicons name="search-outline" size={40} color={theme.palette.muted} />} title={t('tabSearch')} text={t('searchPlaceholder')} />
        )
      ) : hits.length === 0 ? (
        <EmptyState icon={<Ionicons name="sad-outline" size={40} color={theme.palette.muted} />} title={t('noResults')} text={t('noResultsText')} />
      ) : (
        <>
          <Muted>{t('results', { n: hits.length })}</Muted>
          {hits.map((h) => (
            <Card key={h.doc.id} onPress={() => open(h.doc.id, h.matches[0]?.page ?? 0)}>
              <Highlight text={h.doc.title} query={dq} style={[styles.title, { color: theme.palette.text }]} />
              <Row gap={6}>
                <Badge label={licenseBadgeLabel(h.doc.license.kind, lang)} tone={h.doc.license.kind === 'placeholder' ? 'warn' : 'info'} />
                <Muted>{h.doc.author}</Muted>
              </Row>
              {h.matches.map((m, i) => (
                <Pressable
                  key={i}
                  onPress={() => open(h.doc.id, m.page)}
                  style={[styles.excerpt, { backgroundColor: theme.glass.solid ? theme.palette.bg : theme.glass.surfaceOpaque }]}
                  accessibilityRole="button"
                  accessibilityLabel={`${t('page', { p: m.page + 1, n: '…' })}. ${m.excerpt}`}
                >
                  <Muted>{t('page', { p: m.page + 1, n: '…' })}</Muted>
                  <Highlight text={m.excerpt} query={dq} style={{ color: theme.palette.text, lineHeight: 20, writingDirection: h.doc.lang === 'ar' ? 'rtl' : 'ltr' }} />
                </Pressable>
              ))}
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    borderTopWidth: 1,
    borderBottomWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 10, minHeight: 44 },
  clear: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '700' },
  excerpt: { borderRadius: 10, padding: 10, gap: 4, minHeight: 44 },
});
