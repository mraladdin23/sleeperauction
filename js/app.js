// ─────────────────────────────────────────────────────────────
//  APP  — main controller, wires everything together
// ─────────────────────────────────────────────────────────────

const App = (() => {

  // ── Shared state (read by UI module) ────────────────────
  const state = {
    user:          null,
    leagueId:      null,
    leagueName:    '',
    teams:         [],
    players:       {},
    freeAgents:    [],
    auctions:      [],
    faabOverrides: {},
    posFilter:     'ALL',
    isCommissioner: false,
    // modal context
    activeNomPlayerId:  null,
    activeBidAuctionId: null,
  };

  // ── Session helpers ──────────────────────────────────────
  const session = {
    get username()  { return localStorage.getItem('sb_username')  || ''; },
    get leagueId()  { return localStorage.getItem('sb_leagueId')  || ''; },
    set username(v) { localStorage.setItem('sb_username', v); },
    set leagueId(v) { localStorage.setItem('sb_leagueId', v); },
    clear()         { localStorage.removeItem('sb_username'); localStorage.removeItem('sb_leagueId'); },
  };

  // ── Boot ─────────────────────────────────────────────────
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

  // ── Login ────────────────────────────────────────────────
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

  // ── Setup ────────────────────────────────────────────────
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

  // ── Logout ───────────────────────────────────────────────
  function logout() {
    Auction.unsubscribe(state.leagueId);
    session.clear();
    Object.assign(state, { user: null, leagueId: null, teams: [], players: {}, freeAgents: [], auctions: [], faabOverrides: {} });
    UI.showScreen('login');
  }

  // ── Init app ─────────────────────────────────────────────
  async function initApp() {
    UI.showScreen('loading');
    UI.setLoading('Loading league…');

    const [league, rosters, users, players] = await Promise.all([
      Sleeper.fetchLeague(state.leagueId),
      Sleeper.fetchRosters(state.leagueId),
      Sleeper.fetchLeagueUsers(state.leagueId),
      Sleeper.fetchPlayers(),
    ]);

    state.leagueName = league.name;
    state.players    = players;

    // Build teams
    const userMap = {};
    users.forEach(u => { userMap[u.user_id] = u; });

    state.teams = rosters.map(r => {
      const u = userMap[r.owner_id] || {};
      return {
        roster_id:    r.roster_id,
        owner_id:     r.owner_id,
        username:     u.display_name || u.username || `Team ${r.roster_id}`,
        display_name: u.display_name || u.username || `Team ${r.roster_id}`,
        avatar:       u.avatar,
        faab_budget:  r.settings?.waiver_budget  ?? 100,
        faab_used:    r.settings?.waiver_bid_used ?? 0,
        players:      r.players || [],
      };
    });

    // Free agents
    const rostered = new Set(rosters.flatMap(r => r.players || []));
    state.freeAgents = Object.keys(players)
      .filter(id => {
        const p = players[id];
        return !rostered.has(id) && p.active && p.fantasy_positions?.length > 0;
      })
      .sort((a, b) => (players[a].search_rank || 9999) - (players[b].search_rank || 9999));

    state.isCommissioner = league.owner_id === state.user.user_id;

    // Render chrome
    document.getElementById('league-name-badge').textContent = league.name;
    UI.setAvatar(document.getElementById('user-avatar'), state.user);
    if (state.isCommissioner) document.getElementById('commissioner-tab').style.display = '';

    UI.showScreen('app');

    // ── Subscribe to Firebase real-time updates ──
    Auction.subscribe(state.leagueId, auctions => {
      state.auctions = auctions;
      renderAll();
    });

    Auction.subscribeFaabOverrides(state.leagueId, overrides => {
      state.faabOverrides = overrides;
      renderAll();
    });

    UI.startTimers(() => state.auctions);
  }

  function renderAll() {
    UI.renderAuctions(state.auctions, state.faabOverrides);
    UI.renderTeams(state.faabOverrides);
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
      const [players, rosters] = await Promise.all([Sleeper.fetchPlayers(), Sleeper.fetchRosters(state.leagueId)]);
      state.players = players;
      const rostered = new Set(rosters.flatMap(r => r.players || []));
      state.freeAgents = Object.keys(players)
        .filter(id => { const p = players[id]; return !rostered.has(id) && p.active && p.fantasy_positions?.length > 0; })
        .sort((a, b) => (players[a].search_rank || 9999) - (players[b].search_rank || 9999));
      UI.renderFreeAgents(state.posFilter);
      UI.toast('Free agents updated!', 'success');
    } catch (e) { UI.toast('Refresh failed: ' + e.message, 'error'); }
  }

  // ── Refresh from Sleeper ─────────────────────────────────
  async function refreshAll() {
    UI.toast('Refreshing from Sleeper…', 'info');
    try {
      const [rosters, users] = await Promise.all([
        Sleeper.fetchRosters(state.leagueId),
        Sleeper.fetchLeagueUsers(state.leagueId),
      ]);
      const userMap = {};
      users.forEach(u => { userMap[u.user_id] = u; });

      state.teams = rosters.map(r => {
        const u = userMap[r.owner_id] || {};
        return {
          roster_id:    r.roster_id,
          owner_id:     r.owner_id,
          username:     u.display_name || u.username || `Team ${r.roster_id}`,
          display_name: u.display_name || u.username || `Team ${r.roster_id}`,
          avatar:       u.avatar,
          faab_budget:  r.settings?.waiver_budget  ?? 100,
          faab_used:    r.settings?.waiver_bid_used ?? 0,
          players:      r.players || [],
        };
      });
      renderAll();
      UI.toast('Refreshed!', 'success');
    } catch (e) { UI.toast('Refresh failed: ' + e.message, 'error'); }
  }

  // ── Nominate modal ───────────────────────────────────────
  function openNomModal(playerId) {
    const myTeam = UI.getMyTeam(state);
    if (!myTeam) { UI.toast('You are not in this league.', 'error'); return; }

    const now = Date.now();
    const myActiveNom = state.auctions.find(a =>
      !a.processed && a.expiresAt > now && a.nominatedBy === myTeam.roster_id
    );
    if (myActiveNom) { UI.toast('You already have an active nomination.', 'error'); return; }

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

  function closeNomModal()              { UI.closeModal('nom-modal'); }
  function closeNomModalOutside(e)      { if (e.target.id === 'nom-modal') closeNomModal(); }

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
    if (!auction)  return;

    state.activeBidAuctionId = auctionId;
    const p       = state.players[auction.playerId] || {};
    const pos     = UI.playerPos(p);
    const leading = Auction.computeLeadingBid(auction);
    const myMax   = Auction.getMyMaxBid(auction, myTeam.roster_id);
    const avail   = getMyFaab() + myMax; // add back committed max since we'll replace it

    document.getElementById('bid-modal-player-info').innerHTML = `
      ${UI.playerAvatarHTML(auction.playerId, 40)}
      <div>
        <div style="font-weight:600;">${UI.playerName(p)}</div>
        <div style="display:flex;gap:6px;margin-top:2px;">
          <span class="pos-badge pos-${pos}">${pos}</span>
          <span style="color:var(--text3);font-size:12px;">${UI.playerTeam(p)}</span>
        </div>
      </div>`;

    document.getElementById('bid-modal-faab').textContent = `$${avail}`;

    const input = document.getElementById('bid-amount-input');
    input.value  = myMax || (leading.displayBid + 1);
    input.max    = avail;

    document.getElementById('bid-current-info').innerHTML =
      `Current bid: <strong style="color:var(--text);">$${leading.displayBid}</strong>` +
      ` — Leader: <strong style="color:var(--accent2);">${leading.rosterId ? UI.getTeamName(leading.rosterId, state) : '—'}</strong>` +
      (myMax ? ` &nbsp;|&nbsp; Your current max: <strong style="color:var(--yellow);">$${myMax}</strong>` : '');

    // Bid history
    const bids    = Array.isArray(auction.bids) ? auction.bids : Object.values(auction.bids || {});
    const sorted  = [...bids].sort((a, b) => b.timestamp - a.timestamp);
    const histEl  = document.getElementById('bid-history-list');
    histEl.innerHTML = sorted.length
      ? sorted.map(b => `
          <div class="bid-row">
            <span class="bid-row-team">${UI.getTeamName(b.rosterId, state)}</span>
            <span class="bid-row-amount">max $${b.maxBid}</span>
            <span class="bid-row-time">${UI.timeAgo(b.timestamp)}</span>
          </div>`).join('')
      : `<div style="padding:10px 12px;color:var(--text3);font-size:12px;">No bids yet.</div>`;

    updateBidHint();
    UI.openModal('bid-modal');
  }

  function closeBidModal()             { UI.closeModal('bid-modal'); }
  function closeBidModalOutside(e)     { if (e.target.id === 'bid-modal') closeBidModal(); }

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
      hint.style.color = 'var(--red)'; hint.textContent = `Must exceed current bid of $${leading.displayBid}.`; return;
    }
    hint.style.color = ''; hint.textContent = `You win unless someone bids more than $${val}. System only pays $1 above next highest.`;
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

    if (bidVal < 1)           { UI.toast('Minimum bid is $1.', 'error'); return; }
    if (bidVal <= leading.displayBid && leading.rosterId !== myTeam.roster_id) {
      UI.toast(`Bid must exceed current bid of $${leading.displayBid}.`, 'error'); return;
    }
    if (bidVal > avail)       { UI.toast(`You only have $${avail} available.`, 'error'); return; }

    const btn = document.getElementById('bid-submit-btn');
    btn.textContent = 'Placing…'; btn.disabled = true;

    try {
      const updated    = await Auction.placeBid(state.leagueId, auction.id, myTeam.roster_id, bidVal);
      const newLeading = Auction.computeLeadingBid(updated);
      closeBidModal();
      UI.toast(
        newLeading.rosterId === myTeam.roster_id
          ? `You're winning at $${newLeading.displayBid}! Timer reset to 8h. 🏆`
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

    // Deduct FAAB in Firebase overrides
    if (leading.rosterId) {
      const team  = state.teams.find(t => t.roster_id === leading.rosterId);
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

  async function commOverrideFaab() {
    const rId = parseInt(document.getElementById('comm-team-select').value);
    const val = parseInt(document.getElementById('comm-faab-val').value);
    if (isNaN(val) || val < 0) { UI.toast('Enter a valid FAAB amount.', 'error'); return; }
    const team = state.teams.find(t => t.roster_id === rId);
    await Auction.setFaabOverride(state.leagueId, rId, val);
    UI.toast(`FAAB updated for ${team?.display_name || 'team'}.`, 'success');
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
    refreshAll,
    renderAll,
    openNomModal, closeNomModal, closeNomModalOutside, submitNomination,
    openBidModal,  closeBidModal,  closeBidModalOutside,  submitBid, updateBidHint,
    markProcessed, commOverrideFaab, confirmReset,
  };
})();

// ── Boot on load ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => App.boot());
