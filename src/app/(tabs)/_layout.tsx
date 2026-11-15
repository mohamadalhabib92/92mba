import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';
import React from 'react';
import { useI18n } from '../../lib/i18n';
import { colors } from '../../theme';
import { useTheme } from '../../components/theme';

export default function TabsLayout() {
  const { t } = useI18n();
  const theme = useTheme();
  const icon =
    (name: keyof typeof Ionicons.glyphMap) =>
    ({ color, size }: { color: import('react-native').ColorValue; size: number }) => <Ionicons name={name} color={(color ?? undefined) as string | undefined} size={size} />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.palette.primary,
        tabBarInactiveTintColor: theme.palette.muted,
        tabBarStyle: { backgroundColor: theme.palette.surface, borderTopColor: theme.palette.border },
        tabBarLabelStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabHome'), tabBarIcon: icon('home-outline') }} />
      <Tabs.Screen name="library" options={{ title: t('tabLibrary'), tabBarIcon: icon('library-outline') }} />
      <Tabs.Screen name="search" options={{ title: t('tabSearch'), tabBarIcon: icon('search-outline') }} />
      <Tabs.Screen name="settings" options={{ title: t('tabSettings'), tabBarIcon: icon('settings-outline') }} />
    </Tabs>
  );
}
