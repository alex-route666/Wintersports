/* Ski game – règles du jeu (fonctions pures, testables sous Node) */
(function (root) {
  'use strict';
  const D = typeof module !== 'undefined' && module.exports ? require('./data.js') : root.SKI_DATA;

  /* ---------- Dates : heure de Paris ---------- */
  function parisInstant(date, time) {
    const [y, m, d] = date.split('-').map(Number);
    const [h, mi] = (time || '00:00').split(':').map(Number);
    const guess = Date.UTC(y, m - 1, d, h, mi);
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Paris', hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    });
    const parts = Object.fromEntries(fmt.formatToParts(new Date(guess)).map((p) => [p.type, p.value]));
    const asParis = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
    const offset = asParis - guess;
    return new Date(guess - offset);
  }

  const raceStart = (race) => parisInstant(race.date, race.time);

  function sessionRaces(session) { return session.races.map((id) => D.RACES[id]); }

  function sessionDeadline(session) {
    return new Date(Math.min(...sessionRaces(session).map((r) => raceStart(r).getTime())));
  }
  function sessionEnd(session) {
    const last = sessionRaces(session).map((r) => raceStart(r).getTime());
    return new Date(Math.max(...last) + 12 * 3600 * 1000);
  }
  /** 'ouverte' (choix possibles) | 'en cours' (choix verrouillés) | 'terminée' */
  function sessionState(session, now) {
    if (now < sessionDeadline(session)) return 'ouverte';
    if (now < sessionEnd(session)) return 'en cours';
    return 'terminée';
  }

  /* ---------- Points ---------- */
  function pointsForRank(rank) {
    return rank >= 1 && rank <= D.POINTS.length ? D.POINTS[rank - 1] : 0;
  }
  function findEntry(results, raceId, athId) {
    return ((results && results[raceId]) || []).find((e) => e.ath === athId) || null;
  }
  /** Athlète effectivement compté : le titulaire, sauf DNS où le remplaçant prend le relais. */
  function effectiveAthlete(pick, results, raceId) {
    if (!pick || !pick.a) return null;
    const main = findEntry(results, raceId, pick.a);
    if (main && main.status === 'DNS' && pick.b) return pick.b;
    return pick.a;
  }
  function scoreRace(race, pick, results) {
    if (!results || !results[race.id]) return null; // pas encore de résultat
    const ath = effectiveAthlete(pick, results, race.id);
    if (!ath) return 0;
    const e = findEntry(results, race.id, ath);
    if (!e || e.status) return 0; // DNF, DSQ, DNS, ou hors points
    return pointsForRank(e.rank) * race.mult;
  }

  /* ---------- Bonus des Mondiaux ---------- */
  function worldsWinner(results, raceId) {
    const e = ((results && results[raceId]) || []).find((x) => !x.status && x.rank === 1);
    return e ? e.ath : null;
  }
  /** +200 par discipline (H et F gagnants), +400 pour les 4 vainqueurs d'un genre, cumulables. */
  function worldsBonus(picksOfPlayer, results) {
    const won = {};
    D.WORLDS.races.forEach((id) => {
      const w = worldsWinner(results, id);
      won[id] = !!w && effectiveAthlete(picksOfPlayer && picksOfPlayer[id], results, id) === w;
    });
    const lines = [];
    ['DH', 'SG', 'GS', 'SL'].forEach((d) => {
      if (won['XM' + d] && won['XW' + d]) lines.push({ label: D.DISC[d].fr + ' : les deux vainqueurs', pts: 200 });
    });
    ['M', 'W'].forEach((g) => {
      if (['DH', 'SG', 'GS', 'SL'].every((d) => won['X' + g + d])) {
        lines.push({ label: (g === 'M' ? 'Messieurs' : 'Dames') + ' : quatre vainqueurs', pts: 400 });
      }
    });
    return { lines, total: lines.reduce((s, l) => s + l.pts, 0) };
  }

  /* ---------- Totaux ---------- */
  function sessionScore(session, picksOfPlayer, results) {
    return sessionRaces(session).reduce((s, r) => s + (scoreRace(r, picksOfPlayer && picksOfPlayer[r.id], results) || 0), 0);
  }
  function deskScore(deskId, picksOfPlayer, results) {
    return D.SESSIONS.filter((s) => s.desk === deskId).reduce((s, x) => s + sessionScore(x, picksOfPlayer, results), 0);
  }
  function worldsScore(picksOfPlayer, results) {
    const races = D.WORLDS.races.reduce((s, id) => s + (scoreRace(D.RACES[id], picksOfPlayer && picksOfPlayer[id], results) || 0), 0);
    const bonus = worldsBonus(picksOfPlayer, results).total;
    return { races, bonus, total: races + bonus };
  }
  function disciplineScore(disc, picksOfPlayer, results) {
    return Object.values(D.RACES).filter((r) => r.disc === disc)
      .reduce((s, r) => s + (scoreRace(r, picksOfPlayer && picksOfPlayer[r.id], results) || 0), 0);
  }
  function generalScore(picksOfPlayer, results) {
    const desks = D.DESKS.map((d) => deskScore(d.id, picksOfPlayer, results));
    const w = worldsScore(picksOfPlayer, results);
    return { desks, worlds: w.total, total: desks.reduce((a, b) => a + b, 0) + w.total };
  }

  /* ---------- Contrainte « un athlète une seule fois par desk » ---------- */
  /** Athlètes déjà utilisés comme titulaires dans le desk, pour un genre, hors la course `exceptRaceId`. */
  function usedInDesk(deskId, gender, picksOfPlayer, exceptRaceId) {
    const used = new Set();
    // deskId 0 = bloc des Mondiaux (huit épreuves, huit skieurs différents par genre)
    const scope = deskId === 0 ? [D.WORLDS] : D.SESSIONS.filter((s) => s.desk === deskId);
    scope.forEach((s) => {
      sessionRaces(s).forEach((r) => {
        if (r.gender !== gender || r.id === exceptRaceId) return;
        const p = picksOfPlayer && picksOfPlayer[r.id];
        if (p && p.a) used.add(p.a);
      });
    });
    return used;
  }

  const api = {
    parisInstant, raceStart, sessionRaces, sessionDeadline, sessionEnd, sessionState,
    pointsForRank, effectiveAthlete, scoreRace, worldsWinner, worldsBonus,
    sessionScore, deskScore, worldsScore, disciplineScore, generalScore, usedInDesk,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SKI_GAME = api;
})(typeof window !== 'undefined' ? window : globalThis);
