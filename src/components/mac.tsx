import { router } from 'expo-router';
import React, { createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import { Platform, useWindowDimensions, type PressableProps } from 'react-native';
import { addMacKeyListener } from 'mba-mac';
import { isIOSAppOnMac } from '../lib/macNative';
import { actionForKey, keyFromWeb, stageFor, stageKind, type KeyAction } from '../lib/stage';

type Handler = (action: KeyAction) => boolean;

type Api = {
  isMac: boolean;
  wide: boolean;
  maxWidth: number;
  focused: string | null;
  register: (id: string, onPress: () => void) => () => void;
  claim: (kind: 'find' | 'escape' | 'arrow', handler: Handler) => () => void;
};

const MacContext = createContext<Api | null>(null);

function iosPad(): boolean {
  return Platform.OS === 'ios' && (Platform as { isPad?: boolean }).isPad === true;
}

function useApi(): Api {
  const ctx = useContext(MacContext);
  const { width } = useWindowDimensions();
  if (ctx) return ctx;
  const kind = stageKind({ os: Platform.OS, isPad: iosPad(), isTV: Platform.isTV === true, isMac: false });
  const stage = stageFor(width, kind);
  return {
    isMac: false,
    wide: stage.wide,
    maxWidth: stage.maxWidth,
    focused: null,
    register: () => () => undefined,
    claim: () => () => undefined,
  };
}

export function useStage() {
  const api = useApi();
  return { wide: api.wide, maxWidth: api.maxWidth, isMac: api.isMac };
}

export function useMacPress(onPress?: () => void): {
  isMac: boolean;
  hovered: boolean;
  focused: boolean;
  bind: Pick<PressableProps, 'onHoverIn' | 'onHoverOut'>;
} {
  const api = useApi();
  const id = useId();
  const [hovered, setHovered] = useState(false);
  const press = useRef(onPress);
  press.current = onPress;
  const enabled = !!onPress;
  useEffect(() => {
    if (!api.isMac || !enabled) return;
    return api.register(id, () => press.current?.());
  }, [api.isMac, api.register, id, enabled]);
  if (!api.isMac) return { isMac: false, hovered: false, focused: false, bind: {} };
  return {
    isMac: true,
    hovered,
    focused: api.focused === id,
    bind: { onHoverIn: () => setHovered(true), onHoverOut: () => setHovered(false) },
  };
}

function useClaim(kind: 'find' | 'escape' | 'arrow', handler: Handler, active: boolean) {
  const api = useApi();
  const saved = useRef(handler);
  saved.current = handler;
  useEffect(() => {
    if (!active) return;
    return api.claim(kind, (action) => saved.current(action));
  }, [api.claim, kind, active]);
}

export function useMacFind(handler: Handler) {
  useClaim('find', handler, true);
}

export function useMacEscape(handler: Handler) {
  useClaim('escape', handler, true);
}

export function useMacArrows(handler: Handler) {
  useClaim('arrow', handler, true);
}

export function MacProvider({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const isMac = isIOSAppOnMac();
  const kind = stageKind({ os: Platform.OS, isPad: iosPad(), isTV: Platform.isTV === true, isMac });
  const stage = stageFor(width, kind);
  const keysOn = isMac || (Platform.OS === 'web' && stage.wide);
  const order = useRef<string[]>([]);
  const actions = useRef(new Map<string, () => void>());
  const claims = useRef({ find: [] as Handler[], escape: [] as Handler[], arrow: [] as Handler[] });
  const [focused, setFocused] = useState<string | null>(null);
  const focusedRef = useRef<string | null>(null);
  focusedRef.current = focused;

  const register = React.useCallback((id: string, onPress: () => void) => {
    actions.current.set(id, onPress);
    if (!order.current.includes(id)) order.current.push(id);
    return () => {
      actions.current.delete(id);
      order.current = order.current.filter((item) => item !== id);
      if (focusedRef.current === id) setFocused(null);
    };
  }, []);

  const claim = React.useCallback((kind: 'find' | 'escape' | 'arrow', handler: Handler) => {
    claims.current[kind].push(handler);
    return () => {
      claims.current[kind] = claims.current[kind].filter((item) => item !== handler);
    };
  }, []);

  const move = (delta: number) => {
    const ids = order.current.filter((id) => actions.current.has(id));
    if (!ids.length) return;
    const current = focusedRef.current ? ids.indexOf(focusedRef.current) : -1;
    const next = ids[(current + delta + ids.length) % ids.length];
    setFocused(next);
  };

  const run = (list: Handler[], action: KeyAction) => {
    for (let i = list.length - 1; i >= 0; i -= 1) {
      if (list[i](action)) return true;
    }
    return false;
  };

  const dispatch = (key: string, typing: boolean) => {
    const action: KeyAction = actionForKey(key, typing);
    if (action === 'ignore') return;
    if (action === 'find') {
      if (!run(claims.current.find, action)) router.push('/search');
      return;
    }
    if (action === 'escape') {
      if (run(claims.current.escape, action)) return;
      if (router.canGoBack()) router.back();
      return;
    }
    if (action === 'activate') {
      const id = focusedRef.current;
      if (id) actions.current.get(id)?.();
      return;
    }
    if (action === 'left' || action === 'right' || action === 'up' || action === 'down') {
      if (run(claims.current.arrow, action)) return;
      move(action === 'left' || action === 'up' ? -1 : 1);
      return;
    }
    move(action === 'prev' ? -1 : 1);
  };

  useEffect(() => {
    if (!keysOn) return;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const onKey = (event: KeyboardEvent) => {
        const name = keyFromWeb(event);
        if (!name) return;
        const tag = (event.target as HTMLElement | null)?.tagName;
        const typing = tag === 'INPUT' || tag === 'TEXTAREA' || (event.target as HTMLElement | null)?.isContentEditable === true;
        if (name === 'find' || (!typing && (name === 'tab' || name === 'tabBack' || name === 'space'))) event.preventDefault();
        dispatch(name, typing);
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
    return addMacKeyListener((key) => dispatch(key, false));
  }, [keysOn]);

  const api = React.useMemo<Api>(
    () => ({ isMac, wide: stage.wide, maxWidth: stage.maxWidth, focused, register, claim }),
    [isMac, stage.wide, stage.maxWidth, focused, register, claim],
  );
  return <MacContext.Provider value={api}>{children}</MacContext.Provider>;
}
