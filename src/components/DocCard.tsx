import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useI18n } from '../lib/i18n';
import { CATEGORY_LABELS, Doc, LICENSE_BADGE, paginate, readingMinutes } from '../lib/library';
import type { Progress } from '../lib/store';
import { colors } from '../theme';
import { Badge, Card, H3, Muted, ProgressBar, Row } from './ui';

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  strategy: 'compass-outline',
  finance: 'bar-chart-outline',
  marketing: 'megaphone-outline',
  leadership: 'people-outline',
  operations: 'construct-outline',
  economics: 'globe-outline',
  other: 'document-text-outline',
};

export function DocCard({ doc, progress, onPress }: { doc: Doc; progress?: Progress; onPress: () => void }) {
  const { t, lang } = useI18n();
  const pages = paginate(doc).length;
  const pct = progress ? Math.round(((progress.page + 1) / Math.max(1, progress.pages)) * 100) : 0;
  const tone = doc.license.kind === 'placeholder' ? 'warn' : doc.license.kind === 'public-domain' ? 'ok' : 'info';
  return (
    <Card onPress={onPress} accessibilityLabel={doc.title}>
      <Row gap={12} style={{ alignItems: 'flex-start' }}>
        <View style={styles.cover}>
          <Ionicons name={ICONS[doc.category] ?? 'book-outline'} size={26} color={colors.accent} />
          <Muted style={styles.lang}>{doc.lang.toUpperCase()}</Muted>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <H3 numberOfLines={2} style={{ writingDirection: doc.lang === 'ar' ? 'rtl' : 'ltr' }}>
            {doc.title}
          </H3>
          <Muted numberOfLines={1}>
            {doc.author}
            {doc.year ? ` · ${doc.year}` : ''} · {CATEGORY_LABELS[doc.category][lang]}
          </Muted>
          <Row style={{ flexWrap: 'wrap' }} gap={6}>
            <Badge label={LICENSE_BADGE[doc.license.kind][lang]} tone={tone} />
            {doc.userAdded ? <Badge label={t('myDocs')} /> : null}
            <Muted>
              {t('pages', { n: pages })} · {t('minutes', { n: readingMinutes(doc) })}
            </Muted>
          </Row>
          {progress ? (
            <View style={{ gap: 4, marginTop: 4 }}>
              <ProgressBar value={pct / 100} color={pct >= 100 ? '#2E7D4F' : colors.accent} />
              <Muted>{pct >= 100 ? t('finished') : t('percent', { n: pct })}</Muted>
            </View>
          ) : null}
        </View>
      </Row>
    </Card>
  );
}

const styles = StyleSheet.create({
  cover: {
    width: 56,
    height: 72,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  lang: { color: '#C8CFDF', fontSize: 10, fontWeight: '700' },
});
