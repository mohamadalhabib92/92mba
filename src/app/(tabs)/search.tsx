import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Highlight } from '../../components/Highlight';
import { Badge, Card, Chip, EmptyState, H1, H3, Muted, Row, Screen } from '../../components/ui';
import { useI18n } from '../../lib/i18n';
import { allDocs, CATEGORY_LABELS, Category, LICENSE_BADGE, searchDocs } from '../../lib/library';
import { appStore, cleanHistory, pushSearchHistory } from '../../lib/store';
import { useDebounced } from '../../lib/useDebounced';
import { LANGS, Lang } from '../../i18n/strings';
import { colors } from '../../theme';

export default function Search() {
  const { t, lang, dir } = useI18n();
  const s = appStore.useStore();
  const [q, setQ] = useState('');
  const [docLang, setDocLang] = useState<Lang | 'all'>('all');
  const [cat, setCat] = useState<Category | 'all'>('all');
  const dq = useDebounced(q, 250);
  const docs = useMemo(() => allDocs(s.userDocs), [s.userDocs]);
  const pool = useMemo(
    () => docs.filter((d) => (docLang === 'all' || d.lang === docLang) && (cat === 'all' || d.category === cat)),
    [docs, docLang, cat],
  );
  const hits = useMemo(() => searchDocs(pool, dq), [pool, dq]);
  const history = cleanHistory(s.searchHistory);

  useEffect(() => {
    if (dq.trim().length < 2) return;
    const id = setTimeout(() => pushSearchHistory(dq), 1200);
    return () => clearTimeout(id);
  }, [dq]);

  const open = (id: string, page: number) => {
    pushSearchHistory(q);
    router.push({ pathname: '/doc/[id]', params: { id, page: String(page), q: dq.trim() } });
  };

  return (
    <Screen dir={dir}>
      <H1>{t('tabSearch')}</H1>
      <View style={styles.inputWrap}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder={t('searchPlaceholder')}
          placeholderTextColor={colors.muted}
          style={[styles.input, { textAlign: dir === 'rtl' ? 'right' : 'left' }]}
          returnKeyType="search"
          onSubmitEditing={() => pushSearchHistory(q)}
          accessibilityLabel={t('searchPlaceholder')}
          autoCorrect={false}
        />
        {q ? (
          <Pressable accessibilityLabel={t('clearHistory')} onPress={() => setQ('')} hitSlop={12}>
            <Ionicons name="close-circle" size={18} color={colors.muted} />
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
            <Row style={{ justifyContent: 'space-between' }}>
              <H3>{t('searchHistory')}</H3>
              <Pressable accessibilityRole="button" onPress={() => appStore.set({ searchHistory: [] })} hitSlop={10}>
                <Muted style={{ color: colors.primary, fontWeight: '700' }}>{t('clearHistory')}</Muted>
              </Pressable>
            </Row>
            <Row style={{ flexWrap: 'wrap' }}>
              {history.map((h) => (
                <Chip key={h} label={h} onPress={() => setQ(h)} />
              ))}
            </Row>
          </Card>
        ) : (
          <EmptyState icon={<Ionicons name="search-outline" size={40} color={colors.muted} />} title={t('tabSearch')} text={t('searchPlaceholder')} />
        )
      ) : hits.length === 0 ? (
        <EmptyState icon={<Ionicons name="sad-outline" size={40} color={colors.muted} />} title={t('noResults')} text={t('noResultsText')} />
      ) : (
        <>
          <Muted>{t('results', { n: hits.length })}</Muted>
          {hits.map((h) => (
            <Card key={h.doc.id} onPress={() => open(h.doc.id, h.matches[0]?.page ?? 0)}>
              <Highlight text={h.doc.title} query={dq} style={styles.title} />
              <Row gap={6}>
                <Badge label={LICENSE_BADGE[h.doc.license.kind][lang]} tone={h.doc.license.kind === 'placeholder' ? 'warn' : 'info'} />
                <Muted>{h.doc.author}</Muted>
              </Row>
              {h.matches.map((m, i) => (
                <Pressable key={i} onPress={() => open(h.doc.id, m.page)} style={styles.excerpt} accessibilityRole="button">
                  <Muted>{t('page', { p: m.page + 1, n: '…' })}</Muted>
                  <Highlight text={m.excerpt} query={dq} style={{ color: colors.text, lineHeight: 20, writingDirection: h.doc.lang === 'ar' ? 'rtl' : 'ltr' }} />
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
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  input: { flex: 1, fontSize: 16, color: colors.text, paddingVertical: 10 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  excerpt: { backgroundColor: colors.bg, borderRadius: 10, padding: 10, gap: 4 },
});
