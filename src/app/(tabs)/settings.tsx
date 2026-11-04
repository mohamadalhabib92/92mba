import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Linking } from 'react-native';
import { ReadingControls } from '../../components/ReadingControls';
import { Badge, Body, Button, Card, Chip, H1, H3, Muted, Row, Screen, ToggleRow } from '../../components/ui';
import { haptic, setHapticsEnabled, useHapticsEnabled } from '../../lib/haptics';
import { useI18n } from '../../lib/i18n';
import { FEATURE_AI } from '../../lib/features';
import { PRIVACY_URL, SUPPORT_URL, supportEmail } from '../../lib/links';
import { appStore } from '../../lib/store';
import { LANGS } from '../../i18n/strings';
import { type ReaderTheme } from '../../theme';
import { useColors } from '../../lib/colors';

export default function Settings() {
  const colors = useColors();
  const { t, lang, setLang, dir } = useI18n();
  const s = appStore.useStore();
  const warning = appStore.useStorageWarning();
  const copyVerified = appStore.useCopyVerified();
  const resetResult = appStore.useResetResult();
  const [confirm, setConfirm] = useState(false);
  const vibrationsOn = useHapticsEnabled();
  const resetBlocked = warning === 'copy-failed' || ((warning === 'unreadable' || warning === 'delete-failed') && !copyVerified);
  const canStartFresh = copyVerified && (warning === 'unreadable' || warning === 'delete-failed');
  const deleteFailed = warning === 'delete-failed' || resetResult === 'delete-failed';
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
        <ReadingControls color={colors.text} muted={colors.muted} />
      </Card>
      <Card>
        <H3>{t('comfort')}</H3>
        <ToggleRow
          label={t('vibrations')}
          hint={t('vibrationsHint')}
          value={vibrationsOn}
          onChange={(on) => {
            setHapticsEnabled(on);
            if (on) haptic.select();
          }}
        />
      </Card>
      <Card>
        <H3>{t('aboutContent')}</H3>
        <Body>{t('aboutContentText')}</Body>
        <Button
          variant="ghost"
          label={t('privacy')}
          icon={<Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />}
          onPress={() => Linking.openURL(PRIVACY_URL).catch(() => undefined)}
        />
        <Button
          variant="ghost"
          label={t('support')}
          icon={<Ionicons name="help-circle-outline" size={16} color={colors.primary} />}
          onPress={() => Linking.openURL(supportEmail() ? `mailto:${supportEmail()}` : SUPPORT_URL).catch(() => undefined)}
        />
      </Card>
      <Card>
        <H3>{t('phase2')}</H3>
        {!FEATURE_AI ? <Badge label={t('optionalUnavailable')} tone="warn" /> : null}
        <Body>{t('phase2Text')}</Body>
      </Card>
      <Card>
        <H3>{t('dataLocal')}</H3>
        <Body>{t('dataLocalText')}</Body>
        {deleteFailed ? <Body>{t('resetDeleteFailed')}</Body> : null}
        {resetBlocked ? (
          <>
            <Body>{t('storageCopyFailed')}</Body>
            <Body>{t('resetRefused')}</Body>
          </>
        ) : canStartFresh ? (
          <>
            <Body>{t('freshStartHint')}</Body>
            <Button
              variant={confirm ? 'danger' : 'ghost'}
              label={confirm ? t('confirmFreshStart') : t('freshStart')}
              onPress={() => {
                if (!confirm) return setConfirm(true);
                appStore.reset();
                setConfirm(false);
              }}
            />
          </>
        ) : (
          <Button
            variant={confirm ? 'danger' : 'ghost'}
            label={confirm ? t('confirmReset') : t('resetData')}
            onPress={() => {
              if (!confirm) return setConfirm(true);
              appStore.reset();
              setConfirm(false);
            }}
          />
        )}
        {resetResult === 'pending' ? <Muted>{t('resetPending')}</Muted> : null}
        {resetResult === 'refused' && !resetBlocked && !deleteFailed ? <Body>{t('resetRefused')}</Body> : null}
        {resetResult === 'wiped' ? <Muted>{t('resetDone')}</Muted> : null}
      </Card>
      <Muted center>92'MBA · v1.0.0</Muted>
    </Screen>
  );
}
