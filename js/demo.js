/* Ski game – DONNÉES DE DÉMONSTRATION (maquette).
   Les joueurs, choix et résultats ci-dessous sont inventés et ne servent qu'à montrer l'interface. */
(function (root) {
  'use strict';

  // Les skieurs viennent de la vraie liste (js/athletes.js) ; seuls joueurs, choix et résultats sont fictifs.
  const ATHLETES = root.SKI_ATHLETES || (typeof require === 'function' ? require('./athletes.js') : { M: [], W: [] });

  const PLAYERS = [
    { id: 'p1', name: 'Alexandre' }, { id: 'p2', name: 'Joueur 2' }, { id: 'p3', name: 'Joueur 3' },
    { id: 'p4', name: 'Joueur 4' }, { id: 'p5', name: 'Joueur 5' }, { id: 'p6', name: 'Joueur 6' },
  ];
  const ME = 'p1';

  const A = (g, i) => ATHLETES[g][i].id;
  const top = (g, order) => order.map((i, k) => ({ ath: A(g, i), rank: k + 1 }));

  // Résultats fictifs : S1 (Sölden) et S2 (Levi). Un abandon dans chaque course pour montrer le « 0 point ».
  const RESULTS = {
    M01: [...top('M', [1, 0, 3, 4, 7, 2, 8]), { ath: A('M', 5), status: 'DNF' }],
    W01: [...top('W', [1, 2, 0, 4, 3, 7, 8]), { ath: A('W', 6), status: 'DNF' }],
    M02: [...top('M', [6, 2, 7, 10, 3, 4, 11]), { ath: A('M', 0), status: 'DNF' }],
    W02: [...top('W', [0, 10, 5, 6, 7, 11, 4]), { ath: A('W', 1), status: 'DNS' }],
  };

  // Choix fictifs : [M01, W01, M02, W02] titulaires (+ remplaçant éventuel pour W02).
  const PICKS = {
    p1: { M01: { a: A('M', 1) }, W01: { a: A('W', 2) }, M02: { a: A('M', 6) }, W02: { a: A('W', 1), b: A('W', 0) } },
    p2: { M01: { a: A('M', 0) }, W01: { a: A('W', 1) }, M02: { a: A('M', 2) }, W02: { a: A('W', 10) } },
    p3: { M01: { a: A('M', 3) }, W01: { a: A('W', 0) }, M02: { a: A('M', 0) }, W02: { a: A('W', 5) } },
    p4: { M01: { a: A('M', 5) }, W01: { a: A('W', 6) }, M02: { a: A('M', 10) }, W02: { a: A('W', 4) } },
    p5: { M01: { a: A('M', 2) }, W01: { a: A('W', 3) }, M02: { a: A('M', 7) }, W02: { a: A('W', 0) } },
    p6: { M01: { a: A('M', 4) }, W01: { a: A('W', 7) }, M02: { a: A('M', 3) }, W02: { a: A('W', 11) } },
  };

  const api = { PLAYERS, ME, RESULTS, PICKS, DEMO_NOW: '2026-11-16T09:00:00Z' };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SKI_DEMO = api;
})(typeof window !== 'undefined' ? window : globalThis);
