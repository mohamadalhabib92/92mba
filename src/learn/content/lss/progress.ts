import type { StudyState } from '../../study';
import { PASS_RATIO } from '../../study';

export type BeltGate = {
  id: string;
  order: number;
  lessonIds: string[];
};

export function mockExamId(beltId: string): string {
  return `${beltId}:mock`;
}

export function lessonsDone(lessonIds: string[], study: StudyState): boolean {
  return lessonIds.length > 0 && lessonIds.every((id) => !!study.lessons[id]?.doneAt);
}

export function mockPassed(beltId: string, study: StudyState, passRatio = PASS_RATIO): boolean {
  const exam = study.exams[mockExamId(beltId)];
  return !!exam && exam.total > 0 && exam.correct / exam.total >= passRatio;
}

export function beltHeld(belt: BeltGate, study: StudyState): boolean {
  return lessonsDone(belt.lessonIds, study) && mockPassed(belt.id, study);
}

/** La première ceinture est ouverte. La suivante attend leçons + examen blanc de la précédente. */
export function beltOpen(belt: BeltGate, belts: BeltGate[], study: StudyState): boolean {
  if (belt.order <= 1) return true;
  const prev = belts.find((item) => item.order === belt.order - 1);
  if (!prev) return false;
  return beltHeld(prev, study);
}
