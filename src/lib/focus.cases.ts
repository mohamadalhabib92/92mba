/**
 * Cas de test du minuteur Mode Focus (sans React Native).
 * Exécutés par `npm test` : durée, pause en arrière-plan / reprise, retour bloqué,
 * minimum imposé, sortie d’urgence (non comptée), persistance de l’historique.
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
  focusNav,
  focusTotals,
  formatClock,
  holdDone,
  holdProgress,
  isComplete,
  onBackground,
  onForeground,
  pausedMs,
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
      name: 'arrière-plan : le minuteur se met en PAUSE, reprend au retour, chaque sortie est une interruption',
      run() {
        let s = startFocus(10, T0, undefined, 'bg');
        s = onBackground(s, T0 + 2 * MIN);
        eq(s.interruptions.length, 1, 'une interruption');
        s = onBackground(s, T0 + 3 * MIN);
        eq(s.interruptions.length, 1, 'double événement : pas de doublon');
        eq(pausedMs(s, T0 + 4 * MIN), 2 * MIN, 'pause en cours');
        eq(elapsedMs(s, T0 + 4 * MIN), 2 * MIN, 'figé pendant la pause');
        eq(elapsedMs(s, T0 + 50 * MIN), 2 * MIN, 'toujours figé longtemps après');
        ok(!isComplete(s, T0 + 50 * MIN), 'jamais terminé en arrière-plan');
        eq(completeFocus(s, T0 + 50 * MIN), null, 'pas de fin hors de l’app');
        s = onForeground(s, T0 + 5 * MIN);
        eq(s.backgroundSince, null, 'retour au premier plan');
        eq(s.interruptions[0], { at: T0 + 2 * MIN, ms: 3 * MIN }, 'durée de l’interruption');
        eq(onForeground(s, T0 + 6 * MIN), s, 'premier plan sans sortie : inchangé');
        eq(elapsedMs(s, T0 + 5 * MIN), 2 * MIN, 'le temps hors app NE compte PAS');
        eq(elapsedMs(s, T0 + 6 * MIN), 3 * MIN, 'le minuteur repart au retour');
        eq(remainingMs(s, T0 + 6 * MIN), 7 * MIN, 'reste juste après la reprise');
        s = onForeground(onBackground(s, T0 + 7 * MIN), T0 + 7 * MIN + 30_000);
        eq(s.interruptions.length, 2, 'deuxième interruption comptée');
        eq(awayMs(s, T0 + 8 * MIN), 3 * MIN + 30_000, 'total hors app');
        // 10 min de concentration atteintes à T0 + 13 min 30 s (3 min 30 s de pause).
        ok(!isComplete(s, T0 + 13 * MIN + 29_999), 'pas fini avant la durée de concentration');
        const r = completeFocus(s, T0 + 20 * MIN);
        ok(r, 'terminée');
        eq(r.outcome, 'completed', 'issue');
        eq(r.elapsedMs, 10 * MIN, 'concentration = durée choisie');
        eq(r.awayMs, 3 * MIN + 30_000, 'pauses enregistrées');
        eq(r.interruptions, 2, 'deux interruptions');
        eq(r.endedAt, T0 + 13 * MIN + 30_000, 'fin = durée + pauses');
        eq(formatClock(9 * MIN + 5_000), '09:05', 'pastille mm:ss');
        eq(formatClock(1), '00:01', 'arrondi supérieur');
        eq(formatClock(-5), '00:00', 'jamais négatif');
        eq(formatClock(30 * MIN, (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[+d])), '٣٠:٠٠', 'chiffres localisés');
      },
    },
    {
      name: 'retour bloqué : seulement sur l’écran Focus et seulement pendant une session',
      run() {
        const content = ['/lesson', '/drill', '/doc'];
        eq(focusNav('/focus', true, content), { blockBack: true, showPill: false, redirect: null }, 'Focus actif : retour bloqué');
        eq(focusNav('/focus/', true, content).blockBack, true, 'barre finale ignorée');
        eq(focusNav('/focus', false, content), { blockBack: false, showPill: false, redirect: null }, 'sans session : retour libre');
        eq(focusNav('/lesson/u1-l1', true, content), { blockBack: false, showPill: true, redirect: null }, 'contenu accessible + pastille');
        eq(focusNav('/drill', true, content).showPill, true, 'révision accessible');
        eq(focusNav('/doc/abc', true, content).redirect, null, 'lecteur accessible');
        eq(focusNav('/learn', true, content), { blockBack: false, showPill: false, redirect: '/focus' }, 'autre écran ⇒ retour au minuteur');
        eq(focusNav('/', true, content).redirect, '/focus', 'accueil ⇒ retour au minuteur');
        eq(focusNav('/lessonx', true, content).redirect, '/focus', 'préfixe strict');
        eq(focusNav('/settings', false, content).redirect, null, 'sans session : aucune redirection');
        // Le contrôleur ne termine pas la session quand on quitte un contenu : seule la fin ou l’urgence la ferment.
        let s = startFocus(10, T0, { kind: 'lesson', id: 'u1-l1' }, 'nav');
        const leave = requestLeave(s, T0 + 5 * MIN);
        ok(!leave.ok && leave.reason === 'minimum', 'sortie ordinaire refusée : session toujours active');
        s = onForeground(onBackground(s, T0 + 6 * MIN), T0 + 7 * MIN);
        ok(!completeFocus(s, T0 + 7 * MIN), 'toujours active');
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
          eq(out.record.elapsedMs, 2 * MIN, 'concentration réelle (pause exclue)');
          eq(out.record.awayMs, 2 * MIN, 'arrière-plan clos');
          eq(out.record.interruptions, 1, 'interruption notée');
          eq(out.record.target, { kind: 'doc', id: 'd' }, 'cible gardée');
        }
        const after = emergencyExit(s, T0 + 31 * MIN, { heldMs: 3200, confirmed: true });
        ok(after.ok && after.record.outcome === 'completed', 'après la fin : compte comme terminée');
      },
    },
    {
      name: 'sortie d’urgence : pas d’écran de réussite, ne compte pas dans les totaux',
      async run() {
        const mem = memoryStorage();
        let now = T0;
        const c = createFocusController(mem.storage, key, () => now);
        await c.hydrate();
        c.start(10);
        now += 10 * MIN;
        ok(c.tick()?.outcome === 'completed', 'une session terminée');
        c.dismissFinished();
        c.start(20);
        now += 5 * MIN;
        ok(c.emergency(3100, true).ok, 'sortie d’urgence');
        eq(c.get().finished, null, 'aucun écran de réussite');
        eq(c.get().data.active, null, 'session close');
        const h = c.get().data.history;
        eq(h.map((r) => r.outcome), ['completed', 'emergency'], 'urgence gardée dans l’historique');
        eq(focusTotals(h), { completed: 1, minutes: 10 }, 'totaux : sessions terminées seulement');
        eq(focusTotals([h[1]]), { completed: 0, minutes: 0 }, 'urgence seule : 0');
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
        ok(c.get().notice && c.get().notice?.awayMs === MIN && c.get().notice?.interruptions === 1, 'message discret au retour');
        c.dismissNotice();
        eq(c.get().notice, null, 'message fermé');
        now += 6 * MIN;
        eq(c.tick(), null, 'pas encore fini (la pause ne compte pas)');
        now += MIN;
        const done = c.tick();
        ok(done && done.outcome === 'completed', 'fin à 10 min de concentration');
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
      name: 'reprise après fermeture de l’app : la pause tient, puis fin enregistrée une seule fois',
      async run() {
        const mem = memoryStorage();
        let now = T0;
        const c = createFocusController(mem.storage, key, () => now);
        await c.hydrate();
        c.start(10);
        now += MIN;
        c.background();
        now += 30 * MIN;
        eq(c.tick(), null, 'pas de fin pendant la pause');
        await flush();
        // Relance 30 min plus tard : la session est en pause depuis la sortie, l’interruption est close.
        const c2 = createFocusController(mem.storage, key, () => now);
        await c2.hydrate();
        const a = c2.get().data.active;
        ok(a && a.backgroundSince === null, 'session reprise');
        eq(a.interruptions[0]?.ms, 30 * MIN, 'interruption close à la reprise');
        eq(remainingMinutes(a, now), 9, 'temps restant : la pause ne compte pas');
        eq(c2.get().notice?.interruptions, 1, 'message discret à la relance');
        await flush();
        // App fermée au premier plan (aucun événement d’arrière-plan) puis relancée après la fin.
        now += 9 * MIN;
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
