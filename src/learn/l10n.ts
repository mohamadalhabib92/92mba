import type { Lang } from '../i18n/strings';
import type { L10n, Provenance } from './types';

export function L(fr: string, en: string, ar: string): L10n {
  return { fr, en, ar };
}

export function pick(text: L10n, lang: Lang): string {
  return text[lang] || text.fr;
}

/** Contenu rédigé pour cette application. Pas une citation. */
export function team(verify?: string): Provenance {
  return {
    author: "Équipe 92'MBA",
    date: '2026-11-15',
    source: "Texte original rédigé pour 92'MBA",
    licence: "Original — Équipe 92'MBA / Mohamed",
    status: verify ? 'needs-review' : 'original',
    verify,
  };
}

export function publicDomain(author: string, date: string, source: string, verify: string, url?: string): Provenance {
  return {
    author,
    date,
    source,
    licence: 'Domaine public revendiqué (LDA suisse, 70 ans après le décès) — à vérifier',
    status: 'public-domain',
    url,
    verify,
  };
}
