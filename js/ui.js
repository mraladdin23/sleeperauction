// ─────────────────────────────────────────────────────────────
//  UI  — rendering helpers, modals, toasts, timers
// ─────────────────────────────────────────────────────────────

const UI = (() => {

  // ── Screens ─────────────────────────────────────────────
  function showScreen(name) {
    const screens = { login:'login-screen', loading:'loading-screen', setup:'setup-screen', picker:'picker-screen', app:'app' };
    Object.entries(screens).forEach(([key, id]) => {
      document.getElementById(id).classList.toggle('hidden', key !== name);
    });
    // Always clear stale modals when switching screens
    if (name === 'login') {
      ['change-pw-modal','league-pw-modal'].forEach(id => {
        document.getElementById(id)?.remove();
      });
      const pwWrap = document.getElementById('login-password-wrap');
      if (pwWrap) pwWrap.style.display = 'none';
      const pwInput = document.getElementById('login-password');
      if (pwInput) pwInput.value = '';
    }
  }

  function setLoading(msg) { document.getElementById('loading-text').textContent = msg; }
  // ── Tabs ─────────────────────────────────────────────────
  function switchTab(name) {
    // Scope to auction view in SPA mode to avoid interfering with cap/draft tab-content divs
    const scope = document.getElementById('view-auction') || document;
    scope.querySelectorAll('.nav-tab:not([data-captab])').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    scope.querySelectorAll('.tab-content').forEach(t => t.classList.toggle('active', t.id === 'tab-' + name));
    const dd = document.getElementById('nav-dropdown');
    if (dd) dd.value = name;
  }

  // ── Avatar ───────────────────────────────────────────────
  function setAvatar(el, user) {
    if (!el) return;
    const initial = (user?.display_name || user?.username || '?')[0].toUpperCase();
    if (user?.avatar) {
      el.innerHTML = `<img src="https://sleepercdn.com/avatars/thumbs/${user.avatar}" onerror="this.parentElement.textContent='${initial}'" />`;
    } else {
      el.textContent = initial;
    }
  }

  // ── Player helpers ────────────────────────────────────────
  function playerName(p) {
    if (!p || !p.first_name) return 'Unknown Player';
    return `${p.first_name} ${p.last_name}`;
  }
  function playerPos(p)  { return (p?.fantasy_positions?.[0]) || p?.position || ''; }
  function playerTeam(p) { return p?.team || 'FA'; }
  function playerEmoji(pos) {
    return { QB:'🏈', RB:'💨', WR:'⚡', TE:'🎯' }[pos] || '🏈';
  }

  function playerAvatarHTML(playerId, size = 44) {
    const p   = App.state.players[playerId] || {};
    const pos = playerPos(p);
    return `<div class="player-avatar" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.4)}px;">
      <img src="https://sleepercdn.com/content/nfl/players/thumb/${playerId}.jpg"
           onerror="this.style.display='none';this.nextElementSibling.style.cssText='display:flex;width:100%;height:100%;align-items:center;justify-content:center;'" />
      <span style="display:none">${playerEmoji(pos)}</span>
    </div>`;
  }

  // ── Overnight pause banner ────────────────────────────────
  function renderPauseBanner() {
    const existing = document.getElementById('pause-banner');
    const paused   = Auction.isNightPause();
    if (paused && !existing) {
      const banner = document.createElement('div');
      banner.id        = 'pause-banner';
      banner.className = 'pause-banner';
      const msLeft     = Auction.msTillPauseEnd();
      const h          = Math.floor(msLeft / 3600000);
      const m          = Math.floor((msLeft % 3600000) / 60000);
      banner.innerHTML = `🌙 Auctions are paused overnight (12am–8am CT). Timers resume in <strong>${h}h ${m}m</strong>.`;
      // Insert only into auction view nav-tabs, not cap or draft tabs
      const auctionView = document.getElementById('view-auction');
      const navTabs = auctionView
        ? auctionView.querySelector('.nav-tabs')
        : document.querySelector('.nav-tabs');
      if (navTabs) navTabs.insertAdjacentElement('afterend', banner);
    } else if (!paused && existing) {
      existing.remove();
    }
  }

  // ── Timer ────────────────────────────────────────────────
  function formatTime(ms) {
    if (ms <= 0) return 'Ended';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  function timeAgo(ts) {
    const d = Date.now() - ts;
    if (d < 60000)    return 'just now';
    if (d < 3600000)  return `${Math.floor(d / 60000)}m ago`;
    if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
    return `${Math.floor(d / 86400000)}d ago`;
  }

  // ── Urgency glow ─────────────────────────────────────────
  let _urgencyEl = null;
  function setUrgencyGlow(active) {
    if (!_urgencyEl) {
      _urgencyEl = document.createElement('div');
      _urgencyEl.id = 'urgency-glow';
      _urgencyEl.style.cssText = 'pointer-events:none;position:fixed;inset:0;z-index:9999;border:3px solid var(--red);border-radius:0;animation:urgency-pulse 1s ease-in-out infinite;display:none;';
      document.body.appendChild(_urgencyEl);
      const style = document.createElement('style');
      style.textContent = '@keyframes urgency-pulse{0%,100%{opacity:0}50%{opacity:.6}}';
      document.head.appendChild(style);
    }
    _urgencyEl.style.display = active ? '' : 'none';
  }

  // ── Auction cards ─────────────────────────────────────────
  function renderAuctions(auctions, faabOverrides) {
    const { state } = App;
    const now    = Date.now();
    const myTeam = getMyTeam(state);
    const myRid  = myTeam?.roster_id;
    const isComm = state.isCommissioner;

    const active    = auctions.filter(a => !a.processed && !a.cancelled && a.expiresAt > now);
    const completed = auctions.filter(a => a.processed || a.cancelled || a.expiresAt <= now);

    // Check if any active auction is under 60 seconds
    const anyUrgent = active.some(a => {
      const left = a.expiresAt - now;
      return left > 0 && left < 60_000 && !Auction.isNightPause(now);
    });
    setUrgencyGlow(anyUrgent);

    if (!document.getElementById('auctions-grid')) return;
    document.getElementById('auction-count').innerHTML =
      `<span class="live-dot"></span>${active.length} live`;
    document.getElementById('completed-count').textContent = completed.length;

    const render = (list, el) => {
      if (!list.length) {
        el.innerHTML = emptyState(
          el.id === 'auctions-grid' ? '🏷' : '✅',
          el.id === 'auctions-grid' ? 'No Active Auctions' : 'No Completed Auctions',
          el.id === 'auctions-grid' ? 'Nominate a player from the Free Agents tab.' : 'Completed auctions will appear here.'
        );
        return;
      }
      el.innerHTML = list.map(a => auctionCard(a, now, myRid, state, isComm)).join('');
    };

    render(active,    document.getElementById('auctions-grid'));
    render(completed, document.getElementById('completed-grid'));
  }

  function auctionCard(auction, now, myRid, state, isComm) {
    const p       = state.players[auction.playerId] || {};
    const pos     = playerPos(p);
    const leading = Auction.computeLeadingBid(auction);
    const myMax   = myRid ? Auction.getMyMaxBid(auction, myRid) : 0;
    const isExp   = auction.expiresAt <= now;
    const isCan   = auction.cancelled;
    const isWin   = !isExp && !isCan && leading.rosterId === myRid;
    const isOut   = !isExp && !isCan && myRid && myMax > 0 && leading.rosterId !== myRid;
    const { paused } = Auction.effectiveTimeLeft(auction, now);
    const left     = isExp ? 0 : auction.expiresAt - now;
    const isUrgent = !isExp && !isCan && !paused && left > 0 && left < 60_000;
    const isWatched = !!(state.watchlist || {})[auction.playerId];

    let cls = 'auction-card';
    if (isWin)    cls += ' winning';
    if (isOut)    cls += ' outbid';
    if (isExp || isCan) cls += ' expired';
    if (isUrgent) cls += ' urgent-card';

    let pill = '';
    if (isCan)                                       pill = `<span class="status-pill status-expired">Cancelled</span>`;
    else if (auction.processed)                      pill = `<span class="status-pill status-won">Claimed ✓</span>`;
    else if (isExp && auction.autoClosedByPasses)    pill = `<span class="status-pill status-expired">All Passed</span>`;
    else if (isExp && leading.rosterId === myRid)    pill = `<span class="status-pill status-won">Won ✓</span>`;
    else if (isExp)                                  pill = `<span class="status-pill status-expired">Ended</span>`;
    else if (paused)                                 pill = `<span class="status-pill status-paused">⏸ Paused</span>`;
    else if (isWin)                                  pill = `<span class="status-pill status-winning">Winning ↑</span>`;
    else if (isOut)                                  pill = `<span class="status-pill status-outbid">Outbid !</span>`;
    else                                             pill = `<span class="status-pill status-watching">Watching</span>`;

    const timerCls = isExp ? 'done' : paused ? 'paused' : isUrgent ? 'urgent' : '';
    const timerTxt = paused ? '⏸ Paused' : formatTime(left);

    const canBid   = !isExp && !isCan && !auction.processed;
    const bidBtn   = canBid
      ? `<button class="btn btn-primary btn-sm" style="margin-left:auto;" onclick="App.openBidModal('${auction.id}')">
           ${isWin ? 'Update Bid' : isOut ? 'Bid Again' : 'Bid'}
         </button>` : '';

    // ── Pass / Not Interested ──────────────────────────────
    const passes     = Object.keys(auction.passes || {}).map(Number);
    const bids       = Array.isArray(auction.bids) ? auction.bids : Object.values(auction.bids || {});
    const bidderRids = new Set(bids.map(b => b.rosterId));
    const totalTeams = state.teams.length;
    // Teams that need to pass = everyone except nominator and bidders
    const mustPassCount = state.teams.filter(t =>
      t.roster_id !== auction.nominatedBy && !bidderRids.has(t.roster_id)
    ).length;
    const passCount  = passes.filter(rid => rid !== auction.nominatedBy && !bidderRids.has(rid)).length;
    const myPassed   = myRid && passes.includes(myRid);
    const myBid      = myRid ? Auction.getMyMaxBid(auction, myRid) : 0;
    // Can pass if: auction active, not nominator, haven't bid, haven't already passed
    const canPass    = canBid && myRid && auction.nominatedBy !== myRid && !myBid && !myPassed;

    const passBtn = canPass
      ? `<button class="btn btn-sm pass-btn" onclick="App.passAuction('${auction.id}')"
           style="background:rgba(255,77,106,.08);color:var(--red);border:1px solid rgba(255,77,106,.25);margin-left:6px;">
           👎 Pass
         </button>`
      : myPassed && canBid
      ? `<span style="font-size:11px;color:var(--text3);margin-left:6px;">Passed</span>`
      : '';

    const passCounter = canBid && mustPassCount > 0
      ? `<span style="font-size:11px;color:var(--text3);margin-left:6px;" title="${passCount} of ${mustPassCount} non-bidding teams have passed">
           ${passCount}/${mustPassCount} passed
         </span>`
      : '';

    const cancelBtn = isComm && canBid
      ? `<button class="btn btn-sm" style="background:var(--red-dim);color:var(--red);border:1px solid rgba(255,77,106,0.25);margin-left:6px;"
           onclick="App.cancelAuction('${auction.id}')">Cancel</button>` : '';

    // Push to Claim: show for expired, unprocessed auctions (commissioner only)
    const claimBtn = isComm && isExp && !auction.processed && !isCan
      ? `<button class="btn btn-green btn-sm" style="margin-left:6px;font-size:11px;" onclick="App.pushToClaim('${auction.id}')">✅ Claim</button>` : '';

    const deleteBtn = isComm
      ? `<button class="btn btn-sm" style="background:transparent;color:var(--text3);border:1px solid var(--border);margin-left:6px;font-size:11px;"
           onclick="App.deleteAuction('${auction.id}')" title="Delete">🗑</button>` : '';

    const watchBtn = `<button class="btn btn-sm" style="background:transparent;border:1px solid var(--border);margin-left:6px;font-size:13px;padding:4px 7px;"
         onclick="App.toggleWatch('${auction.playerId}')" title="${isWatched ? 'Remove from watchlist' : 'Add to watchlist'}">${isWatched ? '⭐' : '☆'}</button>`;

    const customPts = App.computeCustomPts(auction.playerId);
    const ptsTag    = customPts !== null
      ? `<span style="font-size:11px;color:var(--text3);">${customPts.toFixed(1)} pts</span>` : '';

    return `<div class="${cls}" id="card-${auction.id}">
      ${isUrgent ? '<div style="background:var(--red);color:#fff;font-size:10px;font-weight:700;text-align:center;padding:3px;letter-spacing:.5px;border-radius:var(--radius) var(--radius) 0 0;">⚡ CLOSING SOON</div>' : ''}
      ${canBid && mustPassCount > 0 && passCount === mustPassCount - 1 ? '<div style="background:rgba(255,201,77,.15);color:var(--yellow);font-size:10px;font-weight:600;text-align:center;padding:3px;letter-spacing:.3px;">⚠️ 1 team left to pass — closes when they do</div>' : ''}
      <div class="card-top">
        ${playerAvatarHTML(auction.playerId, 44)}
        <div class="player-info">
          <div class="player-name">${playerName(p)}</div>
          <div class="player-meta">
            <span class="pos-badge pos-${pos}">${pos}</span>
            <span>${playerTeam(p)}</span>
            ${ptsTag}
          </div>
          <div style="font-size:11px;color:var(--text3);margin-top:3px;">
            Nominated by ${getTeamName(auction.nominatedBy, state)}
          </div>
        </div>
      </div>
      <div class="card-mid">
        <div class="bid-info">
          <div class="bid-label">Current Price</div>
          <div class="bid-amount"><span class="dollar">$</span>${fmtBidShort(leading.displayBid)}</div>
          <div class="bid-leader">Leader: <span>${leading.rosterId ? getTeamName(leading.rosterId, state) : '—'}</span></div>
        </div>
        <div class="timer-block">
          <div class="timer-label">Time Left</div>
          <div class="timer ${timerCls}" id="timer-${auction.id}">${timerTxt}</div>
        </div>
      </div>
      <div class="card-bot">${pill}${watchBtn}${passBtn}${passCounter}${bidBtn}${cancelBtn}${claimBtn}${deleteBtn}</div>
    </div>`;
  }

  // Format bid amounts shorter for card display: $1.1M, $500K
  function fmtBidShort(n) {
    if (!n) return '100K';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'M';
    if (n >= 1_000)     return Math.round(n / 1_000) + 'K';
    return String(n);
  }

  // ── Timer ticks ───────────────────────────────────────────
  let _timerInterval = null;
  function startTimers(getAuctions) {
    if (_timerInterval) clearInterval(_timerInterval);
    _timerInterval = setInterval(() => {
      const now    = Date.now();
      const paused = Auction.isNightPause(now);
      let needRender = false;
      let anyUrgent  = false;

      renderPauseBanner();

      getAuctions().forEach(a => {
        if (a.processed || a.cancelled) return;
        const el   = document.getElementById(`timer-${a.id}`);
        const left = a.expiresAt - now;
        if (left <= 0) {
          if (el) { el.textContent = 'Ended'; el.className = 'timer done'; }
          needRender = true;
        } else if (paused) {
          if (el) { el.textContent = '⏸ Paused'; el.className = 'timer paused'; }
        } else {
          if (left < 60_000) anyUrgent = true;
          if (el) { el.textContent = formatTime(left); el.className = `timer ${left < 60_000 ? 'urgent' : left < 3_600_000 ? 'urgent' : ''}`; }
        }
      });

      setUrgencyGlow(anyUrgent);
      if (needRender) App.renderAll();
    }, 1000);
  }

  // ── Stat breakdown ────────────────────────────────────────
  function renderStatBreakdown(playerId, rawStats, scoringSettings) {
    const el = document.getElementById('bid-stat-breakdown');
    if (!el) return;
    if (!rawStats || !scoringSettings) { el.innerHTML = ''; return; }

    const statDefs = [
      ['Pass Yards',  'pass_yd', 'pass_yd'],
      ['Pass TD',     'pass_td', 'pass_td'],
      ['Interception','pass_int','pass_int'],
      ['Rush Yards',  'rush_yd', 'rush_yd'],
      ['Rush TD',     'rush_td', 'rush_td'],
      ['Receptions',  'rec',     'rec'],
      ['Rec Yards',   'rec_yd',  'rec_yd'],
      ['Rec TD',      'rec_td',  'rec_td'],
      ['2PT Conv',    'bonus_rec_te','bonus_rec_te'],
      ['Fum Lost',    'fum_lost','fum_lost'],
    ];

    const rows = statDefs
      .filter(([, statKey]) => rawStats[statKey] !== undefined && rawStats[statKey] !== 0)
      .map(([label, statKey, scoreKey]) => {
        const val = rawStats[statKey] ?? 0;
        const mul = scoringSettings[scoreKey] ?? 0;
        const pts = (val * mul).toFixed(1);
        return `<div class="stat-row">
          <span class="stat-label">${label}</span>
          <span class="stat-val">${typeof val === 'number' && val % 1 !== 0 ? val.toFixed(1) : val}</span>
          <span class="stat-pts">${mul !== 0 ? `${pts} pts` : '—'}</span>
        </div>`;
      });

    if (!rows.length) { el.innerHTML = ''; return; }

    el.innerHTML = `
      <div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;margin-top:14px;">2025 Season Stats (completed)</div>
      <div class="stat-breakdown">${rows.join('')}</div>`;
  }

  // ── Free agents ───────────────────────────────────────────
  if (window.faPage === undefined) window.faPage = 0;
  window._faAllFiltered = window._faAllFiltered || [];
  window._faSort = window._faSort || { col: 'pts', dir: 'desc' };
  const FA_PAGE_SIZE = 50;

  function renderFreeAgents(posFilter, resetPage) {
    const { state } = App;
    if (resetPage) window.faPage = 0;
    const query       = (document.getElementById('fa-search')?.value || '').toLowerCase();
    const nflTeamFilter = (document.getElementById('fa-nfl-team-filter')?.value || '').toUpperCase();
    const now         = Date.now();
    const activeIds   = new Set(state.auctions.filter(a => !a.processed && !a.cancelled && a.expiresAt > now).map(a => a.playerId));
    const myTeam      = getMyTeam(state);
    const myActiveNom = myTeam
      ? state.auctions.find(a => !a.processed && !a.cancelled && a.expiresAt > now && a.nominatedBy === myTeam.roster_id)
      : null;

    // Populate NFL team dropdown on first render
    const nflDd = document.getElementById('fa-nfl-team-filter');
    if (nflDd && nflDd.options.length <= 1) {
      const teams = [...new Set(state.freeAgents.map(id => state.players[id]?.team).filter(t => t && t !== 'FA'))].sort();
      teams.forEach(t => { const o = document.createElement('option'); o.value = t; o.textContent = t; nflDd.appendChild(o); });
    }

    let filtered = state.freeAgents.filter(id => {
      const p = state.players[id];
      if (!p?.first_name) return false;
      if (posFilter !== 'ALL' && !(p.fantasy_positions || []).includes(posFilter)) return false;
      if (query && !playerName(p).toLowerCase().includes(query)) return false;
      if (nflTeamFilter && (p.team || '').toUpperCase() !== nflTeamFilter) return false;
      return true;
    });

    // Sort
    const { col, dir } = window._faSort;
    const mult = dir === 'asc' ? 1 : -1;
    filtered.sort((a, b) => {
      const pa = state.players[a] || {}, pb = state.players[b] || {};
      if (col === 'name') return mult * (playerName(pa).localeCompare(playerName(pb)));
      if (col === 'team') return mult * ((pa.team||'').localeCompare(pb.team||''));
      if (col === 'bye')  return mult * ((pa.bye_week||99) - (pb.bye_week||99));
      if (col === 'pts')  { const ap = App.computeCustomPts(a), bp = App.computeCustomPts(b); return mult * ((ap??-1) - (bp??-1)); }
      return 0;
    });

    // Update sort indicators
    ['name','team','bye','pts'].forEach(c => {
      const el = document.getElementById(`fa-sort-${c}`);
      if (el) el.textContent = col === c ? (dir === 'asc' ? '▲' : '▼') : '';
    });

    window._faAllFiltered = filtered;
    _renderFAPage(myTeam, activeIds, myActiveNom);
  }

  function _renderFAPage(myTeamIn, activeIdsIn, myActiveNomIn) {
    const { state } = App;
    const now         = Date.now();
    const allFiltered = window._faAllFiltered;
    const totalPages  = Math.max(1, Math.ceil(allFiltered.length / FA_PAGE_SIZE));
    if (window.faPage >= totalPages) window.faPage = totalPages - 1;
    const filtered = allFiltered.slice(window.faPage * FA_PAGE_SIZE, (window.faPage + 1) * FA_PAGE_SIZE);

    // When called from prev/next buttons, recompute context
    const myTeam      = myTeamIn      !== undefined ? myTeamIn      : getMyTeam(state);
    const activeIds   = activeIdsIn   !== undefined ? activeIdsIn   : new Set(state.auctions.filter(a => !a.processed && !a.cancelled && a.expiresAt > now).map(a => a.playerId));
    const myActiveNom = myActiveNomIn !== undefined ? myActiveNomIn : (myTeam ? state.auctions.find(a => !a.processed && !a.cancelled && a.expiresAt > now && a.nominatedBy === myTeam.roster_id) : null);

    document.getElementById('fa-count').textContent = `${allFiltered.length} players`;

    const tbody = document.getElementById('fa-tbody');
    if (!allFiltered.length) {
      tbody.innerHTML = `<tr><td colspan="5">${emptyState('\ud83d\udd0d','No players found','Try a different search or position filter.')}</td></tr>`;
      const pg = document.getElementById('fa-pagination');
      if (pg) pg.innerHTML = '';
      return;
    }

    tbody.innerHTML = filtered.map(id => {
      const p         = state.players[id] || {};
      const pos2      = playerPos(p);
      const inAuction = activeIds.has(id);
      const canNom    = !inAuction && !myActiveNom;
      const customPts = App.computeCustomPts(id);
      const ptsLabel  = customPts !== null ? customPts.toFixed(1) : '—';
      const raw       = (App.state.statsMap || {})[id] || {};
      const isWatched = !!(state.watchlist || {})[id];

      const statBits = [];
      if (raw.pass_yd) statBits.push(`${Math.round(raw.pass_yd)} PaYd`);
      if (raw.pass_td) statBits.push(`${raw.pass_td} PaTD`);
      if (raw.rush_yd) statBits.push(`${Math.round(raw.rush_yd)} RuYd`);
      if (raw.rush_td) statBits.push(`${raw.rush_td} RuTD`);
      if (raw.rec)     statBits.push(`${raw.rec} Rec`);
      if (raw.rec_yd)  statBits.push(`${Math.round(raw.rec_yd)} ReYd`);
      if (raw.rec_td)  statBits.push(`${raw.rec_td} ReTD`);
      const statLine = statBits.length
        ? `<div style="font-size:10px;color:var(--text3);margin-top:2px;">${statBits.join(' · ')}</div>`
        : '';

      return `<tr>
        <td>
          <div class="player-cell">
            <div class="fa-mini-avatar">
              <img src="https://sleepercdn.com/content/nfl/players/thumb/${id}.jpg"
                   onerror="this.style.display='none';this.nextSibling.style.cssText='display:flex;align-items:center;justify-content:center;width:100%;height:100%;'" />
              <span style="display:none">${playerEmoji(pos2)}</span>
            </div>
            <div>
              <div style="font-weight:500;">${playerName(p)}</div>
              <div style="display:flex;gap:6px;margin-top:2px;"><span class="pos-badge pos-${pos2}">${pos2}</span></div>
              ${statLine}
            </div>
          </div>
        </td>
        <td style="color:var(--text2);">${playerTeam(p)}</td>
        <td style="color:var(--text3);font-family:var(--font-mono);">${p.bye_week || '—'}</td>
        <td style="color:var(--text2);font-family:var(--font-mono);font-size:13px;">${ptsLabel}</td>
        <td style="text-align:right;">
          <button class="btn btn-sm" style="background:transparent;border:1px solid var(--border);margin-right:4px;font-size:13px;padding:4px 7px;"
            onclick="App.toggleWatch('${id}')" title="${isWatched ? 'Unwatch' : 'Watch'}">${isWatched ? '⭐' : '☆'}</button>
          ${inAuction
            ? `<span style="font-size:11px;color:var(--yellow);">In Auction</span>`
            : !myTeam
            ? `<span style="font-size:11px;color:var(--text3);">Not in league</span>`
            : `<button class="btn btn-green btn-sm" ${canNom ? '' : 'disabled'}
                 onclick="App.openNomModal('${id}')"
                 title="${!canNom ? 'You already have an active nomination' : ''}">Nominate</button>`
          }
        </td>
      </tr>`;
    }).join('');

    const base   = 'padding:7px 18px;border-radius:var(--radius-sm);font-size:13px;font-weight:500;font-family:var(--font-body);cursor:pointer;transition:all .15s;';
    const btnOn  = base + 'border:1px solid var(--accent);background:var(--accent);color:#fff;';
    const btnOff = base + 'border:1px solid var(--border);background:var(--surface2);color:var(--text3);cursor:not-allowed;opacity:.45;';
    const cur    = window.faPage;
    const start  = cur * FA_PAGE_SIZE + 1;
    const end    = Math.min((cur + 1) * FA_PAGE_SIZE, allFiltered.length);

    const pgHTML = totalPages <= 1 ? '' : `
      <div style="display:flex;align-items:center;justify-content:center;gap:12px;padding:10px 0;border-top:1px solid var(--border);margin-top:6px;">
        <button style="${cur===0?btnOff:btnOn}" ${cur===0?'disabled':''} onclick="faPagePrev()">← Prev</button>
        <span style="font-size:12px;color:var(--text2);font-family:var(--font-mono);">
          ${start}–${end} <span style="color:var(--text3);">of ${allFiltered.length}</span>
          &nbsp;·&nbsp; Page ${cur+1} / ${totalPages}
        </span>
        <button style="${cur>=totalPages-1?btnOff:btnOn}" ${cur>=totalPages-1?'disabled':''} onclick="faPageNext()">Next →</button>
      </div>`;
    const pgTop = document.getElementById('fa-pagination-top');
    if (pgTop) pgTop.innerHTML = pgHTML;
    const pg = document.getElementById('fa-pagination');
    if (pg) pg.innerHTML = pgHTML;
  }



  // ── Teams ────────────────────────────────────────────────
  function renderTeams(faabOverrides) {
    const { state } = App;
    const now           = Date.now();
    const grid          = document.getElementById('teams-grid');
    if (!grid) return;
    const activeAuctions = state.auctions.filter(a => !a.processed && !a.cancelled && a.expiresAt > now);
    const rosterSizes   = state.rosterSizes || {};
    const hasRosterData = Object.keys(rosterSizes).length > 0;

    // Sort: my team first, then by available FAAB descending
    const sorted = [...state.teams].sort((a, b) => {
      const aIsMe = String(a.owner_id) === String(state.user?.user_id);
      const bIsMe = String(b.owner_id) === String(state.user?.user_id);
      if (aIsMe) return -1; if (bIsMe) return 1;
      const aAvail = Math.max(0, (faabOverrides?.[a.roster_id] ?? Math.max(0, a.faab_budget - a.faab_used)) - Auction.getCommittedFaab(state.auctions, a.roster_id));
      const bAvail = Math.max(0, (faabOverrides?.[b.roster_id] ?? Math.max(0, b.faab_budget - b.faab_used)) - Auction.getCommittedFaab(state.auctions, b.roster_id));
      return bAvail - aAvail;
    });

    grid.innerHTML = sorted.map(t => {
      const override  = faabOverrides?.[t.roster_id];
      const baseFaab  = override !== undefined ? override : Math.max(0, t.faab_budget - (t.faab_used || 0));
      const committed = Auction.getCommittedFaab(state.auctions, t.roster_id);
      const available = Math.max(0, baseFaab - committed);
      const isMe      = String(t.owner_id) === String(state.user?.user_id);

      const myActiveBids = activeAuctions.filter(a => Auction.getMyMaxBid(a, t.roster_id) > 0);
      const bidCount     = myActiveBids.length;
      const leadingOn    = myActiveBids.filter(a => Auction.computeLeadingBid(a).rosterId === t.roster_id);
      const winningCount = leadingOn.length;

      const ROSTER_CAP  = 25;
      // Active roster = all players minus taxi and IR
      // Fall back to manual Firebase value if Sleeper data not available
      let rosterCount = null;
      if (t.players != null) {
        const taxiSet    = new Set(t.taxi    || []);
        const reserveSet = new Set(t.reserve || []);
        const activeCount = (t.players || []).filter(id => !taxiSet.has(id) && !reserveSet.has(id)).length;
        rosterCount = activeCount;
      } else {
        rosterCount = rosterSizes[t.roster_id] ?? null;
      }
      const openSpots = rosterCount != null ? Math.max(0, ROSTER_CAP - rosterCount - winningCount) : null;

      const spotsHtml = openSpots !== null
        ? `<div class="team-stat">
            <div class="team-stat-label">Open Spots</div>
            <div class="team-stat-val" style="color:${openSpots === 0 ? 'var(--red)' : openSpots <= 2 ? 'var(--yellow)' : 'var(--text2)'};">${openSpots}</div>
          </div>` : '';

      // Max budget for bar scaling
      const allBases = state.teams.map(tt => {
        const ov = faabOverrides?.[tt.roster_id];
        return ov !== undefined ? ov : Math.max(0, tt.faab_budget - (tt.faab_used || 0));
      });
      const maxBase = Math.max(...allBases, 1);
      const pct = Math.round((baseFaab / maxBase) * 100);

      return `<div class="team-card ${isMe ? 'team-card-me' : ''}">
        <div class="team-card-header">
          <div class="avatar" style="width:30px;height:30px;font-size:12px;flex-shrink:0;">
            ${t.avatar
              ? `<img src="https://sleepercdn.com/avatars/thumbs/${t.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"
                      onerror="this.parentElement.textContent='${(t.display_name||'?')[0].toUpperCase()}'" />`
              : (t.display_name || '?')[0].toUpperCase()}
          </div>
          <div style="font-weight:600;font-size:14px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
            ${t.display_name || t.username}
          </div>
          ${isMe ? '<span class="you-badge">You</span>' : ''}
        </div>

        <div class="team-stats-grid">
          <div class="team-stat">
            <div class="team-stat-label">Balance</div>
            <div class="team-stat-val" style="color:var(--green);">${App.fmtFaab(baseFaab)}</div>
          </div>
          <div class="team-stat">
            <div class="team-stat-label">Committed</div>
            <div class="team-stat-val" style="color:${committed > 0 ? 'var(--yellow)' : 'var(--text3)'};">${App.fmtFaab(committed)}</div>
          </div>
          <div class="team-stat">
            <div class="team-stat-label">Available</div>
            <div class="team-stat-val" style="color:var(--accent2);">${App.fmtFaab(available)}</div>
          </div>
          <div class="team-stat">
            <div class="team-stat-label">Active Bids</div>
            <div class="team-stat-val" style="color:${bidCount > 0 ? 'var(--accent2)' : 'var(--text3)'};">${bidCount}</div>
          </div>
          <div class="team-stat">
            <div class="team-stat-label">Winning</div>
            <div class="team-stat-val" style="color:${winningCount > 0 ? 'var(--green)' : 'var(--text3)'};">${winningCount}</div>
          </div>
          ${spotsHtml}
        </div>

        ${leadingOn.length > 0 ? `
          <div style="margin-top:8px;font-size:11px;color:var(--text3);">
            Winning: ${leadingOn.map(a => {
              const p     = state.players[a.playerId] || {};
              const price = Auction.computeLeadingBid(a).displayBid;
              return `<span style="color:var(--green);font-weight:500;">${p.last_name || '?'} ${App.fmtFaab(price)}</span>`;
            }).join(', ')}
          </div>` : ''}

        <div class="team-faab-bar-bg" style="margin-top:10px;">
          <div class="team-faab-bar-fill" style="width:${pct}%"></div>
        </div>
      </div>`;
    }).join('');
  }

  // ── History tab ───────────────────────────────────────────
  function renderHistory(auctions) {
    const el = document.getElementById('history-list');
    if (!el) return;
    const { state } = App;

    // Filters
    const teamFilter = document.getElementById('hist-team-filter')?.value || 'all';
    const posFilter  = document.getElementById('hist-pos-filter')?.value || 'all';
    const statusFilter = document.getElementById('hist-status-filter')?.value || 'all';
    const searchVal  = (document.getElementById('hist-search')?.value || '').toLowerCase();

    let done = [...auctions]
      .filter(a => a.processed || a.cancelled || a.expiresAt <= Date.now())
      .sort((a, b) => b.expiresAt - a.expiresAt);

    // Apply filters
    if (teamFilter !== 'all') {
      done = done.filter(a => {
        const leading = Auction.computeLeadingBid(a);
        return String(a.nominatedBy) === teamFilter || String(leading.rosterId) === teamFilter;
      });
    }
    if (posFilter !== 'all') {
      done = done.filter(a => {
        const p = state.players[a.playerId] || {};
        return (p.fantasy_positions || []).includes(posFilter) || p.position === posFilter;
      });
    }
    if (statusFilter === 'claimed')   done = done.filter(a => a.processed);
    if (statusFilter === 'cancelled') done = done.filter(a => a.cancelled);
    if (statusFilter === 'expired')   done = done.filter(a => !a.processed && !a.cancelled && a.expiresAt <= Date.now());
    if (searchVal) {
      done = done.filter(a => {
        const p = state.players[a.playerId] || {};
        return playerName(p).toLowerCase().includes(searchVal);
      });
    }

    if (!done.length) {
      el.innerHTML = emptyState('📋', 'No History', 'No auctions match those filters.');
      return;
    }

    el.innerHTML = done.map(a => {
      const p       = state.players[a.playerId] || {};
      const pos     = playerPos(p);
      const leading = Auction.computeLeadingBid(a);
      const bids    = Array.isArray(a.bids) ? a.bids : Object.values(a.bids || {});
      const bidCount = [...new Set(bids.map(b => b.rosterId))].length;

      let statusHtml = '';
      if (a.cancelled) {
        statusHtml = `<span class="status-pill status-expired">Cancelled</span>`;
      } else if (a.processed) {
        statusHtml = `<span class="status-pill status-won">Claimed ✓</span>
          <span style="font-size:13px;color:var(--green);font-family:var(--font-mono);margin-left:8px;">${App.fmtFaab(leading.displayBid)}</span>
          <span style="font-size:12px;color:var(--text3);margin-left:6px;">→ ${leading.rosterId ? getTeamName(leading.rosterId, state) : '—'}</span>`;
      } else {
        statusHtml = `<span class="status-pill status-expired">Expired</span>
          <span style="font-size:13px;color:var(--green);font-family:var(--font-mono);margin-left:8px;">${App.fmtFaab(leading.displayBid)}</span>
          <span style="font-size:12px;color:var(--text3);margin-left:6px;">→ ${leading.rosterId ? getTeamName(leading.rosterId, state) : '—'}</span>`;
      }

      return `<div class="history-row">
        <div style="display:flex;align-items:center;gap:10px;flex:1;">
          ${playerAvatarHTML(a.playerId, 36)}
          <div>
            <div style="font-weight:500;font-size:14px;">${playerName(p)}</div>
            <div style="display:flex;gap:6px;align-items:center;margin-top:2px;flex-wrap:wrap;">
              <span class="pos-badge pos-${pos}">${pos}</span>
              <span style="font-size:11px;color:var(--text3);">${playerTeam(p)}</span>
              <span style="font-size:11px;color:var(--text3);">${bidCount} bidder${bidCount !== 1 ? 's' : ''}</span>
              <span style="font-size:11px;color:var(--text3);">nom: <strong style="color:var(--text2);">${getTeamName(a.nominatedBy, state)}</strong></span>
            </div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">${statusHtml}</div>
      </div>`;
    }).join('');
  }

  // ── Activity Feed ─────────────────────────────────────────
  function renderActivityFeed(feed) {
    const el = document.getElementById('activity-feed-list');
    if (!el) return;
    const { state } = App;

    if (!feed || !feed.length) {
      el.innerHTML = emptyState('📡', 'No Activity Yet', 'Nominations, bids, and claims will appear here.');
      return;
    }

    const icons  = { nomination: '🏷', bid: '💰', claim: '✅', cancel: '❌', pass: '👎', autoclose: '🔒' };
    const colors = { nomination: 'var(--accent2)', bid: 'var(--yellow)', claim: 'var(--green)', cancel: 'var(--red)', pass: 'var(--text3)', autoclose: 'var(--text2)' };

    el.innerHTML = feed.slice(0, 50).map(item => {
      const icon  = icons[item.type]  || '📋';
      const color = colors[item.type] || 'var(--text2)';
      let desc = '';
      if (item.type === 'nomination')
        desc = `<strong style="color:var(--text);">${item.teamName}</strong> nominated <strong style="color:var(--accent2);">${item.playerName}</strong> — opening bid ${App.fmtFaab(item.amount)}`;
      else if (item.type === 'bid')
        desc = `<strong style="color:var(--text);">${item.teamName}</strong> placed a bid on <strong style="color:var(--accent2);">${item.playerName}</strong>`;
      else if (item.type === 'claim')
        desc = `<strong style="color:var(--green);">${item.teamName}</strong> claimed <strong style="color:var(--accent2);">${item.playerName}</strong> for <strong style="color:var(--green);">${App.fmtFaab(item.amount)}</strong>`;
      else if (item.type === 'cancel')
        desc = `Auction for <strong style="color:var(--accent2);">${item.playerName}</strong> was cancelled`;
      else if (item.type === 'pass')
        desc = `<strong style="color:var(--text);">${item.teamName}</strong> passed on <strong style="color:var(--accent2);">${item.playerName}</strong>`;
      else if (item.type === 'autoclose')
        desc = `Auction for <strong style="color:var(--accent2);">${item.playerName}</strong> closed early — all teams passed`;

      return `<div class="history-row" style="gap:10px;">
        <div style="font-size:20px;flex-shrink:0;width:28px;text-align:center;">${icon}</div>
        <div style="flex:1;">
          <div style="font-size:13px;">${desc}</div>
          <div style="font-size:11px;color:var(--text3);margin-top:2px;">${timeAgo(item.timestamp)}</div>
        </div>
      </div>`;
    }).join('');
  }

  // ── Commissioner ──────────────────────────────────────────
  function renderCommissioner(faabOverrides) {
    const { state } = App;
    const now = Date.now();

    const allList = document.getElementById('comm-all-auctions');
    if (allList) {
      const sorted = [...state.auctions].sort((a, b) => (b.startTime || 0) - (a.startTime || 0));
      if (!sorted.length) {
        allList.innerHTML = `<div style="color:var(--text3);font-size:13px;padding:8px 0;">No auctions yet.</div>`;
      } else {
        allList.innerHTML = sorted.map(a => {
          const p       = state.players[a.playerId] || {};
          const pos     = playerPos(p);
          const leading = Auction.computeLeadingBid(a);
          const isActive = !a.processed && !a.cancelled && a.expiresAt > now;
          const isExp    = !a.cancelled && !a.processed && a.expiresAt <= now;

          let statusHtml;
          if (a.cancelled) {
            statusHtml = `<span class="status-pill status-expired" style="font-size:10px;">Cancelled</span>`;
          } else if (a.processed) {
            statusHtml = `<span class="status-pill status-won" style="font-size:10px;">Claimed</span>
              <span style="font-size:12px;color:var(--green);font-family:var(--font-mono);">${App.fmtFaab(leading.displayBid)}</span>
              <span style="font-size:11px;color:var(--text3);">→ ${leading.rosterId ? getTeamName(leading.rosterId, state) : '—'}</span>`;
          } else if (isExp) {
            statusHtml = `<span class="status-pill status-expired" style="font-size:10px;">Needs Claim</span>
              <span style="font-size:12px;color:var(--green);font-family:var(--font-mono);">${App.fmtFaab(leading.displayBid)}</span>
              <span style="font-size:11px;color:var(--text3);">→ ${leading.rosterId ? getTeamName(leading.rosterId, state) : '—'}</span>`;
          } else {
            const left = a.expiresAt - now;
            statusHtml = `<span class="status-pill status-winning" style="font-size:10px;">Live</span>
              <span style="font-size:12px;color:var(--green);font-family:var(--font-mono);">${App.fmtFaab(leading.displayBid)}</span>
              <span style="font-size:11px;color:var(--text3);">${formatTime(left)} left</span>`;
          }

          const cancelBtn = isActive
            ? `<button class="btn btn-sm" style="background:var(--red-dim);color:var(--red);border:1px solid rgba(255,77,106,0.25);font-size:11px;padding:4px 8px;"
                 onclick="App.cancelAuction('${a.id}')">Cancel</button>` : '';

          const claimBtn = isExp
            ? `<button class="btn btn-green btn-sm" style="font-size:11px;padding:4px 8px;white-space:nowrap;"
                 onclick="App.pushToClaim('${a.id}')">✅ Claim</button>` : '';

          const deleteBtn = `<button class="btn btn-sm" style="background:transparent;color:var(--red);border:1px solid rgba(255,77,106,0.25);font-size:11px;padding:4px 8px;"
               onclick="App.deleteAuction('${a.id}')" title="Delete">🗑</button>`;

          return `<div class="comm-auction-row">
            <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:140px;">
              ${playerAvatarHTML(a.playerId, 30)}
              <div>
                <div style="font-weight:500;font-size:13px;">${playerName(p)}
                  <span class="pos-badge pos-${pos}" style="font-size:9px;vertical-align:middle;margin-left:4px;">${pos}</span>
                </div>
                <div style="font-size:11px;color:var(--text3);margin-top:1px;">nom: ${getTeamName(a.nominatedBy, state)}</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;flex:1;">${statusHtml}</div>
            <div style="display:flex;gap:4px;flex-shrink:0;">${claimBtn}${cancelBtn}${deleteBtn}</div>
          </div>`;
        }).join('');
      }
    }

    const sel  = document.getElementById('comm-team-select');
    const bulk = document.getElementById('comm-faab-bulk');

    if (sel) {
      sel.innerHTML = state.teams
        .map(t => `<option value="${t.roster_id}">${t.display_name || t.username}</option>`)
        .join('');
    }

    const rosterBulk = document.getElementById('comm-roster-bulk');
    if (rosterBulk) {
      rosterBulk.innerHTML = state.teams.map(t => {
        const ROSTER_CAP   = 25;
        const taxiSet      = new Set(t.taxi    || []);
        const reserveSet   = new Set(t.reserve || []);
        const activeCount  = t.players != null
          ? (t.players || []).filter(id => !taxiSet.has(id) && !reserveSet.has(id)).length
          : null;
        const taxiCount    = (t.taxi    || []).length;
        const irCount      = (t.reserve || []).length;
        const openSpots    = activeCount != null ? Math.max(0, ROSTER_CAP - activeCount) : '—';
        const spotsColor   = openSpots === 0 ? 'var(--red)' : openSpots <= 2 ? 'var(--yellow)' : 'var(--green)';
        return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);flex-wrap:wrap;">
          <div style="flex:1;font-size:13px;font-weight:500;min-width:120px;">${t.display_name || t.username}</div>
          <div style="font-size:11px;color:var(--text3);">${activeCount ?? '—'} active · ${taxiCount} taxi · ${irCount} IR</div>
          <div style="font-size:12px;font-weight:600;min-width:64px;text-align:right;color:${spotsColor};">${openSpots} open</div>
        </div>`;
      }).join('') + '<div style="font-size:11px;color:var(--text3);margin-top:8px;">Active roster only — taxi and IR excluded · Live from Sleeper</div>';
    }

    if (bulk) {
      bulk.innerHTML = state.teams.map(t => {
        const current = faabOverrides?.[t.roster_id] !== undefined
          ? faabOverrides[t.roster_id]
          : Math.max(0, t.faab_budget - (t.faab_used || 0));
        return `<div class="faab-bulk-row" data-roster-id="${t.roster_id}" style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--border);">
          <div style="flex:1;font-size:13px;font-weight:500;">${t.display_name || t.username}</div>
          <div style="position:relative;width:140px;">
            <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text3);font-family:var(--font-mono);">$</span>
            <input type="number" min="0" value="${current}"
              style="padding:7px 10px 7px 22px;font-family:var(--font-mono);font-size:14px;width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);outline:none;" />
          </div>
        </div>`;
      }).join('');
    }

    // Populate history filters with teams
    const histTeam = document.getElementById('hist-team-filter');
    if (histTeam && histTeam.options.length <= 1) {
      histTeam.innerHTML = `<option value="all">All Teams</option>` +
        state.teams.map(t => `<option value="${t.roster_id}">${t.display_name || t.username}</option>`).join('');
    }
  }

  // ── Modals ───────────────────────────────────────────────
  function openModal(id)  { document.getElementById(id).classList.add('open'); }
  function closeModal(id) { document.getElementById(id).classList.remove('open'); }

  // ── Toasts ───────────────────────────────────────────────
  function toast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const el        = document.createElement('div');
    el.className    = `toast ${type}`;
    el.textContent  = msg;
    container.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }

  // ── Helpers ──────────────────────────────────────────────
  function emptyState(icon, title, sub) {
    return `<div class="empty-state"><div class="empty-icon">${icon}</div><div class="empty-title">${title}</div><div class="empty-sub">${sub}</div></div>`;
  }

  function getMyTeam(state) {
    const uid = state.user?.user_id;
    if (!uid) return null;
    // Primary owner match
    const primary = state.teams.find(t => t.owner_id === uid);
    if (primary) return primary;
    // Sleeper co-manager match
    const co = state.teams.find(t => (t.co_owners || []).includes(uid));
    if (co) return co;
    // Firebase co-manager override: leagues/{id}/coManagers/{username} = roster_id
    const coRid = window._coManagerRosterId;
    if (coRid) return state.teams.find(t => t.roster_id === coRid) || null;
    return null;
  }

  function getTeamName(rosterId, state) {
    const t = state.teams.find(t => t.roster_id === rosterId);
    return t ? (t.display_name || t.username) : `Team ${rosterId}`;
  }

  function faPagePrev() {
    if (window.faPage > 0) {
      window.faPage--;
      _renderFAPage();
      document.getElementById('fa-tbody')?.closest('table')?.scrollIntoView({behavior:'smooth',block:'start'});
    }
  }
  function faPageNext() {
    window.faPage++;
    _renderFAPage();
    document.getElementById('fa-tbody')?.closest('table')?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function faSort(col) {
    if (window._faSort.col === col) {
      window._faSort.dir = window._faSort.dir === 'asc' ? 'desc' : 'asc';
    } else {
      window._faSort = { col, dir: col === 'pts' ? 'desc' : 'asc' };
    }
    renderFreeAgents(App.state.posFilter || 'ALL');
  }

  function renderWatchlistTab() {
    const { state } = App;
    const wl = state.watchlist || {};
    const ids = Object.keys(wl);
    const grid = document.getElementById('watchlist-grid');
    const count = document.getElementById('wl-count');
    if (count) count.textContent = ids.length;
    if (!grid) return;
    if (!ids.length) {
      grid.innerHTML = emptyState('⭐', 'No Watchlist Players', 'Star players from the Free Agents tab to track them here.');
      return;
    }
    const now = Date.now();
    const activeIds = new Set(state.auctions.filter(a => !a.processed && !a.cancelled && a.expiresAt > now).map(a => a.playerId));
    const myTeam    = getMyTeam(state);
    const myActiveNom = myTeam
      ? state.auctions.find(a => !a.processed && !a.cancelled && a.expiresAt > now && a.nominatedBy === myTeam.roster_id)
      : null;
    grid.innerHTML = ids.map(id => {
      const p         = state.players[id] || {};
      const pos2      = playerPos(p);
      const inAuction = activeIds.has(id);
      const canNom    = !inAuction && !myActiveNom;
      const customPts = App.computeCustomPts(id);
      const ptsLabel  = customPts !== null ? customPts.toFixed(1) : '—';
      return `<div class="auction-card" style="padding:14px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
          ${playerAvatarHTML(id, 40)}
          <div style="flex:1;min-width:0;">
            <div style="font-weight:600;font-size:14px;">${playerName(p)}</div>
            <div style="display:flex;gap:6px;margin-top:3px;flex-wrap:wrap;align-items:center;">
              <span class="pos-badge pos-${pos2}">${pos2}</span>
              <span style="font-size:12px;color:var(--text2);">${playerTeam(p)}</span>
              <span style="font-size:12px;color:var(--text3);">${ptsLabel} pts</span>
            </div>
          </div>
          <button onclick="App.toggleWatch('${id}')" style="background:none;border:none;font-size:18px;cursor:pointer;color:var(--yellow);">⭐</button>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          ${inAuction
            ? `<span style="font-size:11px;color:var(--yellow);padding:5px 0;">In Auction</span>`
            : !myTeam
            ? ''
            : `<button class="btn btn-green btn-sm" ${canNom?'':'disabled'} onclick="App.openNomModal('${id}')">Nominate</button>`
          }
        </div>
      </div>`;
    }).join('');
  }

  return {
    showScreen, setLoading, switchTab, setAvatar,
    playerName, playerPos, playerTeam, playerEmoji, playerAvatarHTML,
    formatTime, timeAgo,
    renderPauseBanner,
    renderAuctions, renderFreeAgents, renderTeams, renderHistory,
    renderActivityFeed, renderCommissioner,
    renderStatBreakdown,
    startTimers, openModal, closeModal, toast,
    getMyTeam, getTeamName,
    faPagePrev, faPageNext,
    faSort, renderWatchlistTab,
  };
})();

// Expose pagination as true globals so onclick="faPagePrev()" always works
// regardless of whether UI module is in scope
window.faPagePrev = UI.faPagePrev;
window.faPageNext = UI.faPageNext;
