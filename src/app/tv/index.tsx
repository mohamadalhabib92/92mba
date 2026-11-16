import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { TvBody, TvFocusable, TvHint, TvScreen, TvTitle } from '../../components/tv/ui';
import { modules, PATH_92 } from '../../learn/content/catalog';
import { learnText } from '../../learn/copy';
import { pick } from '../../learn/l10n';
import { nextLessonId, reviewIds } from '../../learn/study';
import { useI18n } from '../../lib/i18n';
import { allDocs } from '../../lib/library';
import { appStore } from '../../lib/store';

export default function TvHome() {
  const { lang } = useI18n();
  const state = appStore.useStore();
  const t = (key: Parameters<typeof learnText>[1], vars?: Record<string, string | number>) => learnText(lang, key, vars);
  const due = reviewIds(modules, state.study, Date.now()).length;
  const docs = allDocs(state.userDocs);
  const recent = Object.entries(state.progress).sort((a, b) => b[1].updatedAt - a[1].updatedAt)[0];
  const recentDoc = recent ? docs.find((doc) => doc.id === recent[0]) : undefined;
  const firstLesson = nextLessonId(modules[0], state.study);
  return (
    <TvScreen>
      <TvHint>92'MBA</TvHint>
      <TvTitle>{t('studyTitle')}</TvTitle>
      <TvBody>{t('studyLead')}</TvBody>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 22 }}>
        {recentDoc ? (
          <View style={{ width: '31%', minWidth: 360 }}>
            <TvFocusable
              preferred
              label={recentDoc.title}
              hint={t('continueLesson')}
              onPress={() => router.push({ pathname: '/tv/reader/[id]', params: { id: recentDoc.id } })}
            />
          </View>
        ) : null}
        <View style={{ width: '31%', minWidth: 360 }}>
          <TvFocusable
            preferred={!recentDoc}
            label={t('reviewNow')}
            hint={due ? t('dueSome', { n: Math.min(due, 10) }) : t('dueNone')}
            onPress={() => router.push('/tv/review')}
          />
        </View>
        {firstLesson ? (
          <View style={{ width: '31%', minWidth: 360 }}>
            <TvFocusable label={t('pathCta')} hint={PATH_92.days ? `${PATH_92.days}` : undefined} onPress={() => router.push({ pathname: '/tv/lesson/[id]', params: { id: firstLesson } })} />
          </View>
        ) : null}
      </View>
      <TvBody>{t('browseModules')}</TvBody>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 22 }}>
        {modules.map((mod) => (
          <View key={mod.id} style={{ width: '31%', minWidth: 360 }}>
            <TvFocusable
              label={pick(mod.title, lang)}
              hint={pick(mod.promise, lang)}
              onPress={() => router.push({ pathname: '/tv/module/[id]', params: { id: mod.id } })}
            />
          </View>
        ))}
      </View>
    </TvScreen>
  );
}
