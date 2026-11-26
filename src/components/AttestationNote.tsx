import React from 'react';
import { learnText } from '../learn/copy';
import { pick } from '../learn/l10n';
import type { L10n } from '../learn/types';
import { useI18n } from '../lib/i18n';
import { Body, Card, H3 } from './ui';

export function AttestationNote({ text }: { text: L10n }) {
  const { lang } = useI18n();
  return (
    <Card>
      <H3>{learnText(lang, 'lssAttestation')}</H3>
      <Body>{pick(text, lang)}</Body>
    </Card>
  );
}
