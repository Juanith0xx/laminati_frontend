import fs from 'node:fs/promises';

const OLD_SITEMAP = 'https://laminati.cl/1_es_0_sitemap.xml';
const NEW_SITEMAP = process.env.NEW_SITEMAP || 'http://localhost:3000/sitemap.xml';

const decodeXml = (value='') => value
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'");

function extractLocs(xml) {
  const out = [];
  const re = /<loc>([\s\S]*?)<\/loc>/gi;
  for (const m of xml.matchAll(re)) {
    let v = m[1].trim();
    v = v.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
    v = decodeXml(v);
    if (v) out.push(v);
  }
  return [...new Set(out)];
}

function stripAccents(s='') {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeSlug(s='') {
  return stripAccents(String(s).toLowerCase())
    .replace(/\.html?$/i, '')
    .replace(/^\d+-/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

function lastSegment(url) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    return decodeURIComponent(parts.at(-1) || '');
  } catch {
    return '';
  }
}

function pathAndQuery(url) {
  const u = new URL(url);
  return `${u.pathname}${u.search}`;
}

function isTechnicalLegacy(url) {
  const u = new URL(url);
  const p = u.pathname.toLowerCase();
  const q = u.search.toLowerCase();
  if (p === '/pagina-no-encontrada') return true;
  if (p === '/mapa del sitio' || p === '/mapa%20del%20sitio') return true;
  if (p === '/index.php' && q.includes('controller=module-')) return true;
  if (p === '/index.php' && q.includes('controller=cron')) return true;
  return false;
}

function tokenSet(s) {
  return new Set(normalizeSlug(s).split('-').filter(x => x.length > 1));
}

function jaccard(a, b) {
  const A = tokenSet(a), B = tokenSet(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  const union = new Set([...A, ...B]).size;
  return union ? inter / union : 0;
}

const csvEscape = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;
const csv = rows => rows.map(r => r.map(csvEscape).join(',')).join('\n') + '\n';

async function fetchText(url) {
  const r = await fetch(url, { redirect: 'follow' });
  if (!r.ok) throw new Error(`${url} -> HTTP ${r.status}`);
  return await r.text();
}

const [oldXml, newXml] = await Promise.all([
  fetchText(OLD_SITEMAP),
  fetchText(NEW_SITEMAP),
]);

const oldUrls = extractLocs(oldXml);
const newUrls = extractLocs(newXml);

const newBySlug = new Map();
for (const url of newUrls) {
  const slug = normalizeSlug(lastSegment(url));
  if (!slug) continue;
  if (!newBySlug.has(slug)) newBySlug.set(slug, []);
  newBySlug.get(slug).push(url);
}

const newProductUrls = newUrls.filter(u => {
  try { return new URL(u).pathname.startsWith('/productos/'); } catch { return false; }
});

const exact = [];
const review = [];
const ignored = [];
const same = [];

for (const oldUrl of oldUrls) {
  let old;
  try { old = new URL(oldUrl); } catch { continue; }

  if (isTechnicalLegacy(oldUrl)) {
    ignored.push([oldUrl, 'TECNICA_PRESTASHOP']);
    continue;
  }

  const oldPath = old.pathname;
  const newSame = newUrls.find(u => {
    try { return new URL(u).pathname === oldPath; } catch { return false; }
  });
  if (newSame) {
    same.push([oldUrl, newSame, 'MISMA_RUTA']);
    continue;
  }

  const slug = normalizeSlug(lastSegment(oldUrl));
  const candidates = newBySlug.get(slug) || [];
  if (slug && candidates.length === 1) {
    exact.push([oldUrl, candidates[0], 'SLUG_EXACTO', '1.00']);
    continue;
  }

  // Comparación segura principalmente contra fichas de producto nuevas.
  let bestUrl = '';
  let bestScore = 0;
  for (const nu of newProductUrls) {
    const score = jaccard(slug, lastSegment(nu));
    if (score > bestScore) {
      bestScore = score;
      bestUrl = nu;
    }
  }

  if (bestUrl && bestScore >= 0.70) {
    review.push([oldUrl, bestUrl, 'PROBABLE_PRODUCTO', bestScore.toFixed(2)]);
  } else {
    review.push([oldUrl, bestUrl, 'REVISAR_MANUAL', bestScore.toFixed(2)]);
  }
}

await fs.writeFile('seo_redirect_exact.csv', csv([
  ['old_url','new_url','match_type','confidence'],
  ...exact,
]));
await fs.writeFile('seo_redirect_review.csv', csv([
  ['old_url','candidate_new_url','match_type','confidence'],
  ...review,
]));
await fs.writeFile('seo_redirect_ignored.csv', csv([
  ['old_url','reason'],
  ...ignored,
]));
await fs.writeFile('seo_same_routes.csv', csv([
  ['old_url','new_url','reason'],
  ...same,
]));

const redirectObjects = exact.map(([oldUrl, newUrl]) => ({
  source: new URL(oldUrl).pathname,
  destination: new URL(newUrl).pathname,
  permanent: true,
}));

await fs.writeFile(
  'seo_redirect_exact.json',
  JSON.stringify(redirectObjects, null, 2) + '\n'
);

console.log('=== RESUMEN ===');
console.log('URLs antiguas:', oldUrls.length);
console.log('URLs nuevas:', newUrls.length);
console.log('Matches exactos seguros:', exact.length);
console.log('Misma ruta (sin redirect):', same.length);
console.log('Ignoradas técnicas:', ignored.length);
console.log('Pendientes de revisión:', review.length);
console.log('\nArchivos generados:');
console.log('- seo_redirect_exact.csv');
console.log('- seo_redirect_exact.json');
console.log('- seo_redirect_review.csv');
console.log('- seo_redirect_ignored.csv');
console.log('- seo_same_routes.csv');
console.log('\nIMPORTANTE: no copies todavía seo_redirect_exact.json a producción. Primero revisa el CSV.');
