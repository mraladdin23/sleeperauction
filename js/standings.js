// standings.js — Standings, Matchups, Playoffs for SleeperBid SPA
// Works when dynamically loaded into #view-standings

var STANDINGS_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// ── State ──────────────────────────────────────────────────────
var standingsData = null;   // { teams, rosters, users, league }
var matchupsCache = {};     // week -> matchup array
var currentWeek   = 1;
var standingsTab  = 'standings'; // 'standings' | 'matchups' | 'playoffs'

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
    <div class="nav-dropdown-wrap">
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
  viewingLeagueId = null;  // reset to current season
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
    if (!historicalLeagues.length) loadHistoricalSeasons(league);
  } catch(e) {
    showStandingsError('Could not load standings: ' + (e.message || e));
  }
}

// ── Historical seasons ─────────────────────────────────────────
async function loadHistoricalSeasons(currentLeague) {
  historicalLeagues = [];
  const currentSeason = currentLeague.season || new Date().getFullYear();
  historicalLeagues.push({
    leagueId: standingsLeagueId(),
    season:   currentSeason,
    name:     currentLeague.name || currentSeason,
    current:  true,
  });

  // Walk back through previous_league_id chain
  let prevId = currentLeague.previous_league_id;
  let attempts = 0;
  while (prevId && attempts < 10) {
    attempts++;
    try {
      const league = await Sleeper.fetchLeague(prevId);
      historicalLeagues.push({
        leagueId: prevId,
        season:   league.season || (currentSeason - attempts),
        name:     league.name || String(currentSeason - attempts),
        current:  false,
      });
      prevId = league.previous_league_id;
    } catch(e) { break; }
  }

  // Only show season bar if there are multiple seasons
  if (historicalLeagues.length > 1) renderSeasonBar();
}

function renderSeasonBar() {
  const bar = document.getElementById('st-season-bar');
  if (!bar) return;
  const currentId = viewingLeagueId || standingsLeagueId();
  bar.style.display = '';
  bar.innerHTML =
    '<div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;font-weight:600;">Season</div>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
    historicalLeagues.map(h =>
      `<button onclick="switchSeason('${h.leagueId}')"
        style="padding:5px 12px;border-radius:var(--radius-sm);border:1px solid var(--border);
        background:${h.leagueId===currentId?'var(--accent)':'var(--surface2)'};
        color:${h.leagueId===currentId?'#fff':'var(--text2)'};font-size:12px;cursor:pointer;
        font-family:var(--font-body);">${h.season}${h.current?' ★':''}</button>`
    ).join('') +
    '</div>';
}

async function switchSeason(leagueId) {
  viewingLeagueId = leagueId;
  matchupsCache   = {};   // clear matchup cache for this season
  renderSeasonBar();

  // Fetch data for this season
  showStandingsLoading('Loading ' + (historicalLeagues.find(h=>h.leagueId===leagueId)?.season || 'season') + ' standings…');
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
            <th>PF</th><th>PA</th>
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
  const lid = viewingLeagueId || standingsLeagueId();
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
    renderMatchupCards(matchupsCache[week], week);
    return;
  }

  grid.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text3);">
    <div class="spinner" style="margin:0 auto 12px;"></div>Loading week ${week}…</div>`;

  try {
    const matchups = await Sleeper.fetchMatchups(lid, week);
    matchupsCache[week] = matchups;
    renderMatchupCards(matchups, week);
  } catch(e) {
    grid.innerHTML = `<div style="padding:30px;text-align:center;color:var(--red);">
      Could not load matchups for week ${week}.</div>`;
  }
}

function renderMatchupCards(matchups, week) {
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

  const cards = Object.entries(pairs).sort(([a],[b]) => +a - +b).map(([matchupId, pair]) => {
    if (pair.length < 2) return '';
    const [a, b] = pair;
    const ta = rosterMap[a.roster_id] || { display_name: `Team ${a.roster_id}` };
    const tb = rosterMap[b.roster_id] || { display_name: `Team ${b.roster_id}` };
    const aWin = a.points > b.points;
    const bWin = b.points > a.points;
    const tie  = a.points === b.points;
    const aAvatar = ta.avatar
      ? `<img src="https://sleepercdn.com/avatars/thumbs/${ta.avatar}"
          style="width:32px;height:32px;border-radius:50%;object-fit:cover;"
          onerror="this.outerHTML='<div class=st-avatar>${(ta.display_name||'?')[0].toUpperCase()}</div>'">`
      : `<div class="st-avatar">${(ta.display_name||'?')[0].toUpperCase()}</div>`;
    const bAvatar = tb.avatar
      ? `<img src="https://sleepercdn.com/avatars/thumbs/${tb.avatar}"
          style="width:32px;height:32px;border-radius:50%;object-fit:cover;"
          onerror="this.outerHTML='<div class=st-avatar>${(tb.display_name||'?')[0].toUpperCase()}</div>'">`
      : `<div class="st-avatar">${(tb.display_name||'?')[0].toUpperCase()}</div>`;

    return `<div class="matchup-card">
      <div class="matchup-team ${aWin?'matchup-winner':''}">
        ${aAvatar}
        <div class="matchup-name">${ta.display_name}</div>
        <div class="matchup-pts" style="color:${aWin?'var(--green)':bWin?'var(--red)':'var(--text2)'};">${fmt(a.points)}</div>
      </div>
      <div class="matchup-vs">VS</div>
      <div class="matchup-team ${bWin?'matchup-winner':''}">
        ${bAvatar}
        <div class="matchup-name">${tb.display_name}</div>
        <div class="matchup-pts" style="color:${bWin?'var(--green)':aWin?'var(--red)':'var(--text2)'};">${fmt(b.points)}</div>
      </div>
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
  const lid = viewingLeagueId || standingsLeagueId();
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

    const rosterMap = {};
    (standingsData?.teams || []).forEach(t => { rosterMap[t.roster_id] = t.display_name; });

    function matchName(rosterId) {
      return rosterMap[rosterId] || (rosterId ? `Team ${rosterId}` : 'TBD');
    }

    function renderBracketRound(matches, roundLabel) {
      if (!matches.length) return '';
      return `<div class="bracket-round">
        <div class="bracket-round-label">${roundLabel}</div>
        ${matches.map(m => {
          const t1 = matchName(m.t1);
          const t2 = matchName(m.t2);
          const w  = m.w ? matchName(m.w) : null;
          const winnerStyle = 'color:var(--green);font-weight:600;';
          const loserStyle  = 'color:var(--text3);text-decoration:line-through;';
          return `<div class="bracket-match">
            <div class="${m.w===m.t1?'bracket-team':'bracket-team'}"
              style="${m.w?m.w===m.t1?winnerStyle:loserStyle:''}">${t1}</div>
            <div class="bracket-vs">vs</div>
            <div style="${m.w?m.w===m.t2?winnerStyle:loserStyle:''}">${t2}</div>
          </div>`;
        }).join('')}
      </div>`;
    }

    // Group by round
    const byRound = {};
    winners.forEach(m => {
      const r = m.r || 1;
      if (!byRound[r]) byRound[r] = [];
      byRound[r].push(m);
    });

    const roundLabels = { 1: 'Quarterfinals', 2: 'Semifinals', 3: 'Championship' };
    const bracketHTML = Object.entries(byRound)
      .sort(([a],[b]) => +a - +b)
      .map(([r, matches]) => renderBracketRound(matches, roundLabels[r] || `Round ${r}`))
      .join('');

    el.innerHTML = `
      <div style="padding:16px 0 8px;">
        <div style="font-size:15px;font-weight:600;margin-bottom:16px;">🏆 Playoff Bracket</div>
        <div class="bracket-container">${bracketHTML}</div>
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
