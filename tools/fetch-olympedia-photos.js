#!/usr/bin/env node
/* Photos des skieurs ayant participé aux Jeux olympiques (2014, 2018, 2022, 2026), via Olympedia.
   Usage (Codespaces) :  npm i sharp  puis  node tools/fetch-olympedia-photos.js
   Options : --force (re-télécharge)   --dry (compte seulement les skieurs appariés, ne télécharge aucune photo)
   1. Lit les pages de résultats alpines d'Olympedia (≈ 40 pages, 1 toutes les 3 s, arrêt au premier refus).
   2. Associe chaque skieur de notre liste à son identifiant Olympedia (même genre, même nation).
   3. Télécharge https://olympedia-photos.s3.us-east-1.amazonaws.com/<id>.jpg (stockage d'images, pas le site).
   Ne remplace jamais une photo déjà présente (sauf --force). Écrit img/athletes/<id>.jpg, tools/photo-credits.json, credits.html. */
const fs = require('fs');
const path = require('path');
const data = require('../js/athletes.js');
const O = require('./parse-olympedia.js');
const CR = require('./credits.js');

const SITE = process.env.OLY_SITE || 'https://www.olympedia.org';
const PHOTOS = process.env.OLY_PHOTOS || 'https://olympedia-photos.s3.us-east-1.amazonaws.com';
const DELAY = parseInt(process.env.DELAY || '3000', 10);
const START = (process.env.OLY_START || '15000000,19019500,9000100,350000').split(',');
const UA = 'SkiGameFantasy/1.0 (https://github.com/alex-route666/Wintersports; usage prive)';
const force = process.argv.includes('--force'), dry = process.argv.includes('--dry');
const outDir = path.join(__dirname, '..', 'img', 'athletes');
fs.mkdirSync(outDir, { recursive: true });
let sharp = null;
if (!dry) { try { sharp = require('sharp'); } catch (e) { console.error('Lance d\'abord :  npm i sharp'); process.exit(1); } }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let last = 0;
class Refused extends Error {}
async function get(url, buffer) {
  const gap = DELAY - (Date.now() - last); if (gap > 0) await sleep(gap);
  last = Date.now();
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (r.status === 429 || r.status === 403 && buffer === undefined) throw new Refused(`${r.status} sur ${url}`);
  if (!r.ok) return null;
  return buffer ? Buffer.from(await r.arrayBuffer()) : r.text();
}
const genderOf = (html) => { const t = (html.match(/<h1 class="event_title">([^<]*)/) || [])[1] || ''; return /Women/.test(t) ? 'W' : /Men/.test(t) ? 'M' : null; };

(async () => {
  // 1. Pages de résultats
  const pages = new Map(), todo = [...START];
  const seen = new Set(), found = { M: new Map(), W: new Map() };
  while (todo.length) {
    const id = todo.shift(); if (seen.has(id)) continue; seen.add(id);
    let html;
    try { html = await get(`${SITE}/results/${id}`); } catch (e) { if (e instanceof Refused) { console.log('\nOlympedia refuse : ' + e.message + '\nOn s\'arrête là (rien n\'est perdu, relance plus tard).'); break; } throw e; }
    if (!html) { console.log(`  page ${id} introuvable`); continue; }
    const g = genderOf(html);
    const rows = g ? O.parseResults(html) : [];
    rows.forEach((r) => { if (!found[g].has(r.fss)) found[g].set(r.fss, r); });
    if (START.includes(id)) O.parseSameGames(html).forEach((x) => todo.push(x));
    console.log(`page ${id} : ${g || 'mixte, ignorée'}, ${rows.length} skieurs lus (${seen.size} pages lues)`);
    if (g && !rows.length) console.log('   ⚠ aucun skieur lu : début de la page → ' + (html.match(/<table[\s\S]{0,300}/) || [html.slice(0, 200)])[0].replace(/\s+/g, ' '));
  }
  // 2. Appariement
  const credits = CR.load();
  const jobs = [];
  for (const g of ['M', 'W']) {
    const r = O.matchAthletes(data[g], [...found[g].values()]);
    console.log(`${g === 'M' ? 'Messieurs' : 'Dames'} : ${r.matches.size} / ${data[g].length} retrouvés dans les épreuves olympiques, ${r.ambiguous.length} ambigus.`);
    r.matches.forEach((m, id) => jobs.push({ a: data[g].find((x) => x.id === id), oly: m.fss }));
  }
  if (dry) { console.log('(--dry : rien téléchargé)'); return; }
  // 3. Photos
  let ok = 0, skip = 0; const none = [];
  for (const { a, oly } of jobs) {
    const dest = path.join(outDir, `${a.id}.jpg`);
    if (!force && fs.existsSync(dest)) { skip++; continue; }
    const buf = await get(`${PHOTOS}/${oly}.jpg`, true).catch(() => null);
    if (!buf) { none.push(a.name); continue; }
    try {
      const meta = await sharp(buf).metadata();
      const cut = Math.floor(meta.height * 0.94); // retire la bande de crédit incrustée en bas de certaines photos
      const jpg = await sharp(buf).extract({ left: 0, top: 0, width: meta.width, height: cut }).resize(240, 320, { fit: 'inside', withoutEnlargement: true }).flatten({ background: '#eee5cf' }).jpeg({ quality: 82 }).toBuffer();
      fs.writeFileSync(dest, jpg);
      credits[a.id] = { name: a.name, author: 'Comité d\'organisation des Jeux / CIO (via Olympedia)', license: 'Droits réservés', page: `${SITE}/athletes/${oly}`, how: 'olympedia' };
      ok++;
    } catch (e) { none.push(a.name); }
  }
  CR.save(credits);
  console.log(`\nPhotos enregistrées : ${ok}, déjà présentes (gardées) : ${skip}, sans photo chez Olympedia : ${none.length}.`);
  if (none.length) console.log('Sans photo : ' + none.join(', '));
})();
