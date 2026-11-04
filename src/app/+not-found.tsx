import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Button, EmptyState, Screen } from '../components/ui';
import { useI18n } from '../lib/i18n';
import { useColors } from '../lib/colors';

export default function NotFound() {
  const colors = useColors();
  const { t, dir } = useI18n();
  return (
    <Screen dir={dir}>
      <EmptyState
        icon={<Ionicons name="compass-outline" size={44} color={colors.muted} />}
        title={t('notFound')}
        text={t('notFoundText')}
        action={<Button label={t('back')} onPress={() => router.replace('/')} />}
      />
    </Screen>
  );
}
