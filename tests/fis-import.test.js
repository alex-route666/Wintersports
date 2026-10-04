const assert = require('assert');
const F = require('../js/fis-import.js');

const tail = '<td>Downhill</td><td>DH</td><td>---</td><td>Slalom</td><td>SL</td><td>1</td><td>1\'080</td>';
let n = 1000;
const row = (cells, rank, pts) => `<a class="table-row  reset-padding" href="https://www.fis-ski.com/DB/general/athlete-biography.html?sectorcode=AL&amp;competitorid=${++n}&amp;type=cups&amp;cupcode=WCSL">${cells.map((c) => `<td>${c}</td>`).join('')}<td>Overall</td><td>ALL</td><td>${rank}</td><td>${pts}</td>${tail}</a>`;

// ---- Dames : nom, [#], nation
const women = '<html><script>var x="<b>Overall</b>";</script><body><table>' + [
  row(['SHIFFRIN Mikaela ', 'USA'], 1, "1'534"),
  row(['GUT-BEHRAMI Lara ', '#', 'SUI'], 5, "1'042"),
  row(['DELLA MEA Lara ', 'ITA'], 25, '405'),
  row(['HURT A J ', 'USA'], 60, '120'),
  row(['DUERR Lena ', 'GER'], 24, '432'),
  row(['ZEGG Leonie ', 'AUT'], 149, '1'),
  row(['GRILL Lisa ', 'AUT'], 149, '1'),
].join('') + '</table></body></html>';
const w = F.parseFisStandings(women, 'W');
assert.strictEqual(w.warnings.length, 0, w.warnings.join(';'));
assert.strictEqual(w.athletes.length, 7);
assert.deepStrictEqual(w.athletes.map((a) => a.rank), [1, 5, 24, 25, 60, 149, 149], 'triées par rang, ex aequo conservés');
const by = (arr, id) => arr.find((a) => a.id === id);
assert.strictEqual(by(w.athletes, 'lara-gut-behrami').inj, true, 'marque # lue');
assert.strictEqual(by(w.athletes, 'lara-gut-behrami').name, 'Lara Gut-Behrami');
assert.strictEqual(by(w.athletes, 'lara-della-mea').name, 'Lara Della Mea', 'nom composé');
assert.strictEqual(by(w.athletes, 'a-j-hurt').name, 'A J Hurt', 'sans prénom distinct');
assert.strictEqual(by(w.athletes, 'lena-duerr').name, 'Lena Dürr', 'correction d\'accent connue');
assert.strictEqual(by(w.athletes, 'mikaela-shiffrin').pts, 1534, 'séparateur de milliers');
assert.strictEqual(by(w.athletes, 'mikaela-shiffrin').inj, false);
assert.strictEqual(by(w.athletes, 'mikaela-shiffrin').fid, '1001', 'identifiant FIS lu (ordre de la page conservé après tri)');
assert.strictEqual(by(w.athletes, 'lena-duerr').fid, '1005');

// ---- Messieurs : nom, marque de skis, [#], nation
const men = '<table>' + [
  row(['ODERMATT Marco', 'Stoeckli', 'SUI'], 1, "1'816"),
  row(['MCGRATH Atle Lie', 'Head', 'NOR'], 4, '981'),
  row(['VON ALLMEN Franjo', 'Head', 'SUI'], 5, '970'),
  row(['KILDE Aleksander Aamodt', 'Atomic', '#', 'NOR'], 86, '60'),
  row(['MEILLARD Loic', 'Rossignol', 'SUI'], 3, "1'083"),
].join('') + '</table>';
const m = F.parseFisStandings(men, 'M');
assert.strictEqual(m.warnings.length, 0, m.warnings.join(';'));
assert.deepStrictEqual(m.athletes.map((a) => a.id), ['marco-odermatt', 'loic-meillard', 'atle-lie-mcgrath', 'franjo-von-allmen', 'aleksander-aamodt-kilde']);
assert.strictEqual(by(m.athletes, 'atle-lie-mcgrath').name, 'Atle Lie McGrath');
assert.strictEqual(by(m.athletes, 'franjo-von-allmen').name, 'Franjo von Allmen');
assert.strictEqual(by(m.athletes, 'aleksander-aamodt-kilde').inj, true, '# après la marque');
assert.strictEqual(by(m.athletes, 'aleksander-aamodt-kilde').brand, 'Atomic');
assert.strictEqual(by(m.athletes, 'loic-meillard').name, 'Loïc Meillard');

assert.strictEqual(by(m.athletes, 'marco-odermatt').fid, '1008');

// ---- Page illisible : avertissement, pas d'exception
const bad = F.parseFisStandings('<td>X</td><td>??</td><td>Overall</td><td>ALL</td><td>abc</td><td>1</td>', 'W');
assert.strictEqual(bad.athletes.length, 0);
assert.strictEqual(bad.warnings.length, 1);

// ---- Fusion avec une liste existante
const existing = w.athletes;
const incoming = [
  { id: 'mikaela-shiffrin', fis: 'SHIFFRIN Mikaela', name: 'Mikaela Shiffrin', nat: 'USA', rank: 2 },       // rang changé
  { id: 'leoni-zegg', fis: 'ZEGG Leoni', name: 'Leoni Zegg', nat: 'AUT', rank: 149 },                        // orthographe modifiée ?
  { id: 'nouvelle-venue', fis: 'VENUE Nouvelle', name: 'Nouvelle Venue', nat: 'FRA', rank: 30 },             // vraiment nouvelle
  { id: 'lara-gut-behrami', fis: 'GUT-BEHRAMI Lara', name: 'Lara Gut-Behrami', nat: 'SUI', rank: 5 },
];
const diff = F.diffLists(existing, incoming);
assert.deepStrictEqual(diff.added.map((a) => a.id), ['nouvelle-venue']);
assert.strictEqual(diff.alerts.length, 1, 'une alerte d\'orthographe');
assert.strictEqual(diff.alerts[0].old.id, 'leonie-zegg');
assert.strictEqual(diff.alerts[0].new.id, 'leoni-zegg');
assert.deepStrictEqual(diff.moved.map((x) => [x.id, x.from, x.to]), [['mikaela-shiffrin', 1, 2]]);
const keptIds = diff.kept.map((a) => a.id);
assert.ok(keptIds.includes('lisa-grill') && keptIds.includes('lena-duerr'), 'absents conservés, jamais supprimés');
assert.ok(!keptIds.includes('leonie-zegg'), 'l\'ancien nom en alerte n\'est pas compté comme simple absent');

// ---- Liste réellement livrée (js/athletes.js)
const A = require('../js/athletes.js');
assert.strictEqual(A.M.length, 168); assert.strictEqual(A.W.length, 151);
['M', 'W'].forEach((g) => {
  assert.strictEqual(new Set(A[g].map((a) => a.id)).size, A[g].length, 'ids uniques ' + g);
  for (let i = 1; i < A[g].length; i++) assert.ok(A[g][i].rank >= A[g][i - 1].rank, 'ordre par rang ' + g);
  A[g].forEach((a) => { assert.ok(/^[a-z0-9-]+$/.test(a.id)); assert.ok(/^[A-Z]{3}$/.test(a.nat)); assert.ok(a.name.length > 3); });
});
assert.ok(A.M.every((a) => /^\d+$/.test(a.fid)) && A.W.every((a) => /^\d+$/.test(a.fid)), 'identifiant FIS pour tous');
assert.strictEqual(new Set([...A.M, ...A.W].map((a) => a.fid)).size, 319, 'identifiants FIS uniques');
assert.strictEqual(A.M[0].fid, '190231'); // Odermatt
assert.strictEqual(A.M[0].id, 'marco-odermatt'); assert.strictEqual(A.W[0].id, 'mikaela-shiffrin');

console.log('Tests d\'import FIS : OK.');
