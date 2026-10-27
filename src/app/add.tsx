import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { File as FsFile } from 'expo-file-system';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Platform, StyleSheet, TextInput } from 'react-native';
import { Badge, Body, Button, Card, Chip, H1, H3, Muted, Row, Screen } from '../components/ui';
import { useI18n } from '../lib/i18n';
import { Category, CATEGORY_LABELS, Doc, LicenseKind } from '../lib/library';
import { appStore } from '../lib/store';
import { LANGS, Lang } from '../i18n/strings';
import { colors } from '../theme';

async function readPicked(asset: DocumentPicker.DocumentPickerAsset): Promise<string> {
  if (Platform.OS === 'web' && asset.file) return asset.file.text();
  return new FsFile(asset.uri).text();
}

export default function AddDoc() {
  const { t, lang, dir } = useI18n();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [text, setText] = useState('');
  const [docLang, setDocLang] = useState<Lang>(lang);
  const [category, setCategory] = useState<Category>('other');
  const [kind, setKind] = useState<Extract<LicenseKind, 'owned' | 'public-domain' | 'open'>>('owned');
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');

  const pick = async () => {
    setError('');
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: ['text/plain', 'text/markdown'], copyToCacheDirectory: true });
      if (res.canceled || !res.assets?.[0]) return;
      const a = res.assets[0];
      const content = await readPicked(a);
      setText(content);
      if (!title) setTitle(a.name.replace(/\.(txt|md)$/i, ''));
    } catch (e) {
      setError(String((e as Error)?.message ?? e));
    }
  };

  const save = () => {
    const paragraphs = text
      .replace(/\r\n/g, '\n')
      .split(/\n\s*\n/)
      .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
      .filter(Boolean);
    if (!title.trim() || paragraphs.length === 0) return setError(t('required'));
    const labels = { owned: t('licOwned'), 'public-domain': t('licPD'), open: t('licOpen') };
    const doc: Doc = {
      id: `user-${Date.now().toString(36)}`,
      title: title.trim(),
      author: author.trim() || '—',
      lang: docLang,
      category,
      license: { kind, label: details.trim() ? `${labels[kind]} — ${details.trim()}` : labels[kind], source: details.trim() || undefined },
      summary: paragraphs[0].slice(0, 160),
      paragraphs,
      userAdded: true,
    };
    appStore.set((s) => ({ userDocs: [doc, ...s.userDocs] }));
    router.replace({ pathname: '/doc/[id]', params: { id: doc.id } });
  };

  return (
    <Screen dir={dir}>
      <Row style={{ justifyContent: 'space-between' }}>
        <H1>{t('add')}</H1>
        <Button small variant="ghost" label={t('close')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/library'))} />
      </Row>
      <Card style={{ backgroundColor: '#FFF6DC' }}>
        <Row>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.accent} />
          <Body style={{ flex: 1 }}>{t('rightsNotice')}</Body>
        </Row>
      </Card>
      <Card>
        <H3>{t('title')}</H3>
        <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholder={t('title')} placeholderTextColor={colors.muted} />
        <H3>{t('author')}</H3>
        <TextInput value={author} onChangeText={setAuthor} style={styles.input} placeholder={t('author')} placeholderTextColor={colors.muted} />
        <H3>{t('language')}</H3>
        <Row style={{ flexWrap: 'wrap' }}>
          {LANGS.map((l) => (
            <Chip key={l.code} label={l.label} active={docLang === l.code} onPress={() => setDocLang(l.code)} />
          ))}
        </Row>
        <H3>{t('category')}</H3>
        <Row style={{ flexWrap: 'wrap' }}>
          {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
            <Chip key={c} label={CATEGORY_LABELS[c][lang]} active={category === c} onPress={() => setCategory(c)} />
          ))}
        </Row>
      </Card>
      <Card>
        <H3>{t('licenseKind')}</H3>
        <Row style={{ flexWrap: 'wrap' }}>
          <Chip label={t('licOwned')} active={kind === 'owned'} onPress={() => setKind('owned')} />
          <Chip label={t('licPD')} active={kind === 'public-domain'} onPress={() => setKind('public-domain')} />
          <Chip label={t('licOpen')} active={kind === 'open'} onPress={() => setKind('open')} />
        </Row>
        <TextInput value={details} onChangeText={setDetails} style={styles.input} placeholder={t('licenseDetails')} placeholderTextColor={colors.muted} />
      </Card>
      <Card>
        <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <H3>{t('text')}</H3>
          <Button small variant="secondary" label={t('importTxt')} icon={<Ionicons name="document-attach-outline" size={16} color={colors.primary} />} onPress={pick} />
        </Row>
        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          style={[styles.input, { minHeight: 200, textAlignVertical: 'top' }]}
          placeholder={t('pasteText')}
          placeholderTextColor={colors.muted}
        />
        {text ? <Muted>{text.length.toLocaleString()} car.</Muted> : null}
      </Card>
      {error ? <Badge label={error} tone="warn" /> : null}
      <Button label={t('save')} icon={<Ionicons name="checkmark" size={18} color="#fff" />} onPress={save} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.bg,
  },
});
