import { appStore } from '../lib/store';
import type { Grade } from './srs';
import {
  addMark,
  applyGrade,
  cardFromMark,
  completeLesson,
  FOCUS_CHOICES,
  recordCapstone,
  recordExam,
  setLessonScreen,
  type ReaderMark,
  type StudyState,
} from './study';

export function patchStudy(recipe: (study: StudyState) => StudyState) {
  appStore.set((state) => ({ study: recipe(state.study) }));
}

export function gradeCard(cardId: string, grade: Grade) {
  patchStudy((study) => applyGrade(study, cardId, grade, Date.now()));
}

export function finishLesson(lessonId: string, moduleId: string, lessonIds: string[]) {
  patchStudy((study) => completeLesson(study, lessonId, moduleId, lessonIds, Date.now()));
}

export function moveLesson(lessonId: string, screen: number) {
  patchStudy((study) => setLessonScreen(study, lessonId, screen));
}

export function saveExam(moduleId: string, correct: number, total: number) {
  patchStudy((study) => recordExam(study, moduleId, correct, total, Date.now()));
}

export function saveCapstone() {
  patchStudy((study) => recordCapstone(study, Date.now()));
}

export function keepMark(mark: ReaderMark) {
  patchStudy((study) => addMark(study, mark));
}

export function promoteMark(markId: string, front: string, back: string, meta: { lang: 'fr' | 'en' | 'ar'; docId: string; author: string; date: string; source: string; licence: string; status: string }) {
  patchStudy((study) => cardFromMark(study, markId, Date.now(), { front, back, ...meta }));
}

export function setComfort(patch: Partial<StudyState>) {
  patchStudy((study) => ({ ...study, ...patch }));
}

export { FOCUS_CHOICES };
