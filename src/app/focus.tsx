import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { AppState, View } from 'react-native';
import { BackButton, PageTitle } from '../components/learnChrome';
import { Body, Button, Card, H1, Muted, Screen } from '../components/ui';
import { useTheme } from '../components/theme';
import { FOCUS_CHOICES, setComfort } from '../learn/actions';
import { learnText } from '../learn/copy';
import { touchStreak } from '../learn/study';
import { useI18n } from '../lib/i18n';
import { appStore } from '../lib/store';

const TAG = '92mba-focus';

export default function FocusScreen() {
  const { lang, dir } = useI18n();
  const theme = useTheme();
  const study = appStore.useStore().study;
  const [left, setLeft] = useState(study.focusMinutes * 60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [armed, setArmed] = useState(false);
  const t = (key: Parameters<typeof learnText>[1]) => learnText(lang, key);
  useEffect(() => {
    if (!running) return;
    void activateKeepAwakeAsync(TAG).catch(() => undefined);
    const id = setInterval(() => {
      if (AppState.currentState !== 'active') return;
      setLeft((value) => {
        if (value <= 1) {
          setRunning(false);
          setDone(true);
          appStore.set((state) => ({ study: { ...state.study, ...touchStreak(state.study, Date.now()), resume: { kind: 'focus', id: 'focus' } } }));
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => {
      clearInterval(id);
      void deactivateKeepAwake(TAG).catch(() => undefined);
    };
  }, [running]);
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  return (
    <Screen dir={dir}>
      {!running ? <BackButton /> : null}
      <PageTitle title={t('focus')} text={t('focusHint')} />
      <Card style={{ alignItems: 'center', paddingVertical: 36 }}>
        <H1 style={{ fontVariant: ['tabular-nums'], color: theme.palette.text }}>
          {mm}:{ss}
        </H1>
        {done ? <Body>{t('focusDone')}</Body> : <Muted>{study.focusMinutes} min</Muted>}
      </Card>
      {!running && !done ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {FOCUS_CHOICES.map((minutes) => (
            <Button
              key={minutes}
              small
              variant={study.focusMinutes === minutes ? 'primary' : 'secondary'}
              label={`${minutes}`}
              onPress={() => {
                setComfort({ focusMinutes: minutes });
                setLeft(minutes * 60);
              }}
            />
          ))}
        </View>
      ) : null}
      {!done ? (
        <Button label={running ? t('stay') : t('focus')} onPress={() => setRunning((value) => !value)} />
      ) : (
        <Button label={t('next')} onPress={() => router.back()} />
      )}
      {running ? (
        <Button variant="ghost" label={t('emergency')} onPress={() => setArmed(true)} />
      ) : null}
      {armed ? (
        <Card>
          <Body>{t('leave')}</Body>
          <Button variant="secondary" label={t('stay')} onPress={() => setArmed(false)} />
          <Button variant="danger" label={t('leave')} onPress={() => { setRunning(false); router.back(); }} />
        </Card>
      ) : null}
    </Screen>
  );
}
