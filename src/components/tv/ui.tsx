import React, { createContext, useContext, useRef, useState } from 'react';
import { Pressable, ScrollView, View, type ScrollViewInstance } from 'react-native';
import { TV_FOCUS_SCALE, TV_SAFE, TV_TYPE } from '../../tv/metrics';
import { useTheme } from '../theme';
import { Body, H1, Muted } from '../ui';

type Host = {
  measureLayout: (
    relative: object,
    onSuccess: (x: number, y: number, width: number, height: number) => void,
    onFail: () => void,
  ) => void;
};

type ScrollApi = { scrollToFocus: (node: Host | null) => void };
const ScrollFocus = createContext<ScrollApi | null>(null);

/** Présent dans react-native-tvos. Sur iPhone et le web, un View suffit : cet écran n’est pas la route de départ. */
const RN = require('react-native') as {
  TVFocusGuideView?: React.ComponentType<{
    style?: object;
    children?: React.ReactNode;
    trapFocusUp?: boolean;
    trapFocusDown?: boolean;
    trapFocusLeft?: boolean;
    trapFocusRight?: boolean;
  }>;
};
const TVFocusGuideView = RN.TVFocusGuideView ?? View;

export function TvScreen({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const ref = useRef<ScrollViewInstance>(null);
  const scrollToFocus = (node: Host | null) => {
    const scroller = ref.current;
    if (!node || !scroller) return;
    node.measureLayout(
      scroller,
      (_x, y) => {
        scroller.scrollTo({ y: Math.max(0, y - TV_SAFE.vertical), animated: true });
      },
      () => undefined,
    );
  };
  return (
    <ScrollFocus.Provider value={{ scrollToFocus }}>
      <TVFocusGuideView style={{ flex: 1 }} trapFocusUp trapFocusDown trapFocusLeft trapFocusRight>
        <ScrollView
          ref={ref}
          style={{ flex: 1, backgroundColor: theme.palette.bg }}
          contentContainerStyle={{
            paddingHorizontal: TV_SAFE.horizontal,
            paddingVertical: TV_SAFE.vertical,
            gap: 28,
          }}
        >
          {children}
        </ScrollView>
      </TVFocusGuideView>
    </ScrollFocus.Provider>
  );
}

export function TvTitle({ children }: { children: React.ReactNode }) {
  return <H1 style={{ fontSize: TV_TYPE.display, lineHeight: 72 }}>{children}</H1>;
}

export function TvBody({ children }: { children: React.ReactNode }) {
  return <Body style={{ fontSize: TV_TYPE.body, lineHeight: 44 }}>{children}</Body>;
}

export function TvHint({ children }: { children: React.ReactNode }) {
  return <Muted style={{ fontSize: TV_TYPE.hint, lineHeight: 32 }}>{children}</Muted>;
}

/**
 * Un seul bouton focusable. Le focus est un fond clair, un bord épais,
 * un agrandissement et un halo. Le reste est atténué.
 */
export function TvFocusable({
  label,
  hint,
  onPress,
  preferred,
  children,
}: {
  label: string;
  hint?: string;
  onPress?: () => void;
  preferred?: boolean;
  children?: React.ReactNode;
}) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const viewRef = useRef<Host | null>(null);
  const scroll = useContext(ScrollFocus);
  return (
    <Pressable
      ref={(node) => {
        viewRef.current = node as unknown as Host | null;
      }}
      accessibilityRole="button"
      accessibilityLabel={hint ? `${label}. ${hint}` : label}
      hasTVPreferredFocus={preferred}
      onFocus={() => {
        setFocused(true);
        scroll?.scrollToFocus(viewRef.current);
      }}
      onBlur={() => setFocused(false)}
      onPress={onPress}
      style={{
        minHeight: 88,
        borderRadius: 22,
        paddingHorizontal: 28,
        paddingVertical: 18,
        justifyContent: 'center',
        opacity: focused ? 1 : 0.55,
        transform: [{ scale: focused ? TV_FOCUS_SCALE : 1 }],
        backgroundColor: focused ? theme.palette.primary : theme.palette.surface,
        borderWidth: focused ? 6 : 2,
        borderColor: focused ? theme.palette.accent : theme.palette.border,
        shadowColor: theme.palette.accent,
        shadowOpacity: focused ? 0.85 : 0,
        shadowRadius: focused ? 24 : 0,
        shadowOffset: { width: 0, height: 0 },
      }}
    >
      {children ?? (
        <>
          <Body style={{ color: focused ? theme.palette.onPrimary : theme.palette.text, fontSize: TV_TYPE.button, fontWeight: '800' }}>{label}</Body>
          {hint ? (
            <Muted style={{ color: focused ? theme.palette.onPrimary : theme.palette.muted, fontSize: TV_TYPE.hint, marginTop: 6 }}>{hint}</Muted>
          ) : null}
        </>
      )}
    </Pressable>
  );
}
