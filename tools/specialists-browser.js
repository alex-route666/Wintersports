/* Ski game – à coller dans la console du navigateur, sur une page de https://firstskisport.com (générée : ne pas modifier) */
(async () => {
  // fonctions de lecture recopiées de tools/specialists.js
  const MAP = {"ø":"o","æ":"ae","ß":"ss","đ":"d","ł":"l"};
  const HILL_ALIAS = {"copper-mtn":"copper-mountain","st-moritz":"saint-moritz","groeden":"val-gardena","plan-de-corones":"kronplatz","obergurgl":"gurgl","gurgl-soelden":"gurgl","mont-tremblant":"tremblant","palisades-tahoe":"palisades-tahoe"};
  const DISC_CODE = {"slalom":"SL","giant slalom":"GS","super g":"SG","downhill":"DH"};
  const plain = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[øæßđł]/g, (c) => MAP[c]);
  const slug = (s) => plain(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#0?39;/g, "'").replace(/\s+/g, ' ').trim();
  const hillMatches = function hillMatches(a, b) {
  const x = HILL_ALIAS[slug(a)] || slug(a), y = HILL_ALIAS[slug(b)] || slug(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const tx = x.split('-'), ty = y.split('-');
  const [s, l] = tx.length <= ty.length ? [tx, ty] : [ty, tx];
  return s.join('').length >= 5 && s.every((t) => l.includes(t)); // « garmisch » ⊂ « garmisch-partenkirchen »
};
  const parseCalendar = function parseCalendar(html) {
  const out = [];
  const re = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  let m;
  while ((m = re.exec(html))) {
    const tds = [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((x) => x[1]);
    if (tds.length < 4) continue;
    const id = /results\.php\?id=(\d+)/.exec(tds[2]);
    const disc = DISC_CODE[strip(tds[3]).toLowerCase()];
    if (!id || !disc) continue;
    out.push({ date: strip(tds[0]), hill: strip(tds[2]), disc, id: id[1] });
  }
  return out;
};
  const parseResults = function parseResults(html) {
  const h2 = /<h2[^>]*>([\s\S]*?)<\/h2>/.exec(html);
  const head = h2 ? strip(h2[1]).split(',').map((s) => s.trim()) : [];
  const rows = [];
  const re = /<tr class="rider[^"]*"[^>]*>([\s\S]*?)<\/tr>/g;
  let m;
  while ((m = re.exec(html))) {
    const tds = [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((x) => x[1]);
    const a = /athlete\.php\?id=(\d+)/.exec(m[1]);
    if (tds.length < 9 || !a) continue;
    rows.push({ pos: strip(tds[0]), fss: a[1], pts: parseInt(strip(tds[8]), 10) || 0 });
  }
  return { category: head[1] || '', date: head[2] || '', rows };
};

  const KEYS = [{"gender":"M","disc":"GS","place":"Sölden"},{"gender":"M","disc":"SL","place":"Levi"},{"gender":"M","disc":"SL","place":"Gurgl"},{"gender":"M","disc":"SG","place":"Copper Mountain"},{"gender":"M","disc":"GS","place":"Copper Mountain"},{"gender":"M","disc":"DH","place":"Beaver Creek"},{"gender":"M","disc":"SG","place":"Beaver Creek"},{"gender":"M","disc":"GS","place":"Beaver Creek"},{"gender":"M","disc":"GS","place":"Val d'Isère"},{"gender":"M","disc":"SL","place":"Val d'Isère"},{"gender":"M","disc":"DH","place":"Val Gardena"},{"gender":"M","disc":"SG","place":"Val Gardena"},{"gender":"M","disc":"GS","place":"Alta Badia"},{"gender":"M","disc":"SL","place":"Alta Badia"},{"gender":"M","disc":"SL","place":"Madonna di Campiglio"},{"gender":"M","disc":"DH","place":"Bormio"},{"gender":"M","disc":"SG","place":"Bormio"},{"gender":"M","disc":"GS","place":"Kranjska Gora"},{"gender":"M","disc":"SL","place":"Kranjska Gora"},{"gender":"M","disc":"GS","place":"Adelboden"},{"gender":"M","disc":"SL","place":"Adelboden"},{"gender":"M","disc":"SG","place":"Wengen"},{"gender":"M","disc":"DH","place":"Wengen"},{"gender":"M","disc":"SL","place":"Wengen"},{"gender":"M","disc":"SG","place":"Kitzbühel"},{"gender":"M","disc":"DH","place":"Kitzbühel"},{"gender":"M","disc":"SL","place":"Kitzbühel"},{"gender":"M","disc":"GS","place":"Schladming"},{"gender":"M","disc":"SL","place":"Schladming"},{"gender":"M","disc":"SL","place":"Chamonix"},{"gender":"M","disc":"DH","place":"Garmisch-Partenkirchen"},{"gender":"M","disc":"SG","place":"Garmisch-Partenkirchen"},{"gender":"M","disc":"DH","place":"Saalbach"},{"gender":"M","disc":"SG","place":"Saalbach"},{"gender":"M","disc":"DH","place":"Kvitfjell"},{"gender":"M","disc":"SG","place":"Kvitfjell"},{"gender":"M","disc":"GS","place":"Åre"},{"gender":"M","disc":"SL","place":"Åre"},{"gender":"M","disc":"DH","place":"Sun Valley"},{"gender":"M","disc":"SG","place":"Sun Valley"},{"gender":"M","disc":"GS","place":"Sun Valley"},{"gender":"M","disc":"SL","place":"Sun Valley"},{"gender":"W","disc":"GS","place":"Sölden"},{"gender":"W","disc":"SL","place":"Levi"},{"gender":"W","disc":"SL","place":"Gurgl"},{"gender":"W","disc":"GS","place":"Killington"},{"gender":"W","disc":"SL","place":"Killington"},{"gender":"W","disc":"GS","place":"Tremblant"},{"gender":"W","disc":"DH","place":"Beaver Creek"},{"gender":"W","disc":"SG","place":"Beaver Creek"},{"gender":"W","disc":"SG","place":"Saint-Moritz"},{"gender":"W","disc":"GS","place":"Saint-Moritz"},{"gender":"W","disc":"GS","place":"Gosau"},{"gender":"W","disc":"SL","place":"Gosau"},{"gender":"W","disc":"GS","place":"Flachau"},{"gender":"W","disc":"SL","place":"Flachau"},{"gender":"W","disc":"DH","place":"Cortina d'Ampezzo"},{"gender":"W","disc":"SG","place":"Cortina d'Ampezzo"},{"gender":"W","disc":"GS","place":"Kronplatz"},{"gender":"W","disc":"GS","place":"Jasná"},{"gender":"W","disc":"SL","place":"Jasná"},{"gender":"W","disc":"GS","place":"Kranjska Gora"},{"gender":"W","disc":"SL","place":"Kranjska Gora"},{"gender":"W","disc":"SG","place":"Lenzerheide"},{"gender":"W","disc":"DH","place":"Garmisch-Partenkirchen"},{"gender":"W","disc":"GS","place":"Soldeu"},{"gender":"W","disc":"SL","place":"Soldeu"},{"gender":"W","disc":"DH","place":"Narvik"},{"gender":"W","disc":"SG","place":"Narvik"},{"gender":"W","disc":"DH","place":"Sun Valley"},{"gender":"W","disc":"SG","place":"Sun Valley"},{"gender":"W","disc":"GS","place":"Sun Valley"},{"gender":"W","disc":"SL","place":"Sun Valley"}];
  const SEASONS = [2026,2025,2024,2023,2022];
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
  console.log(stopped ? 'ARRÊT : le site refuse. Le fichier téléchargé est partiel (' + window.SKI_HIST.length + ' courses). Pour reprendre plus tard, recolle ce script dans le même onglet : il continuera là où il s\'est arrêté.' : 'TERMINÉ : ' + window.SKI_HIST.length + ' courses dans fss-history.json.');
  if (!stopped && left > 0) console.log(left + ' course(s) introuvable(s) : sans conséquence, elles sont ignorées.');
})();
