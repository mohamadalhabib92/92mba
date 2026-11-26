import { L } from '../../l10n';
import type { LssBelt } from './types';
import { whiteBelt } from './white';
import { yellowBelt } from './yellow';
import { greenBelt } from './green';
import { blackBelt } from './black';

export const LSS_TRACK = {
  id: 'lean-six-sigma',
  title: L(
    'Lean Six Sigma — de la blanche à la noire',
    'Lean Six Sigma — White Belt to Black Belt',
    'لين ستة سيغما — من الأبيض إلى الأسود',
  ),
  summary: L(
    'Quatre ceintures, dans l’ordre. Chaque ceinture a ses leçons, une banque de questions et un examen blanc chronométré. Réussir ouvre la suivante. L’écran de fin est une attestation dans l’application : ce n’est pas une certification accréditée.',
    'Four belts, in order. Each belt has lessons, a question bank and a timed mock exam. Passing opens the next one. The closing screen is an in-app attestation: it is not an accredited certification.',
    'أربعة أحزمة بالترتيب. لكل حزام دروس وبنك أسئلة واختبار تجريبي موقوت. النجاح يفتح التالي. شاشة الختام إقرار داخل التطبيق: ليست شهادة معتمدة.',
  ),
};

const registered: LssBelt[] = [whiteBelt, yellowBelt, greenBelt, blackBelt];

export const lssBelts: LssBelt[] = [...registered].sort((a, b) => a.order - b.order);

export function findBelt(id: string | undefined): LssBelt | undefined {
  if (!id) return undefined;
  return lssBelts.find((belt) => belt.id === id);
}

export const lssFormulas = lssBelts.flatMap((belt) => belt.formulas);
export const lssGlossary = lssBelts.flatMap((belt) => belt.glossary);

export function mockQuestions(belt: LssBelt) {
  const byId = new Map(belt.questions.map((question) => [question.id, question]));
  return belt.mockIds.map((questionId) => {
    const question = byId.get(questionId);
    if (!question) throw new Error(`question de mock absente: ${questionId}`);
    return question;
  });
}
