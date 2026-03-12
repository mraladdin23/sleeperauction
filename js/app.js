
// ── FAAB seed data (pre-loaded from commissioner input) ──────
// Maps Sleeper username (lowercase) → starting FAAB balance
// Update these values via Commissioner tab going forward.
const FAAB_SEED = {
  'schardt312':   1123,
  'spicytunaroll':1136,
  'notgreatbob':  1191,
  'tmill85':      1061,
  'abomb25':      1138,
  'kodypetey':    1140,
  'mkim521':      1303,
  'stupend0us':   1061,
  'iowafan30':    1307,
  'dlon16':       1135,
  'southy610':    1098,
  'mraladdin23':  1064,
};
// ─────────────────────────────────────────────────────────────
//  APP  — main controller
// ─────────────────────────────────────────────────────────────

const App = (() => {

  const SKILL_POSITIONS = new Set(['QB', 'RB', 'WR', 'TE']);

  const state = {
    user:            null,
    leagueId:        null,
    leagueName:      '',
    leagueSettings:  null,   // full league object (for scoring_settings, roster_positions)
    scoringSettings: {},     // league.scoring_settings
    rosterPositions: [],     // league.roster_positions (for max roster check)
    teams:           [],
    players:         {},
    statsMap:        {},     // playerId → season raw stats
    freeAgents:      [],
    auctions:        [],
    faabOverrides:   {},
    posFilter:       'ALL',
    isCommissioner:  false,
    activeNomPlayerId:  null,
    activeBidAuctionId: null,
  };

  const session = {
    get username()  { return localStorage.getItem('sb_username')  || ''; },
    get leagueId()  { return localStorage.getItem('sb_leagueId')  || ''; },
    set username(v) { localStorage.setItem('sb_username', v); },
    set leagueId(v) { localStorage.setItem('sb_leagueId', v); },
    clear()         { localStorage.removeItem('sb_username'); localStorage.removeItem('sb_leagueId'); },
  };

  // ── Boot ────────────────────────────────────────────────
  async function boot() {
    if (session.username && session.leagueId) {
      UI.showScreen('loading');
      UI.setLoading('Reconnecting…');
      try {
        state.user     = await Sleeper.fetchUser(session.username);
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
      auctions: [], faabOverrides: {},
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
        taxi:         r.taxi   || [],   // taxi squad — excluded from active roster count
      };
    });

    // Fetch 2025 stats and compute custom-scored points
    UI.setLoading('Loading 2025 stats…');
    let rawStats = {};
    try { rawStats = await Sleeper.fetchStats(2025); } catch (e) { /* non-fatal */ }
    state.statsMap = rawStats;

    // Build free agents (skill positions only), sorted by custom fantasy points
    const rostered = new Set(rosters.flatMap(r => r.players || []));
    state.freeAgents = Object.keys(players)
      .filter(id => {
        const p = players[id];
        if (rostered.has(id) || !p.active) return false;
        return (p.fantasy_positions || []).some(pos => SKILL_POSITIONS.has(pos));
      })
      .sort((a, b) => {
        const apts = computeCustomPts(a);
        const bpts = computeCustomPts(b);
        if (apts !== null && bpts !== null) return bpts - apts;
        if (apts !== null) return -1;
        if (bpts !== null) return 1;
        return (players[a].search_rank || 9999) - (players[b].search_rank || 9999);
      });

    // Commissioner is identified by Sleeper username (case-insensitive).
    // This is the most reliable method — Sleeper's owner_id type is inconsistent.
    const COMMISSIONER_USERNAME = 'mraladdin23';
    const myUsername = (state.user.username || state.user.display_name || '').toLowerCase();
    state.isCommissioner = myUsername === COMMISSIONER_USERNAME.toLowerCase()
      || String(league.owner_id) === String(state.user.user_id);

    document.getElementById('league-name-badge').textContent = league.name;
    UI.setAvatar(document.getElementById('user-avatar'), state.user);
    document.getElementById('commissioner-tab').style.display = state.isCommissioner ? '' : 'none';

    UI.showScreen('app');
    UI.renderPauseBanner();

    Auction.subscribe(state.leagueId, auctions => {
      const prevAuctions = state.auctions;
      state.auctions = auctions;
      checkOutbidNotifications(prevAuctions, auctions);
      renderAll();
    });

    Auction.subscribeFaabOverrides(state.leagueId, async overrides => {
      // On first load, if no overrides exist yet, seed from FAAB_SEED
      if (!overrides || Object.keys(overrides).length === 0) {
        await seedFaabFromKnownValues();
        return; // The seed will trigger another overrides callback
      }
      state.faabOverrides = overrides;
      renderAll();
    });

    UI.startTimers(() => state.auctions);
    requestNotificationPermission();
  }

  // Auto-seeds FAAB balances from FAAB_SEED map on first run
  async function seedFaabFromKnownValues() {
    for (const team of state.teams) {
      const uname = (team.username || '').toLowerCase();
      if (FAAB_SEED[uname] !== undefined) {
        await Auction.setFaabOverride(state.leagueId, team.roster_id, FAAB_SEED[uname]);
      }
    }
  }

  // Helper: compute custom-scored points for a player from raw stats
  function computeCustomPts(playerId) {
    const raw = state.statsMap[playerId];
    if (!raw) return null;
    const pts = Sleeper.calculatePoints(raw, state.scoringSettings);
    return pts;
  }

  function renderAll() {
    UI.renderAuctions(state.auctions, state.faabOverrides);
    UI.renderTeams(state.faabOverrides);
    UI.renderHistory(state.auctions);
    if (state.isCommissioner) UI.renderCommissioner(state.faabOverrides);
  }

  // ── Tab switching ────────────────────────────────────────
  function switchTab(name) { UI.switchTab(name); }

  // ── Free agents ──────────────────────────────────────────
  function setFilter(pos, el) {
    state.posFilter = pos;
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    UI.renderFreeAgents(state.posFilter);
  }

  function renderFreeAgents() { UI.renderFreeAgents(state.posFilter); }

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
          if (rostered.has(id) || !p.active) return false;
          return (p.fantasy_positions || []).some(pos => SKILL_POSITIONS.has(pos));
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

  // ── Refresh ──────────────────────────────────────────────
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
      // Show a toast prompting the user rather than immediately requesting
      UI.toast('Enable notifications to get outbid alerts. Click the 🔔 button in the top bar.', 'info');
    }
  }

  async function enableNotifications() {
    if (!('Notification' in window)) { UI.toast('Notifications not supported in this browser.', 'error'); return; }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      UI.toast('Outbid notifications enabled! 🔔', 'success');
    } else {
      UI.toast('Notification permission denied.', 'error');
    }
  }

  function checkOutbidNotifications(prevAuctions, nextAuctions) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const myTeam = UI.getMyTeam(state);
    if (!myTeam) return;
    const myRid  = myTeam.roster_id;
    const now    = Date.now();

    nextAuctions.forEach(auction => {
      if (auction.processed || auction.cancelled || auction.expiresAt <= now) return;
      const leading    = Auction.computeLeadingBid(auction);
      const myMax      = Auction.getMyMaxBid(auction, myRid);
      if (myMax === 0) return; // I haven't bid

      const prev        = prevAuctions.find(a => a.id === auction.id);
      const prevLeading = prev ? Auction.computeLeadingBid(prev) : null;

      // Was I leading before and now I'm not?
      const wasWinning = prevLeading?.rosterId === myRid;
      const nowLosing  = leading.rosterId !== myRid;

      if (wasWinning && nowLosing) {
        const p    = state.players[auction.playerId] || {};
        const name = UI.playerName(p);
        new Notification('SleeperBid — You\'ve been outbid!', {
          body: `${name} — new leading bid: $${leading.displayBid}`,
          icon: `https://sleepercdn.com/content/nfl/players/thumb/${auction.playerId}.jpg`,
          tag:  auction.id,
        });
      }
    });
  }

  // ── Roster size enforcement ──────────────────────────────
  function getMaxRosterSize() {
    // Count non-IR roster slots from league.roster_positions
    const positions = state.rosterPositions || [];
    return positions.filter(p => p !== 'BN' ? true : true).length || 999;
    // Sleeper uses BN for bench — count all slots
  }

  function getMyRosterSize() {
    const myTeam = UI.getMyTeam(state);
    return myTeam ? (myTeam.players || []).length : 0;
  }

  function isRosterFull() {
    const max  = getMaxRosterSize();
    const curr = getMyRosterSize();
    return curr >= max;
  }

  // ── Nominate modal ───────────────────────────────────────
  function openNomModal(playerId) {
    const myTeam = UI.getMyTeam(state);
    if (!myTeam) { UI.toast('You are not in this league.', 'error'); return; }

    const now = Date.now();
    const myActiveNom = state.auctions.find(a =>
      !a.processed && !a.cancelled && a.expiresAt > now && a.nominatedBy === myTeam.roster_id
    );
    if (myActiveNom) { UI.toast('You already have an active nomination.', 'error'); return; }

    if (isRosterFull()) {
      UI.toast(`Your roster is full (${getMyRosterSize()}/${getMaxRosterSize()} spots). Drop a player first.`, 'error');
      return;
    }

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

    document.getElementById('nom-faab').textContent = `$${getMyFaab()}`;
    document.getElementById('nom-bid-input').value  = 1;
    document.getElementById('nom-error').classList.add('hidden');
    UI.openModal('nom-modal');
  }

  function closeNomModal()         { UI.closeModal('nom-modal'); }
  function closeNomModalOutside(e) { if (e.target.id === 'nom-modal') closeNomModal(); }

  async function submitNomination() {
    const myTeam = UI.getMyTeam(state);
    if (!myTeam) return;
    const bidVal = parseInt(document.getElementById('nom-bid-input').value) || 1;
    const faab   = getMyFaab();
    if (bidVal < 1)    { showNomError('Minimum bid is $1.'); return; }
    if (bidVal > faab) { showNomError(`You only have $${faab} available.`); return; }

    try {
      await Auction.nominate(state.leagueId, state.activeNomPlayerId, myTeam.roster_id, bidVal);
      closeNomModal();
      UI.toast(`Auction started for ${UI.playerName(state.players[state.activeNomPlayerId])}!`, 'success');
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
    const p       = state.players[auction.playerId] || {};
    const pos     = UI.playerPos(p);
    const leading = Auction.computeLeadingBid(auction);
    const myMax   = Auction.getMyMaxBid(auction, myTeam.roster_id);
    const avail   = getMyFaab() + myMax;

    // Player info + custom pts
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

    document.getElementById('bid-modal-faab').textContent = `$${avail}`;

    const input = document.getElementById('bid-amount-input');
    input.value = myMax || (leading.displayBid + 1);
    input.max   = avail;

    document.getElementById('bid-current-info').innerHTML =
      `Current bid: <strong style="color:var(--text);">$${leading.displayBid}</strong>` +
      ` — Leader: <strong style="color:var(--accent2);">${leading.rosterId ? UI.getTeamName(leading.rosterId, state) : '—'}</strong>` +
      (myMax ? ` &nbsp;|&nbsp; Your current max: <strong style="color:var(--yellow);">$${myMax}</strong>` : '');

    // Stat breakdown panel
    UI.renderStatBreakdown(auction.playerId, state.statsMap[auction.playerId], state.scoringSettings);

    // Bid history — show max only to the person who placed it (blind proxy)
    const bids   = Array.isArray(auction.bids) ? auction.bids : Object.values(auction.bids || {});
    const sorted = [...bids].sort((a, b) => b.timestamp - a.timestamp);
    // Deduplicate: only show the latest bid entry per roster (hide superseded bids)
    const seenRosters = new Set();
    const dedupedBids = sorted.filter(b => {
      if (seenRosters.has(b.rosterId)) return false;
      seenRosters.add(b.rosterId);
      return true;
    });
    document.getElementById('bid-history-list').innerHTML = dedupedBids.length
      ? dedupedBids.map(b => {
          const isMe = b.rosterId === myTeam.roster_id;
          return `<div class="bid-row">
            <span class="bid-row-team">${UI.getTeamName(b.rosterId, state)}${isMe ? ' <span style="color:var(--accent2);font-size:10px;">(you)</span>' : ''}</span>
            <span class="bid-row-amount">${isMe ? `max $${b.maxBid}` : 'bid placed'}</span>
            <span class="bid-row-time">${UI.timeAgo(b.timestamp)}</span>
          </div>`;
        }).join('')
      : `<div style="padding:10px 12px;color:var(--text3);font-size:12px;">No bids yet.</div>`;

    updateBidHint();
    UI.openModal('bid-modal');
  }

  function closeBidModal()         { UI.closeModal('bid-modal'); }
  function closeBidModalOutside(e) { if (e.target.id === 'bid-modal') closeBidModal(); }

  function updateBidHint() {
    const auction = state.auctions.find(a => a.id === state.activeBidAuctionId);
    if (!auction) return;
    const val     = parseInt(document.getElementById('bid-amount-input').value) || 0;
    const leading = Auction.computeLeadingBid(auction);
    const hint    = document.getElementById('bid-hint');
    if (val < 1) {
      hint.style.color = 'var(--red)'; hint.textContent = 'Minimum bid is $1.'; return;
    }
    if (val <= leading.displayBid) {
      hint.style.color = 'var(--red)';
      hint.textContent = `Must exceed current bid of $${leading.displayBid}.`; return;
    }
    hint.style.color = '';
    hint.textContent = `You win unless someone bids more than $${val}. System only pays $1 above next highest.`;
  }

  async function submitBid() {
    const myTeam = UI.getMyTeam(state);
    if (!myTeam) return;
    const auction = state.auctions.find(a => a.id === state.activeBidAuctionId);
    if (!auction) return;

    const bidVal  = parseInt(document.getElementById('bid-amount-input').value) || 0;
    const leading = Auction.computeLeadingBid(auction);
    const myMax   = Auction.getMyMaxBid(auction, myTeam.roster_id);
    const avail   = getMyFaab() + myMax;

    if (bidVal < 1) { UI.toast('Minimum bid is $1.', 'error'); return; }
    if (bidVal <= leading.displayBid && leading.rosterId !== myTeam.roster_id) {
      UI.toast(`Bid must exceed current bid of $${leading.displayBid}.`, 'error'); return;
    }
    if (bidVal > avail) { UI.toast(`You only have $${avail} available.`, 'error'); return; }

    const btn = document.getElementById('bid-submit-btn');
    btn.textContent = 'Placing…'; btn.disabled = true;
    try {
      const updated    = await Auction.placeBid(state.leagueId, auction.id, myTeam.roster_id, bidVal);
      const newLeading = Auction.computeLeadingBid(updated);
      closeBidModal();
      UI.toast(
        newLeading.rosterId === myTeam.roster_id
          ? `You're winning at $${newLeading.displayBid}! Timer reset. 🏆`
          : `Bid placed but you're currently losing — the leader has a higher max.`,
        newLeading.rosterId === myTeam.roster_id ? 'success' : 'info'
      );
    } catch (e) { UI.toast('Bid failed: ' + e.message, 'error'); }
    finally    { btn.textContent = 'Place Max Bid'; btn.disabled = false; }
  }

  // ── Commissioner tools ───────────────────────────────────
  async function markProcessed(auctionId) {
    const auction = state.auctions.find(a => a.id === auctionId);
    if (!auction) return;
    const leading = Auction.computeLeadingBid(auction);

    if (leading.rosterId) {
      const team    = state.teams.find(t => t.roster_id === leading.rosterId);
      if (team) {
        const current = state.faabOverrides[leading.rosterId] !== undefined
          ? state.faabOverrides[leading.rosterId]
          : Math.max(0, team.faab_budget - (team.faab_used || 0));
        await Auction.setFaabOverride(state.leagueId, leading.rosterId, Math.max(0, current - leading.displayBid));
      }
    }
    await Auction.markProcessed(state.leagueId, auctionId);
    UI.toast('Auction marked as processed!', 'success');
  }

  async function cancelAuction(auctionId) {
    if (!confirm('Cancel this auction? All bids will be voided and FAAB returned. Cannot be undone.')) return;
    await Auction.cancelAuction(state.leagueId, auctionId);
    UI.toast('Auction cancelled.', 'info');
  }

  async function deleteAuction(auctionId) {
    if (!confirm('PERMANENTLY DELETE this auction? It will be removed from history entirely. Cannot be undone.')) return;
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

  // Set ALL teams' starting FAAB at once from the bulk input grid
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

  async function confirmReset() {
    if (confirm('Reset ALL auction data and FAAB overrides? Cannot be undone.')) {
      await Auction.resetAll(state.leagueId);
      UI.toast('All auction data cleared.', 'info');
    }
  }

  // ── FAAB helpers ─────────────────────────────────────────
  function getMyFaab() {
    const myTeam = UI.getMyTeam(state);
    if (!myTeam) return 0;
    const override = state.faabOverrides[myTeam.roster_id];
    const base     = override !== undefined
      ? override
      : Math.max(0, myTeam.faab_budget - (myTeam.faab_used || 0));
    return Math.max(0, base - Auction.getCommittedFaab(state.auctions, myTeam.roster_id));
  }

  // ── Public API ───────────────────────────────────────────
  return {
    state,
    boot,
    doLogin, logout,
    doSetup,
    switchTab,
    setFilter, renderFreeAgents, loadFreeAgents,
    refreshAll, renderAll,
    enableNotifications,
    computeCustomPts,
    openNomModal, closeNomModal, closeNomModalOutside, submitNomination,
    openBidModal,  closeBidModal,  closeBidModalOutside, submitBid, updateBidHint,
    markProcessed, cancelAuction, deleteAuction, commOverrideFaab, commSetAllFaab, confirmReset,
  };
})();

document.addEventListener('DOMContentLoaded', () => App.boot());

