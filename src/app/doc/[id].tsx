import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, ScrollViewInstance, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Highlight } from '../../components/Highlight';
import { ReadingControls } from '../../components/ReadingControls';
import { Badge, Button, EmptyState, Muted, Row, Slider } from '../../components/ui';
import { keepMark, promoteMark } from '../../learn/actions';
import { learnText } from '../../learn/copy';
import { useAppFonts } from '../../lib/fonts';
import { useI18n } from '../../lib/i18n';
import { CATEGORY_LABELS, findDoc, licenseBadgeLabel, licenseStatusCodeOf, normalize, paginate } from '../../lib/library';
import { appStore, setProgress, toggleBookmark } from '../../lib/store';
import { useReaderPage } from './useReaderPage';
import { firstString, sanitizeSearchQuery } from '../../lib/textGuard';
import { useTheme } from '../../components/theme';
import { colors, highlightColors, readingColumnWidth, readingPadding, readerThemes, snapFontScale, snapLineHeight, ReaderTheme, type HighlightName } from '../../theme';
import { frostBar } from '../../theme/glass';
import { useMacArrows, useMacEscape, useMacFind, useStage } from '../../components/mac';

const THEME_ORDER: ReaderTheme[] = ['light', 'sepia', 'dark'];

export default function Reader() {
  const params = useLocalSearchParams<{ id: string; page?: string; q?: string }>();
  const { t, lang } = useI18n();
  const s = appStore.useStore();
  const doc = useMemo(() => findDoc(firstString(params.id) || undefined, s.userDocs), [params.id, s.userDocs]);
  const pages = useMemo(() => (doc ? paginate(doc) : []), [doc]);
  const [dragPage, setDragPage] = useState<number | null>(null);
  const [panel, setPanel] = useState<'none' | 'info' | 'bookmarks' | 'find' | 'display' | 'highlight'>('none');
  const [ink, setInk] = useState<HighlightName>('yellow');
  const [find, setFind] = useState(sanitizeSearchQuery(params.q));
  const scrollRef = useRef<ScrollViewInstance>(null);
  const storageReady = appStore.useStorageReady();
  const { page, go } = useReaderPage({
    docId: doc?.id,
    pageParam: params.page,
    savedPage: doc ? s.progress[doc.id]?.page : undefined,
    pageCount: pages.length,
    storageReady,
    onCommit: (next) => {
      if (doc) setProgress(doc.id, next, pages.length);
    },
  });
  const fonts = useAppFonts();
  const { isMac, wide } = useStage();
  const appTheme = useTheme();
  const { fontScale: systemScale } = useWindowDimensions();
  const theme = readerThemes[s.readerTheme];
  const bar = frostBar(theme.bar, theme.bg, appTheme.glass.solid);
  const readerDark = s.readerTheme === 'dark';
  const edgeTop = appTheme.glass.solid ? theme.muted : readerDark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.82)';
  const edgeBottom = appTheme.glass.solid ? theme.muted : readerDark ? 'rgba(0,0,0,0.5)' : 'rgba(27,42,74,0.18)';
  const rtl = doc?.lang === 'ar';
  const fontScale = snapFontScale(s.fontScale);
  const fontSize = (isMac ? 21 : 18) * fontScale;
  const lineRatio = snapLineHeight(s.lineHeight);
  const family = s.dyslexia && !rtl && fonts.dyslexia
    ? fonts.dyslexia
    : rtl
      ? (fonts.arabic ?? (Platform.OS === 'ios' ? 'Geeza Pro' : 'serif'))
      : (fonts.serif ?? (Platform.OS === 'web' ? 'Georgia, "Iowan Old Style", Palatino, serif' : Platform.OS === 'ios' ? 'Georgia' : 'serif'));
  const letterSpacing = s.dyslexia ? Math.round(fontSize * 0.04 * 10) / 10 : 0;
  const column = readingColumnWidth(fontSize, s.readerMargin);
  const pad = readingPadding(s.readerMargin);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [page, doc?.id]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || isMac || wide) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight') go(rtl ? page - 1 : page + 1);
      if (e.key === 'ArrowLeft') go(rtl ? page + 1 : page - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pages.length, rtl, page, go, isMac, wide]);

  useMacArrows((action) => {
    if (action !== 'left' && action !== 'right') return false;
    go(action === 'left' ? (rtl ? page + 1 : page - 1) : rtl ? page - 1 : page + 1);
    return true;
  });
  useMacFind(() => {
    setPanel('find');
    return true;
  });
  useMacEscape(() => {
    if (panel === 'none') return false;
    setPanel('none');
    return true;
  });

  const findQuery = sanitizeSearchQuery(find);
  const findHits = useMemo(() => {
    const q = normalize(findQuery);
    if (q.length < 2) return [];
    return pages.map((pg, i) => ({ i, n: pg.filter((p) => normalize(p).includes(q)).length })).filter((x) => x.n > 0);
  }, [findQuery, pages]);

  if (!doc) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: appTheme.glass.canvas, justifyContent: 'center' }}>
        <EmptyState
          icon={<Ionicons name="alert-circle-outline" size={40} color={appTheme.palette.muted} />}
          title={t('notFound')}
          text={t('notFoundText')}
          action={<Button label={t('openLibrary')} onPress={() => router.replace('/library')} />}
        />
      </SafeAreaView>
    );
  }

  const marks = s.bookmarks[doc.id] ?? [];
  const passage = (pages[page] ?? []).join('\n\n').slice(0, 500).trim();
  const markId = passage ? `${doc.id}:${page}:${passage.slice(0, 40)}` : '';
  const saved = markId ? s.study.marks.find((mark) => mark.id === markId) : undefined;
  const inkNow = saved?.color ?? ink;
  const paint = (color: HighlightName) => {
    setInk(color);
    if (!passage || !markId) return;
    keepMark({ id: markId, docId: doc.id, page, text: passage, createdAt: saved?.createdAt ?? Date.now(), color });
  };
  const makeCard = () => {
    if (!passage || !markId) return;
    if (!saved) keepMark({ id: markId, docId: doc.id, page, text: passage, createdAt: Date.now(), color: inkNow });
    promoteMark(markId, learnText(lang, 'highlight'), passage, {
      lang: doc.lang,
      docId: doc.id,
      author: doc.author,
      date: doc.license.date || doc.year || 'à vérifier',
      source: doc.title,
      licence: doc.license.label,
      status: doc.license.statusCode ?? doc.license.kind,
    });
  };
  const isMarked = marks.includes(page);
  const shown = dragPage ?? page;
  const pct = Math.round(((page + 1) / pages.length) * 100);
  const iconBtn = (name: keyof typeof Ionicons.glyphMap, label: string, onPress: () => void, active?: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      style={[styles.iconBtn, active && (appTheme.glass.solid ? { borderWidth: 2, borderColor: theme.accent, backgroundColor: theme.bar } : { backgroundColor: theme.accent + '33' })]}
      hitSlop={4}
    >
      <Ionicons name={name} size={20} color={active ? theme.accent : theme.text} />
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={[styles.top, { backgroundColor: bar, borderBottomColor: edgeBottom, borderTopColor: edgeTop }]}>
        {iconBtn('chevron-back', t('back'), () => (router.canGoBack() ? router.back() : router.replace('/')))}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text allowFontScaling maxFontSizeMultiplier={2} numberOfLines={systemScale >= 1.3 ? 3 : 1} style={[styles.title, { color: theme.text }]}>
            {doc.title}
          </Text>
          <Text allowFontScaling maxFontSizeMultiplier={2} style={{ color: theme.muted, fontSize: 12 }}>{t('page', { p: page + 1, n: pages.length })} · {t('percent', { n: pct })}</Text>
        </View>
        {iconBtn(isMarked ? 'bookmark' : 'bookmark-outline', isMarked ? t('removeBookmark') : t('addBookmark'), () => toggleBookmark(doc.id, page), isMarked)}
        {iconBtn('color-wand-outline', learnText(lang, 'highlight'), () => {
          if (!passage) return;
          keepMark({ id: markId, docId: doc.id, page, text: passage, createdAt: Date.now(), color: saved?.color ?? ink });
          setPanel(panel === 'highlight' ? 'none' : 'highlight');
        }, panel === 'highlight')}
        {iconBtn('information-circle-outline', t('info'), () => setPanel(panel === 'info' ? 'none' : 'info'), panel === 'info')}
      </View>
      <View style={[styles.tools, { backgroundColor: bar, borderBottomColor: edgeBottom }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('textSmaller')} accessibilityState={{ disabled: fontScale <= 0.8 }} style={styles.tool} onPress={() => appStore.set({ fontScale: snapFontScale(fontScale - 0.1) })}>
          <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>A-</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={t('textLarger')} accessibilityState={{ disabled: fontScale >= 2 }} style={styles.tool} onPress={() => appStore.set({ fontScale: snapFontScale(fontScale + 0.1) })}>
          <Text style={{ color: theme.text, fontWeight: '700', fontSize: 18 }}>A+</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('readerTheme')}
          style={styles.tool}
          onPress={() => appStore.set({ readerTheme: THEME_ORDER[(THEME_ORDER.indexOf(s.readerTheme) + 1) % 3] })}
        >
          <Ionicons name={s.readerTheme === 'dark' ? 'moon' : s.readerTheme === 'sepia' ? 'cafe-outline' : 'sunny-outline'} size={18} color={theme.text} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={t('findInDoc')} accessibilityState={{ expanded: panel === 'find' }} style={styles.tool} onPress={() => setPanel(panel === 'find' ? 'none' : 'find')}>
          <Ionicons name="search" size={18} color={panel === 'find' ? theme.accent : theme.text} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={t('display')} accessibilityState={{ expanded: panel === 'display' }} style={styles.tool} onPress={() => setPanel(panel === 'display' ? 'none' : 'display')}>
          <Ionicons name="text" size={18} color={panel === 'display' ? theme.accent : theme.text} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={t('bookmarks')} accessibilityState={{ expanded: panel === 'bookmarks' }} style={styles.tool} onPress={() => setPanel(panel === 'bookmarks' ? 'none' : 'bookmarks')}>
          <Ionicons name="list" size={18} color={panel === 'bookmarks' ? theme.accent : theme.text} />
          {marks.length ? <Text style={{ color: theme.muted, fontSize: 11 }}>{marks.length}</Text> : null}
        </Pressable>
      </View>

      {panel !== 'none' ? (
        <View style={[styles.panel, { backgroundColor: bar, borderColor: edgeBottom, borderTopColor: edgeTop }]}>
          {panel === 'info' ? (
            <View style={{ gap: 6 }}>
              <Badge
                label={licenseBadgeLabel(doc.license.kind, lang)}
                tone={doc.license.kind === 'placeholder' ? 'warn' : doc.license.kind === 'public-domain' ? 'ok' : 'info'}
              />
              <Meta k={t('title')} v={doc.title} c={theme.text} />
              <Meta k={t('author')} v={`${doc.author}${doc.year ? ` (${doc.year})` : ''}`} c={theme.text} />
              <Meta k={t('date')} v={doc.license.date || doc.year || t('dateUnknown')} c={theme.text} />
              <Meta k={t('language')} v={doc.lang.toUpperCase()} c={theme.text} />
              <Meta k={t('category')} v={CATEGORY_LABELS[doc.category][lang]} c={theme.text} />
              <Meta k={t('licenseStatus')} v={t(STATUS_KEY[licenseStatusCodeOf(doc)])} c={theme.text} />
              <Meta k={t('license')} v={doc.license.label} c={theme.text} />
              {doc.license.source ? <Meta k={t('source')} v={doc.license.source} c={theme.text} /> : null}
              {doc.addedAt && formatAdded(doc.addedAt, lang) ? <Meta k={t('addedOn')} v={formatAdded(doc.addedAt, lang)} c={theme.text} /> : null}
              {doc.license.url ? (
                <Text style={{ color: theme.link, textDecorationLine: 'underline' }} onPress={() => Linking.openURL(doc.license.url!)}>
                  {doc.license.url}
                </Text>
              ) : null}
              {doc.license.gutenberg === 'stripped' ? <Text style={{ color: theme.muted, lineHeight: 20 }}>{t('gutenbergTodo')}</Text> : null}
              {doc.note ? <Text style={{ color: theme.muted, fontStyle: 'italic' }}>{doc.note}</Text> : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={learnText(lang, 'toCard')}
                onPress={() => {
                  const passage = (pages[page] ?? []).join('\n\n').slice(0, 500).trim();
                  if (!passage) return;
                  const markId = `${doc.id}:${page}:${passage.slice(0, 40)}`;
                  const existing = s.study.marks.find((mark) => mark.id === markId);
                  if (!existing) keepMark({ id: markId, docId: doc.id, page, text: passage, createdAt: Date.now() });
                  promoteMark(markId, learnText(lang, 'highlight'), passage, {
                    lang: doc.lang,
                    docId: doc.id,
                    author: doc.author,
                    date: doc.license.date || doc.year || 'à vérifier',
                    source: doc.title,
                    licence: doc.license.label,
                    status: doc.license.statusCode ?? doc.license.kind,
                  });
                }}
                style={{ minHeight: 44, justifyContent: 'center' }}
              >
                <Text style={{ color: theme.link, fontWeight: '700' }}>{learnText(lang, 'toCard')}</Text>
              </Pressable>
            </View>
          ) : panel === 'highlight' ? (
            <View style={{ gap: 8 }}>
              <Text style={{ color: theme.text, fontWeight: '700' }}>{learnText(lang, 'highlighted')}</Text>
              <Text style={{ color: theme.muted }}>{learnText(lang, 'oneNext')}</Text>
              {passage ? (
                <Text numberOfLines={systemScale >= 1.3 ? undefined : 3} style={{ color: highlightColors[inkNow].text, backgroundColor: highlightColors[inkNow].bg, borderRadius: 8, padding: 8 }}>
                  {passage}
                </Text>
              ) : null}
              <Row style={{ flexWrap: 'wrap' }}>
                {(Object.keys(highlightColors) as HighlightName[]).map((name) => (
                  <Pressable
                    key={name}
                    accessibilityRole="button"
                    accessibilityLabel={learnText(lang, name === 'yellow' ? 'colorYellow' : name === 'green' ? 'colorGreen' : name === 'blue' ? 'colorBlue' : 'colorRose')}
                    accessibilityState={{ selected: inkNow === name }}
                    onPress={() => paint(name)}
                    style={{
                      minWidth: 44,
                      minHeight: 44,
                      borderRadius: 22,
                      backgroundColor: highlightColors[name].bg,
                      borderWidth: inkNow === name ? 3 : 1,
                      borderColor: theme.text,
                    }}
                  />
                ))}
              </Row>
              {saved?.cardId ? (
                <Button label={learnText(lang, 'cardReady')} onPress={() => router.push('/review')} />
              ) : (
                <Button label={learnText(lang, 'toCard')} onPress={makeCard} />
              )}
              <Button variant="ghost" label={learnText(lang, 'highlights')} onPress={() => router.push('/highlights')} />
            </View>
          ) : panel === 'bookmarks' ? (
            marks.length ? (
              <Row style={{ flexWrap: 'wrap' }}>
                {marks.map((m) => (
                  <Pressable accessibilityRole="button" accessibilityLabel={t('page', { p: m + 1, n: pages.length })} key={m} onPress={() => { go(m); setPanel('none'); }} style={[styles.pill, { borderColor: theme.accent, backgroundColor: bar }]}>
                    <Ionicons name="bookmark" size={12} color={theme.accent} />
                    <Text style={{ color: theme.text }}>{t('page', { p: m + 1, n: pages.length })}</Text>
                  </Pressable>
                ))}
              </Row>
            ) : (
              <Text style={{ color: theme.muted }}>{t('noBookmarks')}</Text>
            )
          ) : panel === 'display' ? (
            <ReadingControls color={theme.text} muted={theme.muted} />
          ) : (
            <View style={{ gap: 8 }}>
              <TextInput
                accessibilityLabel={t('findInDoc')}
                allowFontScaling
                maxFontSizeMultiplier={2}
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
                      <Pressable accessibilityRole="button" accessibilityLabel={t('page', { p: h.i + 1, n: pages.length })} key={h.i} onPress={() => go(h.i)} style={[styles.pill, { borderColor: h.i === page ? theme.accent : theme.muted, backgroundColor: bar }]}>
                        <Text style={{ color: theme.text }}>{t('page', { p: h.i + 1, n: pages.length })} ({h.n})</Text>
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

      <ScrollView ref={scrollRef} contentContainerStyle={[styles.pageWrap, { paddingHorizontal: pad }]}>
        <View style={{ width: '100%', maxWidth: column, gap: fontSize * 0.85, direction: rtl ? 'rtl' : 'ltr' }}>
          {page === 0 && doc.license.kind === 'placeholder' ? <Badge label={licenseBadgeLabel('placeholder', lang)} tone="warn" /> : null}
          {pages[page]?.map((para, i) => (
            <Highlight
              key={`${page}-${i}`}
              text={para}
              query={findQuery}
              accessibilityLanguage={doc.lang}
              style={{
                fontSize,
                lineHeight: fontSize * lineRatio,
                letterSpacing,
                color: theme.text,
                fontFamily: family,
                textAlign: rtl ? 'right' : 'left',
                writingDirection: rtl ? 'rtl' : 'ltr',
              }}
            />
          ))}
          {page === pages.length - 1 ? (
            <View style={{ alignItems: 'center', paddingVertical: 24, gap: 6 }}>
              <Ionicons name="checkmark-done-circle" size={36} color={theme.accent} />
              <Text style={{ color: theme.muted }}>{t('finished')}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.bottom, { backgroundColor: bar, borderTopColor: edgeTop }]}>
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
          <Button
            small
            variant="ghost"
            label={t('previous')}
            disabled={page === 0}
            onPress={() => go(page - 1)}
            labelColor={theme.text}
            borderColor={theme.muted}
          />
          <Muted style={{ color: theme.muted }}>{t('page', { p: shown + 1, n: pages.length })}</Muted>
          <Button
            small
            label={t('next')}
            disabled={page >= pages.length - 1}
            onPress={() => go(page + 1)}
            labelColor={s.readerTheme === 'dark' ? colors.primary : colors.onPrimary}
            backgroundColor={s.readerTheme === 'dark' ? colors.accent : colors.primary}
          />
        </Row>
      </View>
    </SafeAreaView>
  );
}

const STATUS_KEY = {
  'needs-review': 'statusNeedsReview',
  'public-domain-claimed': 'statusPublicDomain',
  placeholder: 'statusPlaceholder',
  owned: 'statusOwned',
  open: 'statusOpen',
} as const;

function formatAdded(iso: string, lang: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const locale = lang === 'ar' ? 'ar' : lang === 'en' ? 'en-GB' : 'fr-CH';
  try {
    return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  } catch {
    return '';
  }
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
  top: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 6, borderTopWidth: 1, borderBottomWidth: 2 },
  title: { fontWeight: '700', fontSize: 15 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  tools: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4, paddingBottom: 6, borderBottomWidth: 2 },
  tool: { minWidth: 52, minHeight: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 3, paddingHorizontal: 8 },
  panel: { marginHorizontal: 12, marginBottom: 6, padding: 12, borderRadius: 14, borderWidth: 1, borderTopWidth: 1, borderBottomWidth: 2 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, minHeight: 44 },
  find: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, minHeight: 44, fontSize: 15 },
  pageWrap: { padding: 22, paddingBottom: 40, alignItems: 'center' },
  bottom: { paddingHorizontal: 16, paddingBottom: 12, paddingTop: 8, gap: 2, borderTopWidth: 1 },
});
