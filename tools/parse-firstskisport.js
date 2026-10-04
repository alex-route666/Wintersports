/* Firstskisport : lecture d'une page « ranking.php » enregistrée en HTML, et appariement avec notre liste de skieurs. */
(function (root) {
  'use strict';
  const MAP = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'æ': 'ae', 'ø': 'oe', 'å': 'aa', 'ß': 'ss', 'Ä': 'Ae', 'Ö': 'Oe', 'Ü': 'Ue', 'Æ': 'Ae', 'Ø': 'Oe', 'Å': 'Aa', 'đ': 'd', 'ł': 'l' };
  const translit = (s) => s.replace(/[äöüæøåßÄÖÜÆØÅđł]/g, (c) => MAP[c]);
  const plain = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  const slug = (s) => plain(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const squash = (s) => slug(s).replace(/-/g, '');
  const keysOf = (name) => new Set([squash(name), squash(translit(name))]);
  const hasNonAscii = (s) => /[^\u0000-\u007f]/.test(s);
  const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#0?39;/g, "'").replace(/\s+/g, ' ').trim();

  /** -> [{ fss, nat, name }] ; name = « Prénom Nom » tel qu'écrit par le site (avec accents). */
  function parseRanking(html) {
    const out = [];
    const re = /<tr class="ranking nat([A-Z]{3})[^"]*"[\s\S]*?<a href="[^"]*athlete\.php\?id=(\d+)[^"]*"[^>]*>\s*<span[^>]*>([\s\S]*?)<\/span>([\s\S]*?)<\/a>/g;
    let m;
    while ((m = re.exec(html))) out.push({ fss: m[2], nat: m[1], name: `${strip(m[4])} ${strip(m[3])}`.trim() });
    return out;
  }

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
  const tokens = (s) => slug(translit(s)).split('-').filter(Boolean);

  /**
   * list : nos skieurs d'un genre ({id, name, nat}) ; rows : lignes Firstskisport du même genre.
   * Trois passes, de la plus sûre à la plus souple : même nom (accents et tirets ignorés), un nom contenu dans l'autre
   * (« Joan Verdu » / « Joan Verdu Sanchez »), puis une ou deux lettres d'écart. Les deux dernières exigent la même nation
   * et un seul candidat possible ; sinon la ligne est signalée comme ambiguë.
   * -> { matches: Map(id -> row + how), unmatched: [nos skieurs], leftover: [lignes du site], ambiguous: [...] }
   */
  function matchAthletes(list, rows) {
    const matches = new Map(), usedRows = new Set(), ambiguous = [];
    const free = () => rows.filter((r) => !usedRows.has(r.fss));
    const take = (a, r, how) => { matches.set(a.id, Object.assign({ how }, r)); usedRows.add(r.fss); };
    // 1. même nom
    list.forEach((a) => {
      const k = squash(a.id);
      const c = free().filter((r) => keysOf(r.name).has(k));
      if (c.length === 1) take(a, c[0], 'nom');
      else if (c.length > 1) { const same = c.filter((r) => r.nat === a.nat); if (same.length === 1) take(a, same[0], 'nom'); else ambiguous.push({ athlete: a, candidates: c }); }
    });
    // 2 et 3. même nation, plus souple
    const pass = (how, test) => list.filter((a) => !matches.has(a.id)).forEach((a) => {
      const c = free().filter((r) => r.nat === a.nat && test(a, r));
      if (c.length === 1) take(a, c[0], how);
      else if (c.length > 1) ambiguous.push({ athlete: a, candidates: c });
    });
    pass('nom contenu', (a, r) => {
      const x = tokens(a.name), y = tokens(r.name);
      const [s, l] = x.length <= y.length ? [x, y] : [y, x];
      return s.length >= 2 && x[0] === y[0] && s.every((t) => l.includes(t));
    });
    pass('orthographe proche', (a, r) => lev(squash(a.id), squash(translit(r.name))) <= 2);
    return { matches, unmatched: list.filter((a) => !matches.has(a.id)), leftover: free(), ambiguous };
  }

  /** Nom à afficher : celui du site, s'il ne diffère du nôtre que par des accents (le site les écrit, la FIS non). */
  function betterName(ourName, fssName) {
    if (!hasNonAscii(fssName)) return ourName;
    return squash(translit(fssName)) === squash(translit(ourName)) ? fssName : ourName;
  }

  const api = { parseRanking, matchAthletes, betterName, translit, squash };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SKI_FSS = api;
})(typeof window !== 'undefined' ? window : globalThis);
