import type { Lang } from '../i18n/strings';

/** Texte d'interface et de cours. Les trois langues sont obligatoires. */
export type L10n = Record<Lang, string>;

export type ContentStatus = 'original' | 'public-domain' | 'open' | 'needs-review';

/**
 * Chaque élément porte auteur, date, source, licence et statut.
 * `needs-review` = « à vérifier » : le texte reste visible, il n'est pas une citation certifiée.
 */
export type Provenance = {
  author: string;
  date: string;
  source: string;
  licence: string;
  status: ContentStatus;
  url?: string;
  /** Phrase courte quand un fait, un taux ou une licence d'édition n'est pas clos. */
  verify?: string;
};

export type Screen =
  | { kind: 'idea'; title: L10n; body: L10n }
  | { kind: 'example'; title: L10n; body: L10n }
  | {
      kind: 'check';
      prompt: L10n;
      options: L10n[];
      answer: number;
      why: L10n;
    };

export type Lesson = {
  id: string;
  moduleId: string;
  minutes: number;
  title: L10n;
  screens: Screen[];
  provenance: Provenance;
};

export type FlashCard = {
  id: string;
  moduleId: string;
  front: L10n;
  back: L10n;
  provenance: Provenance;
};

export type QuizItem = {
  id: string;
  moduleId: string;
  prompt: L10n;
  options: L10n[];
  answer: number;
  why: L10n;
  provenance: Provenance;
};

export type CaseStudy = {
  id: string;
  moduleId: string;
  title: L10n;
  minutes: number;
  context: L10n;
  prompt: L10n;
  options: L10n[];
  answer: number;
  why: L10n;
  provenance: Provenance;
};

export type Formula = {
  id: string;
  moduleId: string;
  name: L10n;
  expression: string;
  meaning: L10n;
  provenance: Provenance;
};

export type GlossaryEntry = {
  id: string;
  moduleId: string;
  term: L10n;
  definition: L10n;
  provenance: Provenance;
};

/** Pointeur vers un manuel ouvert. Aucun passage n'est recopié. */
export type OpenReading = {
  id: string;
  moduleId: string;
  title: L10n;
  note: L10n;
  provenance: Provenance;
};

export type ModuleRichness = 'rich' | 'thin';

export type StudyModule = {
  id: string;
  richness: ModuleRichness;
  title: L10n;
  promise: L10n;
  libraryDocIds: string[];
  lessons: Lesson[];
  cards: FlashCard[];
  quiz: QuizItem[];
  cases: CaseStudy[];
  formulas: Formula[];
  readings: OpenReading[];
};

export type Capstone = {
  id: string;
  title: L10n;
  minutes: number;
  scenes: { title: L10n; body: L10n }[];
  decisions: QuizItem[];
  provenance: Provenance;
};

export type StudyPath = {
  id: string;
  days: number;
  title: L10n;
  summary: L10n;
  /** Jour de début (1) inclus, jour de fin inclus, module ou capstone. */
  steps: { from: number; to: number; moduleId: string }[];
};
