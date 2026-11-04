#!/usr/bin/env node
/**
 * Contrôle statique d’accessibilité : chaque élément interactif natif
 * (Pressable, Touchable*, Switch, TextInput) déclare un rôle et un libellé
 * pour VoiceOver/TalkBack. Les composants du kit (Button, Chip…) les posent eux-mêmes.
 * Usage : node scripts/a11y-scan.mjs [dossier=src]
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] ?? 'src');
const TAGS = ['Pressable', 'TouchableOpacity', 'TouchableHighlight', 'TouchableWithoutFeedback', 'Switch', 'TextInput'];
const problems = [];

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (p.endsWith('.tsx')) scan(p);
  }
}

/** Texte de la balise ouvrante, accolades et chaînes respectées. */
function openingTag(src, start) {
  let depth = 0;
  let quote = null;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') quote = c;
    else if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (c === '>' && depth === 0 && src[i - 1] !== '=') return src.slice(start, i + 1);
  }
  return src.slice(start);
}

function scan(file) {
  const src = fs.readFileSync(file, 'utf8');
  for (const tag of TAGS) {
    const re = new RegExp(`<${tag}(?=[\\s/>])`, 'g');
    let m;
    while ((m = re.exec(src))) {
      const text = openingTag(src, m.index);
      const line = src.slice(0, m.index).split('\n').length;
      const where = `${path.relative(process.cwd(), file)}:${line} <${tag}>`;
      const spread = /\{\.\.\.\w+\}/.test(text);
      const hasLabel = /accessibilityLabel=|aria-label=/.test(text);
      const hasRole = /accessibilityRole=|role=/.test(text);
      const hidden = /accessible=\{false\}|importantForAccessibility="no/.test(text);
      if (hidden) continue;
      if (!hasLabel && !spread) problems.push(`${where} : accessibilityLabel manquant`);
      if (tag !== 'TextInput' && !hasRole && !spread) problems.push(`${where} : accessibilityRole manquant`);
      if (tag === 'Switch' && !/accessibilityState=/.test(text) && !spread) problems.push(`${where} : accessibilityState (checked) manquant`);
    }
  }
}

walk(root);
if (problems.length) {
  console.error(`a11y-scan : ${problems.length} problème(s)\n` + problems.join('\n'));
  process.exit(1);
}
console.log('a11y-scan ok : rôles et libellés présents sur les éléments interactifs');
