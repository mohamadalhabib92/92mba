import type { StudyState } from '../study';
import type { CaseStudy, Lesson, StudyModule } from '../types';
import { modules } from './catalog';
import { findBelt, lssBelts } from './lss';
import { beltHeld, beltOpen, type BeltGate } from './lss/progress';

export function studyModules(): StudyModule[] {
  return [...modules, ...lssBelts];
}

export function findModule(id: string | undefined): StudyModule | undefined {
  if (!id) return undefined;
  return studyModules().find((mod) => mod.id === id);
}

export function findLesson(id: string | undefined): { mod: StudyModule; lesson: Lesson } | null {
  if (!id) return null;
  for (const mod of studyModules()) {
    const lesson = mod.lessons.find((item) => item.id === id);
    if (lesson) return { mod, lesson };
  }
  return null;
}

export function findCase(id: string | undefined): CaseStudy | undefined {
  if (!id) return undefined;
  return studyModules()
    .flatMap((mod) => mod.cases)
    .find((item) => item.id === id);
}

function gate(beltId: string): BeltGate | null {
  const belt = findBelt(beltId);
  if (!belt) return null;
  return { id: belt.id, order: belt.order, lessonIds: belt.lessons.map((lesson) => lesson.id) };
}

function gates(): BeltGate[] {
  return lssBelts.map((belt) => ({ id: belt.id, order: belt.order, lessonIds: belt.lessons.map((lesson) => lesson.id) }));
}

export function lessonAllowed(moduleId: string, study: StudyState): boolean {
  const row = gate(moduleId);
  if (!row) return true;
  return beltOpen(row, gates(), study);
}

export function beltIsOpen(beltId: string, study: StudyState): boolean {
  return lessonAllowed(beltId, study);
}

export function beltIsHeld(beltId: string, study: StudyState): boolean {
  const row = gate(beltId);
  if (!row) return false;
  return beltHeld(row, study);
}
