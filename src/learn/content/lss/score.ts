export type MockPick = number | null;

export type MockMiss = {
  index: number;
  picked: MockPick;
};

export type MockScore = {
  correct: number;
  total: number;
  misses: MockMiss[];
};

export function scoreMock(answers: number[], picks: MockPick[]): MockScore {
  const total = answers.length;
  const misses: MockMiss[] = [];
  let correct = 0;
  for (let index = 0; index < total; index += 1) {
    const picked = index < picks.length ? picks[index] : null;
    if (picked === answers[index]) correct += 1;
    else misses.push({ index, picked: picked ?? null });
  }
  return { correct, total, misses };
}

export function formatClock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}
