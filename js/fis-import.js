/* Ski game – import des classements FIS (page « Cup Standings » enregistrée en HTML).
   Utilisable sous Node (génération de js/athletes.js) et dans le navigateur (future section Admin). */
(function (root) {
  'use strict';

  /* Les noms FIS sont en ASCII (DUERR, HUETTER…). Ces corrections d'affichage sont celles dont on est sûr ;
     tout le reste est à arbitrer dans l'Admin. Clé : nom FIS exact. */
  const NAME_OVERRIDES = {
    'MEILLARD Loic': 'Loïc Meillard', 'NOEL Clement': 'Clément Noël',
    'DUERR Lena': 'Lena Dürr', 'HUETTER Cornelia': 'Cornelia Hütter', 'RAEDLER Ariane': 'Ariane Rädler',
    'HAEHLEN Joana': 'Joana Hählen', 'HOERHAGER Lisa': 'Lisa Hörhager', 'HOEPLI Aline': 'Aline Höpli',
    'BRAENDLI Anuk': 'Anuk Brändli', 'BUERGLER Viktoria': 'Viktoria Bürgler', 'LANDSTROEM Moa': 'Moa Landström',
    'OEHLUND Cornelia': 'Cornelia Öhlund', 'ROENNGREN Mattias': 'Mattias Rönngren',
    'ZENHAEUSERN Ramon': 'Ramon Zenhäusern', 'ROESTI Lars': 'Lars Rösti', 'MOELLER Fredrik': 'Fredrik Möller',
    'HAECHLER Lenz': 'Lenz Hächler', 'LJUTIC Zrinka': 'Zrinka Ljutić',
  };
  const LOWER_PARTICLES = new Set(['VON', 'VAN', 'ZU']);

  const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  function decode(s) {
    return s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => {
      if (e[0] === '#') {
        const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : m;
      }
      return Object.prototype.hasOwnProperty.call(ENTITIES, e.toLowerCase()) ? ENTITIES[e.toLowerCase()] : m;
    });
  }
  function flatten(html) {
    let t = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, '');
    t = t.replace(/<[^>]+>/g, '|');
    t = decode(t).replace(/\s+/g, ' ').replace(/(\| ?)+/g, '|');
    return t;
  }

  function capWord(w) {
    if (/^MC.{2,}/.test(w)) return 'Mc' + w[2] + w.slice(3).toLowerCase();
    return w.split(/([-'])/).map((p) => (/^[-']$/.test(p) ? p : p.charAt(0) + p.slice(1).toLowerCase())).join('');
  }
  /** « DELLA MEA Lara » -> { surname: 'DELLA MEA', first: 'Lara' }. Gère les cas sans prénom (« HURT A J »). */
  function splitName(fis) {
    const toks = fis.trim().split(/\s+/);
    const isUp = (t) => t === t.toUpperCase() && /[A-Z]/.test(t);
    const sur = [];
    while (toks.length && isUp(toks[0])) sur.push(toks.shift());
    if (!toks.length && sur.length > 1) { toks.push(...sur.splice(1)); } // tout en majuscules : 1er mot = nom
    return { surname: sur.join(' '), first: toks.join(' ') };
  }
  function displayName(fis) {
    if (NAME_OVERRIDES[fis]) return NAME_OVERRIDES[fis];
    const { surname, first } = splitName(fis);
    const sur = surname.split(' ').map((w) => (LOWER_PARTICLES.has(w) ? w.toLowerCase() : capWord(w))).join(' ');
    return `${first} ${sur}`.trim();
  }
  const idOf = (fis) => { const { surname, first } = splitName(fis); return slug(`${first} ${surname}`); };

  /**
   * Lit un export HTML de la page FIS « Cup Standings » (classement général).
   * gender : 'M' (une colonne « marque de skis » en plus) ou 'W'.
   * Retourne { athletes: [{id, fis, name, nat, rank, pts, inj, fid?, brand?}], warnings: [] }.
   fid = identifiant FIS (competitorid), stable même si l'orthographe du nom change.
   */
  function parseFisStandings(html, gender) {
    const blocks = flatten(html).split('|Overall|ALL|');
    // Identifiants FIS (competitorid) : un lien par ligne du tableau, dans le même ordre.
    const fids = [];
    html.replace(/<a[^>]*class="table-row[^"]*"[^>]*href="[^"]*competitorid=(\d+)/g, (m, id) => { fids.push(id); return m; });
    const athletes = [], warnings = [];
    const fidsOk = fids.length === blocks.length - 1;
    if (!fidsOk && fids.length) warnings.push(`Identifiants FIS ignorés : ${fids.length} liens pour ${blocks.length - 1} lignes`);
    for (let i = 0; i < blocks.length - 1; i++) {
      const seg = blocks[i].split('|');
      let k = seg.length - 1;
      const nat = (seg[k--] || '').trim();
      let inj = false;
      if ((seg[k] || '').trim() === '#') { inj = true; k--; }
      let brand = '';
      if (gender === 'M') brand = (seg[k--] || '').trim();
      const fis = (seg[k] || '').trim();
      const nxt = blocks[i + 1].split('|');
      const rank = parseInt(nxt[0], 10);
      const pts = parseInt(String(nxt[1]).replace(/'/g, ''), 10);
      if (!/^[A-Z]{3}$/.test(nat) || !fis || !Number.isFinite(rank) || !Number.isFinite(pts)) {
        warnings.push(`Ligne ${i + 1} illisible : « ${fis} » / ${nat} / ${nxt[0]} / ${nxt[1]}`);
        continue;
      }
      const a = { id: idOf(fis), fis, name: displayName(fis), nat, rank, pts, inj };
      if (fidsOk && fids.length) a.fid = fids[i];
      if (gender === 'M') a.brand = brand;
      athletes.push(a);
    }
    const seen = new Set();
    athletes.forEach((a) => { if (seen.has(a.id)) warnings.push(`Identifiant en double : ${a.id} (${a.fis})`); seen.add(a.id); });
    athletes.sort((a, b) => a.rank - b.rank || a.fis.localeCompare(b.fis));
    return { athletes, warnings };
  }

  /* ---------- Fusion d'une nouvelle liste avec l'existante ---------- */
  function lev(a, b) {
    const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[n];
  }
  /**
   * existing, incoming : tableaux d'athlètes d'un même genre.
   * - added : nouveaux noms sans équivalent.
   * - alerts : un nom nouveau ressemble à un nom existant absent de la nouvelle liste (changement d'orthographe ?).
   *   À arbitrer : fusionner (garder l'ancien identifiant) ou garder les deux.
   * - kept : noms absents de la nouvelle liste. Ils restent sélectionnables, pour ne rien casser.
   */
  function diffLists(existing, incoming) {
    const byId = new Map(existing.map((a) => [a.id, a]));
    const inIds = new Set(incoming.map((a) => a.id));
    const missing = existing.filter((a) => !inIds.has(a.id));
    const fresh = incoming.filter((a) => !byId.has(a.id));
    const alerts = [], added = [];
    const taken = new Set();
    fresh.forEach((n) => {
      let best = null;
      missing.forEach((o) => {
        if (taken.has(o.id)) return;
        const d = lev(slug(o.fis || o.name), slug(n.fis || n.name));
        const sameNat = o.nat === n.nat;
        const sameSurname = splitName(o.fis || o.name).surname === splitName(n.fis || n.name).surname;
        const sameFirst = splitName(o.fis || o.name).first === splitName(n.fis || n.name).first;
        const score = (sameNat ? 0 : 3) + d - (sameSurname || sameFirst ? 2 : 0);
        if (sameNat && (d <= 3 || sameSurname || sameFirst) && (!best || score < best.score)) best = { o, score, d };
      });
      if (best) { taken.add(best.o.id); alerts.push({ old: best.o, new: n, distance: best.d }); } else added.push(n);
    });
    const alertOld = new Set(alerts.map((a) => a.old.id));
    const moved = incoming.filter((a) => byId.has(a.id) && byId.get(a.id).rank !== a.rank)
      .map((a) => ({ id: a.id, name: a.name, from: byId.get(a.id).rank, to: a.rank }));
    return { added, alerts, kept: missing.filter((a) => !alertOld.has(a.id)), moved, unchanged: incoming.length - fresh.length - moved.length };
  }

  const api = { parseFisStandings, splitName, displayName, idOf, slug, diffLists, NAME_OVERRIDES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SKI_FIS = api;
})(typeof window !== 'undefined' ? window : globalThis);
