import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';
import React from 'react';
import { useI18n } from '../../lib/i18n';
import { useColors } from '../../lib/colors';
import { haptic } from '../../lib/haptics';
import { useFocus } from '../../lib/focusApp';

export default function TabsLayout() {
  const colors = useColors();
  const { t } = useI18n();
  // Mode Focus : pas de barre d’onglets pendant la session (on reste dans l’écran Focus ou dans le contenu).
  const focusActive = !!useFocus().data.active;
  const icon =
    (name: keyof typeof Ionicons.glyphMap) =>
    ({ color, size }: { color: import('react-native').ColorValue; size: number }) => <Ionicons name={name} color={(color ?? undefined) as string | undefined} size={size} />;
  return (
    <Tabs
      screenListeners={{ tabPress: () => haptic.select() }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontWeight: '600' },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, elevation: 0, shadowOpacity: 0, ...(focusActive ? { display: 'none' as const } : null) },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabHome'), tabBarIcon: icon('home-outline') }} />
      <Tabs.Screen name="library" options={{ title: t('tabLibrary'), tabBarIcon: icon('library-outline') }} />
      <Tabs.Screen name="search" options={{ title: t('tabSearch'), tabBarIcon: icon('search-outline') }} />
      <Tabs.Screen name="settings" options={{ title: t('tabSettings'), tabBarIcon: icon('settings-outline') }} />
    </Tabs>
  );
}
