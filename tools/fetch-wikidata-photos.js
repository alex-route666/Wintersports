#!/usr/bin/env node
/* Photos des skieurs depuis Wikimedia Commons, retrouvées via Wikidata.
   Usage (Codespaces ou ordinateur, Node 18+) :  npm i sharp  puis  node tools/fetch-wikidata-photos.js
   Options : --force (re-télécharge même si img/athletes/<id>.jpg existe)   --no-name (pas de recherche par nom)
   - 1re passe : identifiant FIS (propriété Wikidata P2772) -> image P18.  2e passe : recherche par nom (skieur avec image).
   - Les photos déjà présentes (ajoutées à la main) ne sont jamais écrasées, sauf --force.
   - Écrit img/athletes/<id>.jpg (240 px de large, proportions conservées : le cadrage se fait à l'affichage, tête en haut), tools/photo-credits.json et credits.html (auteurs + licences). */
const fs = require('fs');
const path = require('path');
const data = require('../js/athletes.js');

const WD_SPARQL = process.env.WD_SPARQL || 'https://query.wikidata.org/sparql';
const WD_API = process.env.WD_API || 'https://www.wikidata.org/w/api.php';
const COMMONS_API = process.env.COMMONS_API || 'https://commons.wikimedia.org/w/api.php';
const DELAY = parseInt(process.env.DELAY || '400', 10);
const UA = 'SkiGameFantasy/1.0 (https://github.com/alex-route666/Wintersports; photos de skieurs)';
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'img', 'athletes');
const CR = require('./credits.js');
const force = process.argv.includes('--force');
const byName = !process.argv.includes('--no-name');
fs.mkdirSync(outDir, { recursive: true });
let sharp = null;
try { sharp = require('sharp'); } catch (e) { console.warn('⚠ « sharp » absent : lance d\'abord  npm i sharp'); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let last = 0;
async function http(url, opts, asBuffer) {
  for (let k = 1; k <= 4; k++) {
    const gap = DELAY - (Date.now() - last); if (gap > 0) await sleep(gap);
    last = Date.now();
    const r = await fetch(url, Object.assign({ headers: { 'User-Agent': UA, Accept: 'application/json' } }, opts));
    if (r.status === 429 || r.status >= 500) { const w = parseInt(r.headers.get('retry-after') || '0', 10) * 1000 || 5000 * k; console.log(`  (le serveur demande de patienter ${w / 1000} s)`); await sleep(w); continue; }
    if (!r.ok) throw new Error(`${r.status} ${url.slice(0, 120)}`);
    return asBuffer ? Buffer.from(await r.arrayBuffer()) : r.json();
  }
  throw new Error('trop de refus : ' + url.slice(0, 120));
}
const fileNameOf = (u) => decodeURIComponent(String(u).split('/').pop()).replace(/_/g, ' ');
const strip = (h) => String(h || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/\s+/g, ' ').trim();

async function commonsInfo(file) {
  const j = await http(`${COMMONS_API}?action=query&format=json&titles=${encodeURIComponent('File:' + file)}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=480`);
  const page = Object.values((j.query && j.query.pages) || {})[0];
  const ii = page && page.imageinfo && page.imageinfo[0];
  if (!ii) return null;
  const m = ii.extmetadata || {};
  return { thumb: ii.thumburl || ii.url, page: ii.descriptionurl, author: strip(m.Artist && m.Artist.value) || 'Auteur inconnu', license: strip(m.LicenseShortName && m.LicenseShortName.value) || 'Licence à vérifier', file };
}

async function sparqlByFid(fids) {
  const found = new Map();
  for (let i = 0; i < fids.length; i += 80) {
    const part = fids.slice(i, i + 80);
    const q = `SELECT ?fid ?img WHERE { VALUES ?fid { ${part.map((f) => `"${f}"`).join(' ')} } ?p wdt:P2772 ?fid . ?p wdt:P18 ?img . }`;
    const j = await http(`${WD_SPARQL}?format=json&query=${encodeURIComponent(q)}`);
    j.results.bindings.forEach((b) => { if (!found.has(b.fid.value)) found.set(b.fid.value, b.img.value); });
  }
  return found;
}
async function searchByName(name) {
  const s = await http(`${WD_API}?action=wbsearchentities&format=json&language=en&type=item&limit=5&search=${encodeURIComponent(name)}`);
  const ids = (s.search || []).filter((x) => /ski/i.test(x.description || '')).map((x) => x.id);
  if (!ids.length) return null;
  const e = await http(`${WD_API}?action=wbgetentities&format=json&props=claims&ids=${ids.join('|')}`);
  for (const id of ids) {
    const c = e.entities && e.entities[id] && e.entities[id].claims;
    const img = c && c.P18 && c.P18[0] && c.P18[0].mainsnak && c.P18[0].mainsnak.datavalue && c.P18[0].mainsnak.datavalue.value;
    if (img) return String(img).replace(/_/g, ' ');
  }
  return null;
}

async function save(a, file, how, credits) {
  const info = await commonsInfo(file);
  if (!info) return false;
  const buf = await http(info.thumb, { headers: { 'User-Agent': UA } }, true);
  const jpg = await sharp(buf).resize(240, 320, { fit: 'inside', withoutEnlargement: true }).flatten({ background: '#eee5cf' }).jpeg({ quality: 82 }).toBuffer();
  fs.writeFileSync(path.join(outDir, `${a.id}.jpg`), jpg);
  credits[a.id] = { name: a.name, author: info.author, license: info.license, page: info.page, how };
  return true;
}

(async () => {
  const all = [...data.M, ...data.W];
  const todo = all.filter((a) => force || !fs.existsSync(path.join(outDir, `${a.id}.jpg`)));
  const credits = CR.load();
  console.log(`${all.length - todo.length} déjà présentes (gardées), ${todo.length} à chercher.`);
  let nFid = 0, nName = 0; const missing = [];
  const withFid = todo.filter((a) => a.fid);
  const imgs = await sparqlByFid(withFid.map((a) => a.fid));
  console.log(`Wikidata : ${imgs.size} skieurs avec photo trouvés via l'identifiant FIS.`);
  for (const a of todo) {
    try {
      let file = a.fid && imgs.has(a.fid) ? fileNameOf(imgs.get(a.fid)) : null, how = 'fis';
      if (!file && byName) { file = await searchByName(a.name); how = 'nom'; }
      if (file && await save(a, file, how, credits)) { how === 'fis' ? nFid++ : nName++; }
      else missing.push(a.name);
    } catch (e) { console.log(`  ✗ ${a.name} : ${e.message}`); missing.push(a.name); }
    const done = nFid + nName + missing.length; if (done % 25 === 0) console.log(`… ${done} / ${todo.length}`);
  }
  CR.save(credits);
  console.log(`\nPhotos enregistrées : ${nFid} par identifiant FIS, ${nName} par nom. Sans photo : ${missing.length}.`);
  if (missing.length) console.log('Sans photo : ' + missing.join(', '));
  console.log('Crédits : credits.html mis à jour.');
})();
