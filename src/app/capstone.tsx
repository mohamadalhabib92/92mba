import React, { useState } from 'react';
import { BackButton, Choice, PageTitle, ProvenanceLine } from '../components/learnChrome';
import { Body, Button, Card, H2, H3, Screen } from '../components/ui';
import { useTheme } from '../components/theme';
import { saveCapstone } from '../learn/actions';
import { capstone } from '../learn/content/catalog';
import { learnText } from '../learn/copy';
import { pick } from '../learn/l10n';
import { PASS_RATIO } from '../learn/study';
import { useI18n } from '../lib/i18n';
import { appStore } from '../lib/store';

export default function CapstoneScreen() {
  const { lang, dir } = useI18n();
  const theme = useTheme();
  const already = appStore.useStore().study.capstoneAt;
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(!!already);
  const t = (key: Parameters<typeof learnText>[1]) => learnText(lang, key);
  const decision = capstone.decisions[step];
  const commit = () => {
    if (!decision || picked === null) return;
    const next = correct + (picked === decision.answer ? 1 : 0);
    if (step + 1 >= capstone.decisions.length) {
      setCorrect(next);
      setDone(true);
      if (next / capstone.decisions.length >= PASS_RATIO) saveCapstone();
      return;
    }
    setCorrect(next);
    setPicked(null);
    setStep(step + 1);
  };
  return (
    <Screen dir={dir}>
      <BackButton />
      <PageTitle title={pick(capstone.title, lang)} text={t('studyLead')} />
      {capstone.scenes.map((scene) => (
        <Card key={scene.title.fr}>
          <H3>{pick(scene.title, lang)}</H3>
          <Body>{pick(scene.body, lang)}</Body>
        </Card>
      ))}
      {done ? (
        <Card>
          <H2>{correct / capstone.decisions.length >= PASS_RATIO || already ? t('pass') : t('keep')}</H2>
          <Body>{correct} / {capstone.decisions.length}</Body>
        </Card>
      ) : decision ? (
        <Card>
          <H2>{pick(decision.prompt, lang)}</H2>
          {decision.options.map((option, index) => (
            <Choice key={option.fr} label={pick(option, lang)} selected={picked === index} onPress={() => setPicked(index)} />
          ))}
          {picked !== null && picked !== decision.answer ? <Body style={{ color: theme.palette.noticeText }}>{pick(decision.why, lang)}</Body> : null}
          <Button label={t('check')} disabled={picked === null} onPress={commit} />
        </Card>
      ) : null}
      <ProvenanceLine provenance={capstone.provenance} />
    </Screen>
  );
}
