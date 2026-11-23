import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Linking, Platform, Share } from 'react-native';
import { ReadingControls } from '../../components/ReadingControls';
import { Badge, Body, Button, Card, Chip, H1, H3, Muted, Row, Screen } from '../../components/ui';
import { FOCUS_CHOICES, setComfort } from '../../learn/actions';
import { learnText } from '../../learn/copy';
import { useI18n } from '../../lib/i18n';
import { FEATURE_AI } from '../../lib/features';
import { PRIVACY_URL, SUPPORT_URL, supportEmail } from '../../lib/links';
import { utf8ByteLength } from '../../lib/sha256';
import { appStore } from '../../lib/store';
import { LANGS } from '../../i18n/strings';
import { useTheme } from '../../components/theme';
import { type ReaderTheme } from '../../theme';

/** Télécharge ou partage la copie brute sans la placer dans l'arbre React. */
async function deliverRawExport(raw: string): Promise<boolean> {
  const filename = '92mba-export-brut.json';
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return true;
  }
  try {
    const result = await Share.share({ title: filename, message: raw });
    return result.action !== Share.dismissedAction;
  } catch {
    return false;
  }
}

export default function Settings() {
  const { t, lang, setLang, dir } = useI18n();
  const theme = useTheme();
  const s = appStore.useStore();
  const warning = appStore.useStorageWarning();
  const copyVerified = appStore.useCopyVerified();
  const resetResult = appStore.useResetResult();
  const preserve = appStore.usePreserveReport();
  const [confirm, setConfirm] = useState(false);
  const [exportArmed, setExportArmed] = useState(false);
  const [exportNote, setExportNote] = useState<'idle' | 'ready' | 'failed'>('idle');
  const [exportBytes, setExportBytes] = useState(0);
  const [loggedOut, setLoggedOut] = useState(false);
  const heldAside = warning === 'unreadable' || warning === 'version-quarantine' || warning === 'delete-failed';
  const resetBlocked = warning === 'copy-failed' || (heldAside && !copyVerified);
  const canStartFresh = copyVerified && heldAside;
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
        <H3>{learnText(lang, 'comfort')}</H3>
        <Body>{learnText(lang, 'notMedical')}</Body>
        <Muted>{learnText(lang, 'appearance')}</Muted>
        <Row style={{ flexWrap: 'wrap' }}>
          {(['system', 'light', 'dark'] as const).map((mode) => (
            <Chip key={mode} label={learnText(lang, mode)} active={s.study.appearance === mode} onPress={() => setComfort({ appearance: mode })} />
          ))}
        </Row>
        <Row style={{ flexWrap: 'wrap' }}>
          <Chip label={learnText(lang, 'contrast')} active={s.study.highContrast} onPress={() => setComfort({ highContrast: !s.study.highContrast })} />
          <Chip label={learnText(lang, 'motion')} active={s.study.reduceMotion === true} onPress={() => setComfort({ reduceMotion: s.study.reduceMotion === true ? null : true })} />
        </Row>
        <Muted>{learnText(lang, 'celebrate')}</Muted>
        <Row style={{ flexWrap: 'wrap' }}>
          {(['full', 'reduced', 'off'] as const).map((level) => (
            <Chip key={level} label={learnText(lang, level)} active={s.study.celebrations === level} onPress={() => setComfort({ celebrations: level })} />
          ))}
        </Row>
        <Muted>{learnText(lang, 'scheduler')}</Muted>
        <Row style={{ flexWrap: 'wrap' }}>
          <Chip label={learnText(lang, 'sm2')} active={s.study.scheduler === 'sm2'} onPress={() => setComfort({ scheduler: 'sm2' })} />
          <Chip label={learnText(lang, 'fsrs')} active={s.study.scheduler === 'fsrs'} onPress={() => setComfort({ scheduler: 'fsrs' })} />
        </Row>
        <Muted>{learnText(lang, 'focusLen')}</Muted>
        <Row style={{ flexWrap: 'wrap' }}>
          {FOCUS_CHOICES.map((minutes) => (
            <Chip key={minutes} label={`${minutes}`} active={s.study.focusMinutes === minutes} onPress={() => setComfort({ focusMinutes: minutes })} />
          ))}
        </Row>
        <Chip label={learnText(lang, 'reminderToggle')} active={s.study.reminderEnabled} onPress={() => setComfort({ reminderEnabled: !s.study.reminderEnabled })} />
        <Button variant="ghost" label={learnText(lang, 'focus')} onPress={() => router.push('/focus')} />
        <Button variant="ghost" label={learnText(lang, 'glossary')} onPress={() => router.push('/glossary')} />
        <Button variant="ghost" label={learnText(lang, 'formulas')} onPress={() => router.push('/formulas')} />
        <Button variant="ghost" label={learnText(lang, 'capstone')} onPress={() => router.push('/capstone')} />
      </Card>
      <Card>
        <H3>{t('readerTheme')}</H3>
        <Row style={{ flexWrap: 'wrap' }}>
          {themes.map((th) => (
            <Chip key={th.k} label={th.l} active={s.readerTheme === th.k} onPress={() => appStore.set({ readerTheme: th.k })} />
          ))}
        </Row>
        <ReadingControls color={theme.palette.text} muted={theme.palette.muted} />
      </Card>
      <Card>
        <H3>{t('aboutContent')}</H3>
        <Body>{t('aboutContentText')}</Body>
        <Button
          variant="ghost"
          label={t('privacy')}
          icon={<Ionicons name="shield-checkmark-outline" size={16} color={theme.palette.primary} />}
          onPress={() => Linking.openURL(PRIVACY_URL).catch(() => undefined)}
        />
        <Button
          variant="ghost"
          label={t('support')}
          icon={<Ionicons name="help-circle-outline" size={16} color={theme.palette.primary} />}
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
        <Body>
          {t('preserveCounts', {
            docs: preserve.userDocs,
            progress: preserve.progressEntries,
            bookmarks: preserve.bookmarkLists,
            history: preserve.historyEntries,
            bytes: preserve.bytes,
          })}
        </Body>
        {preserve.sha256 ? <Muted>{t('preserveHash', { hash: preserve.sha256.slice(0, 16) })}</Muted> : null}
        {warning === 'write-failed' ? (
          <>
            <Body>{t('storageWriteFailed')}</Body>
            <Button label={t('retrySave')} onPress={() => appStore.retrySave()} />
          </>
        ) : null}
        <Button
          variant={exportArmed ? 'primary' : 'ghost'}
          label={exportArmed ? t('confirmExportRaw') : t('exportRaw')}
          onPress={() => {
            if (!exportArmed) {
              setExportArmed(true);
              setExportNote('idle');
              return;
            }
            setExportArmed(false);
            void appStore.exportRaw().then(async (raw) => {
              if (raw == null) {
                setExportNote('failed');
                return;
              }
              const bytes = utf8ByteLength(raw);
              const delivered = await deliverRawExport(raw);
              setExportBytes(bytes);
              setExportNote(delivered ? 'ready' : 'failed');
            });
          }}
        />
        {exportNote === 'ready' ? <Muted>{t('exportReady', { bytes: exportBytes })}</Muted> : null}
        {exportNote === 'failed' ? <Body>{t('exportFailed')}</Body> : null}
        <Button
          variant="ghost"
          label={t('logout')}
          onPress={() => {
            appStore.logout();
            setLoggedOut(true);
          }}
        />
        {loggedOut ? <Muted>{t('logoutNoAccount')}</Muted> : null}
        <Body>{t('resetNotLogout')}</Body>
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
