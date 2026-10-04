#!/usr/bin/env node
/* Calcule la liste des « spécialistes » de chaque course du jeu et l'écrit dans js/specialists.js.
   Usage : node tools/build-specialists.js fss-history.json [--min-starts 2] [--top 8]
   (fss-history.json vient de tools/specialists-browser.js, collé dans la console sur firstskisport.com.)
   Règle : sur les saisons du fichier, moyenne de points par départ à cette station dans cette discipline (un abandon vaut 0),
   au moins 2 départs, seulement les skieurs de la liste du jeu (donc en activité). Relancer après chaque build-athletes. */
const fs = require('fs'), path = require('path');
const D = require('../js/data.js');
const ATH = require('../js/athletes.js');
const S = require('./specialists.js');
const file = process.argv[2];
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > -1 ? Number(process.argv[i + 1]) : d; };
if (!file) { console.error('Usage : node tools/build-specialists.js fss-history.json'); process.exit(1); }
const input = JSON.parse(fs.readFileSync(file, 'utf8'));
const opts = { minStarts: arg('--min-starts', 2), top: arg('--top', 8) };

const races = {}, none = [];
Object.values(D.RACES).filter((r) => r.kind !== 'mondial').forEach((r) => {
  if (/déterminer/i.test(r.place)) return;
  const res = S.specialistsFor(r, input.history, ATH, opts);
  if (!res || !res.list.length) { none.push(`${r.id} ${r.place} ${r.disc}`); return; }
  races[r.id] = { seasons: res.seasons, races: res.races, list: res.list.map((x) => [x.id, x.starts, x.avg, x.podiums, x.best]) };
});
const out = { generated: input.generated || new Date().toISOString().slice(0, 10), seasons: input.seasons, minStarts: opts.minStarts, races };
const body = `/* Spécialistes de chaque course : généré par tools/build-specialists.js à partir de Firstskisport. Ne pas modifier à la main.
   Chaque ligne : [identifiant du skieur, départs, moyenne de points par départ, podiums, meilleure place]. */
(function (root) {
  'use strict';
  const data = ${JSON.stringify(out, null, 0).replace(/"races":\{/, '"races":{\n').replace(/\},"([MW]\d\d)":/g, '},\n"$1":')};
  if (typeof module !== 'undefined' && module.exports) module.exports = data;
  else root.SKI_SPECIALISTS = data;
})(typeof window !== 'undefined' ? window : globalThis);
`;
fs.writeFileSync(path.join(__dirname, '..', 'js', 'specialists.js'), body);
console.log(`Spécialistes : ${Object.keys(races).length} courses avec une liste, ${none.length} sans historique exploitable.`);
if (none.length) console.log('   sans liste : ' + none.join(', ') + '\n   (nouvelle station, nom différent sur le site → ajouter un alias dans HILL_ALIAS de tools/specialists.js, ou moins de 2 départs)');
