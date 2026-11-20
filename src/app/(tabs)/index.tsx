import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { DocCard } from '../../components/DocCard';
import { Body, Button, Card, EmptyState, H1, H2, Muted, ProgressBar, Row, Screen } from '../../components/ui';
import { useStage } from '../../components/mac';
import { modules, PATH_92 } from '../../learn/content/catalog';
import { learnText } from '../../learn/copy';
import { pick } from '../../learn/l10n';
import { expectedModule, levelFor, nextLessonId, pathDayIndex, reminderDue, REVIEW_SESSION, reviewIds, weakAreas } from '../../learn/study';
import { useI18n } from '../../lib/i18n';
import { allDocs } from '../../lib/library';
import { appStore } from '../../lib/store';
import { useTheme } from '../../components/theme';
import { colors } from '../../theme';

export default function Home() {
  const { t, dir, lang } = useI18n();
  const theme = useTheme();
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
  const tLearn = (key: Parameters<typeof learnText>[1], vars?: Record<string, string | number>) => learnText(lang, key, vars);
  const { wide } = useStage();
  const due = reviewIds(modules, s.study, Date.now()).length;
  const resumeLesson = s.study.resume?.kind === 'lesson' ? s.study.resume.id : null;
  const pathModule = s.study.pathStartedAt ? expectedModule(PATH_92, s.study.pathStartedAt, Date.now()) : null;
  const weak = weakAreas(modules, s.study, Date.now(), s.study.pathId === PATH_92.id ? PATH_92 : null)[0];
  const weakModule = modules.find((mod) => mod.id === weak?.moduleId);
  const pathMod = pathModule ? modules.find((mod) => mod.id === pathModule) : undefined;
  const openLesson = resumeLesson ?? (pathMod ? nextLessonId(pathMod, s.study) : null);

  const studyColumn = (
    <>
      <View style={[styles.hero, theme.glass.solid && styles.heroSolid]}>
        <Muted style={{ color: colors.accent, fontWeight: '800', letterSpacing: dir === 'rtl' ? 0 : 2 }}>92'MBA</Muted>
        <H1 style={{ color: '#fff' }}>{t('continueReading')}</H1>
        <Body style={{ color: '#D7DCEA' }}>{t('tagline')}</Body>
      </View>

      <Card>
        <Muted style={{ fontWeight: '800', letterSpacing: 1 }}>{tLearn('studyKicker')}</Muted>
        <H2>{tLearn('studyTitle')}</H2>
        <Body>{tLearn('studyLead')}</Body>
        <Row style={{ flexWrap: 'wrap' }}>
          <Muted>{tLearn('level', { n: levelFor(s.study.xp) })}</Muted>
          <Muted>{tLearn('streak', { n: s.study.streak })}</Muted>
          <Muted>{tLearn('freeze', { n: s.study.freezes })}</Muted>
        </Row>
        {s.study.pathStartedAt ? <Muted>{tLearn('dayOf', { d: pathDayIndex(s.study.pathStartedAt, Date.now(), PATH_92.days), n: PATH_92.days })}</Muted> : null}
        {reminderDue(s.study, Date.now()) ? <Body>{tLearn('reminder')}</Body> : null}
        <Button label={due ? tLearn('dueSome', { n: Math.min(due, REVIEW_SESSION) }) : tLearn('reviewNow')} onPress={() => router.push('/review')} />
        {openLesson ? <Button variant="secondary" label={tLearn('continueLesson')} onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: openLesson } })} /> : null}
        <Button variant="ghost" label={tLearn('browseModules')} onPress={() => router.push('/curriculum')} />
        <Button variant="ghost" label={tLearn('pathCta')} onPress={() => router.push('/path')} />
        {!s.study.onboarded ? <Button variant="ghost" label={tLearn('onboardCta')} onPress={() => router.push('/onboarding')} /> : null}
      </Card>
      {weakModule ? (
        <Card onPress={() => router.push({ pathname: '/module/[id]', params: { id: weakModule.id } })}>
          <H2>{tLearn('weak')}</H2>
          <Body>{pick(weakModule.title, lang)}</Body>
        </Card>
      ) : null}
    </>
  );

  const readingColumn = (
    <>
      {current ? (
        <Card
          accessibilityLabel={`${current.doc.title}. ${t('continueReading')}`}
          onPress={() => router.push({ pathname: '/doc/[id]', params: { id: current.doc.id } })}
        >
          <Row>
            <Ionicons name="book" size={22} color={theme.palette.primary} />
            <H2 style={{ flex: 1 }} numberOfLines={2}>
              {current.doc.title}
            </H2>
          </Row>
          <Muted>{t('page', { p: current.p.page + 1, n: current.p.pages })}</Muted>
          <ProgressBar value={(current.p.page + 1) / Math.max(1, current.p.pages)} color={theme.palette.primary} height={8} />
          <Button decorative label={t('continueReading')} />
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon={<Ionicons name="bookmarks-outline" size={36} color={theme.palette.muted} />}
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
            <Ionicons name={x.i} size={20} color={theme.palette.primary} />
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
    </>
  );

  return (
    <Screen dir={dir}>
      {wide ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 24, width: '100%' }}>
          <View style={{ flex: 1, gap: 16 }}>{studyColumn}</View>
          <View style={{ flex: 1, gap: 16 }}>{readingColumn}</View>
        </View>
      ) : (
        <>
          {studyColumn}
          {readingColumn}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.primary,
    borderRadius: 22,
    padding: 22,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.4)',
    borderBottomWidth: 3,
    borderBottomColor: '#0B1224',
    shadowColor: '#0B1224',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 6,
  },
  heroSolid: {
    borderTopColor: '#9AACC8',
    shadowOpacity: 0,
    elevation: 0,
  },
});
