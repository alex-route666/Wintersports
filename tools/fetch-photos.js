#!/usr/bin/env node
/* Télécharge les photos des skieurs (photos FIS pour les médias, via firstskisport.com) dans img/athletes/<id>.jpg.
   À lancer sur ton ordinateur (Node 18+) :  npm i sharp  puis  node tools/fetch-photos.js
   Options : --only marco-odermatt,mikaela-shiffrin   --force (re-télécharge)   --size 240
   Le site range les images par année (img/alpine/2023/3040.png) : on essaie plusieurs années, la plus récente d'abord.
   Variable BASE pour pointer ailleurs (tests). */
const fs = require('fs');
const path = require('path');
const data = require('../js/athletes.js');

const BASE = process.env.BASE || 'https://firstskisport.com/img/alpine';
const YEARS = (process.env.YEARS || '2026,2025,2024,2023,2022,2021').split(',');
const arg = (n) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : null; };
const force = process.argv.includes('--force');
const size = parseInt(arg('--size') || '240', 10);
const only = arg('--only') ? new Set(arg('--only').split(',')) : null;
const outDir = path.join(__dirname, '..', 'img', 'athletes');
fs.mkdirSync(outDir, { recursive: true });

let sharp = null;
try { sharp = require('sharp'); } catch (e) { console.warn('⚠ « sharp » absent (npm i sharp) : les images seront enregistrées telles quelles, sans redimensionnement.'); }

async function grab(fss) {
  for (const y of YEARS) for (const ext of ['png', 'jpg']) {
    const url = `${BASE}/${y}/${fss}.${ext}`;
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (ski-game photo import)' } });
      if (!r.ok || !/^image\//.test(r.headers.get('content-type') || '')) continue;
      return { url, buf: Buffer.from(await r.arrayBuffer()) };
    } catch (e) { /* on essaie la suivante */ }
  }
  return null;
}

(async () => {
  const list = [...data.M, ...data.W].filter((a) => a.fss && (!only || only.has(a.id)));
  const noId = [...data.M, ...data.W].filter((a) => !a.fss).map((a) => a.name);
  let ok = 0, skip = 0; const missing = [];
  for (const a of list) {
    const dest = path.join(outDir, `${a.id}.jpg`);
    if (!force && fs.existsSync(dest)) { skip++; continue; }
    const g = await grab(a.fss);
    if (!g) { missing.push(a.name); continue; }
    let buf = g.buf;
    if (sharp) buf = await sharp(buf).resize(size, size, { fit: 'cover', position: 'top' }).flatten({ background: '#eee5cf' }).jpeg({ quality: 82 }).toBuffer();
    fs.writeFileSync(dest, buf);
    ok++;
    if (ok % 25 === 0) console.log(`… ${ok} photos`);
  }
  console.log(`Photos enregistrées : ${ok}, déjà présentes : ${skip}, introuvables : ${missing.length}`);
  if (missing.length) console.log('Introuvables : ' + missing.join(', '));
  if (noId.length) console.log(`Sans identifiant Firstskisport (${noId.length}, initiales affichées) : ` + noId.join(', '));
})();
