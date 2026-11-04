import React, { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { dictionaries, type Lang } from '../i18n/strings';
import { reportCrash } from '../lib/features';
import { appStore } from '../lib/store';
import { space } from '../theme';
import { BootSkeleton } from './ui';
import { useColors } from '../lib/colors';

function langOf(): Lang {
  try {
    const lang = appStore.get().lang;
    if (lang === 'en' || lang === 'ar' || lang === 'fr') return lang;
  } catch {
    // Le store ne doit jamais empêcher l'écran de repli.
  }
  return 'fr';
}

/** Signature attendue par expo-router : pas de pile, pas de message technique en production. */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void | Promise<void> }) {
  const colors = useColors();
  const lang = langOf();
  const copy = dictionaries[lang];
  useEffect(() => {
    reportCrash(error, 'route');
  }, [error]);
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: space.xl, justifyContent: 'center' }}>
      <View style={{ width: '100%', maxWidth: 520, alignSelf: 'center', gap: space.md }}>
        <Text accessibilityRole="header" style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>
          {copy.errorTitle}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 16, lineHeight: 24 }}>{copy.errorText}</Text>
        {typeof __DEV__ !== 'undefined' && __DEV__ ? (
          <Text style={{ color: colors.muted, fontSize: 13 }}>{error?.message}</Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.bootRetry}
          onPress={() => {
            void retry();
          }}
          style={{ minHeight: 48, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: colors.onPrimary, fontWeight: '700' }}>{copy.bootRetry}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function SuspenseFallback() {
  return <BootSkeleton />;
}
