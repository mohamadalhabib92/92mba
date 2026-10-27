import React, { useState } from 'react';
import { Body, Button, Card, Chip, H1, H3, Muted, Row, Screen } from '../../components/ui';
import { useI18n } from '../../lib/i18n';
import { appStore } from '../../lib/store';
import { LANGS } from '../../i18n/strings';
import type { ReaderTheme } from '../../theme';

export default function Settings() {
  const { t, lang, setLang, dir } = useI18n();
  const s = appStore.useStore();
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const themes: { k: ReaderTheme; l: string }[] = [
    { k: 'light', l: t('themeLight') },
    { k: 'sepia', l: t('themeSepia') },
    { k: 'dark', l: t('themeDark') },
  ];
  return (
    <Screen dir={dir}>
      <H1>{t('settings')}</H1>
      <Card>
        <H3>{t('interfaceLanguage')}</H3>
        <Row style={{ flexWrap: 'wrap' }}>
          {LANGS.map((l) => (
            <Chip key={l.code} label={l.label} active={lang === l.code} onPress={() => setLang(l.code)} />
          ))}
        </Row>
      </Card>
      <Card>
        <H3>{t('readerTheme')}</H3>
        <Row style={{ flexWrap: 'wrap' }}>
          {themes.map((th) => (
            <Chip key={th.k} label={th.l} active={s.readerTheme === th.k} onPress={() => appStore.set({ readerTheme: th.k })} />
          ))}
        </Row>
        <Row>
          <Button small variant="secondary" label="A-" onPress={() => appStore.set({ fontScale: Math.max(0.8, +(s.fontScale - 0.1).toFixed(2)) })} />
          <Muted>{Math.round(s.fontScale * 100)} %</Muted>
          <Button small variant="secondary" label="A+" onPress={() => appStore.set({ fontScale: Math.min(1.8, +(s.fontScale + 0.1).toFixed(2)) })} />
        </Row>
      </Card>
      <Card>
        <H3>{t('aboutContent')}</H3>
        <Body>{t('aboutContentText')}</Body>
      </Card>
      <Card>
        <H3>{t('phase2')}</H3>
        <Body>{t('phase2Text')}</Body>
      </Card>
      <Card>
        <H3>{t('dataLocal')}</H3>
        <Body>{t('dataLocalText')}</Body>
        <Button
          variant={confirm ? 'danger' : 'ghost'}
          label={confirm ? t('confirmReset') : t('resetData')}
          onPress={() => {
            if (!confirm) return setConfirm(true);
            appStore.reset();
            setConfirm(false);
            setDone(true);
          }}
        />
        {done ? <Muted>{t('resetDone')}</Muted> : null}
      </Card>
      <Muted center>92'MBA · v1.0.0</Muted>
    </Screen>
  );
}
