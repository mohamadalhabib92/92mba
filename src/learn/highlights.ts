/**
 * File du jour : les cartes nées d'un surlignage passent devant,
 * puis le reste de ce qui est dû. Plafond = séance existante (10).
 * Rien n'est inventé si moins de cartes sont dues, et aucune carte n'est retirée du disque.
 */
import type { StudyModule } from './types';
import { dueAt } from './srs';
import { REVIEW_SESSION, reviewIds, type StudyState } from './study';

export function highlightCardIds(study: StudyState): Set<string> {
  const ids = new Set<string>();
  for (const mark of study.marks) {
    if (mark.cardId) ids.add(mark.cardId);
  }
  return ids;
}

export function dailyReviewIds(modules: StudyModule[], study: StudyState, now: number): string[] {
  const fromMarks = highlightCardIds(study);
  const dueAtOf = (id: string) => {
    const memory = study.cards[id];
    return memory ? dueAt(memory, study.scheduler) : 0;
  };
  return reviewIds(modules, study, now)
    .slice()
    .sort((a, b) => {
      const group = (fromMarks.has(a) ? 0 : 1) - (fromMarks.has(b) ? 0 : 1);
      if (group !== 0) return group;
      return dueAtOf(a) - dueAtOf(b);
    })
    .slice(0, REVIEW_SESSION);
}
