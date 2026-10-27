import pd from '../data/publicDomain.json';
import {
  coutsMarges,
  leadership,
  lireUnBilan,
  marketing4P,
  negotiation,
  placeholderDoc,
  principesGestionAr,
  strategieFondamentaux,
} from '../data/original';
import type { Lang } from '../i18n/strings';

export type LicenseKind = 'original' | 'owned' | 'public-domain' | 'open' | 'placeholder';
export type Category = 'strategy' | 'finance' | 'marketing' | 'leadership' | 'operations' | 'economics' | 'other';

export type Doc = {
  id: string;
  title: string;
  author: string;
  lang: Lang;
  category: Category;
  year?: string;
  license: { kind: LicenseKind; label: string; source?: string; url?: string };
  summary: string;
  note?: string;
  paragraphs: string[];
  userAdded?: boolean;
};

export const CATEGORY_LABELS: Record<Category, Record<Lang, string>> = {
  strategy: { fr: 'Stratégie', en: 'Strategy', ar: 'الاستراتيجية' },
  finance: { fr: 'Finance', en: 'Finance', ar: 'المالية' },
  marketing: { fr: 'Marketing', en: 'Marketing', ar: 'التسويق' },
  leadership: { fr: 'Leadership', en: 'Leadership', ar: 'القيادة' },
  operations: { fr: 'Opérations', en: 'Operations', ar: 'العمليات' },
  economics: { fr: 'Économie', en: 'Economics', ar: 'الاقتصاد' },
  other: { fr: 'Autre', en: 'Other', ar: 'أخرى' },
};

export const LICENSE_BADGE: Record<LicenseKind, Record<Lang, string>> = {
  original: { fr: 'Contenu original', en: 'Original content', ar: 'محتوى أصلي' },
  owned: { fr: 'Contenu possédé', en: 'Owned content', ar: 'محتوى مملوك' },
  'public-domain': { fr: 'Domaine public', en: 'Public domain', ar: 'ملك عام' },
  open: { fr: 'Licence ouverte', en: 'Open license', ar: 'ترخيص مفتوح' },
  placeholder: { fr: 'Placeholder / démo — à remplacer', en: 'Placeholder / demo — replace', ar: 'نص مؤقت — للاستبدال' },
};

const ORIGINAL = {
  kind: 'original' as const,
  label: "Contenu original rédigé pour 92'MBA — à relire et valider par le propriétaire",
  source: "92'MBA",
};

export const BUILTIN_DOCS: Doc[] = [
  {
    id: 'strategie-fondamentaux',
    title: 'Stratégie : les fondamentaux',
    author: "Équipe 92'MBA",
    lang: 'fr',
    category: 'strategy',
    license: ORIGINAL,
    summary: 'Diagnostic externe et interne, SWOT, avantage concurrentiel et exécution.',
    paragraphs: strategieFondamentaux,
  },
  {
    id: 'lire-un-bilan',
    title: 'Finance : lire un bilan',
    author: "Équipe 92'MBA",
    lang: 'fr',
    category: 'finance',
    license: ORIGINAL,
    summary: 'Actif, passif, fonds propres et premiers ratios de lecture.',
    paragraphs: lireUnBilan,
  },
  {
    id: 'couts-marges',
    title: 'Comptabilité de gestion : coûts et marges',
    author: "Équipe 92'MBA",
    lang: 'fr',
    category: 'finance',
    license: ORIGINAL,
    summary: 'Coûts fixes et variables, marge de contribution, seuil de rentabilité.',
    paragraphs: coutsMarges,
  },
  {
    id: 'marketing-4p',
    title: 'Marketing : positionnement et 4P',
    author: "Équipe 92'MBA",
    lang: 'fr',
    category: 'marketing',
    license: ORIGINAL,
    summary: 'Segmentation, ciblage, positionnement et mix marketing cohérent.',
    paragraphs: marketing4P,
  },
  {
    id: 'leadership-equipe',
    title: "Leadership & management d'équipe",
    author: "Équipe 92'MBA",
    lang: 'fr',
    category: 'leadership',
    license: ORIGINAL,
    summary: 'Prise de poste, délégation, feedback et gestion des conflits.',
    paragraphs: leadership,
  },
  {
    id: 'negotiation-essentials',
    title: 'Negotiation essentials',
    author: "92'MBA team",
    lang: 'en',
    category: 'leadership',
    license: { ...ORIGINAL, label: "Original content written for 92'MBA — to be reviewed by the owner" },
    summary: 'Alternatives, interests vs positions, anchoring and closing.',
    paragraphs: negotiation,
  },
  {
    id: 'mabadi-al-idara',
    title: 'مبادئ الإدارة',
    author: "فريق 92'MBA",
    lang: 'ar',
    category: 'leadership',
    license: { ...ORIGINAL, label: "محتوى أصلي كُتب لـ 92'MBA — يُراجع من المالك" },
    summary: 'التخطيط والتنظيم والقيادة والرقابة.',
    paragraphs: principesGestionAr,
  },
  {
    id: 'taylor-scientific-management',
    title: 'The Principles of Scientific Management (Introduction & Ch. I, extract)',
    author: 'Frederick Winslow Taylor',
    year: '1911',
    lang: 'en',
    category: 'operations',
    license: {
      kind: 'public-domain',
      label: 'Public domain (author died 1915)',
      source: 'Project Gutenberg eBook #6435',
      url: 'https://www.gutenberg.org/ebooks/6435',
    },
    summary: 'Founding text of scientific management (1911). Historical text reproduced as is.',
    note: 'Historical text (1911) reproduced without modification; some views are dated.',
    paragraphs: [...pd.taylorIntro, ...pd.taylorCh1],
  },
  {
    id: 'smith-division-of-labour',
    title: 'The Wealth of Nations — Book I, Ch. I: Of the Division of Labour',
    author: 'Adam Smith',
    year: '1776',
    lang: 'en',
    category: 'economics',
    license: {
      kind: 'public-domain',
      label: 'Public domain (author died 1790)',
      source: 'Project Gutenberg eBook #3300',
      url: 'https://www.gutenberg.org/ebooks/3300',
    },
    summary: 'The famous pin-factory chapter on productivity and specialisation.',
    note: 'Historical text (1776) reproduced as is; it contains dated and offensive wording.',
    paragraphs: pd.smithCh1,
  },
  {
    id: 'smith-principle-of-exchange',
    title: 'The Wealth of Nations — Book I, Ch. II: Of the Principle which gives occasion to the Division of Labour',
    author: 'Adam Smith',
    year: '1776',
    lang: 'en',
    category: 'economics',
    license: {
      kind: 'public-domain',
      label: 'Public domain (author died 1790)',
      source: 'Project Gutenberg eBook #3300',
      url: 'https://www.gutenberg.org/ebooks/3300',
    },
    summary: 'Exchange, self-interest and specialisation.',
    note: 'Historical text (1776) reproduced as is.',
    paragraphs: pd.smithCh2,
  },
  {
    id: 'placeholder-vos-cours',
    title: 'Vos supports de cours (emplacement réservé)',
    author: '—',
    lang: 'fr',
    category: 'other',
    license: { kind: 'placeholder', label: 'Placeholder / démo — à remplacer par un contenu possédé ou sous licence ouverte' },
    summary: 'Exemple de document à remplacer.',
    paragraphs: placeholderDoc,
  },
];

export function allDocs(userDocs: Doc[]): Doc[] {
  return [...userDocs, ...BUILTIN_DOCS];
}

export function findDoc(id: string | undefined, userDocs: Doc[]): Doc | undefined {
  if (!id) return undefined;
  return allDocs(userDocs).find((d) => d.id === id);
}

const CHARS_PER_PAGE = 1500;
const cache = new Map<string, string[][]>();

/** Pagination stable (indépendante de la taille du texte) pour que signets et progression restent valides. */
export function paginate(doc: Doc): string[][] {
  const key = `${doc.id}:${doc.paragraphs.length}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const pages: string[][] = [];
  let cur: string[] = [];
  let n = 0;
  const flush = () => {
    if (cur.length) pages.push(cur);
    cur = [];
    n = 0;
  };
  const parts: string[] = [];
  for (const p of doc.paragraphs) {
    if (p.length <= CHARS_PER_PAGE * 1.4) {
      parts.push(p);
      continue;
    }
    // Paragraphe très long : découpe aux phrases.
    const sentences = p.match(/[^.!?؟]+[.!?؟]+["”’)]*\s*|[^.!?؟]+$/g) ?? [p];
    let chunk = '';
    for (const sentence of sentences) {
      if ((chunk + sentence).length > CHARS_PER_PAGE && chunk) {
        parts.push(chunk.trim());
        chunk = '';
      }
      chunk += sentence;
    }
    if (chunk.trim()) parts.push(chunk.trim());
  }
  for (const p of parts) {
    if (n + p.length > CHARS_PER_PAGE && cur.length) flush();
    cur.push(p);
    n += p.length;
  }
  flush();
  const result = pages.length ? pages : [['']];
  cache.set(key, result);
  return result;
}

export function readingMinutes(doc: Doc) {
  const words = doc.paragraphs.join(' ').split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}

export function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f\u064B-\u0652]/g, '');
}

export type SearchHit = { doc: Doc; score: number; matches: { page: number; excerpt: string }[] };

export function searchDocs(docs: Doc[], query: string): SearchHit[] {
  const q = normalize(query.trim());
  if (q.length < 2) return [];
  const hits: SearchHit[] = [];
  for (const doc of docs) {
    let score = 0;
    if (normalize(doc.title).includes(q)) score += 10;
    if (normalize(doc.author).includes(q)) score += 5;
    if (normalize(doc.summary).includes(q)) score += 3;
    const matches: SearchHit['matches'] = [];
    paginate(doc).forEach((page, pi) => {
      for (const para of page) {
        const np = normalize(para);
        const idx = np.indexOf(q);
        if (idx >= 0) {
          const start = Math.max(0, idx - 60);
          matches.push({ page: pi, excerpt: (start > 0 ? '…' : '') + para.slice(start, idx + q.length + 80) + '…' });
          if (matches.length >= 3) break;
        }
      }
    });
    score += matches.length;
    if (score > 0) hits.push({ doc, score, matches });
  }
  return hits.sort((a, b) => b.score - a.score);
}
