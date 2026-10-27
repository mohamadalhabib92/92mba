// Post-export PWA : manifest, service worker, balises <head>, 404.html (SPA GitHub Pages).
// Usage : npx expo export -p web && node scripts/pwa.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dist = path.join(root, 'dist');
const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8')).expo;
const pwa = JSON.parse(fs.readFileSync(path.join(root, 'pwa.config.json'), 'utf8'));
const base = (app.experiments?.baseUrl || '').replace(/\/$/, '');

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error('dist/index.html introuvable — lancez d’abord `npx expo export -p web`.');
  process.exit(1);
}

// 1. Manifest
const manifest = {
  name: pwa.name,
  short_name: pwa.shortName,
  description: pwa.description,
  lang: pwa.lang || 'fr',
  dir: 'auto',
  start_url: `${base}/`,
  scope: `${base}/`,
  display: 'standalone',
  orientation: 'portrait',
  background_color: pwa.backgroundColor,
  theme_color: pwa.themeColor,
  icons: [
    { src: `${base}/icons/icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: `${base}/icons/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: `${base}/icons/maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
};
fs.writeFileSync(path.join(dist, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2));

// 2. Liste de précache (tout sauf les gros médias, mis en cache à la première lecture)
const MAX_PRECACHE = 1.5 * 1024 * 1024;
const files = [];
const walk = (dir) => {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else files.push({ rel: path.relative(dist, p).split(path.sep).join('/'), size: st.size });
  }
};
walk(dist);
const precache = files
  .filter((f) => f.size <= MAX_PRECACHE && !/^(sw\.js|404\.html|\.nojekyll)$/.test(f.rel) && !/\.map$/.test(f.rel))
  .map((f) => `${base}/${f.rel}`);
precache.unshift(`${base}/`);
const hash = crypto.createHash('sha1').update(precache.join('|') + Date.now()).digest('hex').slice(0, 10);

const sw = `/* Service worker généré par scripts/pwa.mjs */
const CACHE = '${app.slug}-${hash}';
const RUNTIME = '${app.slug}-runtime';
const BASE = '${base}';
const PRECACHE = ${JSON.stringify(precache)};
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== RUNTIME).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (req.headers.has('range')) return; // laisser le navigateur gérer le streaming audio partiel
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match(BASE + '/index.html').then((r) => r || caches.match(BASE + '/'))));
    return;
  }
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(RUNTIME).then((c) => c.put(req, copy));
        }
        return res;
      });
    }),
  );
});
`;
fs.writeFileSync(path.join(dist, 'sw.js'), sw);

// 3. Balises <head> + enregistrement du SW
const head = `
<link rel="manifest" href="${base}/manifest.webmanifest">
<meta name="theme-color" content="${pwa.themeColor}">
<meta name="description" content="${pwa.description.replace(/"/g, '&quot;')}">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="${pwa.shortName}">
<link rel="apple-touch-icon" href="${base}/icons/apple-touch-icon.png">
<script>if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('${base}/sw.js',{scope:'${base}/'}).catch(function(){});});}</script>
`;
let html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
html = html.replace(/<html lang="[^"]*"/, `<html lang="${pwa.lang || 'fr'}"`);
if (!html.includes('manifest.webmanifest')) html = html.replace('</head>', `${head}</head>`);
fs.writeFileSync(path.join(dist, 'index.html'), html);
fs.writeFileSync(path.join(dist, '404.html'), html);
fs.writeFileSync(path.join(dist, '.nojekyll'), '');
console.log(`PWA OK — base "${base || '/'}", ${precache.length} fichiers précachés.`);
