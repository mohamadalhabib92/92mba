import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const problems = [];

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name === '.git' || name === '.expo') continue;
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const files = walk(root).filter((file) => /\.(ts|tsx|js|jsx|mjs|json|yml|yaml|html|txt|example)$/.test(file));
const banned = [
  [/EXPO_PUBLIC_EXAMPLE_ENV_VAR/, 'variable de démo EXAMPLE'],
  [/BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY/, 'clé privée'],
  [/[A-Za-z0-9_-]+\.p8\b/, 'fichier .p8'],
  [/sk_live_/, 'clé Stripe'],
  [/supabase\.co/, 'URL Supabase'],
  [/sk-proj-/, 'clé OpenAI'],
];

for (const file of files) {
  if (file.endsWith(`${path.sep}scripts${path.sep}passe1-scan.mjs`)) continue;
  if (file.endsWith(`${path.sep}src${path.sep}lib${path.sep}passe1.check.ts`)) continue;
  const text = fs.readFileSync(file, 'utf8');
  for (const [pattern, label] of banned) {
    if (pattern.test(text)) problems.push(`${label}: ${path.relative(root, file)}`);
  }
}

for (const file of files.filter((item) => item.includes(`${path.sep}src${path.sep}`) && /\.(ts|tsx)$/.test(item))) {
  const text = fs.readFileSync(file, 'utf8');
  if (/\bfetch\s*\(/.test(text)) problems.push(`fetch dans src: ${path.relative(root, file)}`);
  if (/XMLHttpRequest/.test(text)) problems.push(`XHR dans src: ${path.relative(root, file)}`);
}

const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8')).expo;
if (app.experiments?.baseUrl !== '/92mba') problems.push('baseUrl web modifié');
if (app.ios?.bundleIdentifier !== 'ch.mohamadba.ninetytwomba') problems.push('bundle id modifié');
if (app.android?.package !== 'ch.mohamadba.ninetytwomba') problems.push('package modifié');
if (app.extra?.router?.asyncRoutes?.web !== false) problems.push('asyncRoutes web encore actif');

const store = fs.readFileSync(path.join(root, 'src/lib/store.ts'), 'utf8');
if (!store.includes("export const STORAGE_KEY = '92mba:v1'")) problems.push('clé de stockage modifiée');

const config = fs.readFileSync(path.join(root, 'app.config.js'), 'utf8');
if (!config.includes('Y9XF9RY2BU')) problems.push('équipe Apple absente');
if (!config.includes('EXPO_NO_CAPABILITY_SYNC')) problems.push('EXPO_NO_CAPABILITY_SYNC absent');
if (!config.includes('EAS_BUILD')) problems.push('baseUrl n’est plus retiré uniquement pour EAS');

const eas = JSON.parse(fs.readFileSync(path.join(root, 'eas.json'), 'utf8'));
for (const name of ['development', 'preview', 'production']) {
  if (eas.build?.[name]?.env?.EXPO_NO_CAPABILITY_SYNC !== '1') problems.push(`EXPO_NO_CAPABILITY_SYNC manquant sur ${name}`);
}
if (eas.submit?.production?.ios?.appleTeamId !== 'Y9XF9RY2BU') problems.push('appleTeamId submit');

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log('passe1 scan ok');
