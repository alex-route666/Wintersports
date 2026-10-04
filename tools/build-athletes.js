#!/usr/bin/env node
/* Génère js/athletes.js à partir de deux pages FIS « Cup Standings » enregistrées en HTML.
   Usage : node tools/build-athletes.js messieurs.html dames.html */
const fs = require('fs');
const path = require('path');
const F = require('../js/fis-import.js');

const [men, women] = process.argv.slice(2);
if (!men || !women) { console.error('Usage : node tools/build-athletes.js messieurs.html dames.html'); process.exit(1); }

const out = { M: null, W: null };
const warnings = [];
[['M', men], ['W', women]].forEach(([g, file]) => {
  const r = F.parseFisStandings(fs.readFileSync(file, 'utf8'), g);
  out[g] = r.athletes;
  r.warnings.forEach((w) => warnings.push(`${g} : ${w}`));
});
const lite = (a) => {
  const o = { id: a.id, name: a.name, fis: a.fis, nat: a.nat, rank: a.rank, pts: a.pts };
  if (a.fid) o.fid = a.fid;
  if (a.inj) o.inj = 1;
  return o;
};
const body = `/* Liste des skieurs : généré par tools/build-athletes.js à partir des classements FIS (saison 2025-26).
   Ne pas modifier à la main : relancer le script, ou importer une nouvelle liste depuis l'Admin. */
(function (root) {
  'use strict';
  const data = {
    generated: '${new Date().toISOString().slice(0, 10)}',
    source: 'FIS Cup Standings, classement général',
    M: ${JSON.stringify(out.M.map(lite))},
    W: ${JSON.stringify(out.W.map(lite))},
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = data;
  else root.SKI_ATHLETES = data;
})(typeof window !== 'undefined' ? window : globalThis);
`;
fs.writeFileSync(path.join(__dirname, '..', 'js', 'athletes.js'), body);
console.log(`Messieurs : ${out.M.length}, dames : ${out.W.length}`);
if (warnings.length) { console.log('Avertissements :'); warnings.forEach((w) => console.log(' - ' + w)); }
const accent = [...out.M, ...out.W].filter((a) => /UE|OE|AE/.test(a.fis) && !F.NAME_OVERRIDES[a.fis]);
console.log('Noms à vérifier (transcription possible d\'un tréma, non corrigés) :');
console.log(accent.map((a) => `${a.fis} -> ${a.name}`).join('\n'));
