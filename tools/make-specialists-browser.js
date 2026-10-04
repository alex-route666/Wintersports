#!/usr/bin/env node
/* Génère tools/specialists-browser.js : script à coller dans la console du navigateur, sur firstskisport.com.
   Il lit les calendriers de Coupe du monde (messieurs et dames) des dernières saisons, puis le classement des courses
   dont la station et la discipline sont au programme de Ski game, et télécharge le tout dans fss-history.json.
   Ensuite : node tools/build-specialists.js fss-history.json   (écrit js/specialists.js)
   Options : node tools/make-specialists-browser.js [--last 2026] [--seasons 5]
   --last : année de FIN de la dernière saison à lire (2026 = saison 2025/26), --seasons : combien de saisons. */
const fs = require('fs'), path = require('path');
const D = require('../js/data.js');
const S = require('./specialists.js');
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > -1 ? Number(process.argv[i + 1]) : d; };
const last = arg('--last', 2026), n = arg('--seasons', 5);
const SEASONS = Array.from({ length: n }, (_, i) => last - i);

// les courses du jeu qui ont un historique possible : une station connue, hors Mondiaux
const KEYS = [];
Object.values(D.RACES).filter((r) => r.kind !== 'mondial' && !/déterminer/i.test(r.place)).forEach((r) => {
  if (!KEYS.some((k) => k.gender === r.gender && k.disc === r.disc && k.place === r.place)) KEYS.push({ gender: r.gender, disc: r.disc, place: r.place });
});

const code = `/* Ski game – à coller dans la console du navigateur, sur une page de https://firstskisport.com (générée : ne pas modifier) */
(async () => {
  // fonctions de lecture recopiées de tools/specialists.js
  const MAP = ${JSON.stringify(S.MAP)};
  const HILL_ALIAS = ${JSON.stringify(S.HILL_ALIAS)};
  const DISC_CODE = ${JSON.stringify(S.DISC_CODE)};
  const plain = (s) => s.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/[øæßđł]/g, (c) => MAP[c]);
  const slug = (s) => plain(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#0?39;/g, "'").replace(/\\s+/g, ' ').trim();
  const hillMatches = ${S.hillMatches.toString()};
  const parseCalendar = ${S.parseCalendar.toString()};
  const parseResults = ${S.parseResults.toString()};

  const KEYS = ${JSON.stringify(KEYS)};
  const SEASONS = ${JSON.stringify(SEASONS)};
  const DELAY = 4000, WAIT = 60000, STOP = { stop: true }, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let last = 0;
  async function get(u) { // une requête à la fois, espacée ; si le site dit « trop de requêtes » (429), on patiente puis on réessaie
    for (let k = 1; k <= 3; k++) {
      const gap = DELAY - (Date.now() - last); if (gap > 0) await sleep(gap);
      last = Date.now();
      try {
        const r = await fetch(u, { credentials: 'same-origin' });
        if (r.status === 429 || r.status === 403) { console.log('Le site demande de ralentir (' + r.status + '), pause de ' + (WAIT * k / 1000) + ' s…'); await sleep(WAIT * k); continue; }
        return r.ok ? await r.text() : null;
      } catch (e) { await sleep(2000); }
    }
    throw STOP; // le site refuse toujours : on s'arrête proprement
  }

  // 1) les courses à lire : calendriers messieurs puis dames, saison par saison
  window.SKI_JOBS = window.SKI_JOBS || null;
  window.SKI_HIST = window.SKI_HIST || [];
  let stopped = false;
  try {
    if (!window.SKI_JOBS) {
      const jobs = [];
      for (const y of SEASONS) for (const g of ['M', 'W']) {
        const html = await get('/alpine/calendar.php?y=' + y + (g === 'W' ? '&g=w' : ''));
        if (!html) { console.log('Calendrier ' + g + ' ' + y + ' : introuvable'); continue; }
        parseCalendar(html).forEach((c) => {
          if (KEYS.some((k) => k.gender === g && k.disc === c.disc && hillMatches(c.hill, k.place))) jobs.push({ season: y, gender: g, hill: c.hill, disc: c.disc, id: c.id });
        });
        console.log('Calendrier ' + (g === 'M' ? 'messieurs' : 'dames') + ' ' + (y - 1) + '/' + y + ' lu (' + jobs.length + ' courses au total)');
      }
      window.SKI_JOBS = jobs;
    }
    // 2) le classement de chaque course (on reprend où l'on s'était arrêté si le script est recollé)
    const done = new Set(window.SKI_HIST.map((h) => h.gender + h.id));
    const todo = window.SKI_JOBS.filter((j) => !done.has(j.gender + j.id));
    console.log(todo.length + ' classements à lire (environ ' + Math.ceil(todo.length * DELAY / 60000) + ' min)');
    let i = 0;
    for (const j of todo) {
      const html = await get('/alpine/results.php?id=' + j.id + (j.gender === 'W' ? '&g=w' : ''));
      i++;
      if (!html) { console.log('Course ' + j.id + ' : introuvable'); continue; }
      const r = parseResults(html);
      window.SKI_HIST.push({ season: j.season, gender: j.gender, hill: j.hill, disc: j.disc, id: j.id, category: r.category, date: r.date, rows: r.rows });
      if (i % 20 === 0) console.log(i + ' / ' + todo.length);
    }
  } catch (e) { if (e === STOP) stopped = true; else throw e; }

  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ generated: new Date().toISOString().slice(0, 10), seasons: SEASONS, history: window.SKI_HIST })], { type: 'application/json' }));
  a.download = 'fss-history.json'; document.body.appendChild(a); a.click();
  const left = (window.SKI_JOBS ? window.SKI_JOBS.length : 0) - window.SKI_HIST.length;
  console.log(stopped ? 'ARRÊT : le site refuse. Le fichier téléchargé est partiel (' + window.SKI_HIST.length + ' courses). Pour reprendre plus tard, recolle ce script dans le même onglet : il continuera là où il s\\'est arrêté.' : 'TERMINÉ : ' + window.SKI_HIST.length + ' courses dans fss-history.json.');
  if (!stopped && left > 0) console.log(left + ' course(s) introuvable(s) : sans conséquence, elles sont ignorées.');
})();
`;
fs.writeFileSync(path.join(__dirname, 'specialists-browser.js'), code);
console.log('specialists-browser.js :', KEYS.length, 'courses distinctes,', SEASONS.length, 'saisons (' + SEASONS.map((y) => (y - 1) + '/' + y).join(', ') + '),', code.length, 'octets');
