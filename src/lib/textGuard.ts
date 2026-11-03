const BANNED = new Set(['undefined', 'null']);

/** Première chaîne exploitable (les params expo-router peuvent être un tableau). */
export function firstString(raw: unknown): string {
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item === 'string') return item;
    }
  }
  return '';
}

/**
 * Requête affichable. Jamais « undefined » ni « null »
 * (régression : une valeur absente stringifiée ne doit pas devenir une puce).
 */
export function sanitizeSearchQuery(raw: unknown): string {
  const q = firstString(raw).trim();
  if (q.length < 2) return '';
  if (BANNED.has(q.toLowerCase())) return '';
  return q;
}

export function cleanHistory(list: unknown): string[] {
  if (!Array.isArray(list)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of list) {
    const q = sanitizeSearchQuery(item);
    if (!q) continue;
    const key = q.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(q);
    if (out.length >= 12) break;
  }
  return out;
}

export function safePageIndex(raw: unknown): number | null {
  const s = firstString(raw).trim();
  if (!s || BANNED.has(s.toLowerCase())) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}

/** Interpolation : une variable absente devient vide, jamais le mot « undefined ». */
export function fillTemplate(template: string, vars?: Record<string, string | number | null | undefined>): string {
  if (!vars) return template;
  let s = template;
  for (const [key, value] of Object.entries(vars)) {
    let shown = '';
    if (typeof value === 'number' && Number.isFinite(value)) shown = String(value);
    else if (typeof value === 'string' && !BANNED.has(value.trim().toLowerCase())) shown = value;
    s = s.replaceAll(`{${key}}`, shown);
  }
  return s;
}
