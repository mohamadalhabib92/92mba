import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { TvBody, TvFocusable, TvScreen, TvTitle } from '../../components/tv/ui';
import { LSS_TRACK, lssBelts } from '../../learn/content/lss';
import { beltIsOpen } from '../../learn/content/resolve';
import { learnText } from '../../learn/copy';
import { pick } from '../../learn/l10n';
import { useI18n } from '../../lib/i18n';
import { appStore } from '../../lib/store';

export default function TvLss() {
  const { lang } = useI18n();
  const study = appStore.useStore().study;
  const t = (key: Parameters<typeof learnText>[1]) => learnText(lang, key);
  return (
    <TvScreen>
      <TvFocusable label={t('leave')} onPress={() => router.back()} />
      <TvTitle>{pick(LSS_TRACK.title, lang)}</TvTitle>
      <TvBody>{pick(LSS_TRACK.summary, lang)}</TvBody>
      <View style={{ gap: 16 }}>
        {lssBelts.map((belt, index) => {
          const open = beltIsOpen(belt.id, study);
          return (
            <TvFocusable
              key={belt.id}
              preferred={index === 0}
              label={pick(belt.title, lang)}
              hint={open ? pick(belt.promise, lang) : t('lssLocked')}
              onPress={open ? () => router.push({ pathname: '/tv/module/[id]', params: { id: belt.id } }) : undefined}
            />
          );
        })}
      </View>
    </TvScreen>
  );
}
