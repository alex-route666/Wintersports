/* Spécialistes d'une course : lecture des pages Firstskisport (calendrier, classement d'une course) et calcul des listes.
   Les fonctions de lecture n'utilisent que des expressions régulières : le même code tourne dans Node (tests, build)
   et dans la console du navigateur (tools/specialists-browser.js, généré par make-specialists-browser.js). */
'use strict';

const MAP = { 'ø': 'o', 'æ': 'ae', 'ß': 'ss', 'đ': 'd', 'ł': 'l' };
const plain = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[øæßđł]/g, (c) => MAP[c]);
const slug = (s) => plain(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#0?39;/g, "'").replace(/\s+/g, ' ').trim();

const DISC_CODE = { 'slalom': 'SL', 'giant slalom': 'GS', 'super g': 'SG', 'downhill': 'DH' };

/* Une même station s'écrit différemment selon la source (« Copper Mtn. » / « Copper Mountain »). */
const HILL_ALIAS = { 'copper-mtn': 'copper-mountain', 'st-moritz': 'saint-moritz', 'groeden': 'val-gardena', 'plan-de-corones': 'kronplatz',
  'obergurgl': 'gurgl', 'gurgl-soelden': 'gurgl', 'mont-tremblant': 'tremblant', 'palisades-tahoe': 'palisades-tahoe' };
function hillMatches(a, b) {
  const x = HILL_ALIAS[slug(a)] || slug(a), y = HILL_ALIAS[slug(b)] || slug(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const tx = x.split('-'), ty = y.split('-');
  const [s, l] = tx.length <= ty.length ? [tx, ty] : [ty, tx];
  return s.join('').length >= 5 && s.every((t) => l.includes(t)); // « garmisch » ⊂ « garmisch-partenkirchen »
}

/** calendar.php → [{ date: '26.10', hill, disc: 'GS', id }] ; les courses annulées (sans lien de résultats) sont ignorées. */
function parseCalendar(html) {
  const out = [];
  const re = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  let m;
  while ((m = re.exec(html))) {
    const tds = [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((x) => x[1]);
    if (tds.length < 4) continue;
    const id = /results\.php\?id=(\d+)/.exec(tds[2]);
    const disc = DISC_CODE[strip(tds[3]).toLowerCase()];
    if (!id || !disc) continue;
    out.push({ date: strip(tds[0]), hill: strip(tds[2]), disc, id: id[1] });
  }
  return out;
}

/** results.php → { category: 'World Cup', date, rows: [{ pos, fss, pts }] } ; pos = « 1 », « OOT », « DNF », « DNS »… */
function parseResults(html) {
  const h2 = /<h2[^>]*>([\s\S]*?)<\/h2>/.exec(html);
  const head = h2 ? strip(h2[1]).split(',').map((s) => s.trim()) : [];
  const rows = [];
  const re = /<tr class="rider[^"]*"[^>]*>([\s\S]*?)<\/tr>/g;
  let m;
  while ((m = re.exec(html))) {
    const tds = [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((x) => x[1]);
    const a = /athlete\.php\?id=(\d+)/.exec(m[1]);
    if (tds.length < 9 || !a) continue;
    rows.push({ pos: strip(tds[0]), fss: a[1], pts: parseInt(strip(tds[8]), 10) || 0 });
  }
  return { category: head[1] || '', date: head[2] || '', rows };
}

const isStart = (pos) => pos !== 'DNS' && pos !== '';
const placeOf = (pos) => (/^\d+$/.test(pos) ? Number(pos) : 0);

/**
 * history : [{ season, gender: 'M'|'W', hill, disc, category, rows: [{pos, fss, pts}] }]
 * race    : { gender, place, disc }          (course du jeu)
 * athletes: { M: [{id, fss}], W: [...] }     (skieurs du jeu : seuls eux sont proposés → skieurs actifs)
 * Classement : moyenne de points par départ (un abandon vaut 0), au moins `minStarts` départs, sur les saisons de `history`.
 */
function specialistsFor(race, history, athletes, { minStarts = 2, top = 8 } = {}) {
  const races = history.filter((h) => h.gender === race.gender && h.disc === race.disc && h.category === 'World Cup' && hillMatches(h.hill, race.place) && h.rows.length);
  if (!races.length) return null;
  const byFss = new Map(athletes[race.gender].filter((a) => a.fss).map((a) => [String(a.fss), a.id]));
  const acc = new Map();
  for (const r of races) {
    for (const row of r.rows) {
      const id = byFss.get(String(row.fss));
      if (!id || !isStart(row.pos)) continue;
      const s = acc.get(id) || { id, starts: 0, pts: 0, podiums: 0, best: 0 };
      s.starts++; s.pts += row.pts;
      const p = placeOf(row.pos);
      if (p && p <= 3) s.podiums++;
      if (p && (!s.best || p < s.best)) s.best = p;
      acc.set(id, s);
    }
  }
  const list = [...acc.values()].filter((s) => s.starts >= minStarts)
    .map((s) => ({ id: s.id, starts: s.starts, avg: Math.round((s.pts / s.starts) * 10) / 10, podiums: s.podiums, best: s.best }))
    .sort((a, b) => b.avg - a.avg || b.podiums - a.podiums || (a.best || 99) - (b.best || 99) || b.starts - a.starts || a.id.localeCompare(b.id))
    .slice(0, top);
  return { seasons: new Set(races.map((r) => r.season)).size, races: races.length, list };
}

module.exports = { slug, hillMatches, parseCalendar, parseResults, specialistsFor, DISC_CODE, HILL_ALIAS, MAP };
