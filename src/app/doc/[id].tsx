import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, ScrollViewInstance, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Highlight } from '../../components/Highlight';
import { Badge, Button, EmptyState, Muted, Row, Slider } from '../../components/ui';
import { useI18n } from '../../lib/i18n';
import { CATEGORY_LABELS, findDoc, LICENSE_BADGE, normalize, paginate } from '../../lib/library';
import { appStore, setProgress, toggleBookmark } from '../../lib/store';
import { colors, readerThemes, ReaderTheme } from '../../theme';

const THEME_ORDER: ReaderTheme[] = ['light', 'sepia', 'dark'];

export default function Reader() {
  const params = useLocalSearchParams<{ id: string; page?: string; q?: string }>();
  const { t, lang } = useI18n();
  const s = appStore.useStore();
  const doc = useMemo(() => findDoc(params.id, s.userDocs), [params.id, s.userDocs]);
  const pages = useMemo(() => (doc ? paginate(doc) : []), [doc]);
  const initial = (() => {
    const fromParam = params.page !== undefined ? Number(params.page) : NaN;
    if (Number.isFinite(fromParam)) return fromParam;
    return doc ? (s.progress[doc.id]?.page ?? 0) : 0;
  })();
  const [page, setPage] = useState(Math.max(0, Math.min(initial, Math.max(0, pages.length - 1))));
  const [dragPage, setDragPage] = useState<number | null>(null);
  const [panel, setPanel] = useState<'none' | 'info' | 'bookmarks' | 'find'>('none');
  const [find, setFind] = useState(typeof params.q === 'string' && params.q !== 'undefined' ? params.q : '');
  const scrollRef = useRef<ScrollViewInstance>(null);
  const theme = readerThemes[s.readerTheme];
  const rtl = doc?.lang === 'ar';

  useEffect(() => {
    if (!doc) return;
    setProgress(doc.id, page, pages.length);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [doc, page, pages.length]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight') setPage((p) => (rtl ? Math.max(0, p - 1) : Math.min(pages.length - 1, p + 1)));
      if (e.key === 'ArrowLeft') setPage((p) => (rtl ? Math.min(pages.length - 1, p + 1) : Math.max(0, p - 1)));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pages.length, rtl]);

  const findHits = useMemo(() => {
    const q = normalize(find.trim());
    if (q.length < 2) return [];
    return pages.map((pg, i) => ({ i, n: pg.filter((p) => normalize(p).includes(q)).length })).filter((x) => x.n > 0);
  }, [find, pages]);

  if (!doc) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}>
        <EmptyState
          icon={<Ionicons name="alert-circle-outline" size={40} color={colors.muted} />}
          title={t('notFound')}
          text={t('notFoundText')}
          action={<Button label={t('openLibrary')} onPress={() => router.replace('/library')} />}
        />
      </SafeAreaView>
    );
  }

  const marks = s.bookmarks[doc.id] ?? [];
  const isMarked = marks.includes(page);
  const shown = dragPage ?? page;
  const pct = Math.round(((page + 1) / pages.length) * 100);
  const fontSize = 18 * s.fontScale;
  const go = (p: number) => setPage(Math.max(0, Math.min(pages.length - 1, p)));
  const iconBtn = (name: keyof typeof Ionicons.glyphMap, label: string, onPress: () => void, active?: boolean) => (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.iconBtn, active && { backgroundColor: colors.accent + '33' }]} hitSlop={4}>
      <Ionicons name={name} size={20} color={active ? colors.accent : theme.text} />
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={[styles.top, { backgroundColor: theme.bar }]}>
        {iconBtn('chevron-back', t('back'), () => (router.canGoBack() ? router.back() : router.replace('/')))}
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>
            {doc.title}
          </Text>
          <Text style={{ color: theme.muted, fontSize: 12 }}>{t('page', { p: page + 1, n: pages.length })} · {t('percent', { n: pct })}</Text>
        </View>
        {iconBtn(isMarked ? 'bookmark' : 'bookmark-outline', isMarked ? t('removeBookmark') : t('addBookmark'), () => toggleBookmark(doc.id, page), isMarked)}
        {iconBtn('information-circle-outline', t('info'), () => setPanel(panel === 'info' ? 'none' : 'info'), panel === 'info')}
      </View>
      <View style={[styles.tools, { backgroundColor: theme.bar }]}>
        <Pressable accessibilityLabel={t('textSmaller')} style={styles.tool} onPress={() => appStore.set({ fontScale: Math.max(0.8, +(s.fontScale - 0.1).toFixed(2)) })}>
          <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>A-</Text>
        </Pressable>
        <Pressable accessibilityLabel={t('textLarger')} style={styles.tool} onPress={() => appStore.set({ fontScale: Math.min(1.8, +(s.fontScale + 0.1).toFixed(2)) })}>
          <Text style={{ color: theme.text, fontWeight: '700', fontSize: 18 }}>A+</Text>
        </Pressable>
        <Pressable
          accessibilityLabel={t('readerTheme')}
          style={styles.tool}
          onPress={() => appStore.set({ readerTheme: THEME_ORDER[(THEME_ORDER.indexOf(s.readerTheme) + 1) % 3] })}
        >
          <Ionicons name={s.readerTheme === 'dark' ? 'moon' : s.readerTheme === 'sepia' ? 'cafe-outline' : 'sunny-outline'} size={18} color={theme.text} />
        </Pressable>
        <Pressable accessibilityLabel={t('findInDoc')} style={styles.tool} onPress={() => setPanel(panel === 'find' ? 'none' : 'find')}>
          <Ionicons name="search" size={18} color={panel === 'find' ? colors.accent : theme.text} />
        </Pressable>
        <Pressable accessibilityLabel={t('bookmarks')} style={styles.tool} onPress={() => setPanel(panel === 'bookmarks' ? 'none' : 'bookmarks')}>
          <Ionicons name="list" size={18} color={panel === 'bookmarks' ? colors.accent : theme.text} />
          {marks.length ? <Text style={{ color: theme.muted, fontSize: 11 }}>{marks.length}</Text> : null}
        </Pressable>
      </View>

      {panel !== 'none' ? (
        <View style={[styles.panel, { backgroundColor: theme.bar, borderColor: theme.muted + '44' }]}>
          {panel === 'info' ? (
            <View style={{ gap: 6 }}>
              <Badge label={LICENSE_BADGE[doc.license.kind][lang]} tone={doc.license.kind === 'placeholder' ? 'warn' : doc.license.kind === 'public-domain' ? 'ok' : 'info'} />
              <Meta k={t('title')} v={doc.title} c={theme.text} />
              <Meta k={t('author')} v={`${doc.author}${doc.year ? ` (${doc.year})` : ''}`} c={theme.text} />
              <Meta k={t('language')} v={doc.lang.toUpperCase()} c={theme.text} />
              <Meta k={t('category')} v={CATEGORY_LABELS[doc.category][lang]} c={theme.text} />
              <Meta k={t('license')} v={doc.license.label} c={theme.text} />
              {doc.license.source ? <Meta k={t('source')} v={doc.license.source} c={theme.text} /> : null}
              {doc.license.url ? (
                <Text style={{ color: colors.accent, textDecorationLine: 'underline' }} onPress={() => Linking.openURL(doc.license.url!)}>
                  {doc.license.url}
                </Text>
              ) : null}
              {doc.note ? <Text style={{ color: theme.muted, fontStyle: 'italic' }}>{doc.note}</Text> : null}
            </View>
          ) : panel === 'bookmarks' ? (
            marks.length ? (
              <Row style={{ flexWrap: 'wrap' }}>
                {marks.map((m) => (
                  <Pressable key={m} onPress={() => { go(m); setPanel('none'); }} style={[styles.pill, { borderColor: colors.accent }]}>
                    <Ionicons name="bookmark" size={12} color={colors.accent} />
                    <Text style={{ color: theme.text }}>{t('page', { p: m + 1, n: pages.length })}</Text>
                  </Pressable>
                ))}
              </Row>
            ) : (
              <Text style={{ color: theme.muted }}>{t('noBookmarks')}</Text>
            )
          ) : (
            <View style={{ gap: 8 }}>
              <TextInput
                value={find}
                onChangeText={setFind}
                placeholder={t('findInDoc')}
                placeholderTextColor={theme.muted}
                autoFocus
                style={[styles.find, { color: theme.text, borderColor: theme.muted + '66', textAlign: rtl ? 'right' : 'left' }]}
              />
              {find.trim().length >= 2 ? (
                findHits.length ? (
                  <Row style={{ flexWrap: 'wrap' }}>
                    {findHits.map((h) => (
                      <Pressable key={h.i} onPress={() => go(h.i)} style={[styles.pill, { borderColor: h.i === page ? colors.accent : theme.muted + '66' }]}>
                        <Text style={{ color: theme.text }}>
                          p.{h.i + 1} ({h.n})
                        </Text>
                      </Pressable>
                    ))}
                  </Row>
                ) : (
                  <Text style={{ color: theme.muted }}>{t('noResults')}</Text>
                )
              ) : null}
            </View>
          )}
        </View>
      ) : null}

      <ScrollView ref={scrollRef} contentContainerStyle={styles.pageWrap}>
        <View style={{ width: '100%', maxWidth: 680, gap: fontSize * 0.9, direction: rtl ? 'rtl' : 'ltr' }}>
          {page === 0 && doc.license.kind === 'placeholder' ? <Badge label={LICENSE_BADGE.placeholder[lang]} tone="warn" /> : null}
          {pages[page]?.map((para, i) => (
            <Highlight
              key={`${page}-${i}`}
              text={para}
              query={find}
              style={{
                fontSize,
                lineHeight: fontSize * (rtl ? 1.8 : 1.6),
                color: theme.text,
                fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, "Times New Roman", serif' }),
                textAlign: rtl ? 'right' : 'left',
                writingDirection: rtl ? 'rtl' : 'ltr',
              }}
            />
          ))}
          {page === pages.length - 1 ? (
            <View style={{ alignItems: 'center', paddingVertical: 24, gap: 6 }}>
              <Ionicons name="checkmark-done-circle" size={36} color={colors.accent} />
              <Text style={{ color: theme.muted }}>{t('finished')}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.bottom, { backgroundColor: theme.bar }]}>
        <Slider
          value={shown}
          min={0}
          max={Math.max(1, pages.length - 1)}
          step={1}
          rtl={rtl}
          accessibilityLabel={t('goToPage')}
          onChange={(v) => setDragPage(Math.round(v))}
          onComplete={(v) => {
            setDragPage(null);
            go(Math.round(v));
          }}
        />
        <Row style={{ justifyContent: 'space-between' }}>
          <Button small variant="ghost" label={t('previous')} disabled={page === 0} onPress={() => go(page - 1)} />
          <Muted style={{ color: theme.muted }}>{t('page', { p: shown + 1, n: pages.length })}</Muted>
          <Button small label={t('next')} disabled={page >= pages.length - 1} onPress={() => go(page + 1)} />
        </Row>
      </View>
    </SafeAreaView>
  );
}

function Meta({ k, v, c }: { k: string; v: string; c: string }) {
  return (
    <Text style={{ color: c, lineHeight: 20 }}>
      <Text style={{ fontWeight: '700' }}>{k} : </Text>
      {v}
    </Text>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 6 },
  title: { fontWeight: '700', fontSize: 15 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  tools: { flexDirection: 'row', justifyContent: 'center', gap: 4, paddingBottom: 6 },
  tool: { minWidth: 52, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 3 },
  panel: { marginHorizontal: 12, marginBottom: 6, padding: 12, borderRadius: 14, borderWidth: 1 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, minHeight: 36 },
  find: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, minHeight: 44, fontSize: 15 },
  pageWrap: { padding: 22, paddingBottom: 40, alignItems: 'center' },
  bottom: { paddingHorizontal: 16, paddingBottom: 12, paddingTop: 2, gap: 2 },
});
