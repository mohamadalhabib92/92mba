import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SuspenseFallback as RouteSuspense, ErrorBoundary as RouteErrorBoundary } from '../components/RouteFallback';
import { BootFallback, BootSkeleton } from '../components/ui';
import { FontProvider } from '../lib/fonts';
import { I18nProvider } from '../lib/i18n';
import { appStore, BOOT_TIMEOUT_MS } from '../lib/store';
import { colors } from '../theme';

export function ErrorBoundary(props: { error: Error; retry: () => void | Promise<void> }) {
  return <RouteErrorBoundary {...props} />;
}

export function SuspenseFallback() {
  return <RouteSuspense />;
}

function Gate({ children }: { children: React.ReactNode }) {
  const hydrated = appStore.useHydrated();
  const [attempt, setAttempt] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (hydrated) return;
    setTimedOut(false);
    const id = setTimeout(() => setTimedOut(true), BOOT_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [hydrated, attempt]);

  if (hydrated) return <>{children}</>;
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

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <FontProvider>
        <I18nProvider>
          <Gate>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="doc/[id]" />
              <Stack.Screen name="add" options={{ presentation: 'modal' }} />
            </Stack>
          </Gate>
        </I18nProvider>
      </FontProvider>
    </SafeAreaProvider>
  );
}
