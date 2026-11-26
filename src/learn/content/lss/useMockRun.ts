import { useCallback, useEffect, useRef, useState } from 'react';
import { saveExam } from '../../actions';
import { mockExamId } from './progress';
import { scoreMock, type MockScore } from './score';

export function useMockRun(beltId: string, answers: number[], seconds: number) {
  const [phase, setPhase] = useState<'ready' | 'run' | 'review'>('ready');
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [left, setLeft] = useState(seconds);
  const [result, setResult] = useState<MockScore | null>(null);
  const picks = useRef<(number | null)[]>(Array(answers.length).fill(null));
  const pickedRef = useRef<number | null>(null);
  const stepRef = useRef(0);
  const doneRef = useRef(false);
  const answersRef = useRef(answers);

  useEffect(() => {
    pickedRef.current = picked;
  }, [picked]);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (pickedRef.current !== null) picks.current[stepRef.current] = pickedRef.current;
    const scored = scoreMock(answersRef.current, picks.current);
    setResult(scored);
    setPhase('review');
    saveExam(mockExamId(beltId), scored.correct, scored.total);
  }, [beltId]);

  useEffect(() => {
    if (phase !== 'run') return;
    const timer = setInterval(() => {
      setLeft((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase === 'run' && left <= 0) finish();
  }, [phase, left, finish]);

  const commit = () => {
    if (phase !== 'run' || picked === null) return;
    picks.current[step] = picked;
    pickedRef.current = null;
    if (step + 1 >= answers.length) {
      finish();
      return;
    }
    setStep(step + 1);
    setPicked(null);
  };

  const start = () => {
    picks.current = Array(answers.length).fill(null);
    answersRef.current = answers;
    pickedRef.current = null;
    stepRef.current = 0;
    doneRef.current = false;
    setStep(0);
    setPicked(null);
    setLeft(seconds);
    setResult(null);
    setPhase('run');
  };

  return { phase, step, picked, setPicked, left, result, commit, start };
}
