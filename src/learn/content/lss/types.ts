import type { GlossaryEntry, QuizItem, StudyModule } from '../../types';
import type { L10n } from '../../types';

export type LssKind = 'mcq' | 'tf' | 'calc';

/** Entrées numériques : le test recompte la formule, il ne relit pas un corrigé figé. */
export type LssWork = {
  formula: string;
  inputs: number[];
  places: number;
};

export type LssQuestion = QuizItem & {
  kind: LssKind;
  work?: LssWork;
};

export type LssBeltId = 'lss-white' | 'lss-yellow' | 'lss-green' | 'lss-black';

export type LssBelt = StudyModule & {
  belt: 'white' | 'yellow' | 'green' | 'black';
  order: number;
  mockIds: string[];
  mockMinutes: number;
  attestation: L10n;
  questions: LssQuestion[];
  glossary: GlossaryEntry[];
};
