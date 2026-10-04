#!/usr/bin/env node
/* Ajoute à js/athletes.js l'identifiant Firstskisport (fss) de chaque skieur, et corrige les accents quand le site les écrit.
   Usage : node tools/add-fss.js ranking-messieurs.html ranking-dames.html
   (pages « ranking.php » de firstskisport.com enregistrées en HTML). Relancer après chaque build-athletes. */
const fs = require('fs');
const path = require('path');
const S = require('./parse-firstskisport.js');
const file = path.join(__dirname, '..', 'js', 'athletes.js');
const data = require(file);
const [men, women] = process.argv.slice(2);
if (!men || !women) { console.error('Usage : node tools/add-fss.js ranking-messieurs.html ranking-dames.html'); process.exit(1); }

const report = [];
[['M', men], ['W', women]].forEach(([g, f]) => {
  const rows = S.parseRanking(fs.readFileSync(f, 'utf8'));
  const r = S.matchAthletes(data[g], rows);
  data[g].forEach((a) => {
    const m = r.matches.get(a.id);
    if (!m) return;
    a.fss = m.fss;
    a.name = S.betterName(a.name, m.name);
  });
  report.push(`${g} : ${r.matches.size}/${data[g].length} appariés, ${r.ambiguous.length} ambigus, ${r.leftover.length} lignes du site sans équivalent`);
  report.push('   sans photo : ' + r.unmatched.map((a) => a.name).join(', '));
});
const body = fs.readFileSync(file, 'utf8').replace(/(const data = )[\s\S]*?(\n  if \(typeof module)/,
  (m, a, b) => `${a}${JSON.stringify(data, null, 0).replace(/\],"W"/, '],\n    "W"').replace(/"M":\[/, '\n    "M":[')};${b}`);
fs.writeFileSync(file, body);
console.log(report.join('\n'));
