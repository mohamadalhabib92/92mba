import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { TvBody, TvFocusable, TvHint, TvScreen, TvTitle } from '../../../components/tv/ui';
import { useI18n } from '../../../lib/i18n';
import { findDoc, paginate } from '../../../lib/library';
import { appStore, setProgress, toggleBookmark } from '../../../lib/store';
import { learnText } from '../../../learn/copy';

export default function TvReader() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lang } = useI18n();
  const state = appStore.useStore();
  const doc = useMemo(() => findDoc(id, state.userDocs), [id, state.userDocs]);
  const pages = useMemo(() => (doc ? paginate(doc) : []), [doc]);
  const saved = doc ? state.progress[doc.id]?.page ?? 0 : 0;
  const [page, setPage] = useState(Math.min(saved, Math.max(0, pages.length - 1)));
  const t = (key: Parameters<typeof learnText>[1]) => learnText(lang, key);
  if (!doc) {
    return (
      <TvScreen>
        <TvFocusable preferred label={t('leave')} onPress={() => router.back()} />
      </TvScreen>
    );
  }
  const go = (next: number) => {
    const clamped = Math.max(0, Math.min(pages.length - 1, next));
    setPage(clamped);
    setProgress(doc.id, clamped, pages.length);
  };
  const marked = (state.bookmarks[doc.id] ?? []).includes(page);
  return (
    <TvScreen>
      <TvHint>{doc.author}</TvHint>
      <TvTitle>{doc.title}</TvTitle>
      <TvHint>{`${page + 1} / ${pages.length}`}</TvHint>
      <View style={{ gap: 18, maxWidth: 1400 }}>
        {(pages[page] ?? []).map((paragraph) => (
          <TvBody key={paragraph.slice(0, 24)}>{paragraph}</TvBody>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 22 }}>
        <View style={{ flex: 1 }}>
          <TvFocusable label={t('leave')} onPress={() => router.back()} />
        </View>
        <View style={{ flex: 1 }}>
          <TvFocusable label={lang === 'ar' ? 'السابق' : lang === 'en' ? 'Previous' : 'Précédent'} onPress={() => go(page - 1)} />
        </View>
        <View style={{ flex: 1 }}>
          <TvFocusable preferred label={lang === 'ar' ? 'التالي' : lang === 'en' ? 'Next' : 'Suivant'} onPress={() => go(page + 1)} />
        </View>
        <View style={{ flex: 1 }}>
          <TvFocusable
            label={marked ? (lang === 'ar' ? 'إزالة العلامة' : lang === 'en' ? 'Remove bookmark' : 'Retirer le signet') : lang === 'ar' ? 'علامة' : lang === 'en' ? 'Bookmark' : 'Signet'}
            onPress={() => toggleBookmark(doc.id, page)}
          />
        </View>
      </View>
    </TvScreen>
  );
}
