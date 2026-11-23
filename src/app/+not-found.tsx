import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Button, EmptyState, Screen } from '../components/ui';
import { useI18n } from '../lib/i18n';
import { useTheme } from '../components/theme';

export default function NotFound() {
  const { t, dir } = useI18n();
  const theme = useTheme();
  return (
    <Screen dir={dir}>
      <EmptyState
        icon={<Ionicons name="compass-outline" size={44} color={theme.palette.muted} />}
        title={t('notFound')}
        text={t('notFoundText')}
        action={<Button label={t('back')} onPress={() => router.replace('/')} />}
      />
    </Screen>
  );
}
