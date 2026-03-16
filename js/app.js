
// ── FAAB seed data — TRUE DOLLAR AMOUNTS ─────────────────────
// All values in full dollars. $1,123 → $1,123,000,000? No —
// these are FAAB budgets. Converting: old $1 = $100,000.
// So $1123 legacy → $112,300,000 real dollars.
const FAAB_SEED = {
  'schardt312':    112_300_000,
  'spicytunaroll': 113_600_000,
  'notgreatbob':   119_100_000,
  'tmill85':       106_100_000,
  'abomb25':       113_800_000,
  'kodypetey':     114_000_000,
  'mkim521':       130_300_000,
  'stupend0us':    106_100_000,
  'iowafan30':     130_700_000,
  'dlon16':        113_500_000,
  'southy610':     109_800_000,
  'mraladdin23':   106_400_000,
};

// ─────────────────────────────────────────────────────────────
//  APP  — main controller
// ─────────────────────────────────────────────────────────────

const App = (() => {

  const SKILL_POSITIONS    = new Set(['QB', 'RB', 'WR', 'TE']);
  const COMMISSIONER_USERNAME = 'mraladdin23';
  const MIN_BID            = Auction.MIN_BID; // $100,000

  const state = {
    user:            null,
    leagueId:        null,
    leagueName:      '',
    leagueSettings:  null,
    scoringSettings: {},
    rosterPositions: [],
    teams:           [],
    players:         {},
    statsMap:        {},
    freeAgents:      [],
    auctions:        [],
    faabOverrides:   {},
    posFilter:       'ALL',
    isCommissioner:  false,
    activeNomPlayerId:  null,
    activeBidAuctionId: null,
    rosterSizes:     {},
    activityFeed:    [],
    watchlist:       {},     // { [playerId]: true }
    bidPending:      false,  // for 1-tap confirm
  };

  const session = {
    get username()  { return localStorage.getItem('sb_username')  || ''; },
    get leagueId()  { return localStorage.getItem('sb_leagueId')  || ''; },
    set username(v) { localStorage.setItem('sb_username', v); },
    set leagueId(v) { localStorage.setItem('sb_leagueId', v); },
    setUser(u)      { localStorage.setItem('sb_user', JSON.stringify(u)); },
    clear()         { localStorage.removeItem('sb_username'); localStorage.removeItem('sb_leagueId'); localStorage.removeItem('sb_user'); },
  };

  // ── Dollar formatting ────────────────────────────────────
  // Shared with UI — formats full dollar integers as $1.1M, $500K, $100K etc.
  function fmtFaab(n) {
    if (n === undefined || n === null) return '$0';
    if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'M';
    if (n >= 1_000)     return '$' + (n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 0) + 'K';
    return '$' + n;
  }

  // ── Boot ────────────────────────────────────────────────
  async function boot() {
    if (session.username && session.leagueId) {
      UI.showScreen('loading');
      UI.setLoading('Reconnecting…');
      try {
        state.user     = await Sleeper.fetchUser(session.username);
        session.setUser(state.user);
        state.leagueId = session.leagueId;
        await initApp();
        return;
      } catch (e) { /* fall through */ }
    }
    UI.showScreen('login');
    if (session.username) document.getElementById('login-username').value = session.username;
  }

  // ── Login ───────────────────────────────────────────────
  async function doLogin() {
    const username = document.getElementById('login-username').value.trim();
    if (!username) { showLoginError('Enter your Sleeper username.'); return; }
    showLoginError('');
    UI.showScreen('loading');
    UI.setLoading('Looking up your Sleeper account…');
    try {
      state.user = await Sleeper.fetchUser(username);
      session.username = username;
      session.setUser(state.user);
      if (session.leagueId) {
        state.leagueId = session.leagueId;
        await initApp();
      } else {
        UI.showScreen('setup');
        UI.setAvatar(document.getElementById('setup-avatar'), state.user);
      }
    } catch (e) {
      UI.showScreen('login');
      showLoginError('Username not found. Check spelling and try again.');
    }
  }

  function showLoginError(msg) {
    const el = document.getElementById('login-error');
    el.textContent = msg;
    el.classList.toggle('hidden', !msg);
  }

  // ── Setup ───────────────────────────────────────────────
  async function doSetup() {
    const lid = document.getElementById('setup-league-id').value.trim();
    if (!lid) { showSetupError('Enter your league ID.'); return; }
    const btn = document.querySelector('#setup-screen .btn-primary');
    btn.textContent = 'Loading…'; btn.disabled = true;
    try {
      state.leagueId = lid;
      session.leagueId = lid;
      await initApp();
    } catch (e) {
      showSetupError('Could not load league: ' + e.message);
      btn.textContent = 'Load League →'; btn.disabled = false;
    }
  }

  function showSetupError(msg) {
    const el = document.getElementById('setup-error');
    el.textContent = msg;
    el.classList.toggle('hidden', !msg);
  }

  // ── Logout ──────────────────────────────────────────────
  function logout() {
    Auction.unsubscribe(state.leagueId);
    session.clear();
    Object.assign(state, {
      user: null, leagueId: null, leagueSettings: null,
      scoringSettings: {}, rosterPositions: [],
      teams: [], players: {}, statsMap: {}, freeAgents: [],
      auctions: [], faabOverrides: {}, activityFeed: [], watchlist: {},
    });
    UI.showScreen('login');
  }

  // ── Init app ────────────────────────────────────────────
  async function initApp() {
    UI.showScreen('loading');
    UI.setLoading('Loading league…');

    const [league, rosters, users, players] = await Promise.all([
      Sleeper.fetchLeague(state.leagueId),
      Sleeper.fetchRosters(state.leagueId),
      Sleeper.fetchLeagueUsers(state.leagueId),
      Sleeper.fetchPlayers(),
    ]);

    state.leagueName      = league.name;
    state.leagueSettings  = league;
    state.scoringSettings = league.scoring_settings || {};
    state.rosterPositions = league.roster_positions || [];
    state.players         = players;

    const leagueFaabBudget = league.settings?.waiver_budget ?? 100;
    const userMap = {};
    users.forEach(u => { userMap[u.user_id] = u; });

    state.teams = rosters.map(r => {
      const u    = userMap[r.owner_id] || {};
      const used = r.settings?.waiver_bid_used ?? 0;
      return {
        roster_id:    r.roster_id,
        owner_id:     r.owner_id,
        username:     u.display_name || u.username || `Team ${r.roster_id}`,
        display_name: u.display_name || u.username || `Team ${r.roster_id}`,
        avatar:       u.avatar,
        faab_budget:  leagueFaabBudget,
        faab_used:    used,
        players:      r.players || [],
        taxi:         r.taxi   || [],
      };
    });

    // Write username -> roster_id map so cap.js can sync rosterSizes
    try {
      const usernameMap = {};
      users.forEach(u => {
        const r = rosters.find(r => r.owner_id === u.user_id);
        if (r && u.username) usernameMap[u.username.toLowerCase()] = r.roster_id;
      });
      await db.ref(`leagues/${state.leagueId}/usernameToRosterId`).set(usernameMap);
    } catch(e) { /* non-fatal */ }

    UI.setLoading('Loading 2025 stats…');
    let rawStats = {};
    try { rawStats = await Sleeper.fetchStats(2025); } catch (e) { /* non-fatal */ }
    state.statsMap = rawStats;

    const rostered = new Set(rosters.flatMap(r => r.players || []));
    state.freeAgents = Object.keys(players)
      .filter(id => {
        const p = players[id];
        if (rostered.has(id)) return false;
        if (!p.fantasy_positions?.some(pos => SKILL_POSITIONS.has(pos))) return false;
        // Keep if on an NFL roster OR scored any points in 2025
        const hasTeam  = p.team && p.team !== 'FA';
        const hasPts   = (state.statsMap[id]?.pts_ppr ?? 0) > 0;
        return hasTeam || hasPts;
      })
      .sort((a, b) => {
        const apts = computeCustomPts(a);
        const bpts = computeCustomPts(b);
        if (apts !== null && bpts !== null) return bpts - apts;
        if (apts !== null) return -1;
        if (bpts !== null) return 1;
        return (players[a].search_rank || 9999) - (players[b].search_rank || 9999);
      });

    const myUsername = (state.user.username || '').toLowerCase().trim();
    state.isCommissioner = myUsername === COMMISSIONER_USERNAME;

    document.getElementById('league-name-badge').textContent = league.name;
    UI.setAvatar(document.getElementById('user-avatar'), state.user);
    updateCommissionerTab();

    UI.showScreen('app');
    UI.renderPauseBanner();

    // ── Firebase subscriptions ───────────────────────────
    Auction.subscribe(state.leagueId, auctions => {
      const prevAuctions = state.auctions;
      state.auctions = auctions;
      checkOutbidNotifications(prevAuctions, auctions);
      checkWatchlistNotifications(prevAuctions, auctions);
      renderAll();
    });

    Auction.subscribeRosterSizes(state.leagueId, sizes => {
      state.rosterSizes = sizes;
      renderAll();
    });

    Auction.subscribeFaabOverrides(state.leagueId, async overrides => {
      if (!overrides || Object.keys(overrides).length === 0) {
        await seedFaabFromKnownValues();
        return;
      }
      state.faabOverrides = overrides;
      renderAll();
    });

    Auction.subscribeActivityFeed(state.leagueId, feed => {
      state.activityFeed = feed;
      UI.renderActivityFeed(feed);
    });

    // Watchlist — keyed by Sleeper user_id
    const uid = state.user?.user_id;
    if (uid) {
      Auction.subscribeWatchlist(state.leagueId, uid, wl => {
        state.watchlist = wl || {};
        renderAll();
      });
    }

    UI.startTimers(() => state.auctions);
    requestNotificationPermission();
  }

  async function seedFaabFromKnownValues() {
    for (const team of state.teams) {
      const uname = (team.username || '').toLowerCase();
      if (FAAB_SEED[uname] !== undefined) {
        await Auction.setFaabOverride(state.leagueId, team.roster_id, FAAB_SEED[uname]);
      }
    }
  }

  function computeCustomPts(playerId) {
    const raw = state.statsMap[playerId];
    if (!raw) return null;
    return Sleeper.calculatePoints(raw, state.scoringSettings);
  }

  function updateCommissionerTab() {
    const tab = document.getElementById('commissioner-tab');
    if (tab) tab.style.display = state.isCommissioner ? '' : 'none';
    const dd = document.getElementById('nav-dropdown');
    if (dd && state.isCommissioner && !dd.querySelector('option[value="commissioner"]')) {
      const opt = document.createElement('option');
      opt.value = 'commissioner';
      opt.textContent = '⚙️ Commissioner';
      dd.appendChild(opt);
    }
  }

  function renderAll() {
    updateCommissionerTab();
    UI.renderAuctions(state.auctions, state.faabOverrides);
    UI.renderTeams(state.faabOverrides);
    UI.renderHistory(state.auctions);
    if (state.isCommissioner) UI.renderCommissioner(state.faabOverrides);
  }

  // ── Tab switching ────────────────────────────────────────
  function switchTab(name) {
    UI.switchTab(name);
    if (name === 'watchlist') UI.renderWatchlistTab();
  }

  function faSort(col) { UI.faSort(col); }

  // ── Free agents ──────────────────────────────────────────
  function setFilter(pos, el) {
    state.posFilter = pos;
    state.currentPosFilter = pos;
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    UI.renderFreeAgents(state.posFilter, true); // reset to page 0
  }

  function renderFreeAgents(resetPage) {
    UI.renderFreeAgents(state.posFilter || 'ALL', resetPage === true);
  }

  async function loadFreeAgents() {
    UI.toast('Refreshing free agents…', 'info');
    await Sleeper.invalidatePlayerCache();
    try {
      const [players, rosters] = await Promise.all([
        Sleeper.fetchPlayers(),
        Sleeper.fetchRosters(state.leagueId),
      ]);
      state.players = players;
      const rostered = new Set(rosters.flatMap(r => r.players || []));
      state.freeAgents = Object.keys(players)
        .filter(id => {
          const p = players[id];
          if (rostered.has(id)) return false;
          if (!p.fantasy_positions?.some(pos => SKILL_POSITIONS.has(pos))) return false;
          const hasTeam = p.team && p.team !== 'FA';
          const hasPts  = (state.statsMap[id]?.pts_ppr ?? 0) > 0;
          return hasTeam || hasPts;
        })
        .sort((a, b) => {
          const apts = computeCustomPts(a), bpts = computeCustomPts(b);
          if (apts !== null && bpts !== null) return bpts - apts;
          if (apts !== null) return -1;
          if (bpts !== null) return 1;
          return (players[a].search_rank || 9999) - (players[b].search_rank || 9999);
        });
      UI.renderFreeAgents(state.posFilter);
      UI.toast('Free agents updated!', 'success');
    } catch (e) { UI.toast('Refresh failed: ' + e.message, 'error'); }
  }

  async function refreshAll() {
    UI.toast('Refreshing from Sleeper…', 'info');
    try {
      const [league, rosters, users] = await Promise.all([
        Sleeper.fetchLeague(state.leagueId),
        Sleeper.fetchRosters(state.leagueId),
        Sleeper.fetchLeagueUsers(state.leagueId),
      ]);
      const leagueFaabBudget = league.settings?.waiver_budget ?? 100;
      const userMap = {};
      users.forEach(u => { userMap[u.user_id] = u; });

      state.teams = rosters.map(r => {
        const u    = userMap[r.owner_id] || {};
        const used = r.settings?.waiver_bid_used ?? 0;
        return {
          roster_id:    r.roster_id,
          owner_id:     r.owner_id,
          username:     u.display_name || u.username || `Team ${r.roster_id}`,
          display_name: u.display_name || u.username || `Team ${r.roster_id}`,
          avatar:       u.avatar,
          faab_budget:  leagueFaabBudget,
          faab_used:    used,
          players:      r.players || [],
          taxi:         r.taxi   || [],
        };
      });
      renderAll();
      UI.toast('Refreshed!', 'success');
    } catch (e) { UI.toast('Refresh failed: ' + e.message, 'error'); }
  }

  // ── Push notifications ───────────────────────────────────
  function requestNotificationPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      UI.toast('Enable notifications to get outbid alerts. Click 🔔 in the top bar.', 'info');
    }
  }

  async function enableNotifications() {
    if (!('Notification' in window)) { UI.toast('Notifications not supported in this browser.', 'error'); return; }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') UI.toast('Notifications enabled! 🔔', 'success');
    else UI.toast('Notification permission denied.', 'error');
  }

  function checkOutbidNotifications(prevAuctions, nextAuctions) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const myTeam = UI.getMyTeam(state);
    if (!myTeam) return;
    const myRid = myTeam.roster_id;
    const now   = Date.now();

    nextAuctions.forEach(auction => {
      if (auction.processed || auction.cancelled || auction.expiresAt <= now) return;
      const leading = Auction.computeLeadingBid(auction);
      const myMax   = Auction.getMyMaxBid(auction, myRid);
      if (myMax === 0) return;

      const prev        = prevAuctions.find(a => a.id === auction.id);
      const prevLeading = prev ? Auction.computeLeadingBid(prev) : null;
      const wasWinning  = prevLeading?.rosterId === myRid;
      const nowLosing   = leading.rosterId !== myRid;

      if (wasWinning && nowLosing) {
        const p    = state.players[auction.playerId] || {};
        const name = UI.playerName(p);
        new Notification('SleeperBid — Outbid!', {
          body: `${name} — new price: ${fmtFaab(leading.displayBid)}`,
          icon: `https://sleepercdn.com/content/nfl/players/thumb/${auction.playerId}.jpg`,
          tag:  auction.id,
        });
      }
    });
  }

  function checkWatchlistNotifications(prevAuctions, nextAuctions) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (!state.watchlist || !Object.keys(state.watchlist).length) return;
    const now = Date.now();

    nextAuctions.forEach(auction => {
      if (auction.processed || auction.cancelled || auction.expiresAt <= now) return;
      const watched = state.watchlist[auction.playerId];
      if (!watched) return;
      const p    = state.players[auction.playerId] || {};
      const name = UI.playerName(p);

      // New nomination?
      const existed = prevAuctions.find(a => a.id === auction.id);
      if (!existed) {
        new Notification('SleeperBid — Watched Player Nominated!', {
          body: `${name} is now in auction!`,
          icon: `https://sleepercdn.com/content/nfl/players/thumb/${auction.playerId}.jpg`,
          tag:  'watch_nom_' + auction.id,
        });
      }
    });
  }

  // ── Watchlist toggle ─────────────────────────────────────
  async function toggleWatch(playerId) {
    const uid = state.user?.user_id;
    if (!uid) return;
    if (state.watchlist[playerId]) {
      await Auction.removeWatch(state.leagueId, uid, playerId);
      UI.toast('Removed from watchlist', 'info');
    } else {
      await Auction.addWatch(state.leagueId, uid, playerId);
      UI.toast('Added to watchlist ⭐', 'success');
    }
  }

  // ── Roster size enforcement ──────────────────────────────
  function getMyFaab() {
    const myTeam = UI.getMyTeam(state);
    if (!myTeam) return 0;
    const override = state.faabOverrides[myTeam.roster_id];
    const base     = override !== undefined
      ? override
      : Math.max(0, myTeam.faab_budget - (myTeam.faab_used || 0));
    return Math.max(0, base - Auction.getCommittedFaab(state.auctions, myTeam.roster_id));
  }

  // ── Nominate modal ───────────────────────────────────────
  function openNomModal(playerId) {
    const myTeam = UI.getMyTeam(state);
    if (!myTeam) { UI.toast('You are not in this league.', 'error'); return; }

    state.activeNomPlayerId = playerId;
    const p   = state.players[playerId] || {};
    const pos = UI.playerPos(p);

    document.getElementById('nom-player-info').innerHTML = `
      ${UI.playerAvatarHTML(playerId, 40)}
      <div>
        <div style="font-weight:600;">${UI.playerName(p)}</div>
        <div style="display:flex;gap:6px;margin-top:2px;">
          <span class="pos-badge pos-${pos}">${pos}</span>
          <span style="color:var(--text3);font-size:12px;">${UI.playerTeam(p)}</span>
        </div>
      </div>`;

    const teamSel = document.getElementById('nom-team-select');
    const teamRow = document.getElementById('nom-team-row');
    if (state.isCommissioner && teamSel && teamRow) {
      teamRow.style.display = '';
      teamSel.innerHTML = state.teams
        .map(t => `<option value="${t.roster_id}"${t.roster_id === myTeam.roster_id ? ' selected' : ''}>${t.display_name || t.username}</option>`)
        .join('');
    } else if (teamRow) {
      teamRow.style.display = 'none';
    }

    updateNomFaabDisplay();
    if (teamSel) teamSel.onchange = updateNomFaabDisplay;

    document.getElementById('nom-bid-input').value = MIN_BID;
    document.getElementById('nom-error').classList.add('hidden');
    document.getElementById('nom-hint').textContent = `Minimum ${fmtFaab(MIN_BID)}. Bids in ${fmtFaab(MIN_BID)} increments.`;
    UI.openModal('nom-modal');
  }

  function getNomTeam() {
    const sel = document.getElementById('nom-team-select');
    const rid = sel && state.isCommissioner ? parseInt(sel.value) : null;
    return rid ? state.teams.find(t => t.roster_id === rid) : UI.getMyTeam(state);
  }

  function updateNomFaabDisplay() {
    const team = getNomTeam();
    if (!team) return;
    const override  = state.faabOverrides[team.roster_id];
    const base      = override !== undefined ? override : Math.max(0, team.faab_budget - (team.faab_used || 0));
    const committed = Auction.getCommittedFaab(state.auctions, team.roster_id);
    document.getElementById('nom-faab').textContent = fmtFaab(Math.max(0, base - committed));
  }

  function closeNomModal()         { UI.closeModal('nom-modal'); }
  function closeNomModalOutside(e) { if (e.target.id === 'nom-modal') closeNomModal(); }

  async function submitNomination() {
    const nomTeam = getNomTeam();
    if (!nomTeam) return;

    const now = Date.now();
    const teamActiveNom = state.auctions.find(a =>
      !a.processed && !a.cancelled && a.expiresAt > now && a.nominatedBy === nomTeam.roster_id
    );
    if (teamActiveNom && !state.isCommissioner) {
      showNomError('This team already has an active nomination.'); return;
    }

    const bidVal    = parseInt(document.getElementById('nom-bid-input').value) || 0;
    const override  = state.faabOverrides[nomTeam.roster_id];
    const base      = override !== undefined ? override : Math.max(0, nomTeam.faab_budget - (nomTeam.faab_used || 0));
    const committed = Auction.getCommittedFaab(state.auctions, nomTeam.roster_id);
    const faab      = Math.max(0, base - committed);

    if (bidVal < MIN_BID) { showNomError(`Minimum bid is ${fmtFaab(MIN_BID)}.`); return; }
    if (bidVal % MIN_BID !== 0) { showNomError(`Bids must be in ${fmtFaab(MIN_BID)} increments.`); return; }
    if (bidVal > faab)   { showNomError(`${nomTeam.display_name} only has ${fmtFaab(faab)} available.`); return; }

    const p = state.players[state.activeNomPlayerId] || {};
    try {
      await Auction.nominate(
        state.leagueId, state.activeNomPlayerId, nomTeam.roster_id, bidVal,
        nomTeam.display_name || nomTeam.username,
        UI.playerName(p)
      );
      closeNomModal();
      UI.toast(`Auction started for ${UI.playerName(p)}!`, 'success');
    } catch (e) { showNomError('Failed: ' + e.message); }
  }

  function showNomError(msg) {
    const el = document.getElementById('nom-error');
    el.textContent = msg;
    el.classList.remove('hidden');
  }

  // ── Bid modal ────────────────────────────────────────────
  function openBidModal(auctionId) {
    const myTeam = UI.getMyTeam(state);
    if (!myTeam) { UI.toast('You are not in this league.', 'error'); return; }

    const auction = state.auctions.find(a => a.id === auctionId);
    if (!auction) return;

    state.activeBidAuctionId = auctionId;
    state.bidPending = false; // reset confirm state

    const p       = state.players[auction.playerId] || {};
    const pos     = UI.playerPos(p);
    const leading = Auction.computeLeadingBid(auction);
    const myMax   = Auction.getMyMaxBid(auction, myTeam.roster_id);
    const avail   = getMyFaab() + myMax;

    const customPts = computeCustomPts(auction.playerId);
    const ptsHtml   = customPts !== null
      ? `<span style="font-size:11px;color:var(--text3);margin-top:4px;display:block;">2025 fantasy pts: <strong style="color:var(--accent2);">${customPts.toFixed(1)}</strong></span>`
      : '';

    document.getElementById('bid-modal-player-info').innerHTML = `
      ${UI.playerAvatarHTML(auction.playerId, 40)}
      <div>
        <div style="font-weight:600;">${UI.playerName(p)}</div>
        <div style="display:flex;gap:6px;margin-top:2px;">
          <span class="pos-badge pos-${pos}">${pos}</span>
          <span style="color:var(--text3);font-size:12px;">${UI.playerTeam(p)}</span>
        </div>
        ${ptsHtml}
      </div>`;

    document.getElementById('bid-modal-faab').textContent = fmtFaab(avail);

    const input = document.getElementById('bid-amount-input');
    input.value = myMax || Math.max(MIN_BID, leading.displayBid + MIN_BID);
    input.step  = MIN_BID;
    input.min   = MIN_BID;
    input.max   = avail;

    document.getElementById('bid-current-info').innerHTML =
      `Current price: <strong style="color:var(--text);">${fmtFaab(leading.displayBid)}</strong>` +
      ` — Leader: <strong style="color:var(--accent2);">${leading.rosterId ? UI.getTeamName(leading.rosterId, state) : '—'}</strong>` +
      (myMax && !state.isCommissioner ? ` &nbsp;|&nbsp; Your max: <strong style="color:var(--yellow);">${fmtFaab(myMax)}</strong>` : '');

    // Cap impact preview
    updateCapImpact();
    input.addEventListener('input', updateCapImpact);

    UI.renderStatBreakdown(auction.playerId, state.statsMap[auction.playerId], state.scoringSettings);

    const bids    = Array.isArray(auction.bids) ? auction.bids : Object.values(auction.bids || {});
    const sorted  = [...bids].sort((a, b) => b.timestamp - a.timestamp);
    const seenRosters = new Set();
    const deduped = sorted.filter(b => {
      if (seenRosters.has(b.rosterId)) return false;
      seenRosters.add(b.rosterId);
      return true;
    });
    document.getElementById('bid-history-list').innerHTML = deduped.length
      ? deduped.map(b => {
          const isMe    = b.rosterId === myTeam.roster_id;
          const showMax = isMe && !state.isCommissioner;
          return `<div class="bid-row">
            <span class="bid-row-team">${UI.getTeamName(b.rosterId, state)}${isMe ? ' <span style="color:var(--accent2);font-size:10px;">(you)</span>' : ''}</span>
            <span class="bid-row-amount">${showMax ? fmtFaab(b.maxBid) : 'bid placed'}</span>
            <span class="bid-row-time">${UI.timeAgo(b.timestamp)}</span>
          </div>`;
        }).join('')
      : `<div style="padding:10px 12px;color:var(--text3);font-size:12px;">No bids yet.</div>`;

    // Reset confirm button state
    resetBidButton();
    updateBidHint();
    UI.openModal('bid-modal');
  }

  function updateCapImpact() {
    const el = document.getElementById('cap-impact-preview');
    if (!el) return;
    const auction = state.auctions.find(a => a.id === state.activeBidAuctionId);
    if (!auction) return;
    const myTeam  = UI.getMyTeam(state);
    if (!myTeam) return;
    const bidVal  = parseInt(document.getElementById('bid-amount-input').value) || 0;
    const myMax   = Auction.getMyMaxBid(auction, myTeam.roster_id);
    const avail   = getMyFaab() + myMax;
    const afterBid = avail - bidVal;

    // Salary cap impact from rosters.html embedded data (if available)
    el.innerHTML = `
      <div style="font-size:11px;color:var(--text3);margin-top:10px;padding:8px 12px;background:var(--surface2);border-radius:var(--radius-sm);border:1px solid var(--border);">
        <span style="font-weight:600;color:var(--text2);">Cap Impact Preview</span>
        <span style="display:block;margin-top:4px;">If you win at ${fmtFaab(bidVal)}: 
          <strong style="color:${afterBid < 0 ? 'var(--red)' : 'var(--green)'};">${fmtFaab(Math.max(0, afterBid))}</strong> FAAB remaining
          ${afterBid < 0 ? '<span style="color:var(--red);"> — exceeds balance!</span>' : ''}
        </span>
      </div>`;
  }

  function closeBidModal()         {
    UI.closeModal('bid-modal');
    state.bidPending = false;
    resetBidButton();
  }
  function closeBidModalOutside(e) { if (e.target.id === 'bid-modal') closeBidModal(); }

  function resetBidButton() {
    const btn = document.getElementById('bid-submit-btn');
    if (!btn) return;
    btn.textContent = 'Place Max Bid';
    btn.style.background = '';
    btn.dataset.confirm = '0';
    state.bidPending = false;
  }

  function updateBidHint() {
    const auction = state.auctions.find(a => a.id === state.activeBidAuctionId);
    if (!auction) return;
    const val     = parseInt(document.getElementById('bid-amount-input').value) || 0;
    const leading = Auction.computeLeadingBid(auction);
    const hint    = document.getElementById('bid-hint');
    if (val < MIN_BID) {
      hint.style.color = 'var(--red)'; hint.textContent = `Minimum bid is ${fmtFaab(MIN_BID)}.`; return;
    }
    if (val % MIN_BID !== 0) {
      hint.style.color = 'var(--red)'; hint.textContent = `Bids must be in ${fmtFaab(MIN_BID)} increments.`; return;
    }
    if (val <= leading.displayBid) {
      hint.style.color = 'var(--red)';
      hint.textContent = `Must exceed current price of ${fmtFaab(leading.displayBid)}.`; return;
    }
    hint.style.color = '';
    hint.textContent = `You win unless someone bids more than ${fmtFaab(val)}. System pays just ${fmtFaab(MIN_BID)} above next highest.`;
  }

  // 1-tap confirm: first tap arms the button, second tap fires
  async function submitBid() {
    const btn = document.getElementById('bid-submit-btn');
    if (!btn) return;

    // First tap — arm confirm
    if (btn.dataset.confirm !== '1') {
      btn.dataset.confirm  = '1';
      btn.textContent      = '✓ Confirm Bid';
      btn.style.background = 'var(--green)';
      btn.style.color      = '#000';
      // Auto-reset after 4 seconds if not confirmed
      setTimeout(() => {
        if (btn.dataset.confirm === '1') resetBidButton();
      }, 4000);
      return;
    }

    // Second tap — actually submit
    const myTeam = UI.getMyTeam(state);
    if (!myTeam) return;
    const auction = state.auctions.find(a => a.id === state.activeBidAuctionId);
    if (!auction) return;

    const bidVal  = parseInt(document.getElementById('bid-amount-input').value) || 0;
    const leading = Auction.computeLeadingBid(auction);
    const myMax   = Auction.getMyMaxBid(auction, myTeam.roster_id);
    const avail   = getMyFaab() + myMax;
    const p       = state.players[auction.playerId] || {};

    if (bidVal < MIN_BID) { UI.toast(`Minimum bid is ${fmtFaab(MIN_BID)}.`, 'error'); resetBidButton(); return; }
    if (bidVal % MIN_BID !== 0) { UI.toast(`Bids must be in ${fmtFaab(MIN_BID)} increments.`, 'error'); resetBidButton(); return; }
    if (bidVal <= leading.displayBid && leading.rosterId !== myTeam.roster_id) {
      UI.toast(`Bid must exceed ${fmtFaab(leading.displayBid)}.`, 'error'); resetBidButton(); return;
    }
    if (bidVal > avail) { UI.toast(`You only have ${fmtFaab(avail)} available.`, 'error'); resetBidButton(); return; }

    btn.textContent = 'Placing…'; btn.disabled = true;
    try {
      const updated    = await Auction.placeBid(
        state.leagueId, auction.id, myTeam.roster_id, bidVal,
        myTeam.display_name || myTeam.username,
        UI.playerName(p),
        auction.playerId
      );
      const newLeading = Auction.computeLeadingBid(updated);
      closeBidModal();
      UI.toast(
        newLeading.rosterId === myTeam.roster_id
          ? `You're winning at ${fmtFaab(newLeading.displayBid)}! 🏆`
          : `Bid placed but you're currently losing — the leader has a higher max.`,
        newLeading.rosterId === myTeam.roster_id ? 'success' : 'info'
      );
    } catch (e) { UI.toast('Bid failed: ' + e.message, 'error'); }
    finally    { btn.textContent = 'Place Max Bid'; btn.disabled = false; btn.dataset.confirm = '0'; btn.style.background = ''; btn.style.color = ''; }
  }

  // ── Push to Claim (commissioner) ─────────────────────────
  async function pushToClaim(auctionId) {
    const auction = state.auctions.find(a => a.id === auctionId);
    if (!auction) return;
    const leading = Auction.computeLeadingBid(auction);
    const p       = state.players[auction.playerId] || {};

    if (leading.rosterId) {
      const team    = state.teams.find(t => t.roster_id === leading.rosterId);
      if (team) {
        const current = state.faabOverrides[leading.rosterId] !== undefined
          ? state.faabOverrides[leading.rosterId]
          : Math.max(0, team.faab_budget - (team.faab_used || 0));
        await Auction.setFaabOverride(state.leagueId, leading.rosterId, Math.max(0, current - leading.displayBid));
      }
      await Auction.claimAuction(
        state.leagueId, auctionId, leading.rosterId,
        state.teams.find(t => t.roster_id === leading.rosterId)?.display_name || `Team ${leading.rosterId}`,
        leading.displayBid,
        UI.playerName(p),
        auction.playerId
      );

      // Push notification to winner
      if ('Notification' in window && Notification.permission === 'granted') {
        const myTeam = UI.getMyTeam(state);
        if (myTeam?.roster_id === leading.rosterId) {
          new Notification('SleeperBid — Player Claimed! 🎉', {
            body: `${UI.playerName(p)} added to your roster for ${fmtFaab(leading.displayBid)}`,
            icon: `https://sleepercdn.com/content/nfl/players/thumb/${auction.playerId}.jpg`,
            tag:  'claim_' + auctionId,
          });
        }
      }
    } else {
      await Auction.markProcessed(state.leagueId, auctionId);
    }
    UI.toast(`${UI.playerName(p)} claimed! FAAB deducted. ✅`, 'success');
  }

  async function cancelAuction(auctionId) {
    if (!confirm('Cancel this auction? All bids will be voided. Cannot be undone.')) return;
    const auction = state.auctions.find(a => a.id === auctionId);
    const p       = auction ? (state.players[auction.playerId] || {}) : {};
    const myTeam  = UI.getMyTeam(state);
    await Auction.cancelAuction(
      state.leagueId, auctionId,
      UI.playerName(p),
      myTeam?.display_name || COMMISSIONER_USERNAME
    );
    UI.toast('Auction cancelled.', 'info');
  }

  async function passAuction(auctionId) {
    const auction = state.auctions.find(a => a.id === auctionId);
    if (!auction) return;
    const myTeam = UI.getMyTeam(state);
    if (!myTeam) return;
    const p           = state.players[auction.playerId] || {};
    const allRosterIds = state.teams.map(t => t.roster_id);
    try {
      const closed = await Auction.passAuction(
        state.leagueId, auctionId,
        myTeam.roster_id, allRosterIds,
        myTeam.display_name || myTeam.username,
        UI.playerName(p)
      );
      if (closed) {
        UI.toast('All teams passed — auction closed early!', 'success');
      } else {
        UI.toast('Marked as not interested.', 'info');
      }
    } catch(e) {
      UI.toast('Could not record pass: ' + e.message, 'error');
    }
  }

  async function deleteAuction(auctionId) {
    if (!confirm('PERMANENTLY DELETE this auction? Cannot be undone.')) return;
    await Auction.deleteAuction(state.leagueId, auctionId);
    UI.toast('Auction deleted.', 'info');
  }

  async function commOverrideFaab() {
    const rId = parseInt(document.getElementById('comm-team-select').value);
    const val = parseInt(document.getElementById('comm-faab-val').value);
    if (isNaN(val) || val < 0) { UI.toast('Enter a valid FAAB amount.', 'error'); return; }
    const team = state.teams.find(t => t.roster_id === rId);
    await Auction.setFaabOverride(state.leagueId, rId, val);
    UI.toast(`FAAB updated for ${team?.display_name || 'team'}.`, 'success');
  }

  async function commSetAllFaab() {
    const rows = document.querySelectorAll('.faab-bulk-row');
    const updates = [];
    for (const row of rows) {
      const rId = parseInt(row.dataset.rosterId);
      const val = parseInt(row.querySelector('input').value);
      if (isNaN(val) || val < 0) { UI.toast('All values must be 0 or greater.', 'error'); return; }
      updates.push({ rId, val });
    }
    for (const { rId, val } of updates) {
      await Auction.setFaabOverride(state.leagueId, rId, val);
    }
    UI.toast('All FAAB balances updated!', 'success');
  }

  async function commSetAllRosterSizes() {
    const rows = document.querySelectorAll('.roster-bulk-row');
    const updates = [];
    for (const row of rows) {
      const rId = parseInt(row.dataset.rosterId);
      const val = parseInt(row.querySelector('input').value);
      if (isNaN(val) || val < 0) { UI.toast('All values must be 0 or greater.', 'error'); return; }
      updates.push({ rId, val });
    }
    for (const { rId, val } of updates) {
      await Auction.setRosterSize(state.leagueId, rId, val);
    }
    UI.toast('Roster sizes saved!', 'success');
  }

  async function confirmReset() {
    if (confirm('Reset ALL auction data and FAAB overrides? Cannot be undone.')) {
      await Auction.resetAll(state.leagueId);
      UI.toast('All auction data cleared.', 'info');
    }
  }

  // ── History filters ──────────────────────────────────────
  function filterHistory() {
    UI.renderHistory(state.auctions);
  }

  // ── Public API ───────────────────────────────────────────
  return {
    state, fmtFaab,
    boot,
    doLogin, logout,
    doSetup,
    switchTab,
    setFilter, renderFreeAgents, loadFreeAgents,
    refreshAll, renderAll, faSort,
    enableNotifications,
    computeCustomPts,
    toggleWatch,
    openNomModal, closeNomModal, closeNomModalOutside, submitNomination,
    commSetAllRosterSizes,
    openBidModal, closeBidModal, closeBidModalOutside, submitBid, updateBidHint,
    pushToClaim, cancelAuction, deleteAuction, passAuction,
    commOverrideFaab, commSetAllFaab, confirmReset,
    filterHistory,
  };
})();

document.addEventListener('DOMContentLoaded', () => App.boot());
