import { L, publicDomain, team } from '../l10n';
import type { CaseStudy, FlashCard, Lesson, QuizItem, Screen } from '../types';

type L10n = ReturnType<typeof L>;

export function idea(fr: string, en: string, ar: string, bfr: string, ben: string, bar: string): Screen {
  return { kind: 'idea', title: L(fr, en, ar), body: L(bfr, ben, bar) };
}
export function example(fr: string, en: string, ar: string, bfr: string, ben: string, bar: string): Screen {
  return { kind: 'example', title: L(fr, en, ar), body: L(bfr, ben, bar) };
}
export function opt(fr: string, en: string, ar: string): L10n {
  return L(fr, en, ar);
}
export function check(fr: string, en: string, ar: string, options: [L10n, L10n, L10n], answer: number, why: L10n): Screen {
  return { kind: 'check', prompt: L(fr, en, ar), options, answer, why };
}
export function lesson(id: string, moduleId: string, minutes: number, title: L10n, screens: Screen[], provenance = team()): Lesson {
  return { id, moduleId, minutes, title, screens, provenance };
}
export function card(id: string, moduleId: string, front: L10n, back: L10n, provenance = team()): FlashCard {
  return { id, moduleId, front, back, provenance };
}
export function item(id: string, moduleId: string, prompt: L10n, options: L10n[], answer: number, why: L10n): QuizItem {
  return { id, moduleId, prompt, options, answer, why, provenance: team() };
}
export function studyCase(
  id: string,
  moduleId: string,
  title: L10n,
  context: L10n,
  prompt: L10n,
  options: L10n[],
  answer: number,
  why: L10n,
): CaseStudy {
  return { id, moduleId, title, minutes: 6, context, prompt, options, answer, why, provenance: team() };
}

export const smithNote = publicDomain(
  'Adam Smith',
  '1776',
  'The Wealth of Nations, extraits déjà dans la bibliothèque (Project Gutenberg n°3300).',
  'Le commentaire est original. L’extrait de la bibliothèque est un domaine public revendiqué, à valider.',
  'https://www.gutenberg.org/ebooks/3300',
);

export const taylorNote = publicDomain(
  'Frederick Winslow Taylor',
  '1911',
  'The Principles of Scientific Management, extrait déjà dans la bibliothèque (Project Gutenberg n°6435). Taylor est mort en 1915.',
  'Texte historique daté. Le commentaire de la leçon est original. Le statut de domaine public de l’extrait est à valider.',
  'https://www.gutenberg.org/ebooks/6435',
);

export const fayolNote = publicDomain(
  'Henri Fayol',
  '1916',
  'Administration industrielle et générale (1916). Noms usuels seulement, formulation originale.',
  'Fayol est mort en 1925. Aucune phrase du livre de 1916 n’est reproduite. À vérifier avant citation.',
);
