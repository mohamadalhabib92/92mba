import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SuspenseFallback as RouteSuspense, ErrorBoundary as RouteErrorBoundary } from '../components/RouteFallback';
import { FeedbackProvider } from '../components/feedback';
import { Onboarding } from '../components/Onboarding';
import { BootFallback, BootSkeleton } from '../components/ui';
import { FontProvider } from '../lib/fonts';
import { I18nProvider, useI18n } from '../lib/i18n';
import { appStore, BOOT_TIMEOUT_MS } from '../lib/store';
import { useColors, useIsDark } from '../lib/colors';
import { hydrateHaptics } from '../lib/haptics';
import { FocusLayer, useFocus } from '../lib/focusApp';

export function ErrorBoundary(props: { error: Error; retry: () => void | Promise<void> }) {
  return <RouteErrorBoundary {...props} />;
}

export function SuspenseFallback() {
  return <RouteSuspense />;
}

function StorageWarning() {
  const colors = useColors();
  const warning = appStore.useStorageWarning();
  const { t, dir } = useI18n();
  if (!warning) return null;
  const message =
    warning === 'delete-failed' ? 'resetDeleteFailed' : warning === 'copy-failed' ? 'storageCopyFailed' : 'storageUnreadable';
  return (
    <View accessibilityRole="alert" style={{ backgroundColor: colors.noticeBg, paddingHorizontal: 16, paddingVertical: 12, direction: dir }}>
      <Text style={{ color: colors.text, fontSize: 15, lineHeight: 22, writingDirection: dir, textAlign: dir === 'rtl' ? 'right' : 'left' }}>{t(message)}</Text>
    </View>
  );
}

function Gate({ children }: { children: React.ReactNode }) {
  const hydrated = appStore.useHydrated();
  const storageReady = appStore.useStorageReady();
  const { onboarded } = appStore.useStore();
  const [attempt, setAttempt] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

  // Réglage « Vibrations » : clé dédiée, lue une fois (absente ⇒ activé).
  useEffect(() => {
    void hydrateHaptics();
  }, []);

  useEffect(() => {
    if (hydrated) return;
    setTimedOut(false);
    const id = setTimeout(() => setTimedOut(true), BOOT_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [hydrated, attempt]);

  if (hydrated) {
    return (
      <View style={{ flex: 1 }}>
        <StorageWarning />
        <View style={{ flex: 1 }}>{children}</View>
        {storageReady && !onboarded ? <Onboarding /> : null}
      </View>
    );
  }
  if (timedOut) {
    return (
      <BootFallback
        onRetry={() => {
          appStore.retryHydration();
          setAttempt((n) => n + 1);
        }}
        onOffline={() => appStore.continueOffline()}
      />
    );
  }
  return <BootSkeleton />;
}

/** Mode Focus : plein écran (barre d’état masquée) tant qu’une session est active. */
function FocusStatusBar({ dark }: { dark: boolean }) {
  const active = !!useFocus().data.active;
  return <StatusBar style={dark ? 'light' : 'dark'} hidden={active} />;
}

export default function RootLayout() {
  const colors = useColors();
  const dark = useIsDark();
  return (
    <SafeAreaProvider>
      <FontProvider>
        <I18nProvider>
          <FeedbackProvider>
          <Gate>
            <FocusStatusBar dark={dark} />
            <FocusLayer>
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="doc/[id]" />
                <Stack.Screen name="add" options={{ presentation: 'modal' }} />
                <Stack.Screen name="focus" />
              </Stack>
            </FocusLayer>
          </Gate>
          </FeedbackProvider>
        </I18nProvider>
      </FontProvider>
    </SafeAreaProvider>
  );
}
