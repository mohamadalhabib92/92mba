/**
 * Cas de test du minuteur Mode Focus (sans React Native).
 * Exécutés par `npm test` : durée, arrière-plan / reprise, minimum imposé,
 * sortie d’urgence, persistance de l’historique.
 */
import {
  EMERGENCY_HOLD_MS,
  FOCUS_DURATIONS,
  HISTORY_LIMIT,
  awayMs,
  completeFocus,
  createFocusStore,
  elapsedMs,
  emergencyExit,
  emptyFocusData,
  holdDone,
  holdProgress,
  isComplete,
  onBackground,
  onForeground,
  parseFocusData,
  pushHistory,
  remainingMinutes,
  remainingMs,
  requestLeave,
  resumeFocus,
  startFocus,
  type FocusRecord,
  type FocusStorage,
} from './focus';
import { createFocusController } from './focusController';

const MIN = 60_000;
const T0 = 1_800_000_000_000;

function ok(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}
function eq(a: unknown, b: unknown, msg: string) {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg} : ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`);
}

function memoryStorage(seed: Record<string, string> = {}) {
  const disk = new Map(Object.entries(seed));
  const reads: string[] = [];
  const writes: string[] = [];
  const storage: FocusStorage = {
    getItem: async (k) => {
      reads.push(k);
      return disk.get(k) ?? null;
    },
    setItem: async (k, v) => {
      writes.push(k);
      disk.set(k, v);
    },
  };
  return { disk, reads, writes, storage };
}
const flush = () => new Promise((r) => setTimeout(r, 0));

export function focusCases(key: string, otherKeys: string[]): { name: string; run: () => void | Promise<void> }[] {
  return [
    {
      name: 'durée : seulement 10, 15, 20 ou 30 min',
      run() {
        eq([...FOCUS_DURATIONS], [10, 15, 20, 30], 'durées proposées');
        for (const m of FOCUS_DURATIONS) eq(startFocus(m, T0).durationMs, m * MIN, `durée ${m}`);
        for (const bad of [0, 5, 9, 11, 25, 60, -10, Number.NaN]) {
          let threw = false;
          try {
            startFocus(bad, T0);
          } catch {
            threw = true;
          }
          ok(threw, `durée refusée ${bad}`);
        }
      },
    },
    {
      name: 'durée : décompte à l’horloge murale, bornes et minutes affichées',
      run() {
        const s = startFocus(15, T0, { kind: 'lesson', id: 'u1-l1' }, 'x');
        eq(elapsedMs(s, T0), 0, 'départ');
        eq(remainingMs(s, T0), 15 * MIN, 'reste au départ');
        eq(remainingMinutes(s, T0), 15, 'minutes au départ');
        eq(remainingMinutes(s, T0 + 30_000), 15, 'arrondi supérieur');
        eq(remainingMinutes(s, T0 + 14 * MIN + 59_000), 1, 'dernière minute');
        eq(elapsedMs(s, T0 - 5 * MIN), 0, 'horloge reculée ⇒ 0');
        eq(elapsedMs(s, T0 + 99 * MIN), 15 * MIN, 'plafonné à la durée');
        ok(!isComplete(s, T0 + 15 * MIN - 1), 'pas fini 1 ms avant');
        ok(isComplete(s, T0 + 15 * MIN), 'fini à l’heure');
      },
    },
    {
      name: 'arrière-plan / reprise : le temps continue et chaque sortie est une interruption',
      run() {
        let s = startFocus(10, T0, undefined, 'bg');
        s = onBackground(s, T0 + 2 * MIN);
        eq(s.interruptions.length, 1, 'une interruption');
        s = onBackground(s, T0 + 3 * MIN);
        eq(s.interruptions.length, 1, 'double événement : pas de doublon');
        eq(awayMs(s, T0 + 4 * MIN), 2 * MIN, 'temps hors app en cours');
        s = onForeground(s, T0 + 5 * MIN);
        eq(s.backgroundSince, null, 'retour au premier plan');
        eq(s.interruptions[0], { at: T0 + 2 * MIN, ms: 3 * MIN }, 'durée de l’interruption');
        eq(onForeground(s, T0 + 6 * MIN), s, 'premier plan sans sortie : inchangé');
        eq(elapsedMs(s, T0 + 5 * MIN), 5 * MIN, 'le temps hors app compte');
        s = onForeground(onBackground(s, T0 + 7 * MIN), T0 + 7 * MIN + 30_000);
        eq(s.interruptions.length, 2, 'deuxième interruption');
        eq(awayMs(s, T0 + 8 * MIN), 3 * MIN + 30_000, 'total hors app');
        // Revenir après la fin : la session est terminée, temps hors app plafonné à la fenêtre.
        s = onBackground(s, T0 + 9 * MIN);
        const r = completeFocus(s, T0 + 40 * MIN);
        ok(r, 'terminée au retour');
        eq(r.outcome, 'completed', 'issue');
        eq(r.awayMs, 3 * MIN + 30_000 + MIN, 'temps hors app borné à la session');
        eq(r.interruptions, 3, 'trois interruptions');
        eq(r.endedAt, T0 + 10 * MIN, 'fin = heure prévue');
      },
    },
    {
      name: 'minimum imposé : sortie ordinaire refusée avant la fin',
      run() {
        const s = startFocus(20, T0, undefined, 'min');
        const early = requestLeave(s, T0 + 19 * MIN);
        ok(!early.ok && early.reason === 'minimum', 'refus avant 20 min');
        if (!early.ok) eq(early.remainingMs, MIN, 'reste 1 min');
        eq(completeFocus(s, T0 + 10 * MIN), null, 'pas de fin anticipée');
        const late = requestLeave(s, T0 + 20 * MIN);
        ok(late.ok && late.record.outcome === 'completed', 'autorisée à 20 min');
        if (late.ok) eq(late.record.plannedMinutes, 20, 'minutes prévues');
      },
    },
    {
      name: 'sortie d’urgence : appui long ≈ 3 s PUIS confirmation',
      run() {
        eq(EMERGENCY_HOLD_MS, 3000, 'appui de 3 s');
        eq(holdProgress(1500), 0.5, 'progression de l’appui');
        eq(holdProgress(-1), 0, 'progression bornée bas');
        eq(holdProgress(9000), 1, 'progression bornée haut');
        ok(!holdDone(2999) && holdDone(3000), 'seuil');
        const s = startFocus(30, T0, { kind: 'doc', id: 'd' }, 'em');
        const short = emergencyExit(s, T0 + MIN, { heldMs: 2000, confirmed: true });
        ok(!short.ok && short.reason === 'hold', 'appui trop court');
        const noConfirm = emergencyExit(s, T0 + MIN, { heldMs: 3200, confirmed: false });
        ok(!noConfirm.ok && noConfirm.reason === 'confirm', 'confirmation exigée');
        const out = emergencyExit(onBackground(s, T0 + 2 * MIN), T0 + 4 * MIN, { heldMs: 3200, confirmed: true });
        ok(out.ok, 'sortie acceptée');
        if (out.ok) {
          eq(out.record.outcome, 'emergency', 'issue urgence');
          eq(out.record.elapsedMs, 4 * MIN, 'temps réel');
          eq(out.record.awayMs, 2 * MIN, 'arrière-plan clos');
          eq(out.record.interruptions, 1, 'interruption notée');
          eq(out.record.target, { kind: 'doc', id: 'd' }, 'cible gardée');
        }
        const after = emergencyExit(s, T0 + 31 * MIN, { heldMs: 3200, confirmed: true });
        ok(after.ok && after.record.outcome === 'completed', 'après la fin : compte comme terminée');
      },
    },
    {
      name: 'historique : persistance sous une clé dédiée, aucune autre clé touchée',
      async run() {
        const seed: Record<string, string> = {};
        for (const k of otherKeys) seed[k] = `{"existant":"${k}"}`;
        const mem = memoryStorage(seed);
        let now = T0;
        const c = createFocusController(mem.storage, key, () => now);
        await c.hydrate();
        c.start(10, { kind: 'lesson', id: 'u1-l2', label: 'Leçon' });
        ok(c.get().data.active, 'session active');
        eq(c.start(30)?.durationMs, 10 * MIN, 'pas de seconde session en parallèle');
        now += 3 * MIN;
        c.background();
        now += MIN;
        c.foreground();
        now += 5 * MIN;
        eq(c.tick(), null, 'pas encore fini');
        now += MIN;
        const done = c.tick();
        ok(done && done.outcome === 'completed', 'fin à 10 min');
        ok(c.get().finished?.id === done.id, 'moment de réussite à afficher');
        c.dismissFinished();
        c.start(15);
        now += 2 * MIN;
        ok(c.emergency(3100, true).ok, 'sortie d’urgence');
        c.markGuideSeen();
        await flush();
        // Relecture à froid (app relancée).
        const c2 = createFocusController(mem.storage, key, () => now);
        await c2.hydrate();
        const h = c2.get().data.history;
        eq(h.map((r) => r.outcome), ['completed', 'emergency'], 'historique relu');
        eq(h[0].interruptions, 1, 'interruptions relues');
        eq(h[0].awayMs, MIN, 'temps hors app relu');
        eq(h[0].target, { kind: 'lesson', id: 'u1-l2', label: 'Leçon' }, 'cible relue');
        eq(c2.get().data.guideSeen, true, 'guide vu relu');
        eq(c2.get().data.active, null, 'aucune session active');
        ok(mem.writes.every((k) => k === key) && mem.reads.every((k) => k === key), `autres clés touchées : ${mem.writes} ${mem.reads}`);
        for (const k of otherKeys) eq(mem.disk.get(k), seed[k], `clé existante intacte ${k}`);
      },
    },
    {
      name: 'reprise après fermeture de l’app : session en cours ou terminée entre-temps',
      async run() {
        const mem = memoryStorage();
        let now = T0;
        const c = createFocusController(mem.storage, key, () => now);
        await c.hydrate();
        c.start(10);
        now += MIN;
        c.background();
        await flush();
        // Relance 2 min plus tard : la session continue, l’interruption est close.
        now += 2 * MIN;
        const c2 = createFocusController(mem.storage, key, () => now);
        await c2.hydrate();
        const a = c2.get().data.active;
        ok(a && a.backgroundSince === null, 'session reprise');
        eq(a.interruptions[0]?.ms, 2 * MIN, 'interruption close à la reprise');
        eq(remainingMinutes(a, now), 7, 'temps restant juste');
        c2.background();
        await flush();
        // Relance après la fin : terminée, enregistrée, moment de réussite.
        now += 60 * MIN;
        const c3 = createFocusController(mem.storage, key, () => now);
        await c3.hydrate();
        eq(c3.get().data.active, null, 'plus de session active');
        eq(c3.get().finished?.outcome, 'completed', 'réussite affichée au retour');
        eq(c3.get().data.history.length, 1, 'enregistrée une fois');
        await flush();
        const c4 = createFocusController(mem.storage, key, () => now);
        await c4.hydrate();
        eq(c4.get().data.history.length, 1, 'pas de doublon à la relance suivante');
        eq(c4.get().finished, null, 'réussite montrée une seule fois');
      },
    },
    {
      name: 'stockage illisible ou en panne : valeurs sûres, la session continue',
      async run() {
        eq(parseFocusData(null), emptyFocusData(), 'absent');
        eq(parseFocusData('{oops'), emptyFocusData(), 'JSON cassé');
        eq(parseFocusData('42'), emptyFocusData(), 'pas un objet');
        const partial = parseFocusData(JSON.stringify({ history: [{ id: 'a' }, { id: 'b', startedAt: 1, endedAt: 2, plannedMinutes: 10, outcome: 'completed' }], active: { id: 'z', startedAt: 1, durationMs: 7 * MIN } }));
        eq(partial.history.map((r) => r.id), ['b'], 'entrée invalide ignorée');
        eq(partial.active, null, 'session à durée invalide ignorée');
        const broken: FocusStorage = { getItem: async () => { throw new Error('x'); }, setItem: async () => { throw new Error('y'); } };
        const store = createFocusStore(broken, key);
        eq(await store.load(), emptyFocusData(), 'lecture en panne');
        await store.save(emptyFocusData());
        const c = createFocusController(broken, key, () => T0);
        await c.hydrate();
        ok(c.start(10), 'session possible sans stockage');
        let hist: FocusRecord[] = [];
        for (let i = 0; i < HISTORY_LIMIT + 5; i++) hist = pushHistory(hist, { id: `r${i}`, startedAt: i, endedAt: i, plannedMinutes: 10, elapsedMs: 0, awayMs: 0, interruptions: 0, outcome: 'completed' });
        eq(hist.length, HISTORY_LIMIT, 'historique plafonné');
        eq(hist[0].id, 'r5', 'les plus anciennes sortent');
        eq(pushHistory(hist, hist[3]), hist, 'pas de doublon');
        const r = resumeFocus(emptyFocusData(), T0);
        eq(r.finished, null, 'rien à reprendre');
      },
    },
  ];
}
