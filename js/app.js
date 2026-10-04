/* Ski game – interface (maquette sans connexion) */
(function () {
  'use strict';
  const D = window.SKI_DATA, G = window.SKI_GAME, DEMO = window.SKI_DEMO;
  const TZ = 'Europe/Paris';
  const STORE = 'skigame.maquette.picks';

  const ATH = {};
  ['M', 'W'].forEach((g) => DEMO.ATHLETES[g].forEach((a) => { ATH[a.id] = Object.assign({ gender: g }, a); }));

  const state = {
    tab: 'next',
    sub: { 1: 'mine', 2: 'mine', 3: 'mine', 0: 'mine' },
    sim: null,
    demo: false,
    players: [{ id: DEMO.ME, name: 'Alexandre' }],
    me: DEMO.ME,
    picks: { [DEMO.ME]: {} },
    results: {},
  };

  /* ---------- Utilitaires ---------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const now = () => state.sim || new Date();
  const fmt = (opts) => new Intl.DateTimeFormat('fr-FR', Object.assign({ timeZone: TZ }, opts));
  const F_DAY = fmt({ weekday: 'short', day: 'numeric', month: 'short' });
  const F_LONG = fmt({ weekday: 'long', day: 'numeric', month: 'long' });
  const F_HOUR = fmt({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const F_SHORT = fmt({ day: 'numeric', month: 'short' });
  const dayOf = (date) => F_DAY.format(G.parisInstant(date, '12:00'));
  const shortOf = (date) => F_SHORT.format(G.parisInstant(date, '12:00'));
  const deadlineText = (d) => `${F_LONG.format(d)} à ${F_HOUR.format(d).replace(':', ' h ')}`.replace(' h 00', ' h');
  const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;
  const surname = (name) => { const p = name.split(' '); return p.length > 1 ? `${p[0][0]}. ${p.slice(1).join(' ')}` : name; };
  const ordinal = (n) => (n === 1 ? '1er' : `${n}e`);
  const playerName = (id) => (state.players.find((p) => p.id === id) || { name: id }).name;
  const myPicks = () => state.picks[state.me] || (state.picks[state.me] = {});
  const deskKeyOf = (session) => session.desk; // 0 pour les Mondiaux

  const allSessions = () => [...D.SESSIONS, D.WORLDS]
    .sort((a, b) => G.sessionDeadline(a) - G.sessionDeadline(b));
  const scopeSessions = (key) => (key === 0 ? [D.WORLDS] : D.SESSIONS.filter((s) => s.desk === key));
  const locked = (session) => G.sessionState(session, now()) !== 'ouverte';
  const visible = (playerId, session) => playerId === state.me || locked(session);

  function load() {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) state.picks[state.me] = JSON.parse(raw);
    } catch (e) { /* stockage indisponible : on continue sans */ }
  }
  function save() {
    if (state.demo) return;
    try { localStorage.setItem(STORE, JSON.stringify(myPicks())); } catch (e) { /* ignoré */ }
  }

  /* ---------- Éléments récurrents ---------- */
  const discLabel = (r) => D.DISC[r.disc].fr + (r.sub ? ' ' + r.sub : '');
  const genderLabel = (r) => (r.gender === 'M' ? 'Messieurs' : 'Dames');
  const placeLabel = (r) => (r.kind === 'mondial' ? 'Crans-Montana' : r.place);
  function discBadge(r) {
    const mult = r.mult > 1
      ? `<span class="mult" title="${r.kind === 'mondial' ? 'Barème ×3 aux Mondiaux' : 'Barème ×2 pour les finales'}">×${r.mult}</span>` : '';
    return `<span class="disc disc--${r.disc}">${esc(discLabel(r))}</span>${mult}`;
  }
  function stateBadge(session) {
    const s = G.sessionState(session, now());
    return `<span class="state state--${s.replace(' ', '-')}">${s === 'ouverte' ? 'Choix ouverts' : s === 'en cours' ? 'Choix verrouillés' : 'Terminée'}</span>`;
  }
  function avatar(a, on) {
    const initials = a.name.split(' ').map((w) => w[0]).slice(0, 2).join('');
    return `<span class="avatar avatar--${a.gender}${on ? '' : ' is-off'}" aria-hidden="true">${esc(initials)}</span>`;
  }
  const pts = (n) => (n === null ? '' : `${n} pt${n > 1 ? 's' : ''}`);

  function podium(raceId) {
    const res = state.results[raceId];
    if (!res) return '';
    const ranked = res.filter((e) => !e.status).sort((a, b) => a.rank - b.rank).slice(0, 3);
    return ranked.map((e) => `${ordinal(e.rank)} ${esc(ATH[e.ath] ? ATH[e.ath].name : e.ath)}`).join(', ');
  }

  /* ---------- Sélecteurs de choix ---------- */
  function options(race, session, slot) {
    const picks = myPicks();
    const used = G.usedInDesk(deskKeyOf(session), race.gender, picks, race.id);
    const cur = picks[race.id] || {};
    const list = DEMO.ATHLETES[race.gender];
    const head = `<option value="">${slot === 'a' ? 'Choisir un skieur' : 'Aucun remplaçant'}</option>`;
    return head + list.map((a) => {
      const isCur = cur[slot] === a.id;
      const taken = used.has(a.id);
      const dis = !isCur && (taken || (slot === 'b' && cur.a === a.id));
      const note = taken && slot === 'a' ? ', déjà pris' : '';
      return `<option value="${a.id}"${isCur ? ' selected' : ''}${dis ? ' disabled' : ''}>${a.rank}. ${esc(a.name)} (${a.nat}${note})</option>`;
    }).join('');
  }
  function pickEditor(race, session) {
    const label = `${placeLabel(race)}, ${genderLabel(race)}, ${discLabel(race)}`;
    const cur = myPicks()[race.id] || {};
    return `<div class="pickbox">
      <label class="sr" for="pa-${race.id}">Skieur, ${esc(label)}</label>
      <select id="pa-${race.id}" class="pick" data-race="${race.id}" data-slot="a">${options(race, session, 'a')}</select>
      <label class="pickbox__sub" for="pb-${race.id}">Remplaçant</label>
      <select id="pb-${race.id}" class="pick pick--sub" data-race="${race.id}" data-slot="b"${cur.a ? '' : ' disabled'}>${options(race, session, 'b')}</select>
    </div>`;
  }
  function pickSummary(playerId, race) {
    const p = (state.picks[playerId] || {})[race.id];
    if (!p || !p.a) return '<span class="none">Aucun choix</span>';
    const main = ATH[p.a];
    const eff = G.effectiveAthlete(p, state.results, race.id);
    let out = `<span class="who">${esc(main ? main.name : p.a)}</span>`;
    if (p.b && eff === p.b) out = `<s class="who who--out">${esc(main ? main.name : p.a)}</s> <span class="who">${esc(ATH[p.b].name)}</span> <em class="sub">remplaçant</em>`;
    else if (p.b) out += ` <em class="sub">remplaçant ${esc(ATH[p.b].name)}</em>`;
    return out;
  }
  function outcome(race, playerId) {
    const res = state.results[race.id];
    if (!res) return '<span class="soon">Résultat à venir</span>';
    const sc = G.scoreRace(race, (state.picks[playerId] || {})[race.id], state.results);
    const p = (state.picks[playerId] || {})[race.id];
    const eff = p && G.effectiveAthlete(p, state.results, race.id);
    const e = eff && res.find((x) => x.ath === eff);
    let how = '';
    if (e && e.status) how = e.status;
    else if (e) how = ordinal(e.rank);
    return `<span class="score ${sc > 0 ? 'score--on' : 'score--off'}">${sc > 0 ? '+' : ''}${sc} pt${sc > 1 ? 's' : ''}</span>${how ? ` <span class="how">${how}</span>` : ''}`;
  }

  /* ---------- Courses d'une session (vue « Mon desk ») ---------- */
  function raceRow(race, session) {
    const open = !locked(session);
    const winners = podium(race.id);
    return `<li class="race">
      <div class="race__when"><span class="race__day">${dayOf(race.date)}</span><span class="race__place">${esc(placeLabel(race))}</span></div>
      <div class="race__what"><span class="gender gender--${race.gender}">${genderLabel(race)}</span> ${discBadge(race)}</div>
      <div class="race__pick">${open ? pickEditor(race, session) : pickSummary(state.me, race)}</div>
      <div class="race__out">${outcome(race, state.me)}${winners ? `<span class="podium">${winners}</span>` : ''}</div>
    </li>`;
  }
  function sessionCard(session, indexLabel) {
    const races = G.sessionRaces(session).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time) || a.gender.localeCompare(b.gender));
    const dl = G.sessionDeadline(session);
    const mine = G.sessionScore(session, myPicks(), state.results);
    const n = races.filter((r) => (myPicks()[r.id] || {}).a).length;
    const open = !locked(session);
    const unknown = races.some((r) => !r.timeKnown);
    return `<article class="session" id="s-${session.id}">
      <header class="session__head">
        <div>
          <h3 class="session__name">${esc(session.name)}</h3>
          <p class="session__meta">${indexLabel}${indexLabel ? ', ' : ''}${plural(races.length, 'course', 'courses')}, deadline ${deadlineText(dl)}${unknown ? ' (heure à confirmer)' : ''}</p>
        </div>
        <div class="session__side">${stateBadge(session)}${open ? `<span class="count${n === races.length ? ' count--ok' : ''}">${n} / ${races.length} choisis</span>` : `<span class="count count--pts">${mine} pts</span>`}</div>
      </header>
      <ul class="races">${races.map((r) => raceRow(r, session)).join('')}</ul>
    </article>`;
  }

  /* ---------- Récap des joueurs ---------- */
  function recapTable(session) {
    const races = G.sessionRaces(session).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time) || a.gender.localeCompare(b.gender));
    const head = state.players.map((p) => `<th scope="col" class="${p.id === state.me ? 'me' : ''}">${esc(p.name)}</th>`).join('');
    const rows = races.map((r) => {
      const cells = state.players.map((p) => {
        const pk = (state.picks[p.id] || {})[r.id];
        if (!pk || !pk.a) return `<td class="${p.id === state.me ? 'me' : ''}"><span class="none">Aucun choix</span></td>`;
        const eff = G.effectiveAthlete(pk, state.results, r.id);
        const sc = G.scoreRace(r, pk, state.results);
        const sub = eff !== pk.a ? ' <em class="sub">rempl.</em>' : '';
        return `<td class="${p.id === state.me ? 'me' : ''}"><span class="who" title="${esc(ATH[eff] ? ATH[eff].name : eff)}">${esc(surname(ATH[eff] ? ATH[eff].name : eff))}</span>${sub}${sc === null ? '' : `<span class="cellpts ${sc > 0 ? 'score--on' : 'score--off'}">${sc}</span>`}</td>`;
      }).join('');
      return `<tr><th scope="row"><span class="rowhead__day">${dayOf(r.date)}</span> ${esc(placeLabel(r))}<br>${genderLabel(r)} ${discBadge(r)}</th>${cells}</tr>`;
    }).join('');
    const totals = state.players.map((p) => `<td class="${p.id === state.me ? 'me' : ''}"><strong>${G.sessionScore(session, state.picks[p.id], state.results)}</strong></td>`).join('');
    return `<div class="tablewrap"><table class="grid">
      <caption>${esc(session.name)}</caption>
      <thead><tr><th scope="col">Course</th>${head}</tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><th scope="row">Points de la session</th>${totals}</tr></tfoot>
    </table></div>`;
  }
  function recapView(key) {
    const sessions = scopeSessions(key);
    const done = sessions.filter(locked);
    const waiting = sessions.filter((s) => !locked(s));
    let html = '';
    if (!done.length) html += '<p class="empty">Aucune session verrouillée. Les choix de chacun sont révélés à la deadline de la session.</p>';
    html += done.map(recapTable).join('');
    if (done.length && waiting.length) {
      html += `<p class="hint">${plural(waiting.length, 'session reste', 'sessions restent')} à venir. Leurs choix seront révélés à leur deadline.</p>`;
    }
    return html;
  }

  /* ---------- Athlètes pris ---------- */
  function takenView(key) {
    const sessions = scopeSessions(key);
    const takes = {}; // athId -> { playerId -> [labels] }
    sessions.forEach((s) => {
      G.sessionRaces(s).forEach((r) => {
        state.players.forEach((p) => {
          if (!visible(p.id, s)) return;
          const pk = (state.picks[p.id] || {})[r.id];
          if (!pk || !pk.a) return;
          ((takes[pk.a] = takes[pk.a] || {})[p.id] = (takes[pk.a][p.id] || [])).push(`${placeLabel(r)}, ${D.DISC[r.disc].short}${r.sub || ''}`);
        });
      });
    });
    const head = state.players.map((p) => `<th scope="col" class="${p.id === state.me ? 'me' : ''}">${esc(p.name)}</th>`).join('');
    return ['M', 'W'].map((g) => {
      const list = DEMO.ATHLETES[g];
      const taken = list.filter((a) => takes[a.id]).length;
      const rows = list.map((a) => {
        const on = !!takes[a.id];
        const cells = state.players.map((p) => {
          const l = takes[a.id] && takes[a.id][p.id];
          return `<td class="${p.id === state.me ? 'me' : ''}">${l ? `<span class="mark" title="${esc(l.join(', '))}">${esc(l.join(', '))}</span>` : ''}</td>`;
        }).join('');
        return `<tr class="${on ? 'is-taken' : 'is-free'}"><th scope="row">${avatar(ATH[a.id], on)}<span class="athname"><span class="rk">${a.rank}</span> ${esc(a.name)} <em class="sub">${a.nat}</em></span></th>${cells}</tr>`;
      }).join('');
      return `<div class="tablewrap"><table class="grid grid--taken">
        <caption>${g === 'M' ? 'Messieurs' : 'Dames'}, ${taken} sur ${list.length} déjà pris</caption>
        <thead><tr><th scope="col">Skieur, par ordre de classement</th>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
    }).join('') + '<p class="hint">Photos en couleur : skieur déjà choisi. En noir et blanc : encore libre. Les choix des autres joueurs apparaissent à la deadline de chaque session.</p>';
  }

  /* ---------- Panneau d'un desk / des Mondiaux ---------- */
  function worldsBox() {
    const b = G.worldsBonus(myPicks(), state.results);
    const lines = b.lines.length
      ? `<ul class="bonus__lines">${b.lines.map((l) => `<li><span>${esc(l.label)}</span><strong>+${l.pts}</strong></li>`).join('')}</ul>`
      : '<p class="hint">Aucun bonus pour l’instant.</p>';
    return `<aside class="bonus">
      <h3>Bonus des vainqueurs</h3>
      <p>Choisis les deux vainqueurs d’une même discipline, messieurs et dames : <strong>+200</strong>. Les quatre vainqueurs messieurs, ou les quatre dames : <strong>+400</strong>. Les bonus se cumulent, huit vainqueurs valent 1 600 points.</p>
      ${lines}
    </aside>`;
  }
  function deskPanel(key) {
    const isW = key === 0;
    const sessions = scopeSessions(key);
    const sub = state.sub[key];
    const dk = isW ? null : D.DESKS[key - 1];
    const score = isW ? G.worldsScore(myPicks(), state.results).total : G.deskScore(key, myPicks(), state.results);
    const total = sessions.reduce((n, s) => n + s.races.length, 0);
    const chosen = sessions.reduce((n, s) => n + s.races.filter((id) => (myPicks()[id] || {}).a).length, 0);
    const title = isW ? 'Championnats du monde de Crans-Montana' : dk.name;
    const dates = isW ? '4 au 14 février 2027, barème ×3, hors desks' : `${shortOf(dk.from)} au ${shortOf(dk.to)}`;
    const tabs = [['mine', 'Mon desk'], ['recap', 'Récap des joueurs'], ['taken', 'Athlètes pris']].map(([id, label]) =>
      `<button type="button" role="tab" class="seg__btn" aria-selected="${sub === id}" data-sub="${id}" data-key="${key}">${label}</button>`).join('');
    let body;
    if (sub === 'mine') {
      body = (isW ? worldsBox() : '') + sessions.map((s, i) => sessionCard(s, isW ? '' : `session ${i + 1} sur ${sessions.length}`)).join('');
    } else if (sub === 'recap') body = (isW ? worldsBox() : '') + recapView(key);
    else body = takenView(key);
    return `<section>
      <header class="deskhead">
        <div><h2>${esc(title)}</h2><p class="deskhead__meta">${esc(dates)}, ${plural(total, 'course', 'courses')}, un skieur ne peut servir qu’une fois${isW ? ' ici' : ' dans ce desk'}</p></div>
        <dl class="deskhead__stats"><div><dt>Mes choix</dt><dd>${chosen} / ${total}</dd></div><div><dt>Mes points</dt><dd>${score}</dd></div></dl>
      </header>
      <div class="seg" role="tablist" aria-label="Vue du desk">${tabs}</div>
      <div class="deskbody">${body}</div>
    </section>`;
  }

  /* ---------- Session à venir (forfait) ---------- */
  function nextPanel() {
    const upcoming = allSessions().find((s) => G.sessionState(s, now()) !== 'terminée');
    if (!upcoming) return '<p class="empty">La saison est terminée.</p>';
    const isW = upcoming.id === 'X';
    const races = G.sessionRaces(upcoming).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time) || a.gender.localeCompare(b.gender));
    const dl = G.sessionDeadline(upcoming);
    const open = !locked(upcoming);
    const n = races.filter((r) => (myPicks()[r.id] || {}).a).length;
    const where = isW ? 'Hors desk, barème ×3'
      : `Desk ${upcoming.desk}, session ${D.SESSIONS.filter((s) => s.desk === upcoming.desk).indexOf(upcoming) + 1} sur ${D.SESSIONS.filter((s) => s.desk === upcoming.desk).length}`;
    const goto = isW ? 0 : upcoming.desk;
    const list = races.map((r) => `<li class="mini">
      <span class="mini__when">${dayOf(r.date)}</span>
      <span class="mini__what">${esc(placeLabel(r))}, ${genderLabel(r)} ${discBadge(r)}</span>
      <span class="mini__pick">${(myPicks()[r.id] || {}).a ? pickSummary(state.me, r) : '<span class="todo">À choisir</span>'}</span></li>`).join('');
    const stub = open
      ? `<p class="forfait__label">Il reste</p><p class="countdown" id="countdown" data-dl="${dl.toISOString()}">${countdownText(dl)}</p>
         <p class="forfait__dl">avant la deadline du ${deadlineText(dl)}${races.some((r) => !r.timeKnown) ? ', heure à confirmer' : ''}</p>`
      : `<p class="forfait__label">Choix verrouillés</p><p class="countdown countdown--shut">Course en cours</p>
         <p class="forfait__dl">Verrouillés depuis le ${deadlineText(dl)}</p>`;
    return `<section>
      <article class="forfait">
        <div class="forfait__main">
          ${stateBadge(upcoming)}
          <h2 class="forfait__name">${esc(upcoming.name)}</h2>
          <p class="forfait__where">${esc(where)}, ${plural(races.length, 'course', 'courses')}</p>
          <ul class="minis">${list}</ul>
          <button type="button" class="btn btn--brique" data-goto="${goto}">${open ? `${n === races.length ? 'Modifier mes choix' : 'Faire mes choix'} dans ${isW ? 'les Mondiaux' : 'le desk ' + upcoming.desk}` : `Voir ${isW ? 'les Mondiaux' : 'le desk ' + upcoming.desk}`}</button>
        </div>
        <div class="forfait__stub">${stub}</div>
      </article>
      ${open ? '' : `<h3 class="subtitle">Choix de tous les joueurs</h3>${recapTable(upcoming)}`}
    </section>`;
  }
  function countdownText(dl) {
    let s = Math.max(0, Math.floor((dl - now()) / 1000));
    const d = Math.floor(s / 86400); s -= d * 86400;
    const h = Math.floor(s / 3600); s -= h * 3600;
    const m = Math.floor(s / 60);
    return `<span><b>${d}</b> j</span> <span><b>${h}</b> h</span> <span><b>${m}</b> min</span>`;
  }

  /* ---------- Classements ---------- */
  function rankRows(scoreFn) {
    const rows = state.players.map((p) => ({ p, v: scoreFn(state.picks[p.id] || {}) })).sort((a, b) => b.v.total - a.v.total);
    let last = null, rank = 0;
    rows.forEach((r, i) => { if (r.v.total !== last) { rank = i + 1; last = r.v.total; } r.rank = rank; });
    return rows;
  }
  function smallRanking(title, scoreFn) {
    const rows = rankRows((pk) => ({ total: scoreFn(pk) }));
    return `<div class="tablewrap"><table class="grid grid--rank"><caption>${esc(title)}</caption>
      <thead><tr><th scope="col" class="num">Rang</th><th scope="col">Joueur</th><th scope="col" class="num">Points</th></tr></thead>
      <tbody>${rows.map((r) => `<tr class="${r.p.id === state.me ? 'me' : ''}"><td class="num">${r.rank}</td><th scope="row">${esc(r.p.name)}</th><td class="num">${r.v.total}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function generalPanel() {
    const R = state.results;
    const rows = rankRows((pk) => G.generalScore(pk, R));
    const main = `<div class="tablewrap"><table class="grid grid--rank grid--general"><caption>Le gros globe, tous les joueurs</caption>
      <thead><tr><th scope="col" class="num">Rang</th><th scope="col">Joueur</th><th scope="col" class="num">Desk 1</th><th scope="col" class="num">Desk 2</th><th scope="col" class="num">Desk 3</th><th scope="col" class="num">Mondiaux</th><th scope="col" class="num">Total</th></tr></thead>
      <tbody>${rows.map((r) => `<tr class="${r.p.id === state.me ? 'me' : ''}"><td class="num">${r.rank}</td><th scope="row">${esc(r.p.name)}</th>${r.v.desks.map((d) => `<td class="num">${d}</td>`).join('')}<td class="num">${r.v.worlds}</td><td class="num total">${r.v.total}</td></tr>`).join('')}</tbody></table></div>`;
    const desks = D.DESKS.map((d) => smallRanking(`Classement du ${d.name}`, (pk) => G.deskScore(d.id, pk, R))).join('');
    const discs = ['DH', 'SG', 'GS', 'SL'].map((c) => smallRanking(`Petit globe de ${c === 'SG' ? 'super-G' : D.DISC[c].fr.toLowerCase()}`, (pk) => G.disciplineScore(c, pk, R))).join('');
    const none = Object.keys(R).length === 0 ? '<p class="hint">Aucun résultat pour l’instant : tous les compteurs sont à zéro.</p>' : '';
    return `<section><header class="deskhead"><div><h2>Classement général</h2>
      <p class="deskhead__meta">Les trois desks et les Mondiaux, bonus compris</p></div></header>${none}${main}
      <h3 class="subtitle">Un classement par desk</h3><p class="hint">Pour s’accrocher quand le général est perdu.</p><div class="grid3">${desks}</div>
      <h3 class="subtitle">Les petits globes</h3><p class="hint">Points marqués dans chaque discipline, Mondiaux compris, sans les bonus.</p><div class="grid2">${discs}</div></section>`;
  }

  /* ---------- Navigation & rendu ---------- */
  const TABS = [
    { id: 'next', label: 'Session à venir', note: () => '' },
    { id: '1', label: 'Desk 1', note: () => `${shortOf(D.DESKS[0].from)} au ${shortOf(D.DESKS[0].to)}` },
    { id: '2', label: 'Desk 2', note: () => `${shortOf(D.DESKS[1].from)} au ${shortOf(D.DESKS[1].to)}` },
    { id: '3', label: 'Desk 3', note: () => `${shortOf(D.DESKS[2].from)} au ${shortOf(D.DESKS[2].to)}` },
    { id: 'w', label: 'Mondiaux', note: () => '4 au 14 févr.' },
    { id: 'gen', label: 'Classement général', note: () => '' },
  ];
  function renderTabs() {
    $('#tabs').innerHTML = TABS.map((t) => `<button type="button" role="tab" class="plate" id="tab-${t.id}" data-tab="${t.id}" aria-selected="${state.tab === t.id}">
      <span class="plate__label">${t.label}</span>${t.note() ? `<span class="plate__note">${t.note()}</span>` : ''}</button>`).join('');
  }
  function renderPanel() {
    const t = state.tab;
    const html = t === 'next' ? nextPanel() : t === 'gen' ? generalPanel() : t === 'w' ? deskPanel(0) : deskPanel(Number(t));
    $('#panel').innerHTML = (state.demo ? '<p class="demo">Démonstration : joueurs, choix et résultats fictifs.</p>' : '') + html;
    $('#panel').setAttribute('aria-labelledby', 'tab-' + t);
  }
  function render() { renderTabs(); renderPanel(); syncSim(); }

  function syncSim() {
    const el = $('#sim-date');
    if (!el) return;
    const d = now();
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(d).map((x) => [x.type, x.value]));
    el.value = `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
  }

  function setTab(id, push) {
    state.tab = id;
    if (push !== false) { try { history.replaceState(null, '', '#' + id); } catch (e) { /* ignoré */ } }
    render();
  }

  document.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-tab]');
    if (tab) { setTab(tab.dataset.tab); window.scrollTo({ top: 0 }); return; }
    const go = e.target.closest('[data-goto]');
    if (go) { setTab(go.dataset.goto === '0' ? 'w' : go.dataset.goto); window.scrollTo({ top: 0 }); return; }
    const sub = e.target.closest('[data-sub]');
    if (sub) { state.sub[Number(sub.dataset.key)] = sub.dataset.sub; renderPanel(); return; }
    if (e.target.closest('#btn-demo')) loadDemo();
    if (e.target.closest('#btn-reset')) { state.picks[state.me] = {}; save(); render(); }
    if (e.target.closest('#btn-now')) { state.sim = null; render(); }
  });

  document.addEventListener('change', (e) => {
    const sel = e.target.closest('select.pick');
    if (sel) {
      const race = D.RACES[sel.dataset.race];
      const session = [...D.SESSIONS, D.WORLDS].find((s) => s.races.includes(race.id));
      if (locked(session)) { render(); return; } // deadline passée : on ignore
      const picks = myPicks();
      const cur = picks[race.id] || (picks[race.id] = {});
      const slot = sel.dataset.slot;
      if (sel.value) cur[slot] = sel.value; else delete cur[slot];
      if (slot === 'a') { if (!cur.a) delete cur.b; else if (cur.b === cur.a) delete cur.b; }
      if (!cur.a && !cur.b) delete picks[race.id];
      save();
      const y = window.scrollY;
      renderPanel(); renderTabs();
      window.scrollTo({ top: y });
      const again = document.getElementById(sel.id);
      if (again) again.focus({ preventScroll: true });
      return;
    }
    if (e.target.id === 'sim-date' && e.target.value) {
      const [d, t] = e.target.value.split('T');
      state.sim = G.parisInstant(d, t);
      render();
    }
  });

  function loadDemo() {
    state.demo = true;
    state.players = DEMO.PLAYERS.slice();
    state.picks = JSON.parse(JSON.stringify(DEMO.PICKS));
    state.results = JSON.parse(JSON.stringify(DEMO.RESULTS));
    state.sim = new Date(DEMO.DEMO_NOW);
    render();
  }

  setInterval(() => {
    const c = $('#countdown');
    if (c) c.innerHTML = countdownText(new Date(c.dataset.dl));
  }, 30000);

  /* ---------- Démarrage ---------- */
  load();
  const q = new URLSearchParams(location.search);
  const h = location.hash.replace('#', '');
  if (TABS.some((t) => t.id === h)) state.tab = h;
  if (q.has('demo')) loadDemo(); else render();
})();
