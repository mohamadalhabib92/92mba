import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { DocCard } from '../../components/DocCard';
import { Body, Button, Card, EmptyState, H1, H2, Muted, ProgressBar, Row, Screen } from '../../components/ui';
import { useI18n } from '../../lib/i18n';
import { allDocs } from '../../lib/library';
import { appStore } from '../../lib/store';
import { colors } from '../../theme';

export default function Home() {
  const { t, dir } = useI18n();
  const s = appStore.useStore();
  const docs = useMemo(() => allDocs(s.userDocs), [s.userDocs]);
  const recent = useMemo(
    () =>
      Object.entries(s.progress)
        .sort((a, b) => b[1].updatedAt - a[1].updatedAt)
        .map(([id, p]) => ({ doc: docs.find((d) => d.id === id), p }))
        .filter((x): x is { doc: NonNullable<typeof x.doc>; p: typeof x.p } => !!x.doc),
    [s.progress, docs],
  );
  const current = recent[0];
  const finished = recent.filter((r) => r.p.page + 1 >= r.p.pages).length;
  const bookmarks = Object.values(s.bookmarks).reduce((n, b) => n + b.length, 0);
  const discover = docs.filter((d) => !s.progress[d.id]).slice(0, 3);

  return (
    <Screen dir={dir}>
      <View style={styles.hero}>
        <Muted style={{ color: colors.accent, fontWeight: '800', letterSpacing: 2 }}>92'MBA</Muted>
        <H1 style={{ color: '#fff' }}>{t('continueReading')}</H1>
        <Body style={{ color: '#D7DCEA' }}>{t('tagline')}</Body>
      </View>

      {current ? (
        <Card onPress={() => router.push({ pathname: '/doc/[id]', params: { id: current.doc.id } })}>
          <Row>
            <Ionicons name="book" size={22} color={colors.accent} />
            <H2 style={{ flex: 1 }} numberOfLines={2}>
              {current.doc.title}
            </H2>
          </Row>
          <Muted>{t('page', { p: current.p.page + 1, n: current.p.pages })}</Muted>
          <ProgressBar value={(current.p.page + 1) / current.p.pages} color={colors.accent} height={8} />
          <Button label={t('continueReading')} onPress={() => router.push({ pathname: '/doc/[id]', params: { id: current.doc.id } })} />
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon={<Ionicons name="bookmarks-outline" size={36} color={colors.muted} />}
            title={t('noProgress')}
            text={t('noProgressText')}
            action={<Button label={t('openLibrary')} onPress={() => router.push('/library')} />}
          />
        </Card>
      )}

      <H2>{t('stats')}</H2>
      <Row gap={10} style={{ alignItems: 'stretch' }}>
        {[
          { n: recent.length, l: t('docsStarted'), i: 'play-circle-outline' as const },
          { n: finished, l: t('docsFinished'), i: 'checkmark-circle-outline' as const },
          { n: bookmarks, l: t('bookmarksCount'), i: 'bookmark-outline' as const },
        ].map((x) => (
          <Card key={x.l} style={{ flex: 1, alignItems: 'center' }}>
            <Ionicons name={x.i} size={20} color={colors.primary} />
            <H2>{x.n}</H2>
            <Muted center>{x.l}</Muted>
          </Card>
        ))}
      </Row>

      {recent.length > 1 ? (
        <>
          <H2>{t('tabLibrary')}</H2>
          {recent.slice(1, 4).map((r) => (
            <DocCard key={r.doc.id} doc={r.doc} progress={r.p} onPress={() => router.push({ pathname: '/doc/[id]', params: { id: r.doc.id } })} />
          ))}
        </>
      ) : null}

      {discover.length ? (
        <>
          <H2>{t('recommended')}</H2>
          {discover.map((d) => (
            <DocCard key={d.id} doc={d} onPress={() => router.push({ pathname: '/doc/[id]', params: { id: d.id } })} />
          ))}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.primary, borderRadius: 22, padding: 22, gap: 8 },
});
