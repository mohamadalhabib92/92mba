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
  type FocusRecord,
  type FocusStorage,
  type FocusTarget,
} from './focus';

/**
 * Contrôleur du Mode Focus : état en mémoire + persistance sous une clé dédiée.
 * Sans React Native (stockage et horloge injectés) : testé tel quel.
 */
export type FocusSnapshot = { hydrated: boolean; data: FocusData; finished: FocusRecord | null };

export function createFocusController(storage: FocusStorage, key: string, clock: () => number = () => Date.now()) {
  const store = createFocusStore(storage, key);
  let snap: FocusSnapshot = { hydrated: false, data: emptyFocusData(), finished: null };
  let touched = false;
  const listeners = new Set<() => void>();
  const set = (next: Partial<FocusSnapshot>, persist = true) => {
    snap = { ...snap, ...next };
    listeners.forEach((l) => l());
    if (persist) void store.save(snap.data);
  };
  const finish = (record: FocusRecord) => set({ data: { ...snap.data, active: null, history: pushHistory(snap.data.history, record) }, finished: record });

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
      const { data, finished } = resumeFocus(loaded, clock());
      set({ hydrated: true, data, finished }, data !== loaded);
    },
    start(minutes: number, target?: FocusTarget) {
      if (snap.data.active) return snap.data.active;
      touched = true;
      const active = startFocus(minutes, clock(), target);
      set({ data: { ...snap.data, active }, finished: null });
      return active;
    },
    /** AppState → arrière-plan. */
    background() {
      const a = snap.data.active;
      if (!a) return;
      const next = onBackground(a, clock());
      if (next !== a) set({ data: { ...snap.data, active: next } });
    },
    /** AppState → premier plan ; termine la session si la durée est atteinte entre-temps. */
    foreground() {
      const a = snap.data.active;
      if (!a) return;
      const now = clock();
      const next = onForeground(a, now);
      const done = completeFocus(next, now);
      if (done) return finish(done);
      if (next !== a) set({ data: { ...snap.data, active: next } });
    },
    /** Appelé chaque seconde : fin de session à l’heure prévue. */
    tick(): FocusRecord | null {
      const a = snap.data.active;
      if (!a || !isComplete(a, clock())) return null;
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
        else set({ data: { ...snap.data, active: null, history: pushHistory(snap.data.history, r.record) }, finished: null });
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
