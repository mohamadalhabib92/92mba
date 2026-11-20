import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SuspenseFallback as RouteSuspense, ErrorBoundary as RouteErrorBoundary } from '../components/RouteFallback';
import { BootFallback, BootSkeleton } from '../components/ui';
import { FontProvider } from '../lib/fonts';
import { I18nProvider, useI18n } from '../lib/i18n';
import { ThemeProvider, useTheme } from '../components/theme';
import { MacProvider } from '../components/mac';
import { appStore, BOOT_TIMEOUT_MS } from '../lib/store';

export function ErrorBoundary(props: { error: Error; retry: () => void | Promise<void> }) {
  return <RouteErrorBoundary {...props} />;
}

export function SuspenseFallback() {
  return <RouteSuspense />;
}

function StorageWarning() {
  const warning = appStore.useStorageWarning();
  const { t } = useI18n();
  const theme = useTheme();
  if (!warning) return null;
  const message =
    warning === 'delete-failed'
      ? 'resetDeleteFailed'
      : warning === 'copy-failed'
        ? 'storageCopyFailed'
        : warning === 'version-quarantine'
          ? 'storageVersionQuarantine'
          : warning === 'write-failed'
            ? 'storageWriteFailed'
            : 'storageUnreadable';
  return (
    <View style={{ backgroundColor: theme.palette.noticeBg, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: theme.palette.noticeText }}>
      <Text allowFontScaling maxFontSizeMultiplier={2} style={{ color: theme.palette.noticeText, fontSize: 15, lineHeight: 22 }}>{t(message)}</Text>
      {warning === 'write-failed' ? (
        <Text
          accessibilityRole="button"
          onPress={() => appStore.retrySave()}
          style={{ color: theme.palette.noticeText, fontWeight: '700', marginTop: 6, fontSize: 15, minHeight: 44 }}
        >
          {t('retrySave')}
        </Text>
      ) : null}
    </View>
  );
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

  if (hydrated) {
    return (
      <View style={{ flex: 1 }}>
        <StorageWarning />
        <View style={{ flex: 1 }}>{children}</View>
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

function ThemedShell({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.palette.bg }}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} hidden={Platform.isTV} />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.palette.bg } }}
        {...(Platform.isTV ? { initialRouteName: 'tv' as const } : {})}
      >{children}</Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <FontProvider>
        <I18nProvider>
          <ThemeProvider>
            <MacProvider>
              <Gate>
                <ThemedShell>
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="doc/[id]" />
                  <Stack.Screen name="add" options={{ presentation: 'modal' }} />
                </ThemedShell>
              </Gate>
            </MacProvider>
          </ThemeProvider>
        </I18nProvider>
      </FontProvider>
    </SafeAreaProvider>
  );
}
