import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import React, { useCallback, useMemo, useState } from 'react';
import { BackHandler, Platform, Pressable, View } from 'react-native';
import { Body, Button, Card, Chip, H1, H2, Muted, Row, Screen } from '../components/ui';
import { useColors } from '../lib/colors';
import { useI18n } from '../lib/i18n';
import { allDocs, findDoc } from '../lib/library';
import { appStore } from '../lib/store';
import { firstString } from '../lib/textGuard';
import { haptic } from '../lib/haptics';
import { FOCUS_DURATIONS, focusTotals, formatClock, progressOf, remainingMinutes, remainingMs, type FocusRecord, type FocusTarget } from '../lib/focus';
import { FocusEmergency, FocusGuide, FocusRing } from '../lib/FocusUI';
import { focus, openFocusTarget, startFocusSession, useFocus, useFocusText, useFocusTheme } from '../lib/focusApp';
import { useFocusNow } from '../lib/focusRuntime';

/** Date courte sans Intl (Hermes) : jj/mm · hh:mm. */
function shortDate(ts: number) {
  const d = new Date(ts);
  const two = (v: number) => (v < 10 ? `0${v}` : String(v));
  return `${two(d.getDate())}/${two(d.getMonth() + 1)} · ${two(d.getHours())}:${two(d.getMinutes())}`;
}

export default function FocusScreen() {
  const colors = useColors();
  const { t, dir } = useI18n();
  const params = useLocalSearchParams<{ doc?: string }>();
  const s = appStore.useStore();
  const { screen: tx, guide, ui: fui } = useFocusText();
  const ft = useFocusTheme();
  const snap = useFocus();
  const active = snap.data.active;
  const now = useFocusNow(!!active);
  const [minutes, setMinutes] = useState<number>(15);
  const [showGuide, setShowGuide] = useState(false);

  // Retour bloqué sur cet écran PENDANT une session seulement : geste iOS (gestureEnabled),
  // toute fermeture de l’écran (usePreventRemove = écouteur beforeRemove) et bouton Retour Android.
  usePreventRemove(!!active, () => undefined);
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return undefined;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => !!focus.get().data.active);
      return () => sub.remove();
    }, []),
  );

  const targets = useMemo(() => {
    const docs = allDocs(s.userDocs);
    const out: { target: FocusTarget; label: string }[] = [];
    const param = findDoc(firstString(params.doc) || undefined, s.userDocs);
    if (param) out.push({ target: { kind: 'doc', id: param.id }, label: tx.continueDoc(param.title) });
    Object.entries(s.progress)
      .sort((a, b) => b[1].updatedAt - a[1].updatedAt)
      .map(([id]) => docs.find((d) => d.id === id))
      .filter((d): d is NonNullable<typeof d> => !!d && d.id !== param?.id)
      .slice(0, param ? 2 : 3)
      .forEach((d) => out.push({ target: { kind: 'doc', id: d.id }, label: tx.continueDoc(d.title) }));
    return out;
  }, [s.userDocs, s.progress, params.doc, tx]);
  const [pick, setPick] = useState(0);
  const chosen = targets[Math.min(pick, Math.max(0, targets.length - 1))];

  const history = snap.data.history;
  const totals = focusTotals(history);
  const guideVisible = snap.hydrated && (!snap.data.guideSeen || showGuide);
  const titleOf = (id?: string) => (id ? findDoc(id, s.userDocs)?.title ?? '' : '');
  const describe = (r: FocusRecord) =>
    [titleOf(r.target?.id), `${Math.round(r.elapsedMs / 60000)}/${r.plannedMinutes} ${fui.minShort}`, r.outcome === 'completed' ? tx.completed : tx.emergencyOutcome, tx.interruptions(r.interruptions)]
      .filter(Boolean)
      .join(' · ');

  return (
    <Screen dir={dir}>
      <Stack.Screen options={{ gestureEnabled: !active }} />
      <Row>
        {active ? null : <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('back')}
          hitSlop={8}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name={dir === 'rtl' ? 'chevron-forward' : 'chevron-back'} size={24} color={colors.text} />
        </Pressable>}
        <View style={{ flex: 1 }}>
          <H1 accessibilityRole="header">{tx.screenTitle}</H1>
          <Muted>{tx.screenSub}</Muted>
        </View>
      </Row>

      {active ? (
        <Card>
          <H2>{tx.activeTitle}</H2>
          <View
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={`${fui.title} — ${fui.ringLabel}`}
            accessibilityValue={{ min: 0, max: Math.round(active.durationMs / 60000), now: Math.round(active.durationMs / 60000) - remainingMinutes(active, now), text: fui.remaining(remainingMinutes(active, now)) }}
            style={{ alignItems: 'center', paddingVertical: 8 }}
          >
            <FocusRing progress={progressOf(active, now)} size={190} theme={ft}>
              <H1 style={{ fontVariant: ['tabular-nums'] }}>{formatClock(remainingMs(active, now))}</H1>
              <Muted>{fui.remaining(remainingMinutes(active, now))}</Muted>
            </FocusRing>
          </View>
          <Muted>{fui.calm}</Muted>
          <Muted>{tx.locked}</Muted>
          <Button label={tx.resume} icon={<Ionicons name="play" size={18} color={colors.onPrimary} />} onPress={() => openFocusTarget(active.target)} />
          <FocusEmergency theme={ft} s={fui} remainingMin={remainingMinutes(active, now)} onEmergency={(ms) => focus.emergency(ms, true)} />
        </Card>
      ) : (
        <>
          <H2>{tx.duration}</H2>
          <Row style={{ flexWrap: 'wrap' }}>
            {FOCUS_DURATIONS.map((m) => (
              <Chip key={m} label={`${m} ${fui.minShort}`} active={minutes === m} onPress={() => setMinutes(m)} />
            ))}
          </Row>

          <H2>{tx.during}</H2>
          {targets.length ? (
            <Row style={{ flexWrap: 'wrap' }}>
              {targets.map((o, i) => (
                <Chip key={o.target.id} label={o.label} active={chosen === o} onPress={() => setPick(i)} />
              ))}
            </Row>
          ) : (
            <Muted>{tx.noDoc}</Muted>
          )}

          <Card>
            {tx.promise.map((line) => (
              <Row key={line} style={{ alignItems: 'flex-start' }}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} style={{ marginTop: 2 }} />
                <Body style={{ flex: 1 }}>{line}</Body>
              </Row>
            ))}
          </Card>

          <Button
            label={tx.start(minutes)}
            icon={<Ionicons name="play" size={18} color={colors.onPrimary} />}
            disabled={!snap.hydrated}
            onPress={() => {
              haptic.select();
              startFocusSession(minutes, chosen?.target, tx.started(minutes));
            }}
          />
        </>
      )}

      {guideVisible ? (
        <Card>
          <FocusGuide
            g={guide}
            theme={ft}
            onOk={() => {
              focus.markGuideSeen();
              setShowGuide(false);
            }}
          />
        </Card>
      ) : snap.hydrated ? (
        <Button label={tx.guideAgain} variant="ghost" onPress={() => setShowGuide(true)} />
      ) : null}

      <H2>{tx.history}</H2>
      {history.length ? (
        <>
          <Muted>{tx.totals(totals.completed, totals.minutes)}</Muted>
          {[...history].reverse().slice(0, 20).map((r) => (
            <Card key={r.id}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Body style={{ fontWeight: '700' }}>{shortDate(r.startedAt)}</Body>
                <Ionicons name={r.outcome === 'completed' ? 'checkmark-circle' : 'exit-outline'} size={18} color={r.outcome === 'completed' ? colors.success : colors.muted} />
              </Row>
              <Muted>{describe(r)}</Muted>
            </Card>
          ))}
        </>
      ) : (
        <Muted>{tx.historyEmpty}</Muted>
      )}
    </Screen>
  );
}
