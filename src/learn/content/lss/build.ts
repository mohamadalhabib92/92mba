import { L, team } from '../../l10n';
import type { Formula, GlossaryEntry, OpenReading } from '../../types';
import { item, opt } from '../build';
import type { LssKind, LssQuestion, LssWork } from './types';

export const ATTESTATION = L(
  'Attestation dans l’application. Elle constate un parcours tenu dans 92’MBA. Ce n’est pas une certification accréditée (ASQ, IASSC ou un autre organisme) et elle ne confère aucun titre professionnel.',
  'In-app attestation. It records a path completed inside 92’MBA. It is not an accredited certification (ASQ, IASSC, or any other body) and it grants no professional title.',
  'إقرار داخل التطبيق. يثبت مساراً أُنجز داخل 92’MBA. ليست شهادة معتمدة (ASQ أو IASSC أو أي جهة أخرى) ولا تمنح لقباً مهنياً.',
);

export function q(
  id: string,
  moduleId: string,
  kind: LssKind,
  prompt: [string, string, string],
  options: [string, string, string][],
  answer: number,
  why: [string, string, string],
  work?: LssWork,
): LssQuestion {
  const base = item(
    id,
    moduleId,
    L(prompt[0], prompt[1], prompt[2]),
    options.map((option) => opt(option[0], option[1], option[2])),
    answer,
    L(why[0], why[1], why[2]),
  );
  return work ? { ...base, kind, work } : { ...base, kind };
}

export function tf(
  id: string,
  moduleId: string,
  prompt: [string, string, string],
  trueIsCorrect: boolean,
  why: [string, string, string],
): LssQuestion {
  return q(
    id,
    moduleId,
    'tf',
    prompt,
    [
      ['Vrai', 'True', 'صحيح'],
      ['Faux', 'False', 'خطأ'],
    ],
    trueIsCorrect ? 0 : 1,
    why,
  );
}

export function gloss(id: string, moduleId: string, term: [string, string, string], definition: [string, string, string]): GlossaryEntry {
  return {
    id,
    moduleId,
    term: L(term[0], term[1], term[2]),
    definition: L(definition[0], definition[1], definition[2]),
    provenance: team(),
  };
}

export function formula(id: string, moduleId: string, name: [string, string, string], expression: string, meaning: [string, string, string]): Formula {
  return {
    id,
    moduleId,
    name: L(name[0], name[1], name[2]),
    expression,
    meaning: L(meaning[0], meaning[1], meaning[2]),
    provenance: team(),
  };
}

export function pointer(
  id: string,
  moduleId: string,
  title: [string, string, string],
  note: [string, string, string],
  source: string,
  url: string,
  verify: string,
): OpenReading {
  return {
    id,
    moduleId,
    title: L(title[0], title[1], title[2]),
    note: L(note[0], note[1], note[2]),
    provenance: {
      author: 'Page publique (ASQ ou IASSC)',
      date: '2026-11-26',
      source,
      licence: 'Page publique — aucun extrait recopié. Licence de la page à vérifier.',
      status: 'needs-review',
      url,
      verify,
    },
  };
}
