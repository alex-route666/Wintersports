const assert = require('assert');
const fs = require('fs');
const path = require('path');
const S = require('../tools/specialists.js');
const fx = (f) => fs.readFileSync(path.join(__dirname, 'fixtures', f), 'utf8');

// ---- Correspondance des noms de stations
assert.ok(S.hillMatches('Copper Mtn.', 'Copper Mountain'));
assert.ok(S.hillMatches('Garmisch', 'Garmisch-Partenkirchen'));
assert.ok(S.hillMatches('Soldeu-Grandvalira', 'Soldeu'));
assert.ok(S.hillMatches('Cortina', "Cortina d'Ampezzo"));
assert.ok(S.hillMatches('St. Moritz', 'Saint-Moritz'));
assert.ok(S.hillMatches('Sölden', 'Solden'));
assert.ok(S.hillMatches("Val d'Isère", "Val d'Isère"));
assert.ok(!S.hillMatches('Val Gardena', "Val d'Isère"));
assert.ok(!S.hillMatches('Kranjska Gora', 'Gora'), 'un seul mot court ne suffit pas');
assert.ok(!S.hillMatches('Levi', 'Levi Alpine'), 'moins de 5 lettres : pas de rapprochement approximatif');

// ---- Calendrier : les courses annulées (sans lien de résultats) sont ignorées
const cal = S.parseCalendar(fx('calendar-men-2026.html'));
assert.strictEqual(cal.length, 3);
assert.deepStrictEqual(cal[0], { date: '26.10', hill: 'Sölden', disc: 'GS', id: '4066' });
assert.strictEqual(cal[1].disc, 'SL');

// ---- Classement d'une course
const res = S.parseResults(fx('results-solden-gs-2025.html'));
assert.strictEqual(res.category, 'World Cup');
assert.deepStrictEqual(res.rows[0], { pos: '1', fss: '3040', pts: 100 });
assert.strictEqual(res.rows[2].fss, '4711');
assert.strictEqual(res.rows[2].pts, 60);
const oot = res.rows.find((r) => r.pos === 'OOT');
assert.ok(oot && oot.pts === 0, 'hors du top 30 : départ, 0 point');
assert.ok(res.rows.some((r) => r.pos === 'DNF' && r.pts === 0));
assert.strictEqual(res.rows.find((r) => r.pos === '30').pts, 1);

// ---- Spécialistes : moyenne par départ, jeunes et anciens à égalité de départ
const ath = { M: [{ id: 'a', fss: '1' }, { id: 'b', fss: '2' }, { id: 'c', fss: '3' }, { id: 'd', fss: '4' }], W: [{ id: 'w', fss: '1' }] };
const mk = (season, rows, extra = {}) => Object.assign({ season, gender: 'M', hill: 'Sölden', disc: 'GS', category: 'World Cup', rows }, extra);
const row = (fss, pos, pts) => ({ pos, fss, pts });
const history = [
  mk(2022, [row('1', '1', 100), row('2', '5', 45), row('3', 'DNF', 0), row('4', '2', 80)]),
  mk(2023, [row('1', '1', 100), row('2', '6', 40), row('3', '3', 60)]),
  mk(2024, [row('1', 'DNF', 0), row('2', 'OOT', 0), row('3', '2', 80), row('4', 'DNS', 0)]),
  mk(2025, [row('1', '2', 80), row('2', '10', 26), row('3', '4', 50)]),
  mk(2025, [row('1', '1', 100)], { disc: 'SL' }),                      // autre discipline : ignorée
  mk(2025, [row('1', '1', 100)], { hill: 'Levi' }),                    // autre station : ignorée
  mk(2025, [row('1', '1', 100)], { category: 'Olympic Winter Games' }), // pas une course de Coupe du monde
  mk(2025, [row('1', '1', 100)], { gender: 'W' }),                     // autres dames
];
const r = S.specialistsFor({ gender: 'M', place: 'Sölden', disc: 'GS' }, history, ath);
assert.strictEqual(r.seasons, 4);
assert.strictEqual(r.races, 4);
// a : 100+100+0+80 = 280 / 4 = 70 ; c : 0+60+80+50 = 190 / 4 = 47.5 ; b : 45+40+0+26 = 111 / 4 = 27.75 ; d : 2 départs (DNS exclu) 80/1 → 1 seul départ : écarté
assert.deepStrictEqual(r.list.map((x) => x.id), ['a', 'c', 'b']);
assert.deepStrictEqual(r.list[0], { id: 'a', starts: 4, avg: 70, podiums: 3, best: 1 });
assert.strictEqual(r.list[1].avg, 47.5);
assert.strictEqual(r.list[2].avg, 27.8, 'arrondi à 0,1');
assert.ok(!r.list.some((x) => x.id === 'd'), 'un seul départ : écarté (minimum 2)');
// les skieurs qui ne sont pas dans la liste du jeu ne sont jamais proposés
const r2 = S.specialistsFor({ gender: 'M', place: 'Sölden', disc: 'GS' }, history, { M: [{ id: 'c', fss: '3' }], W: [] });
assert.deepStrictEqual(r2.list.map((x) => x.id), ['c']);
// pas d'historique : null
assert.strictEqual(S.specialistsFor({ gender: 'M', place: 'Kvitfjell', disc: 'DH' }, history, ath), null);
// désignation « Messieurs / Dames » séparées
assert.deepStrictEqual(S.specialistsFor({ gender: 'W', place: 'Sölden', disc: 'GS' }, history, ath, { minStarts: 1 }).list.map((x) => x.id), ['w']);
console.log('Tests spécialistes : OK.');
