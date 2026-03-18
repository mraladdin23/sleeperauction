// standings.js — Standings, Matchups, Playoffs for SleeperBid SPA
// Works when dynamically loaded into #view-standings

var STANDINGS_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// ── State ──────────────────────────────────────────────────────
var standingsData = null;   // { teams, rosters, users, league }
var matchupsCache = {};     // week -> matchup array
var currentWeek   = 1;
var standingsTab      = 'standings'; // 'standings' | 'matchups' | 'playoffs'
window.viewingLeagueId   = window.viewingLeagueId   || null;
window.historicalLeagues = window.historicalLeagues || [];

function standingsLeagueId() { return localStorage.getItem('sb_leagueId') || ''; }

// ── Boot ───────────────────────────────────────────────────────
function standingsInit() {
  if (!standingsLeagueId()) return;
  renderStandingsShell();
  loadStandingsData();
}

// ── Shell HTML ─────────────────────────────────────────────────
function renderStandingsShell() {
  const container = document.getElementById('view-standings');
  if (!container) return;
  container.innerHTML = `
    <div class="nav-tabs" id="standings-nav-tabs">
      <div class="nav-tab active" onclick="switchStandingsTab('standings')" data-tab="standings">📊 Standings</div>
      <div class="nav-tab"        onclick="switchStandingsTab('matchups')"  data-tab="matchups">🏈 Matchups</div>
      <div class="nav-tab"        onclick="switchStandingsTab('playoffs')"  data-tab="playoffs">🏆 Playoffs</div>
    </div>
    <div class="nav-dd-wrap">
      <select class="nav-dd" id="standings-nav-dd" onchange="switchStandingsTab(this.value)">
        <option value="standings">📊 Standings</option>
        <option value="matchups">🏈 Matchups</option>
        <option value="playoffs">🏆 Playoffs</option>
      </select>
    </div>
    <div class="main">
      <div id="st-season-bar" style="display:none;margin-bottom:14px;"></div>
      <div id="st-tab-standings"></div>
      <div id="st-tab-matchups"  style="display:none;"></div>
      <div id="st-tab-playoffs"  style="display:none;"></div>
    </div>`;
}

function switchStandingsTab(name) {
  standingsTab = name;
  const scope = document.getElementById('view-standings');
  if (!scope) return;
  scope.querySelectorAll('#standings-nav-tabs .nav-tab').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === name));
  // Sync dropdown
  const dd = document.getElementById('standings-nav-dd');
  if (dd) dd.value = name;
  ['standings','matchups','playoffs'].forEach(t => {
    const el = document.getElementById('st-tab-' + t);
    if (el) el.style.display = t === name ? '' : 'none';
  });
  if (name === 'standings') renderStandingsTab();
  if (name === 'matchups')  renderMatchupsTab();
  if (name === 'playoffs')  renderPlayoffsTab();
}

// ── Data loading ───────────────────────────────────────────────
async function loadStandingsData(forceRefresh) {
  const lid = standingsLeagueId();
  window.viewingLeagueId = null;  // reset to current season
  showStandingsLoading('Loading standings…');

  // Try Firebase cache
  if (!forceRefresh) {
    try {
      const snap = await Promise.race([
        db.ref(`leagues/${lid}/standingsCache`).once('value'),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000)),
      ]);
      const cached = snap.val();
      if (cached && (Date.now() - (cached.cachedAt || 0)) < STANDINGS_CACHE_TTL) {
        standingsData = cached.data;
        currentWeek   = cached.currentWeek || 1;
        renderStandingsTab();
        // Also load historical seasons if not already loaded
        if (!window.historicalLeagues.length && cached.data?.league) {
          loadHistoricalSeasons(cached.data.league);
        }
        return;
      }
    } catch(e) { /* fall through to fresh fetch */ }
  }

  // Fetch fresh
  try {
    const [league, rosters, users] = await Promise.all([
      Sleeper.fetchLeague(lid),
      Sleeper.fetchRosters(lid),
      Sleeper.fetchLeagueUsers(lid),
    ]);

    const week = league.settings?.leg || league.settings?.week || 1;
    currentWeek = week;

    // Build user map
    const userMap = {};
    (users || []).forEach(u => { userMap[u.user_id] = u; });

    // Build team records from roster settings
    const teams = (rosters || []).map(r => {
      const u = userMap[r.owner_id] || {};
      const s = r.settings || {};
      return {
        roster_id:    r.roster_id,
        owner_id:     r.owner_id,
        display_name: u.display_name || u.username || `Team ${r.roster_id}`,
        avatar:       u.avatar || null,
        username:     (u.username || '').toLowerCase(),
        wins:         s.wins   || 0,
        losses:       s.losses || 0,
        ties:         s.ties   || 0,
        fpts:         (s.fpts  || 0) + (s.fpts_decimal  || 0) / 100,
        fpts_against: (s.fpts_against || 0) + (s.fpts_against_decimal || 0) / 100,
        max_pts:      (s.ppts || 0) + (s.ppts_decimal || 0) / 100,
        streak:       s.streak_type === 'W' ? `W${s.streak_count||1}` :
                      s.streak_type === 'L' ? `L${s.streak_count||1}` : '—',
        waiver_pos:   s.waiver_position || 0,
      };
    });

    standingsData = { teams, league, week };

    // Cache to Firebase (non-blocking)
    db.ref(`leagues/${lid}/standingsCache`).set({
      data: standingsData, currentWeek: week, cachedAt: Date.now()
    }).catch(() => {});

    renderStandingsTab();
    // Load historical seasons in background (non-blocking)
    if (!window.historicalLeagues.length) loadHistoricalSeasons(league);
  } catch(e) {
    showStandingsError('Could not load standings: ' + (e.message || e));
  }
}

// ── Historical seasons ─────────────────────────────────────────
async function loadHistoricalSeasons(currentLeague) {
  window.historicalLeagues = [];
  const currentSeason = currentLeague.season || new Date().getFullYear();
  window.historicalLeagues.push({
    leagueId: standingsLeagueId(),
    season:   currentSeason,
    name:     currentLeague.name || currentSeason,
    current:  true,
  });

  // Walk back through previous_league_id chain (auto-linked via Sleeper renewal)
  let prevId = currentLeague.previous_league_id;
  let attempts = 0;
  while (prevId && attempts < 10) {
    attempts++;
    try {
      const league = await Sleeper.fetchLeague(prevId);
      window.historicalLeagues.push({
        leagueId: prevId,
        season:   league.season || (currentSeason - attempts),
        name:     league.name || String(currentSeason - attempts),
        current:  false,
      });
      prevId = league.previous_league_id;
    } catch(e) { break; }
  }

  // Fallback: check Firebase for manually registered seasons
  // (needed when league was created fresh each year instead of renewed via Sleeper)
  if (window.historicalLeagues.length <= 1) {
    try {
      const snap = await db.ref(`leagues/${standingsLeagueId()}/seasonHistory`).once('value');
      const manual = snap.val();
      if (manual && Array.isArray(manual)) {
        manual.forEach(entry => {
          if (entry.leagueId && entry.leagueId !== standingsLeagueId()) {
            window.historicalLeagues.push({
              leagueId: entry.leagueId,
              season:   entry.season,
              name:     entry.name || String(entry.season),
              current:  false,
            });
          }
        });
        // Sort newest first
        window.historicalLeagues.sort((a, b) => (b.season || 0) - (a.season || 0));
      }
    } catch(e) { /* no manual registry */ }
  }

  // Only show season bar if there are multiple seasons
  if (window.historicalLeagues.length > 1) renderSeasonBar();
}

function renderSeasonBar() {
  const bar = document.getElementById('st-season-bar');
  if (!bar) return;
  const currentId = window.viewingLeagueId || standingsLeagueId();
  bar.style.display = '';
  bar.innerHTML =
    '<div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;font-weight:600;">Season</div>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
    window.historicalLeagues.map(h =>
      `<button onclick="switchSeason('${h.leagueId}')"
        style="padding:5px 12px;border-radius:var(--radius-sm);border:1px solid var(--border);
        background:${h.leagueId===currentId?'var(--accent)':'var(--surface2)'};
        color:${h.leagueId===currentId?'#fff':'var(--text2)'};font-size:12px;cursor:pointer;
        font-family:var(--font-body);">${h.season}${h.current?' ★':''}</button>`
    ).join('') +
    '</div>';
}

async function switchSeason(leagueId) {
  window.viewingLeagueId = leagueId;
  matchupsCache   = {};   // clear matchup cache for this season
  renderSeasonBar();

  // Fetch data for this season
  showStandingsLoading('Loading ' + (window.historicalLeagues.find(h=>h.leagueId===leagueId)?.season || 'season') + ' standings…');
  try {
    const [league, rosters, users] = await Promise.all([
      Sleeper.fetchLeague(leagueId),
      Sleeper.fetchRosters(leagueId),
      Sleeper.fetchLeagueUsers(leagueId),
    ]);

    const week = league.settings?.leg || league.settings?.week || 17;
    currentWeek = week;

    const userMap = {};
    (users || []).forEach(u => { userMap[u.user_id] = u; });

    const teams = (rosters || []).map(r => {
      const u = userMap[r.owner_id] || {};
      const s = r.settings || {};
      return {
        roster_id:    r.roster_id,
        owner_id:     r.owner_id,
        display_name: u.display_name || u.username || `Team ${r.roster_id}`,
        avatar:       u.avatar || null,
        username:     (u.username || '').toLowerCase(),
        wins:         s.wins   || 0,
        losses:       s.losses || 0,
        ties:         s.ties   || 0,
        fpts:         (s.fpts  || 0) + (s.fpts_decimal  || 0) / 100,
        fpts_against: (s.fpts_against || 0) + (s.fpts_against_decimal || 0) / 100,
        max_pts:      (s.ppts || 0) + (s.ppts_decimal || 0) / 100,
        streak:       s.streak_type === 'W' ? `W${s.streak_count||1}` :
                      s.streak_type === 'L' ? `L${s.streak_count||1}` : '—',
      };
    });

    standingsData = { teams, league, week };
    renderStandingsTab();

    // Switch to appropriate tab
    if (standingsTab === 'matchups') renderMatchupsTab();
    if (standingsTab === 'playoffs') renderPlayoffsTab();
  } catch(e) {
    showStandingsError('Could not load season: ' + (e.message || e));
  }
}

function showStandingsLoading(msg) {
  const el = document.getElementById('st-tab-' + standingsTab);
  if (el) el.innerHTML = `<div style="padding:60px;text-align:center;color:var(--text3);">
    <div class="spinner" style="margin:0 auto 16px;"></div>${msg}</div>`;
}

function showStandingsError(msg) {
  const el = document.getElementById('st-tab-' + standingsTab);
  if (el) el.innerHTML = `<div style="padding:40px;text-align:center;color:var(--red);">
    ⚠️ ${msg}<br><button onclick="loadStandingsData(true)"
    style="margin-top:14px;padding:8px 16px;background:var(--surface2);border:1px solid var(--border);
    border-radius:var(--radius-sm);color:var(--text);cursor:pointer;">↻ Try Again</button></div>`;
}

// ── Standings tab ──────────────────────────────────────────────
function renderStandingsTab() {
  const el = document.getElementById('st-tab-standings');
  if (!el || !standingsData) return;

  const { teams, league } = standingsData;
  const playoffSpots = league.settings?.playoff_teams || 6;
  const totalTeams   = teams.length;

  // Sort: wins desc, then points for desc
  const sorted = [...teams].sort((a, b) =>
    b.wins !== a.wins ? b.wins - a.wins :
    b.fpts !== a.fpts ? b.fpts - a.fpts : 0
  );

  const fmt = n => n % 1 === 0 ? n.toFixed(0) : n.toFixed(2);

  el.innerHTML = `
    <div style="padding:16px 0 8px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
      <div style="font-size:13px;color:var(--text3);">
        ${league.name || 'League'} · Week ${currentWeek} · Top ${playoffSpots} make playoffs
      </div>
      <button onclick="loadStandingsData(true)"
        style="padding:5px 12px;background:var(--surface2);border:1px solid var(--border);
        border-radius:var(--radius-sm);color:var(--text2);font-size:12px;cursor:pointer;
        font-family:var(--font-body);">↻ Refresh</button>
    </div>
    <div style="overflow-x:auto;">
      <table class="standings-table">
        <thead>
          <tr>
            <th style="width:28px;">#</th>
            <th>Team</th>
            <th>W</th><th>L</th><th>T</th>
            <th title="Points For">PF</th>
            <th title="Points Against">PA</th>
            <th title="Max Potential Points (used for draft order tiebreaker)">MaxPF</th>
            <th>Streak</th>
          </tr>
        </thead>
        <tbody>
          ${sorted.map((t, i) => {
            const rank       = i + 1;
            const inPlayoffs = rank <= playoffSpots;
            const onBubble   = rank === playoffSpots;
            const rowStyle   = inPlayoffs ? 'background:rgba(124,92,252,.04);' : '';
            const borderLeft = inPlayoffs
              ? `border-left:3px solid ${onBubble ? 'var(--yellow)' : 'var(--accent)'};`
              : 'border-left:3px solid transparent;';
            const initial = (t.display_name || '?')[0].toUpperCase();
            const avatar  = t.avatar
              ? `<img src="https://sleepercdn.com/avatars/thumbs/${t.avatar}"
                  style="width:26px;height:26px;border-radius:50%;object-fit:cover;"
                  onerror="this.outerHTML='<div class=st-avatar>${initial}</div>'">`
              : `<div class="st-avatar">${initial}</div>`;
            const streakColor = t.streak.startsWith('W') ? 'var(--green)' :
                                 t.streak.startsWith('L') ? 'var(--red)' : 'var(--text3)';
            return `<tr style="${rowStyle}${borderLeft}">
              <td style="color:var(--text3);font-size:12px;text-align:center;">${rank}</td>
              <td>
                <div style="display:flex;align-items:center;gap:8px;">
                  ${avatar}
                  <span style="font-weight:${inPlayoffs?600:400};">${t.display_name}</span>
                  ${rank <= playoffSpots && rank > playoffSpots - 2
                    ? '<span style="font-size:10px;color:var(--yellow);margin-left:4px;">bubble</span>' : ''}
                </div>
              </td>
              <td style="font-weight:600;color:var(--green);">${t.wins}</td>
              <td style="color:var(--red);">${t.losses}</td>
              <td style="color:var(--text3);">${t.ties}</td>
              <td style="font-family:var(--font-mono);font-size:12px;">${fmt(t.fpts)}</td>
              <td style="font-family:var(--font-mono);font-size:12px;color:var(--text3);">${fmt(t.fpts_against)}</td>
              <td style="font-family:var(--font-mono);font-size:12px;color:var(--text3);">${t.max_pts > 0 ? fmt(t.max_pts) : '—'}</td>
              <td style="font-family:var(--font-mono);font-size:12px;color:${streakColor};">${t.streak}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    <div style="margin-top:10px;font-size:11px;color:var(--text3);padding:0 4px;">
      <span style="display:inline-block;width:10px;height:10px;background:var(--accent);
        border-radius:2px;margin-right:4px;vertical-align:middle;"></span>Playoff spot
      &nbsp;
      <span style="display:inline-block;width:10px;height:10px;background:var(--yellow);
        border-radius:2px;margin-right:4px;vertical-align:middle;"></span>Bubble
    </div>`;
}

// ── Matchups tab ───────────────────────────────────────────────
function renderMatchupsTab() {
  const el = document.getElementById('st-tab-matchups');
  if (!el) return;

  const maxWeek = currentWeek;
  const weeks   = Array.from({length: maxWeek}, (_, i) => i + 1);

  el.innerHTML = `
    <div style="padding:16px 0 12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      <span style="font-size:13px;color:var(--text3);">Week:</span>
      <div style="display:flex;gap:4px;flex-wrap:wrap;">
        ${weeks.map(w => `<button onclick="loadMatchupsWeek(${w})"
          id="st-week-${w}"
          style="padding:4px 10px;border-radius:var(--radius-sm);border:1px solid var(--border);
          background:${w===maxWeek?'var(--accent)':'var(--surface2)'};
          color:${w===maxWeek?'#fff':'var(--text2)'};font-size:12px;cursor:pointer;
          font-family:var(--font-body);">${w}</button>`).join('')}
      </div>
    </div>
    <div id="st-matchups-grid"></div>`;

  loadMatchupsWeek(maxWeek);
}

async function loadMatchupsWeek(week) {
  const lid = window.viewingLeagueId || standingsLeagueId();
  // Update button highlight
  document.querySelectorAll('[id^="st-week-"]').forEach(b => {
    const w = parseInt(b.id.replace('st-week-',''));
    b.style.background = w === week ? 'var(--accent)' : 'var(--surface2)';
    b.style.color       = w === week ? '#fff' : 'var(--text2)';
  });

  const grid = document.getElementById('st-matchups-grid');
  if (!grid) return;

  // Use cache if available
  if (matchupsCache[week]) {
    await renderMatchupCards(matchupsCache[week], week);
    return;
  }

  grid.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text3);">
    <div class="spinner" style="margin:0 auto 12px;"></div>Loading week ${week}…</div>`;

  try {
    const matchups = await Sleeper.fetchMatchups(lid, week);
    matchupsCache[week] = matchups;
    await renderMatchupCards(matchups, week);
  } catch(e) {
    grid.innerHTML = `<div style="padding:30px;text-align:center;color:var(--red);">
      Could not load matchups for week ${week}.</div>`;
  }
}

async function renderMatchupCards(matchups, week) {
  const grid = document.getElementById('st-matchups-grid');
  if (!grid || !standingsData) return;

  // Group by matchup_id
  const pairs = {};
  matchups.forEach(m => {
    if (!pairs[m.matchup_id]) pairs[m.matchup_id] = [];
    pairs[m.matchup_id].push(m);
  });

  // Build roster_id -> team lookup
  const rosterMap = {};
  (standingsData.teams || []).forEach(t => { rosterMap[t.roster_id] = t; });

  const fmt = n => (n || 0).toFixed(2);

  // Get player name lookup from App state
  // Get player lookup -- try App.state, then localStorage, then fetch
  let players = (window.App && window.App.state && window.App.state.players) || null;
  if (!players || !Object.keys(players).length) {
    try {
      const raw = localStorage.getItem('sb_players');
      if (raw) players = JSON.parse(raw);
    } catch(e) {}
  }
  // If still empty, fetch directly (stores in localStorage for next time)
  if (!players || !Object.keys(players).length) {
    try {
      const r = await fetch('https://api.sleeper.app/v1/players/nfl');
      players = await r.json();
      try { localStorage.setItem('sb_players', JSON.stringify(players)); } catch(e) {}
    } catch(e) { players = {}; }
  }
  players = players || {};
  function pName(id) {
    const p = players[id];
    return p ? `${p.first_name||''} ${p.last_name||''}`.trim() : id;
  }
  function pPos(id) {
    const p = players[id];
    return (p?.fantasy_positions?.[0] || p?.position || '').toUpperCase();
  }
  function pTeam(id) {
    const p = players[id];
    return p?.team || '';
  }
  const posColor = { QB:'var(--accent2)', RB:'var(--green)', WR:'var(--cyan)', TE:'var(--yellow)', K:'var(--text3)', DEF:'var(--text3)' };

  // Roster slot positions from league settings
  const rosterSlots = standingsData?.league?.roster_positions || [];

  function teamAvatar(t) {
    return t.avatar
      ? `<img src="https://sleepercdn.com/avatars/thumbs/${t.avatar}"
          style="width:26px;height:26px;border-radius:50%;object-fit:cover;flex-shrink:0;"
          onerror="this.style.display='none'">`
      : `<div class="st-avatar" style="width:26px;height:26px;font-size:11px;flex-shrink:0;">${(t.display_name||'?')[0].toUpperCase()}</div>`;
  }

  // Build side-by-side starter rows: left name+pts | slot label | right name+pts
  function renderSideBySide(entryA, entryB) {
    const stA = entryA.starters || [], stB = entryB.starters || [];
    const spA = entryA.starters_points || {}, ppA = entryA.players_points || {};
    const spB = entryB.starters_points || {}, ppB = entryB.players_points || {};
    const allA = entryA.players || [], allB = entryB.players || [];

    // Starter slot labels from roster_positions (skip K, BN, IR, TAXI)
    const starterSlots = rosterSlots.filter(s => !['BN','IR','TAXI'].includes(s));
    const rows = [];
    const maxLen = Math.max(stA.length, stB.length, starterSlots.length);

    for (let i = 0; i < maxLen; i++) {
      const idA   = stA[i];
      const idB   = stB[i];
      const slot  = starterSlots[i] || 'FLEX';
      const ptsA  = idA ? +(spA[idA] ?? ppA[idA] ?? 0) : 0;
      const ptsB  = idB ? +(spB[idB] ?? ppB[idB] ?? 0) : 0;
      const slotLabel = slot === 'FLEX' || slot === 'WRT' || slot === 'WRTF' ? 'FLEX'
                      : slot === 'REC_FLEX' ? 'FLEX'
                      : slot === 'SUPER_FLEX' || slot === 'SF' ? 'SF'
                      : slot;
      const posCol = posColor[slotLabel] || posColor[pPos(idA)] || 'var(--text3)';

      rows.push(`<div class="mu-sbs-row">
        <span class="mu-sbs-pts ${ptsA > ptsB ? 'mu-win' : ''}">${idA ? ptsA.toFixed(2) : '—'}</span>
        <span class="mu-sbs-name mu-sbs-name-left">${idA ? pName(idA) : '—'}</span>
        <span class="mu-sbs-slot" style="color:${posCol};">${slotLabel}</span>
        <span class="mu-sbs-name mu-sbs-name-right">${idB ? pName(idB) : '—'}</span>
        <span class="mu-sbs-pts mu-sbs-pts-right ${ptsB > ptsA ? 'mu-win' : ''}">${idB ? ptsB.toFixed(2) : '—'}</span>
      </div>`);
    }

    // Bench
    const benchA = allA.filter(id => !stA.includes(id));
    const benchB = allB.filter(id => !stB.includes(id));
    const benchLen = Math.max(benchA.length, benchB.length);
    let benchHTML = '';
    if (benchLen > 0) {
      benchHTML = `<div class="mu-section-divider">
        <span class="mu-section-label">Bench</span>
      </div>`;
      for (let i = 0; i < benchLen; i++) {
        const idA  = benchA[i];
        const idB  = benchB[i];
        const ptsA = idA ? +(ppA[idA] ?? 0) : 0;
        const ptsB = idB ? +(ppB[idB] ?? 0) : 0;
        benchHTML += `<div class="mu-sbs-row mu-bench">
          <span class="mu-sbs-pts">${idA ? ptsA.toFixed(2) : ''}</span>
          <span class="mu-sbs-name mu-sbs-name-left">${idA ? pName(idA) : ''}</span>
          <span class="mu-sbs-slot" style="opacity:.3;">BN</span>
          <span class="mu-sbs-name mu-sbs-name-right">${idB ? pName(idB) : ''}</span>
          <span class="mu-sbs-pts mu-sbs-pts-right">${idB ? ptsB.toFixed(2) : ''}</span>
        </div>`;
      }
    }

    return rows.join('') + benchHTML;
  }

  const cards = Object.entries(pairs).sort(([a],[b]) => +a - +b).map(([matchupId, pair]) => {
    if (pair.length < 2) return '';
    const [a, b] = pair;
    const ta = rosterMap[a.roster_id] || { display_name: `Team ${a.roster_id}` };
    const tb = rosterMap[b.roster_id] || { display_name: `Team ${b.roster_id}` };
    const aWin = a.points > b.points;
    const bWin = b.points > a.points;
    const hasDetail = (a.starters||[]).length > 0;
    const cardId = `mu-${matchupId}`;

    return `<div class="matchup-card mu-card" onclick="this.querySelector('.mu-detail').style.display=this.querySelector('.mu-detail').style.display==='none'?'':'none'">
      <div class="mu-header">
        <div class="mu-team-block">
          ${teamAvatar(ta)}
          <div class="mu-team-name ${aWin?'mu-win':''}" title="${ta.display_name}">${ta.display_name}</div>
        </div>
        <div class="mu-score-block">
          <span class="mu-score ${aWin?'mu-win':bWin?'mu-lose':''}">${fmt(a.points)}</span>
          <span class="mu-score-sep">–</span>
          <span class="mu-score ${bWin?'mu-win':aWin?'mu-lose':''}">${fmt(b.points)}</span>
        </div>
        <div class="mu-team-block mu-team-right">
          <div class="mu-team-name ${bWin?'mu-win':''}" title="${tb.display_name}">${tb.display_name}</div>
          ${teamAvatar(tb)}
        </div>
      </div>
      ${hasDetail ? `<div class="mu-detail" style="display:none;">
        <div class="mu-sbs-header">
          <span></span>
          <span class="mu-sbs-team-label">${ta.display_name}</span>
          <span class="mu-sbs-slot-header">POS</span>
          <span class="mu-sbs-team-label" style="text-align:right;">${tb.display_name}</span>
          <span></span>
        </div>
        ${renderSideBySide(a, b)}
        <div style="text-align:center;font-size:10px;color:var(--text3);margin-top:6px;padding-top:6px;border-top:1px solid var(--border);">Tap to collapse ↑</div>
      </div>` : `<div style="font-size:11px;color:var(--text3);text-align:center;padding-top:6px;">No player data yet</div>`}
    </div>`;
  }).join('');

  grid.innerHTML = cards || `<div style="padding:30px;text-align:center;color:var(--text3);">No matchups found for week ${week}.</div>`;
}

// ── Playoffs tab ───────────────────────────────────────────────
function renderPlayoffsTab() {
  const el = document.getElementById('st-tab-playoffs');
  if (!el) return;

  const status = standingsData?.league?.status || '';
  const isPostseason = status === 'post_season' || status === 'complete';

  if (!isPostseason) {
    const playoffWeek = standingsData?.league?.settings?.playoff_week_start || '?';
    el.innerHTML = `<div style="padding:60px;text-align:center;color:var(--text3);">
      <div style="font-size:36px;margin-bottom:16px;">🏆</div>
      <div style="font-size:15px;font-weight:600;margin-bottom:8px;">Playoffs haven't started yet</div>
      <div style="font-size:13px;">Regular season runs through week ${typeof playoffWeek === 'number' ? playoffWeek - 1 : '?'}.</div>
      <div style="font-size:12px;margin-top:8px;">Bracket will appear here once the postseason begins.</div>
    </div>`;
    return;
  }

  // Load bracket
  el.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text3);">
    <div class="spinner" style="margin:0 auto 12px;"></div>Loading bracket…</div>`;
  loadBracket();
}

async function loadBracket() {
  const lid = window.viewingLeagueId || standingsLeagueId();
  const el  = document.getElementById('st-tab-playoffs');
  if (!el) return;

  try {
    const [winners, losers] = await Promise.all([
      Sleeper.fetchWinnersBracket(lid),
      Sleeper.fetchLosersBracket(lid),
    ]);

    if (!winners || !winners.length) {
      el.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text3);">
        Bracket data not available yet.</div>`;
      return;
    }

    // Build roster -> display name AND seed (rank in sorted standings)
    const rosterMap = {};
    const seedMap   = {};
    const sortedTeams = [...(standingsData?.teams || [])].sort((a,b) =>
      b.wins !== a.wins ? b.wins - a.wins : b.fpts - a.fpts);
    sortedTeams.forEach((t, i) => {
      rosterMap[t.roster_id] = t.display_name;
      seedMap[t.roster_id]   = i + 1;
    });

    function matchName(rosterId) {
      if (!rosterId) return 'TBD';
      const name = rosterMap[rosterId] || `Team ${rosterId}`;
      const seed = seedMap[rosterId];
      return seed ? `${name} <span style="font-size:10px;color:var(--text3);">#${seed}</span>` : name;
    }

    function bracketMatch(m) {
      const t1 = matchName(m.t1);
      const t2 = matchName(m.t2);
      const decided = m.w != null;
      const t1win = decided && m.w === m.t1;
      const t2win = decided && m.w === m.t2;
      const s1 = t1win ? 'color:var(--green);font-weight:700;' :
                  t2win ? 'color:var(--text3);text-decoration:line-through;opacity:.6;' : '';
      const s2 = t2win ? 'color:var(--green);font-weight:700;' :
                  t1win ? 'color:var(--text3);text-decoration:line-through;opacity:.6;' : '';
      return `<div class="bracket-match">
        <div class="bracket-slot" style="${s1}">${t1 || 'TBD'}</div>
        <div class="bracket-vs">vs</div>
        <div class="bracket-slot" style="${s2}">${t2 || 'TBD'}</div>
        ${decided ? `<div style="font-size:10px;color:var(--text3);margin-top:4px;">
          Winner: <span style="color:var(--green);">${matchName(m.w)}</span>
        </div>` : '<div style="font-size:10px;color:var(--text3);margin-top:4px;">In progress</div>'}
      </div>`;
    }

    // Build set of winners bracket match IDs for filtering
    const wMatchIds = new Set((winners||[]).map(m => m.m));

    // Filter losers bracket: only keep placement games (from winners bracket losses)
    // A match is a placement game if EITHER team comes from a winners bracket loss
    function isPlacementGame(m) {
      const fromW = id => wMatchIds.has(id);
      const t1w = m.t1_from?.l != null && fromW(m.t1_from.l);
      const t2w = m.t2_from?.l != null && fromW(m.t2_from.l);
      const t1r = m.t1_from?.w != null; // winner of a losers bracket match (round 2+)
      const t2r = m.t2_from?.w != null;
      // Include if at least one team directly came from winners bracket loss
      // OR if this is a later round (feeding from earlier placement games)
      return t1w || t2w || t1r || t2r;
    }
    const placementLosers = (losers||[]).filter(isPlacementGame);

    // Group winners and filtered losers by round
    const wByRound = {}, lByRound = {};
    (winners||[]).forEach(m => { const r=m.r||1; if(!wByRound[r]) wByRound[r]=[]; wByRound[r].push(m); });
    placementLosers.forEach(m => { const r=m.r||1; if(!lByRound[r]) lByRound[r]=[]; lByRound[r].push(m); });

    const wRounds   = Object.keys(wByRound).map(Number).sort((a,b)=>a-b);
    const maxWRound = wRounds.length ? Math.max(...wRounds) : 1;
    const maxLRound = Object.keys(lByRound).length ? Math.max(...Object.keys(lByRound).map(Number)) : 0;

    // Map losers rounds to winners rounds they correspond to:
    // Losers R1 = 5th place game, played same week as winners R2 (semis)
    // Losers R2 = 3rd place game, played same week as winners R3 (championship)
    const lRoundsList = Object.keys(lByRound).map(Number).sort((a,b)=>a-b);
    // lRounds[0] -> 5th place (alongside semis), lRounds[1] -> 3rd place (alongside finals)
    function lMatchLabel(lRound) {
      const idx = lRoundsList.indexOf(lRound);
      if (idx === lRoundsList.length - 1) return '🥉 3rd Place';
      return '5th Place';
    }

    // Build unified columns: each winners bracket round is a column
    // R2 column also shows 5th place game; R3 column also shows 3rd place game
    const bracketCols = wRounds.map((r, ri) => {
      // Label for this winners round
      let roundTitle;
      if (r === maxWRound)     roundTitle = '🏆 Championship Round';
      else if (r === maxWRound - 1) roundTitle = 'Semifinals';
      else                     roundTitle = 'First Round';

      // Championship / placement matches for this column
      const wMatches = wByRound[r] || [];

      // Which losers round corresponds to this winners round?
      // lRoundsList[0] aligns with wRounds[1] (semis), lRoundsList[1] aligns with wRounds[2] (finals)
      const lAlignIdx = ri - 1; // offset: R1 has no losers game, R2 has L[0], R3 has L[1]
      const lRound    = lRoundsList[lAlignIdx];
      const lMatches  = (lRound != null && lByRound[lRound]) ? lByRound[lRound] : [];

      const wMatchesHTML = wMatches.map(m => `
        <div class="bracket-match-group">
          <div class="bracket-match-sub-label">${r === maxWRound ? '🏆 Championship' : r === maxWRound-1 ? 'Semifinal' : 'First Round'}</div>
          ${bracketMatch(m)}
        </div>`).join('');

      const lMatchesHTML = lMatches.map(m => `
        <div class="bracket-match-group">
          <div class="bracket-match-sub-label" style="color:var(--text3);">${lMatchLabel(lRound)}</div>
          ${bracketMatch(m)}
        </div>`).join('');

      return `<div class="bracket-round">
        <div class="bracket-round-label">${roundTitle}</div>
        ${wMatchesHTML}
        ${lMatchesHTML}
      </div>`;
    }).join('');

    // Build non-playoff draft order: teams ranked 7+ ordered by MaxPF ascending
    // Lowest MaxPF = pick 1.01 (first pick), highest = last pick
    const playoffSpots = standingsData?.league?.settings?.playoff_teams || 6;
    const nonPlayoffTeams = sortedTeams
      .slice(playoffSpots)
      .sort((a,b) => (a.max_pts||0) - (b.max_pts||0)); // ascending: worst MaxPF picks first
    const fmt2 = n => n > 0 ? n.toFixed(2) : '—';

    const draftOrderHTML = nonPlayoffTeams.length ? `
      <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border);">
        <div style="font-size:13px;font-weight:600;margin-bottom:4px;">📋 Consolation Draft Order</div>
        <div style="font-size:11px;color:var(--text3);margin-bottom:10px;">Based on MaxPF — lower MaxPF picks earlier</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px;">
          ${nonPlayoffTeams.map((t,i) => `
            <div style="display:flex;align-items:center;gap:8px;background:var(--surface);
              border:1px solid var(--border);border-radius:var(--radius-sm);padding:7px 10px;">
              <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;
                color:var(--accent2);min-width:28px;">1.${String(i+1).padStart(2,'0')}</span>
              <span style="font-size:12px;flex:1;overflow:hidden;text-overflow:ellipsis;
                white-space:nowrap;">${t.display_name}</span>
              <span style="font-family:var(--font-mono);font-size:11px;color:var(--text3);">
                ${fmt2(t.max_pts)}</span>
            </div>`).join('')}
        </div>
      </div>` : '';

    el.innerHTML = `
      <div style="padding:16px 0 8px;">
        <div style="font-size:15px;font-weight:600;margin-bottom:12px;">🏆 Playoff Bracket</div>
        <div class="bracket-container" style="align-items:flex-start;">${bracketCols}</div>
        ${draftOrderHTML}
      </div>`;
  } catch(e) {
    if (el) el.innerHTML = `<div style="padding:30px;text-align:center;color:var(--red);">
      Could not load bracket: ${e.message||e}</div>`;
  }
}

// ── Boot guard ─────────────────────────────────────────────────
// Always defer to initStandingsView() so we don't double-initialize.
// The router calls standingsInit() after loadScript completes.
window._standingsInitPending = true;
