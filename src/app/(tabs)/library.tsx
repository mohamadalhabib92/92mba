import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { DocCard } from '../../components/DocCard';
import { Button, Card, Chip, EmptyState, H1, Muted, Row, Screen, Skeleton } from '../../components/ui';
import { useI18n } from '../../lib/i18n';
import { allDocs, Category, CATEGORY_LABELS } from '../../lib/library';
import { appStore } from '../../lib/store';
import { LANGS, Lang } from '../../i18n/strings';
import { colors } from '../../theme';

export default function Library() {
  const { t, lang, dir } = useI18n();
  const s = appStore.useStore();
  const [cat, setCat] = useState<Category | 'all' | 'mine'>('all');
  const [docLang, setDocLang] = useState<Lang | 'all'>('all');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setReady(true), 120);
    return () => clearTimeout(id);
  }, []);
  const docs = useMemo(() => allDocs(s.userDocs), [s.userDocs]);
  const cats = useMemo(() => Array.from(new Set(docs.map((d) => d.category))), [docs]);
  const filtered = docs.filter(
    (d) => (cat === 'all' || (cat === 'mine' ? d.userAdded : d.category === cat)) && (docLang === 'all' || d.lang === docLang),
  );

  return (
    <Screen dir={dir}>
      <Row style={{ justifyContent: 'space-between' }}>
        <H1>{t('tabLibrary')}</H1>
        <Button small label={t('add')} icon={<Ionicons name="add" size={16} color="#fff" />} onPress={() => router.push('/add')} />
      </Row>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        <Chip label={t('allDocs')} active={cat === 'all'} onPress={() => setCat('all')} />
        {s.userDocs.length ? <Chip label={t('myDocs')} active={cat === 'mine'} onPress={() => setCat('mine')} /> : null}
        {cats.map((c) => (
          <Chip key={c} label={CATEGORY_LABELS[c][lang]} active={cat === c} onPress={() => setCat(c)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        <Chip label={`🌐 ${t('allDocs')}`} active={docLang === 'all'} onPress={() => setDocLang('all')} />
        {LANGS.map((l) => (
          <Chip key={l.code} label={l.label} active={docLang === l.code} onPress={() => setDocLang(l.code)} />
        ))}
      </ScrollView>
      <Muted>
        <Ionicons name="cloud-done-outline" size={13} color={colors.muted} /> {t('offlineReady')} · {t('results', { n: filtered.length })}
      </Muted>
      {!ready ? (
        [0, 1, 2].map((i) => (
          <Card key={i}>
            <Skeleton height={20} width="70%" />
            <Skeleton height={14} width="40%" />
            <Skeleton height={14} width="55%" />
          </Card>
        ))
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Ionicons name="library-outline" size={40} color={colors.muted} />}
          title={t('emptyLibrary')}
          text={t('emptyLibraryText')}
          action={<Button label={t('add')} onPress={() => router.push('/add')} />}
        />
      ) : (
        filtered.map((d) => (
          <DocCard key={d.id} doc={d} progress={s.progress[d.id]} onPress={() => router.push({ pathname: '/doc/[id]', params: { id: d.id } })} />
        ))
      )}
    </Screen>
  );
}
