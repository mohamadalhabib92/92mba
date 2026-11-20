import * as Speech from 'expo-speech';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Platform, View } from 'react-native';
import { BackButton, Choice, PageTitle, ProvenanceLine, ScreenProgress } from '../../components/learnChrome';
import { haptic } from '../../components/haptics';
import { Body, Button, Card, H2, Screen } from '../../components/ui';
import { useTheme } from '../../components/theme';
import { finishLesson, moveLesson } from '../../learn/actions';
import { modules } from '../../learn/content/catalog';
import { learnText } from '../../learn/copy';
import { pick } from '../../learn/l10n';
import { useI18n } from '../../lib/i18n';
import { appStore } from '../../lib/store';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lang, dir } = useI18n();
  const theme = useTheme();
  const saved = appStore.useStore().study.lessons[String(id)]?.screen ?? 0;
  const found = useMemo(() => {
    for (const mod of modules) {
      const lesson = mod.lessons.find((item) => item.id === id);
      if (lesson) return { mod, lesson };
    }
    return null;
  }, [id]);
  const [index, setIndex] = useState(saved);
  const [picked, setPicked] = useState<number | null>(null);
  const [spoken, setSpoken] = useState(false);
  const t = (key: Parameters<typeof learnText>[1]) => learnText(lang, key);
  if (!found) {
    return (
      <Screen dir={dir}>
        <BackButton />
      </Screen>
    );
  }
  const { mod, lesson } = found;
  const screen = lesson.screens[Math.min(index, lesson.screens.length - 1)];
  const last = index >= lesson.screens.length - 1;
  const speechLang = lang === 'ar' ? 'ar' : lang === 'en' ? 'en-US' : 'fr-FR';
  const speak = () => {
    if (Platform.isTV) return;
    const text =
      screen.kind === 'check' ? pick(screen.prompt, lang) : `${pick(screen.title, lang)}. ${pick(screen.body, lang)}`;
    if (spoken) {
      try {
        Speech.stop();
      } catch {
        /* voix absente sur cet appareil */
      }
      setSpoken(false);
      return;
    }
    setSpoken(true);
    try {
      Speech.speak(text, { language: speechLang, rate: 0.95, onDone: () => setSpoken(false), onStopped: () => setSpoken(false) });
    } catch {
      setSpoken(false);
    }
  };
  const advance = () => {
    if (!last) {
      const next = index + 1;
      setIndex(next);
      setPicked(null);
      moveLesson(lesson.id, next);
      return;
    }
    finishLesson(lesson.id, mod.id, mod.lessons.map((item) => item.id));
    router.back();
  };
  const checked = screen.kind === 'check' && picked !== null;
  const correct = screen.kind === 'check' && picked === screen.answer;
  return (
    <Screen dir={dir}>
      <BackButton />
      <PageTitle kicker={pick(mod.title, lang)} title={pick(lesson.title, lang)} />
      <ScreenProgress value={(index + 1) / lesson.screens.length} label={`${t('oneConcept')} · ${index + 1}/${lesson.screens.length}`} />
      <Card>
        {screen.kind === 'check' ? (
          <View style={{ gap: 10 }}>
            <H2>{pick(screen.prompt, lang)}</H2>
            {screen.options.map((option, optionIndex) => (
              <Choice
                key={option.fr}
                label={pick(option, lang)}
                selected={picked === optionIndex}
                onPress={() => {
                  setPicked(optionIndex);
                  void haptic(optionIndex === screen.answer ? 'success' : 'warn');
                }}
              />
            ))}
            {checked ? <Body style={{ color: correct ? theme.palette.success : theme.palette.noticeText }}>{correct ? t('nice') : `${t('almost')} ${pick(screen.why, lang)}`}</Body> : null}
            <Button label={t('check')} disabled={picked === null} onPress={() => setPicked((value) => value)} />
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            <H2>{pick(screen.title, lang)}</H2>
            <Body>{pick(screen.body, lang)}</Body>
          </View>
        )}
      </Card>
      <ProvenanceLine provenance={lesson.provenance} />
      <Button variant="ghost" label={spoken ? t('stopSpeak') : t('speak')} onPress={speak} />
      <Button label={last ? t('lessonDone') : t('next')} disabled={screen.kind === 'check' && picked === null} onPress={advance} />
    </Screen>
  );
}
