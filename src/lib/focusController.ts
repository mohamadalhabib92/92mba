import {
  createFocusStore,
  emergencyExit,
  emptyFocusData,
  isComplete,
  completeFocus,
  onBackground,
  onForeground,
  pushHistory,
  resumeFocus,
  startFocus,
  type EmergencyResult,
  type FocusData,
  type FocusSession,
  type FocusRecord,
  type FocusStorage,
  type FocusTarget,
} from './focus';

/**
 * Contrôleur du Mode Focus : état en mémoire + persistance sous une clé dédiée.
 * Sans React Native (stockage et horloge injectés) : testé tel quel.
 */
/** Message discret au retour dans l’app : durée de la pause qui vient de finir et nombre total d’interruptions. */
export type FocusNotice = { awayMs: number; interruptions: number; at: number };
export type FocusSnapshot = { hydrated: boolean; data: FocusData; finished: FocusRecord | null; notice: FocusNotice | null };

/** Pause qui vient d’être close (avant → après onForeground), sinon null. */
function noticeFor(before: FocusSession, after: FocusSession, now: number): FocusNotice | null {
  if (before.backgroundSince === null || after.backgroundSince !== null) return null;
  const last = after.interruptions[after.interruptions.length - 1];
  return { awayMs: last?.ms ?? 0, interruptions: after.interruptions.length, at: now };
}

export function createFocusController(storage: FocusStorage, key: string, clock: () => number = () => Date.now()) {
  const store = createFocusStore(storage, key);
  let snap: FocusSnapshot = { hydrated: false, data: emptyFocusData(), finished: null, notice: null };
  let touched = false;
  const listeners = new Set<() => void>();
  const set = (next: Partial<FocusSnapshot>, persist = true) => {
    snap = { ...snap, ...next };
    listeners.forEach((l) => l());
    if (persist) void store.save(snap.data);
  };
  const finish = (record: FocusRecord) => set({ data: { ...snap.data, active: null, history: pushHistory(snap.data.history, record) }, finished: record, notice: null });

  return {
    key,
    get: () => snap,
    subscribe(l: () => void) {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    async hydrate() {
      const loaded = await store.load();
      // Une session démarrée pendant le chargement l’emporte sur la valeur lue.
      if (touched) {
        set({ hydrated: true, data: { ...snap.data, history: [...loaded.history.filter((r) => !snap.data.history.some((h) => h.id === r.id)), ...snap.data.history], guideSeen: snap.data.guideSeen || loaded.guideSeen } });
        return;
      }
      const now = clock();
      const { data, finished } = resumeFocus(loaded, now);
      // App relancée alors qu’elle était en arrière-plan : la pause est close, on le signale.
      const notice = loaded.active && data.active ? noticeFor(loaded.active, data.active, now) : null;
      set({ hydrated: true, data, finished, notice }, data !== loaded);
    },
    start(minutes: number, target?: FocusTarget) {
      if (snap.data.active) return snap.data.active;
      touched = true;
      const active = startFocus(minutes, clock(), target);
      set({ data: { ...snap.data, active }, finished: null, notice: null });
      return active;
    },
    /** AppState → arrière-plan. */
    background() {
      const a = snap.data.active;
      if (!a) return;
      const next = onBackground(a, clock());
      if (next !== a) set({ data: { ...snap.data, active: next } });
    },
    /** AppState → premier plan : la pause se termine, le minuteur repart, un message discret le signale. */
    foreground() {
      const a = snap.data.active;
      if (!a) return;
      const now = clock();
      const next = onForeground(a, now);
      const done = completeFocus(next, now);
      if (done) return finish(done);
      if (next !== a) set({ data: { ...snap.data, active: next }, notice: noticeFor(a, next, now) });
    },
    dismissNotice() {
      if (snap.notice) set({ notice: null }, false);
    },
    /** Appelé chaque seconde : fin de session à l’heure prévue. */
    tick(): FocusRecord | null {
      const a = snap.data.active;
      // En arrière-plan le minuteur est en pause : pas de fin possible.
      if (!a || a.backgroundSince !== null || !isComplete(a, clock())) return null;
      const done = completeFocus(a, clock());
      if (done) finish(done);
      return done;
    },
    emergency(heldMs: number, confirmed: boolean): EmergencyResult {
      const a = snap.data.active;
      if (!a) return { ok: false, reason: 'confirm' };
      const r = emergencyExit(a, clock(), { heldMs, confirmed });
      if (r.ok) {
        if (r.record.outcome === 'completed') finish(r.record);
        else set({ data: { ...snap.data, active: null, history: pushHistory(snap.data.history, r.record) }, finished: null, notice: null });
      }
      return r;
    },
    dismissFinished() {
      if (snap.finished) set({ finished: null }, false);
    },
    markGuideSeen() {
      if (!snap.data.guideSeen) set({ data: { ...snap.data, guideSeen: true } });
    },
  };
}

export type FocusController = ReturnType<typeof createFocusController>;
