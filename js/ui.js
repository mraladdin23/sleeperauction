// ─────────────────────────────────────────────────────────────
//  UI  — rendering helpers, modals, toasts, timers
// ─────────────────────────────────────────────────────────────

const UI = (() => {

  // ── Screens ─────────────────────────────────────────────
  function showScreen(name) {
    const screens = {
      login:   'login-screen',
      loading: 'loading-screen',
      setup:   'setup-screen',
      app:     'app',
    };
    Object.entries(screens).forEach(([key, id]) => {
      document.getElementById(id).classList.toggle('hidden', key !== name);
    });
  }

  function setLoading(msg) {
    document.getElementById('loading-text').textContent = msg;
  }

  // ── Tabs ────────────────────────────────────────────────
  function switchTab(name) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.toggle('active', t.id === 'tab-' + name));
  }

  // ── Avatar ──────────────────────────────────────────────
  function setAvatar(el, user) {
    if (!el) return;
    const initial = (user?.display_name || user?.username || '?')[0].toUpperCase();
    if (user?.avatar) {
      el.innerHTML = `<img src="https://sleepercdn.com/avatars/thumbs/${user.avatar}" onerror="this.parentElement.textContent='${initial}'" />`;
    } else {
      el.textContent = initial;
    }
  }

  // ── Player helpers ───────────────────────────────────────
  function playerName(p) {
    if (!p || !p.first_name) return 'Unknown Player';
    return `${p.first_name} ${p.last_name}`;
  }
  function playerPos(p)  { return (p?.fantasy_positions?.[0]) || p?.position || ''; }
  function playerTeam(p) { return p?.team || 'FA'; }
  function playerEmoji(pos) {
    return { QB:'🏈', RB:'💨', WR:'⚡', TE:'🎯', K:'🦵', DEF:'🛡', DL:'🏋', LB:'🔥', DB:'👁' }[pos] || '🏈';
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

  // ── Auction cards ────────────────────────────────────────
  function renderAuctions(auctions, faabOverrides) {
    const { state } = App;
    const now = Date.now();
    const myTeam   = getMyTeam(state);
    const myRid    = myTeam?.roster_id;

    const active    = auctions.filter(a => !a.processed && a.expiresAt > now);
    const completed = auctions.filter(a => a.processed || a.expiresAt <= now);

    document.getElementById('auction-count').innerHTML =
      `<span class="live-dot"></span>${active.length} live`;
    document.getElementById('completed-count').textContent = completed.length;

    const render = (list, el) => {
      if (!list.length) {
        el.innerHTML = emptyState(
          el.id === 'auctions-grid' ? '🏷' : '✅',
          el.id === 'auctions-grid' ? 'No Active Auctions' : 'No Completed Auctions',
          el.id === 'auctions-grid' ? 'Nominate a player from the Free Agents tab to start an auction.' : 'Completed auctions will appear here.'
        );
        return;
      }
      el.innerHTML = list.map(a => auctionCard(a, now, myRid, state)).join('');
    };

    render(active,    document.getElementById('auctions-grid'));
    render(completed, document.getElementById('completed-grid'));
  }

  function auctionCard(auction, now, myRid, state) {
    const p       = state.players[auction.playerId] || {};
    const pos     = playerPos(p);
    const leading = Auction.computeLeadingBid(auction);
    const myMax   = myRid ? Auction.getMyMaxBid(auction, myRid) : 0;
    const isExp   = auction.expiresAt <= now;
    const isWin   = !isExp && leading.rosterId === myRid;
    const isOut   = !isExp && myRid && myMax > 0 && leading.rosterId !== myRid;

    let cls = 'auction-card';
    if (isWin) cls += ' winning';
    if (isOut) cls += ' outbid';
    if (isExp) cls += ' expired';

    let pill = '';
    if (auction.processed)                        pill = `<span class="status-pill status-won">Processed ✓</span>`;
    else if (isExp && leading.rosterId === myRid) pill = `<span class="status-pill status-won">Won ✓</span>`;
    else if (isExp)                               pill = `<span class="status-pill status-expired">Ended</span>`;
    else if (isWin)                               pill = `<span class="status-pill status-winning">Winning ↑</span>`;
    else if (isOut)                               pill = `<span class="status-pill status-outbid">Outbid !</span>`;
    else                                          pill = `<span class="status-pill status-watching">Watching</span>`;

    const left      = isExp ? 0 : auction.expiresAt - now;
    const timerCls  = isExp ? 'done' : left < 3600000 ? 'urgent' : '';

    const canBid = !isExp && !auction.processed;
    const bidBtn = canBid
      ? `<button class="btn btn-primary btn-sm" style="margin-left:auto;" onclick="App.openBidModal('${auction.id}')">
          ${isWin ? 'Update Bid' : isOut ? 'Bid Again' : 'Bid'}
        </button>` : '';

    return `<div class="${cls}" id="card-${auction.id}">
      <div class="card-top">
        ${playerAvatarHTML(auction.playerId, 44)}
        <div class="player-info">
          <div class="player-name">${playerName(p)}</div>
          <div class="player-meta">
            <span class="pos-badge pos-${pos}">${pos}</span>
            <span>${playerTeam(p)}</span>
          </div>
          <div style="font-size:11px;color:var(--text3);margin-top:3px;">Nominated by ${getTeamName(auction.nominatedBy, state)}</div>
        </div>
      </div>
      <div class="card-mid">
        <div class="bid-info">
          <div class="bid-label">Current Bid</div>
          <div class="bid-amount"><span class="dollar">$</span>${leading.displayBid || 1}</div>
          <div class="bid-leader">Leader: <span>${leading.rosterId ? getTeamName(leading.rosterId, state) : '—'}</span></div>
        </div>
        <div class="timer-block">
          <div class="timer-label">Time Left</div>
          <div class="timer ${timerCls}" id="timer-${auction.id}">${formatTime(left)}</div>
        </div>
      </div>
      <div class="card-bot">${pill}${bidBtn}</div>
    </div>`;
  }

  // ── Timer ticks ──────────────────────────────────────────
  let _timerInterval = null;
  function startTimers(getAuctions) {
    if (_timerInterval) clearInterval(_timerInterval);
    _timerInterval = setInterval(() => {
      const now = Date.now();
      let needRender = false;
      getAuctions().forEach(a => {
        if (a.processed) return;
        const el = document.getElementById(`timer-${a.id}`);
        if (!el) return;
        const left = a.expiresAt - now;
        if (left <= 0) {
          el.textContent = 'Ended';
          el.className   = 'timer done';
          needRender     = true;
        } else {
          el.textContent = formatTime(left);
          el.className   = `timer ${left < 3600000 ? 'urgent' : ''}`;
        }
      });
      if (needRender) App.renderAll();
    }, 1000);
  }

  // ── Free agents ──────────────────────────────────────────
  function renderFreeAgents(posFilter) {
    const { state } = App;
    const query  = (document.getElementById('fa-search')?.value || '').toLowerCase();
    const myTeam = getMyTeam(state);
    const now    = Date.now();
    const activeIds = new Set(
      state.auctions.filter(a => !a.processed && a.expiresAt > now).map(a => a.playerId)
    );
    const myActiveNom = myTeam
      ? state.auctions.find(a => !a.processed && a.expiresAt > now && a.nominatedBy === myTeam.roster_id)
      : null;

    const filtered = state.freeAgents.filter(id => {
      const p = state.players[id];
      if (!p?.first_name) return false;
      if (posFilter !== 'ALL' && !(p.fantasy_positions || []).includes(posFilter)) return false;
      if (query && !playerName(p).toLowerCase().includes(query)) return false;
      return true;
    }).slice(0, 100);

    document.getElementById('fa-count').textContent = `${filtered.length} players`;

    const tbody = document.getElementById('fa-tbody');
    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="4">${emptyState('🔍','No players found','Try a different search or position filter.')}</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(id => {
      const p    = state.players[id] || {};
      const pos2 = playerPos(p);
      const inAuction = activeIds.has(id);
      const canNom    = !inAuction && !myActiveNom;
      const statsMap  = state.statsMap || {};
      const pts       = statsMap[id]?.pts_half_ppr ?? statsMap[id]?.pts_ppr ?? null;
      const ptsLabel  = pts !== null ? pts.toFixed(1) : '—';

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
            </div>
          </div>
        </td>
        <td style="color:var(--text2);">${playerTeam(p)}</td>
        <td style="color:var(--text3);font-family:var(--font-mono);">${p.bye_week || '—'}</td>
        <td style="color:var(--text2);font-family:var(--font-mono);font-size:13px;" title="Last season half-PPR points">${ptsLabel}</td>
        <td style="text-align:right;">
          ${inAuction
            ? `<span style="font-size:11px;color:var(--yellow);">In Auction</span>`
            : !myTeam
            ? `<span style="font-size:11px;color:var(--text3);">Not in league</span>`
            : `<button class="btn btn-green btn-sm" ${canNom ? '' : 'disabled'}
                 onclick="App.openNomModal('${id}')"
                 title="${!canNom ? 'You already have an active nomination' : ''}">
                 Nominate
               </button>`
          }
        </td>
      </tr>`;
    }).join('');
  }

  // ── Teams ────────────────────────────────────────────────
  function renderTeams(faabOverrides) {
    const { state } = App;
    const maxBudget = Math.max(...state.teams.map(t => t.faab_budget), 1);
    const grid = document.getElementById('teams-grid');

    grid.innerHTML = state.teams.map(t => {
      const override   = faabOverrides?.[t.roster_id];
      const avail      = override !== undefined ? override : Math.max(0, t.faab_budget - (t.faab_used || 0));
      const committed  = Auction.getCommittedFaab(state.auctions, t.roster_id);
      const pct        = Math.round((avail / maxBudget) * 100);
      const isMe       = t.owner_id === state.user.user_id;

      return `<div class="team-card" style="${isMe ? 'border-color:rgba(124,92,252,0.4);' : ''}">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
          <div class="avatar" style="width:28px;height:28px;font-size:11px;">
            ${t.avatar
              ? `<img src="https://sleepercdn.com/avatars/thumbs/${t.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"
                      onerror="this.parentElement.textContent='${(t.display_name||'?')[0].toUpperCase()}'" />`
              : (t.display_name || '?')[0].toUpperCase()}
          </div>
          <div style="font-weight:600;font-size:14px;">${t.display_name || t.username}
            ${isMe ? '<span style="font-size:10px;color:var(--accent2);margin-left:4px;">(You)</span>' : ''}
          </div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;">
          <span style="font-size:12px;color:var(--text3);">FAAB Available</span>
          <span style="font-family:var(--font-mono);font-size:15px;font-weight:600;color:var(--green);">$${avail}</span>
        </div>
        ${committed > 0 ? `<div style="font-size:11px;color:var(--yellow);margin-top:3px;">$${committed} committed in bids</div>` : ''}
        <div class="team-faab-bar-bg"><div class="team-faab-bar-fill" style="width:${pct}%"></div></div>
      </div>`;
    }).join('');
  }

  // ── Commissioner ─────────────────────────────────────────
  function renderCommissioner(faabOverrides) {
    const { state } = App;
    const now     = Date.now();
    const pending = state.auctions.filter(a => !a.processed && a.expiresAt <= now);
    const list    = document.getElementById('comm-pending-list');
    const sel     = document.getElementById('comm-team-select');

    list.innerHTML = pending.length
      ? pending.map(a => {
          const p       = state.players[a.playerId] || {};
          const leading = Auction.computeLeadingBid(a);
          return `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);gap:10px;flex-wrap:wrap;">
            <div style="display:flex;align-items:center;gap:10px;">
              ${playerAvatarHTML(a.playerId, 32)}
              <div>
                <div style="font-weight:500;font-size:14px;">${playerName(p)}</div>
                <div style="font-size:12px;color:var(--text3);">
                  Won by <strong style="color:var(--accent2);">${leading.rosterId ? getTeamName(leading.rosterId, state) : '—'}</strong>
                  for <strong style="color:var(--green);">$${leading.displayBid}</strong>
                </div>
              </div>
            </div>
            <button class="btn btn-green btn-sm" onclick="App.markProcessed('${a.id}')">Mark Processed ✓</button>
          </div>`;
        }).join('')
      : `<div style="color:var(--text3);font-size:13px;">No pending auctions.</div>`;

    sel.innerHTML = state.teams
      .map(t => `<option value="${t.roster_id}">${t.display_name || t.username}</option>`)
      .join('');
  }

  // ── Modals ───────────────────────────────────────────────
  function openModal(id)  { document.getElementById(id).classList.add('open'); }
  function closeModal(id) { document.getElementById(id).classList.remove('open'); }

  // ── Toasts ───────────────────────────────────────────────
  function toast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }

  // ── Helpers ──────────────────────────────────────────────
  function emptyState(icon, title, sub) {
    return `<div class="empty-state"><div class="empty-icon">${icon}</div><div class="empty-title">${title}</div><div class="empty-sub">${sub}</div></div>`;
  }

  function getMyTeam(state) {
    return state.teams.find(t => t.owner_id === state.user?.user_id) || null;
  }

  function getTeamName(rosterId, state) {
    const t = state.teams.find(t => t.roster_id === rosterId);
    return t ? (t.display_name || t.username) : `Team ${rosterId}`;
  }

  return {
    showScreen, setLoading, switchTab, setAvatar,
    playerName, playerPos, playerTeam, playerEmoji, playerAvatarHTML,
    formatTime, timeAgo,
    renderAuctions, renderFreeAgents, renderTeams, renderCommissioner,
    startTimers, openModal, closeModal, toast,
    getMyTeam, getTeamName,
  };
})();
