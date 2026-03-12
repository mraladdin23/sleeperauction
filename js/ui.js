// ─────────────────────────────────────────────────────────────
//  UI  — rendering helpers, modals, toasts, timers
// ─────────────────────────────────────────────────────────────

const UI = (() => {

  // ── Screens ─────────────────────────────────────────────
  function showScreen(name) {
    const screens = { login:'login-screen', loading:'loading-screen', setup:'setup-screen', app:'app' };
    Object.entries(screens).forEach(([key, id]) => {
      document.getElementById(id).classList.toggle('hidden', key !== name);
    });
  }

  function setLoading(msg) { document.getElementById('loading-text').textContent = msg; }

  // ── Tabs ─────────────────────────────────────────────────
  function switchTab(name) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.toggle('active', t.id === 'tab-' + name));
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
      document.querySelector('.nav-tabs').insertAdjacentElement('afterend', banner);
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

  // ── Auction cards ─────────────────────────────────────────
  function renderAuctions(auctions, faabOverrides) {
    const { state } = App;
    const now     = Date.now();
    const myTeam  = getMyTeam(state);
    const myRid   = myTeam?.roster_id;
    const isComm  = state.isCommissioner;

    const active    = auctions.filter(a => !a.processed && !a.cancelled && a.expiresAt > now);
    const completed = auctions.filter(a => a.processed || a.cancelled || a.expiresAt <= now);

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

    let cls = 'auction-card';
    if (isWin) cls += ' winning';
    if (isOut) cls += ' outbid';
    if (isExp || isCan) cls += ' expired';

    let pill = '';
    if (isCan)                                        pill = `<span class="status-pill status-expired">Cancelled</span>`;
    else if (auction.processed)                       pill = `<span class="status-pill status-won">Processed ✓</span>`;
    else if (isExp && leading.rosterId === myRid)     pill = `<span class="status-pill status-won">Won ✓</span>`;
    else if (isExp)                                   pill = `<span class="status-pill status-expired">Ended</span>`;
    else if (paused)                                  pill = `<span class="status-pill status-paused">⏸ Paused</span>`;
    else if (isWin)                                   pill = `<span class="status-pill status-winning">Winning ↑</span>`;
    else if (isOut)                                   pill = `<span class="status-pill status-outbid">Outbid !</span>`;
    else                                              pill = `<span class="status-pill status-watching">Watching</span>`;

    const left     = isExp ? 0 : auction.expiresAt - now;
    const timerCls = isExp ? 'done' : paused ? 'paused' : left < 3600000 ? 'urgent' : '';
    const timerTxt = paused ? '⏸ Paused' : formatTime(left);

    const canBid = !isExp && !isCan && !auction.processed;
    const bidBtn = canBid
      ? `<button class="btn btn-primary btn-sm" style="margin-left:auto;" onclick="App.openBidModal('${auction.id}')">
           ${isWin ? 'Update Bid' : isOut ? 'Bid Again' : 'Bid'}
         </button>` : '';

    const cancelBtn = isComm && canBid
      ? `<button class="btn btn-sm" style="background:var(--red-dim);color:var(--red);border:1px solid rgba(255,77,106,0.25);margin-left:6px;"
           onclick="App.cancelAuction('${auction.id}')">Cancel</button>` : '';

    // Delete button: commissioner can delete any auction (active or completed)
    const deleteBtn = isComm
      ? `<button class="btn btn-sm" style="background:transparent;color:var(--text3);border:1px solid var(--border);margin-left:6px;font-size:11px;"
           onclick="App.deleteAuction('${auction.id}')" title="Permanently delete auction">🗑</button>` : '';

    const customPts = App.computeCustomPts(auction.playerId);
    const ptsTag    = customPts !== null
      ? `<span style="font-size:11px;color:var(--text3);">${customPts.toFixed(1)} pts</span>` : '';

    return `<div class="${cls}" id="card-${auction.id}">
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
          <div class="bid-amount"><span class="dollar">$</span>${leading.displayBid || 1}</div>
          <div class="bid-leader">Leader: <span>${leading.rosterId ? getTeamName(leading.rosterId, state) : '—'}</span></div>
        </div>
        <div class="timer-block">
          <div class="timer-label">Time Left</div>
          <div class="timer ${timerCls}" id="timer-${auction.id}">${timerTxt}</div>
        </div>
      </div>
      <div class="card-bot">${pill}${bidBtn}${cancelBtn}${deleteBtn}</div>
    </div>`;
  }

  // ── Timer ticks ───────────────────────────────────────────
  let _timerInterval = null;
  function startTimers(getAuctions) {
    if (_timerInterval) clearInterval(_timerInterval);
    _timerInterval = setInterval(() => {
      const now     = Date.now();
      const paused  = Auction.isNightPause(now);
      let needRender = false;

      // Update/remove pause banner every tick
      renderPauseBanner();

      getAuctions().forEach(a => {
        if (a.processed || a.cancelled) return;
        const el = document.getElementById(`timer-${a.id}`);
        if (!el) return;
        const left = a.expiresAt - now;
        if (left <= 0) {
          el.textContent = 'Ended';
          el.className   = 'timer done';
          needRender     = true;
        } else if (paused) {
          el.textContent = '⏸ Paused';
          el.className   = 'timer paused';
        } else {
          el.textContent = formatTime(left);
          el.className   = `timer ${left < 3600000 ? 'urgent' : ''}`;
        }
      });
      if (needRender) App.renderAll();
    }, 1000);
  }

  // ── Stat breakdown in bid modal ───────────────────────────
  // Renders key scoring-relevant stats for a player
  function renderStatBreakdown(playerId, rawStats, scoringSettings) {
    const el = document.getElementById('bid-stat-breakdown');
    if (!el) return;
    if (!rawStats || !scoringSettings) { el.innerHTML = ''; return; }

    // Define which stats to show (label, stat key, multiplier key)
    const statDefs = [
      ['Pass Yards',  'pass_yd',    'pass_yd'],
      ['Pass TD',     'pass_td',    'pass_td'],
      ['Interception','pass_int',   'pass_int'],
      ['Rush Yards',  'rush_yd',    'rush_yd'],
      ['Rush TD',     'rush_td',    'rush_td'],
      ['Receptions',  'rec',        'rec'],
      ['Rec Yards',   'rec_yd',     'rec_yd'],
      ['Rec TD',      'rec_td',     'rec_td'],
      ['2PT Conv',    'bonus_rec_te','bonus_rec_te'],
      ['Fum Lost',    'fum_lost',   'fum_lost'],
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
      <div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;margin-top:14px;">
        2025 Season Stats
      </div>
      <div class="stat-breakdown">${rows.join('')}</div>`;
  }

  // ── Free agents ───────────────────────────────────────────
  function renderFreeAgents(posFilter) {
    const { state } = App;
    const query     = (document.getElementById('fa-search')?.value || '').toLowerCase();
    const myTeam    = getMyTeam(state);
    const now       = Date.now();
    const activeIds = new Set(
      state.auctions.filter(a => !a.processed && !a.cancelled && a.expiresAt > now).map(a => a.playerId)
    );
    const myActiveNom = myTeam
      ? state.auctions.find(a => !a.processed && !a.cancelled && a.expiresAt > now && a.nominatedBy === myTeam.roster_id)
      : null;

    const filtered = state.freeAgents.filter(id => {
      const p = state.players[id];
      if (!p?.first_name) return false;
      if (posFilter !== 'ALL' && !(p.fantasy_positions || []).includes(posFilter)) return false;
      if (query && !playerName(p).toLowerCase().includes(query)) return false;
      return true;
    }).slice(0, 150);

    document.getElementById('fa-count').textContent = `${filtered.length} players`;

    const tbody = document.getElementById('fa-tbody');
    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="5">${emptyState('🔍','No players found','Try a different search or position filter.')}</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(id => {
      const p         = state.players[id] || {};
      const pos2      = playerPos(p);
      const inAuction = activeIds.has(id);
      const canNom    = !inAuction && !myActiveNom;
      const customPts = App.computeCustomPts(id);
      const ptsLabel  = customPts !== null ? customPts.toFixed(1) : '—';

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
        <td style="color:var(--text2);font-family:var(--font-mono);font-size:13px;" title="2025 fantasy points (your league scoring)">${ptsLabel}</td>
        <td style="text-align:right;">
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
  }

  // ── Teams ────────────────────────────────────────────────
  function renderTeams(faabOverrides) {
    const { state } = App;
    const now        = Date.now();
    const maxBudget  = Math.max(...state.teams.map(t => t.faab_budget), 1);
    const rosterSize = state.rosterPositions?.length || 0;
    const grid       = document.getElementById('teams-grid');

    // Build per-team auction info
    const activeAuctions = state.auctions.filter(a => !a.processed && !a.cancelled && a.expiresAt > now);

    grid.innerHTML = state.teams
      .map(t => {
        const override   = faabOverrides?.[t.roster_id];
        const baseFaab   = override !== undefined ? override : Math.max(0, t.faab_budget - (t.faab_used || 0));
        const committed  = Auction.getCommittedFaab(state.auctions, t.roster_id);
        const available  = Math.max(0, baseFaab - committed);
        const pct        = Math.round((baseFaab / maxBudget) * 100);
        const isMe       = String(t.owner_id) === String(state.user.user_id);

        // Active bids this team has placed
        const myActiveBids = activeAuctions.filter(a => Auction.getMyMaxBid(a, t.roster_id) > 0);
        const bidCount     = myActiveBids.length;

        // Roster stats — taxi squad players don't count toward active roster limit
        const taxiCount   = (t.taxi || []).length;
        const rosterCount = Math.max(0, (t.players || []).length - taxiCount);
        // rosterPositions excludes taxi slots — count non-taxi positions only
        const activeSlotsTotal = state.rosterPositions.filter(p => p !== 'TXP').length;
        const effectiveSize    = activeSlotsTotal || rosterSize;
        const openSpots        = effectiveSize > 0 ? Math.max(0, effectiveSize - rosterCount) : '?';

        // Players they're leading on (winning auctions)
        const leadingOn = myActiveBids.filter(a => Auction.computeLeadingBid(a).rosterId === t.roster_id);

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
              <div class="team-stat-label">FAAB Balance</div>
              <div class="team-stat-val" style="color:var(--green);">$${baseFaab}</div>
            </div>
            <div class="team-stat">
              <div class="team-stat-label">Committed</div>
              <div class="team-stat-val" style="color:${committed > 0 ? 'var(--yellow)' : 'var(--text3)'};">$${committed}</div>
            </div>
            <div class="team-stat">
              <div class="team-stat-label">Available</div>
              <div class="team-stat-val" style="color:var(--accent2);">$${available}</div>
            </div>
            <div class="team-stat">
              <div class="team-stat-label">Roster</div>
              <div class="team-stat-val">${rosterCount}<span style="color:var(--text3);font-size:11px;">/${effectiveSize || '?'}</span>${taxiCount > 0 ? `<span style="color:var(--text3);font-size:10px;display:block;">+${taxiCount} taxi</span>` : ''}</div>
            </div>
            <div class="team-stat">
              <div class="team-stat-label">Open Spots</div>
              <div class="team-stat-val" style="color:${openSpots === 0 ? 'var(--red)' : 'var(--text2)'};">${openSpots}</div>
            </div>
            <div class="team-stat">
              <div class="team-stat-label">Active Bids</div>
              <div class="team-stat-val" style="color:${bidCount > 0 ? 'var(--accent2)' : 'var(--text3)'};">${bidCount}</div>
            </div>
          </div>

          ${leadingOn.length > 0 ? `
            <div style="margin-top:8px;font-size:11px;color:var(--text3);">
              Winning: ${leadingOn.map(a => {
                const p = state.players[a.playerId] || {};
                const price = Auction.computeLeadingBid(a).displayBid;
                return `<span style="color:var(--green);font-weight:500;">${p.first_name ? p.last_name : '?'} $${price}</span>`;
              }).join(', ')}
            </div>` : ''}

          <div class="team-faab-bar-bg" style="margin-top:10px;">
            <div class="team-faab-bar-fill" style="width:${pct}%"></div>
          </div>
        </div>`;
      }).join('');
  }

  // ── Auction history tab ───────────────────────────────────
  function renderHistory(auctions) {
    const el = document.getElementById('history-list');
    if (!el) return;
    const { state } = App;
    const done = [...auctions]
      .filter(a => a.processed || a.cancelled || a.expiresAt <= Date.now())
      .sort((a, b) => b.expiresAt - a.expiresAt);

    if (!done.length) {
      el.innerHTML = emptyState('📋', 'No History Yet', 'Completed auctions will appear here.');
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
        statusHtml = `<span class="status-pill status-won">Processed ✓</span>
          <span style="font-size:13px;color:var(--green);font-family:var(--font-mono);margin-left:8px;">$${leading.displayBid}</span>
          <span style="font-size:12px;color:var(--text3);margin-left:6px;">→ ${leading.rosterId ? getTeamName(leading.rosterId, state) : '—'}</span>`;
      } else {
        statusHtml = `<span class="status-pill status-expired">Expired</span>
          <span style="font-size:13px;color:var(--green);font-family:var(--font-mono);margin-left:8px;">$${leading.displayBid}</span>
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

  // ── Commissioner ──────────────────────────────────────────
  function renderCommissioner(faabOverrides) {
    const { state } = App;
    const now     = Date.now();
    const pending = state.auctions.filter(a => !a.processed && !a.cancelled && a.expiresAt <= now);
    const list    = document.getElementById('comm-pending-list');
    const sel     = document.getElementById('comm-team-select');
    const bulk    = document.getElementById('comm-faab-bulk');

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

    // Bulk FAAB setter
    if (bulk) {
      bulk.innerHTML = state.teams.map(t => {
        const current = faabOverrides?.[t.roster_id] !== undefined
          ? faabOverrides[t.roster_id]
          : Math.max(0, t.faab_budget - (t.faab_used || 0));
        return `<div class="faab-bulk-row" data-roster-id="${t.roster_id}" style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--border);">
          <div style="flex:1;font-size:13px;font-weight:500;">${t.display_name || t.username}</div>
          <div style="position:relative;width:110px;">
            <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text3);font-family:var(--font-mono);">$</span>
            <input type="number" min="0" value="${current}"
              style="padding:7px 10px 7px 22px;font-family:var(--font-mono);font-size:15px;width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);outline:none;" />
          </div>
        </div>`;
      }).join('');
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
    renderPauseBanner,
    renderAuctions, renderFreeAgents, renderTeams, renderHistory, renderCommissioner,
    renderStatBreakdown,
    startTimers, openModal, closeModal, toast,
    getMyTeam, getTeamName,
  };
})();
