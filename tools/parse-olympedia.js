/* Olympedia : lecture d'une page de résultats (« results/<id> ») et appariement avec notre liste de skieurs.
   Réutilise l'appariement de tools/parse-firstskisport.js (mêmes règles : nom, nom contenu, orthographe proche, même nation). */
(function (root) {
  'use strict';
  const S = typeof require === 'function' ? require('./parse-firstskisport.js') : root.SKI_FSS;
  const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#0?39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();

  /** -> [{ fss: <id Olympedia>, nat, name }] (clé « fss » conservée pour réutiliser matchAthletes). Épreuves par équipes : plusieurs lignes par pays, doublons écartés. */
  function parseResults(html) {
    const out = [], seen = new Set();
    const re = /<a href="https:\/\/www\.olympedia\.org\/athletes\/(\d+)">([^<]+)<\/a><\/td><td><a href="https:\/\/www\.olympedia\.org\/countries\/([A-Z]{3})"/g;
    let m;
    while ((m = re.exec(html))) { if (!seen.has(m[1])) { seen.add(m[1]); out.push({ fss: m[1], nat: m[3], name: strip(m[2]) }); } }
    return out;
  }
  /** Identifiants des autres épreuves du même Jeux (liste déroulante de la page). */
  function parseSameGames(html) {
    const m = html.match(/<select[^>]*id="same_games_select"[\s\S]*?<\/select>/);
    return m ? [...m[0].matchAll(/<option value="(\d+)">/g)].map((x) => x[1]) : [];
  }
  /** Identifiants de la 1re épreuve de chaque autre édition (liste « In other Games »), avec l'année. */
  function parseOtherGames(html) {
    const m = html.match(/<select[^>]*id="other_games_select"[\s\S]*?<\/select>/);
    return m ? [...m[0].matchAll(/<option value="(\d+)">(\d{4})<\/option>/g)].map((x) => ({ id: x[1], year: +x[2] })) : [];
  }
  const api = { parseResults, parseSameGames, parseOtherGames, matchAthletes: S.matchAthletes };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.SKI_OLY = api;
})(typeof window !== 'undefined' ? window : globalThis);
