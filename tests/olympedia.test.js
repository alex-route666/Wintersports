const assert = require('assert');
const O = require('../tools/parse-olympedia.js');
// Variante « code source brut » : liens relatifs, retours à la ligne entre les balises.
const raw = `<table class="table"><tbody>
<tr class="">
  <td>1</td><td class="bib">8</td>
  <td><a href="/athletes/157056">Franjo von Allmen</a></td>
  <td>
    <a href="/countries/SUI"><img src="x.svg">SUI</a></td>
  <td>1:51.61</td></tr>
<tr><td>2</td><td><a href='https://www.olympedia.org/athletes/148903'>Marco Odermatt</a></td><td><a href="https://www.olympedia.org/countries/SUI">SUI</a></td></tr>
<tr><td>3</td><td><a href="/athletes/148903">Marco Odermatt</a></td><td><a href="/countries/SUI">SUI</a></td></tr>
</tbody></table>`;
const r = O.parseResults(raw);
assert.deepStrictEqual(r.map((x) => [x.fss, x.nat, x.name]), [['157056', 'SUI', 'Franjo von Allmen'], ['148903', 'SUI', 'Marco Odermatt']]);
assert.deepStrictEqual(O.parseSameGames('<select id=same_games_select><option value="">x</option><option value=15000001>Super G, Men</option></select>'), ['15000001']);
console.log('Tests Olympedia : OK.');
