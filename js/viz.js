// viz.js — Fun Visualizations: Trade Map, Luck Index, Power Rankings, Draft Grades, Waiver Impact

// ── Entry point ────────────────────────────────────────────────
// Cache team names per league
let _vizTeamNames = {};
let _vizLeagueId  = null;
let _vizYear      = null;

async function getVizTeamNames(lid) {
  if (_vizTeamNames[lid]) return _vizTeamNames[lid];
  try {
    const [rosters, users] = await Promise.all([
      fetch(`https://api.sleeper.app/v1/league/${lid}/rosters`).then(r=>r.json()),
      fetch(`https://api.sleeper.app/v1/league/${lid}/users`).then(r=>r.json()),
    ]);
    const userMap = {};
    (users||[]).forEach(u => { userMap[u.user_id] = u.display_name || u.username || u.user_id; });
    const names = {};
    (rosters||[]).forEach(r => {
      names[String(r.roster_id)] = userMap[r.owner_id] || `Team ${r.roster_id}`;
    });
    _vizTeamNames[lid] = names;
    return names;
  } catch(e) {
    return {};
  }
}

async function getVizSeasons(lid) {
  const seasons = [{ lid, label: 'Current', current: true }];
  try {
    let prevId = (await fetch(`https://api.sleeper.app/v1/league/${lid}`).then(r=>r.json())).previous_league_id;
    let tries = 0;
    while (prevId && prevId !== '0' && tries < 5) {
      const info = await fetch(`https://api.sleeper.app/v1/league/${prevId}`).then(r=>r.json());
      seasons.push({ lid: prevId, label: info.season || `Season ${tries+1}`, current: false });
      prevId = info.previous_league_id;
      if (prevId === '0') break;
      tries++;
    }
  } catch(e) {}
  return seasons;
}

function initVizView() {
  const container = document.getElementById('view-viz');
  if (!container) return;
  const lid = localStorage.getItem('sb_leagueId');
  if (!lid) { container.innerHTML = '<div style="padding:32px;color:var(--text3);">No league selected.</div>'; return; }
  _vizLeagueId = lid;
  _vizYear = lid;
  _vizCurrentTab = -1; // reset so showVizTab(0) always renders fresh

  container.innerHTML = `
    <div style="max-width:960px;margin:0 auto;padding:16px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;flex-wrap:wrap;gap:8px;">
        <div style="font-size:20px;font-weight:700;">📊 League Analytics</div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:12px;color:var(--text3);">Season:</span>
          <div id="viz-season-bar" style="display:flex;gap:4px;flex-wrap:wrap;"></div>
        </div>
      </div>
      <div style="font-size:13px;color:var(--text3);margin-bottom:16px;">Fun stats you won't find anywhere else</div>

      <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:20px;" id="viz-tabs">
        ${['🔄 Trade Map','🍀 Luck Index','🏆 Power Rankings','📋 Draft Recap','💎 Waiver Impact'].map((t,i)=>
          `<button onclick="showVizTab(${i})" id="viz-tab-${i}"
            style="padding:7px 14px;font-size:12px;font-family:var(--font-body);
            background:${i===0?'var(--accent)':'var(--surface2)'};
            color:${i===0?'#fff':'var(--text2)'};
            border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;">${t}</button>`
        ).join('')}
      </div>

      <div id="viz-content" style="min-height:400px;">
        <div style="text-align:center;padding:40px;color:var(--text3);">Loading…</div>
      </div>
    </div>`;

  // Load season selector
  getVizSeasons(lid).then(seasons => {
    const bar = document.getElementById('viz-season-bar');
    if (!bar || seasons.length <= 1) return;
    bar.innerHTML = seasons.map(s =>
      `<button onclick="setVizSeason('${s.lid}')" id="viz-season-${s.lid}"
        style="padding:3px 10px;font-size:11px;font-family:var(--font-body);
        background:${s.current?'var(--accent)':'var(--surface2)'};
        color:${s.current?'#fff':'var(--text2)'};
        border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;">${s.label}</button>`
    ).join('');
  });

  showVizTab(0);
}

function setVizSeason(lid) {
  _vizYear = lid;
  document.querySelectorAll('[id^="viz-season-"]').forEach(btn => {
    const isThis = btn.id === `viz-season-${lid}`;
    btn.style.background = isThis ? 'var(--accent)' : 'var(--surface2)';
    btn.style.color       = isThis ? '#fff'           : 'var(--text2)';
  });
  _vizCurrentTab = -1; // force re-render
  showVizTab(_vizCurrentTab === -1 ? 0 : _vizCurrentTab);
}

let _vizCurrentTab = -1;

function showVizTab(idx) {
  if (_vizCurrentTab === idx) return;
  _vizCurrentTab = idx;
  for (let i = 0; i < 5; i++) {
    const btn = document.getElementById(`viz-tab-${i}`);
    if (btn) { btn.style.background = i===idx?'var(--accent)':'var(--surface2)'; btn.style.color = i===idx?'#fff':'var(--text2)'; }
  }
  const el = document.getElementById('viz-content');
  if (!el) return;
  el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3);">Loading…</div>';
  [renderTradeMap, renderLuckIndex, renderPowerRankings, renderDraftGrades, renderWaiverImpact][idx](el);
}

// ── 1. TRADE MAP ────────────────────────────────────────────────
async function renderTradeMap(el) {
  el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3);">Analyzing trades…</div>';
  const lid = _vizYear || localStorage.getItem('sb_leagueId');
  try {
    // Fetch transactions and find trades
    const weeks = await Promise.all(Array.from({length:18},(_,i)=>i+1).map(w=>
      Sleeper.fetchTransactions(lid,w).catch(()=>[])));
    const trades = weeks.flat().filter(t=>t.type==='trade'&&t.status==='complete');

    if (!trades.length) {
      el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3);">No trades found this season.</div>';
      return;
    }

    // Build trade count matrix
    const teamNames = await getVizTeamNames(lid);

    const pairs = {};
    trades.forEach(t=>{
      const ids = (t.roster_ids||[]).map(String);
      if (ids.length >= 2) {
        const key = ids.sort().join('-');
        pairs[key] = (pairs[key]||0) + 1;
      }
    });

    // Count per team
    const counts = {};
    Object.entries(pairs).forEach(([key,n])=>{
      key.split('-').forEach(id=>{ counts[id]=(counts[id]||0)+n; });
    });

    const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
    const maxTrades = sorted[0]?.[1] || 1;

    el.innerHTML = `
      <div style="margin-bottom:20px;">
        <div style="font-size:16px;font-weight:600;margin-bottom:12px;">Trade Activity by Team</div>
        ${sorted.map(([id,n])=>{
          const pct = (n/maxTrades)*100;
          const name = teamNames[id]||`Roster ${id}`;
          return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <div style="width:140px;font-size:12px;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${name}</div>
            <div style="flex:1;background:var(--surface2);border-radius:99px;height:16px;overflow:hidden;">
              <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:99px;transition:width .5s;"></div>
            </div>
            <div style="font-size:12px;font-family:var(--font-mono);color:var(--text2);width:40px;text-align:right;">${n} trade${n!==1?'s':''}</div>
          </div>`;
        }).join('')}
      </div>
      <div style="font-size:16px;font-weight:600;margin-bottom:12px;">Trading Partners</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        ${Object.entries(pairs).sort((a,b)=>b[1]-a[1]).map(([key,n])=>{
          const [a,b] = key.split('-');
          const nameA = teamNames[a]||`R${a}`, nameB = teamNames[b]||`R${b}`;
          return `<div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:8px 12px;font-size:12px;">
            <span style="color:var(--accent);">${nameA}</span>
            <span style="color:var(--text3);margin:0 6px;">↔</span>
            <span style="color:var(--accent2);">${nameB}</span>
            <span style="color:var(--text3);margin-left:8px;">${n}×</span>
          </div>`;
        }).join('')}
      </div>`;
  } catch(e) {
    el.innerHTML = `<div style="color:var(--red);padding:20px;">Could not load trade data: ${e.message}</div>`;
  }
}

// ── 2. LUCK INDEX ────────────────────────────────────────────────
async function renderLuckIndex(el) {
  el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3);">Calculating luck index…</div>';
  const lid = _vizYear || localStorage.getItem('sb_leagueId');
  try {
    const [rosters, matchupData] = await Promise.all([
      Sleeper.fetchRosters(lid),
      Promise.all(Array.from({length:14},(_,i)=>i+1).map(w=>
        Sleeper.fetchMatchups(lid,w).catch(()=>[])))
    ]);

    const teamNames = await getVizTeamNames(lid);

    // For each week, compute median score. Win against median = "expected win"
    const weeklyScores = {}; // rosterId -> [scores]
    const actualRecord = {}; // rosterId -> {w,l}

    matchupData.forEach((weekMatches, wIdx) => {
      if (!weekMatches?.length) return;
      // Group by matchup_id
      const byMatchup = {};
      weekMatches.forEach(m => {
        if (!byMatchup[m.matchup_id]) byMatchup[m.matchup_id] = [];
        byMatchup[m.matchup_id].push(m);
      });
      const allScores = weekMatches.map(m=>m.points||0).filter(s=>s>0);
      if (!allScores.length) return;
      const median = allScores.sort((a,b)=>a-b)[Math.floor(allScores.length/2)];

      Object.values(byMatchup).forEach(pair => {
        if (pair.length !== 2) return;
        const [a,b] = pair;
        const ridA = String(a.roster_id), ridB = String(b.roster_id);
        if (!weeklyScores[ridA]) weeklyScores[ridA] = [];
        if (!weeklyScores[ridB]) weeklyScores[ridB] = [];
        weeklyScores[ridA].push(a.points||0);
        weeklyScores[ridB].push(b.points||0);
        if (!actualRecord[ridA]) actualRecord[ridA] = {w:0,l:0};
        if (!actualRecord[ridB]) actualRecord[ridB] = {w:0,l:0};
        if ((a.points||0) > (b.points||0)) { actualRecord[ridA].w++; actualRecord[ridB].l++; }
        else { actualRecord[ridB].w++; actualRecord[ridA].l++; }
      });
    });

    // Expected wins = weeks where scored above median
    const results = rosters.map(r => {
      const rid = String(r.roster_id);
      const scores = weeklyScores[rid] || [];
      const actual = actualRecord[rid] || {w:0,l:0};
      const allWeekScores = Object.values(weeklyScores).flat().filter(s=>s>0);
      if (!allWeekScores.length || !scores.length) return null;
      const sortedAll = [...allWeekScores].sort((a,b)=>a-b);
      const expectedWins = scores.filter(s => {
        const rank = sortedAll.filter(x=>x<s).length;
        return rank > sortedAll.length / 2;
      }).length;
      const luckScore = actual.w - expectedWins;
      return { rid, name: teamNames[rid]||`R${rid}`, actual, expectedWins, luckScore, avgScore: scores.length ? (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1) : '—' };
    }).filter(Boolean).sort((a,b)=>b.luckScore-a.luckScore);

    if (!results.length) { el.innerHTML = '<div style="padding:32px;text-align:center;color:var(--text3);">Not enough matchup data yet.</div>'; return; }

    const maxLuck = Math.max(...results.map(r=>Math.abs(r.luckScore)),1);

    el.innerHTML = `
      <div style="font-size:13px;color:var(--text3);margin-bottom:16px;">
        Luck Index = Actual Wins − Expected Wins based on weekly scoring vs league median. Positive = lucky, Negative = unlucky.
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${results.map(r => {
          const pct = (Math.abs(r.luckScore)/maxLuck)*45;
          const color = r.luckScore > 0 ? 'var(--green)' : r.luckScore < 0 ? 'var(--red)' : 'var(--text3)';
          const emoji = r.luckScore >= 2 ? '🍀' : r.luckScore <= -2 ? '😤' : '😐';
          return `<div style="display:flex;align-items:center;gap:10px;background:var(--surface2);border-radius:var(--radius-sm);padding:10px 14px;">
            <div style="font-size:18px;">${emoji}</div>
            <div style="width:130px;font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${r.name}</div>
            <div style="width:60px;font-size:11px;color:var(--text3);">${r.actual.w}-${r.actual.l} actual</div>
            <div style="width:70px;font-size:11px;color:var(--text3);">${r.expectedWins} expected</div>
            <div style="flex:1;display:flex;align-items:center;gap:4px;">
              ${r.luckScore > 0 ? `<div style="width:${pct}%;height:8px;background:var(--green);border-radius:99px;margin-left:50%;"></div>` :
                r.luckScore < 0 ? `<div style="width:${pct}%;height:8px;background:var(--red);border-radius:99px;margin-right:0;margin-left:${50-pct}%;"></div>` :
                `<div style="width:2px;height:8px;background:var(--text3);margin-left:50%;"></div>`}
            </div>
            <div style="font-size:13px;font-weight:700;color:${color};width:40px;text-align:right;">${r.luckScore>0?'+':''}${r.luckScore}</div>
          </div>`;
        }).join('')}
      </div>`;
  } catch(e) {
    el.innerHTML = `<div style="color:var(--red);padding:20px;">Could not load matchup data: ${e.message}</div>`;
  }
}

// ── 3. POWER RANKINGS ────────────────────────────────────────────
async function renderPowerRankings(el) {
  el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3);">Building power rankings…</div>';
  const lid = _vizYear || localStorage.getItem('sb_leagueId');
  try {
    const [rosters, recentMatchups] = await Promise.all([
      Sleeper.fetchRosters(lid),
      Promise.all([1,2,3,4,5,6,7,8,9,10,11,12,13,14].map(w=>
        Sleeper.fetchMatchups(lid,w).catch(()=>[])))
    ]);

    const teamNames = await getVizTeamNames(lid);

    // Power ranking = weighted combo of: recent form (last 3 wks), overall record, avg points
    const scoresByWeek = {}; // rosterId -> week -> pts
    const allWeeks = recentMatchups.map((wm,i)=>({week:i+1,matches:wm})).filter(w=>w.matches?.length);

    allWeeks.forEach(({week,matches})=>{
      matches.forEach(m=>{
        const rid = String(m.roster_id);
        if (!scoresByWeek[rid]) scoresByWeek[rid] = {};
        scoresByWeek[rid][week] = m.points||0;
      });
    });

    if (!Object.keys(scoresByWeek).length) {
      el.innerHTML = '<div style="padding:32px;text-align:center;color:var(--text3);">Not enough data yet — check back after week 3.</div>';
      return;
    }

    const maxWeek = Math.max(...allWeeks.map(w=>w.week));
    const recentWeeks = [maxWeek, maxWeek-1, maxWeek-2].filter(w=>w>0);

    const rankings = rosters.map(r=>{
      const rid = String(r.roster_id);
      const wScores = scoresByWeek[rid]||{};
      const allScores = Object.values(wScores).filter(s=>s>0);
      const recentScores = recentWeeks.map(w=>wScores[w]||0).filter(s=>s>0);
      const avgAll = allScores.length ? allScores.reduce((a,b)=>a+b,0)/allScores.length : 0;
      const avgRecent = recentScores.length ? recentScores.reduce((a,b)=>a+b,0)/recentScores.length : avgAll;
      const wins = r.settings?.wins||0, losses = r.settings?.losses||0;
      const games = wins+losses||1;
      const winPct = wins/games;
      // Power score: 40% recent avg + 30% season avg + 30% win%
      const power = (avgRecent*0.4 + avgAll*0.3 + winPct*100*0.3);
      const trend = avgRecent > avgAll ? '↑' : avgRecent < avgAll*0.9 ? '↓' : '→';
      const trendColor = trend==='↑'?'var(--green)':trend==='↓'?'var(--red)':'var(--text3)';
      return { rid, name:teamNames[rid]||`R${rid}`, wins, losses, avgAll:avgAll.toFixed(1), avgRecent:avgRecent.toFixed(1), power, trend, trendColor };
    }).filter(r=>r.power>0).sort((a,b)=>b.power-a.power);

    el.innerHTML = `
      <div style="font-size:13px;color:var(--text3);margin-bottom:16px;">
        Power = 40% recent form (last 3 weeks) + 30% season avg + 30% win%. Updated weekly.
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        ${rankings.map((r,i)=>{
          const medals = ['🥇','🥈','🥉'];
          const badge = i < 3 ? medals[i] : `<span style="font-size:12px;font-weight:700;color:var(--text3);">#${i+1}</span>`;
          const barPct = (r.power/rankings[0].power)*100;
          return `<div style="display:flex;align-items:center;gap:10px;background:var(--surface2);border-radius:var(--radius-sm);padding:10px 14px;">
            <div style="width:28px;text-align:center;font-size:16px;">${badge}</div>
            <div style="width:130px;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${r.name}</div>
            <div style="width:50px;font-size:11px;color:var(--text3);">${r.wins}-${r.losses}</div>
            <div style="flex:1;background:var(--surface3);border-radius:99px;height:8px;overflow:hidden;">
              <div style="height:100%;width:${barPct}%;background:linear-gradient(90deg,var(--accent),var(--green));border-radius:99px;"></div>
            </div>
            <div style="font-size:12px;color:var(--text3);width:80px;text-align:right;">avg ${r.avgAll} pts</div>
            <div style="font-size:16px;color:${r.trendColor};">${r.trend}</div>
          </div>`;
        }).join('')}
      </div>`;
  } catch(e) {
    el.innerHTML = `<div style="color:var(--red);padding:20px;">Could not load rankings: ${e.message}</div>`;
  }
}

// ── 4. DRAFT GRADES ────────────────────────────────────────────
async function renderDraftGrades(el) {
  const lid = _vizYear || localStorage.getItem('sb_leagueId');
  el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3);">Loading draft recap…</div>';
  try {
    // Get draft info
    const drafts = await fetch(`https://api.sleeper.app/v1/league/${lid}/drafts`).then(r=>r.json());
    if (!drafts?.length) { el.innerHTML = noData('No drafts found for this season.'); return; }
    const completedDraft = [...drafts].sort((a,b)=>Number(b.draft_id)-Number(a.draft_id))
      .find(d=>d.status==='complete') || drafts[0];
    const picks = await fetch(`https://api.sleeper.app/v1/draft/${completedDraft.draft_id}/picks`).then(r=>r.json());
    if (!picks?.length) { el.innerHTML = noData('No picks found in this draft yet.'); return; }

    const teamNames = await getVizTeamNames(lid);
    const teams  = completedDraft.settings?.teams  || 12;
    const rounds = completedDraft.settings?.rounds || 4;
    const year   = completedDraft.season || new Date().getFullYear();
    const isSnak = completedDraft.type === 'snake';

    // Fetch season stats for the draft year to measure actual value
    el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3);">Fetching season stats…</div>';
    let seasonStats = {};
    try {
      const statsRaw = await fetch(`https://api.sleeper.app/v1/stats/nfl/regular/${year}?season_type=regular&position[]=QB&position[]=RB&position[]=WR&position[]=TE`).then(r=>r.json());
      // statsRaw: { player_id: { pts_ppr, pts_std, rec_yd, ... } }
      seasonStats = statsRaw || {};
    } catch(e) { console.warn('Season stats fetch failed:', e); }

    // Build picks array with overall position and actual season points
    const allPicks = picks.map(p => {
      const rid     = String(p.roster_id || '');
      const overall = (p.round - 1) * teams + (p.draft_slot || 1);
      const name    = p.metadata ? `${p.metadata.first_name||''} ${p.metadata.last_name||''}`.trim() : 'Unknown';
      const pos     = p.metadata?.position || '?';
      const pid     = p.player_id;
      const pts     = pid && seasonStats[pid] ? (seasonStats[pid].pts_ppr || seasonStats[pid].pts_std || 0) : null;
      return { rid, overall, name, pos, pid, pts, round: p.round, slot: p.draft_slot };
    }).filter(p => p.rid && p.rid !== 'undefined');

    // Rank all picks by actual points to get "value rank"
    const picksWithStats = allPicks.filter(p => p.pts !== null && p.pts > 0);
    picksWithStats.sort((a,b) => b.pts - a.pts);
    const valueRankMap = {}; // player overall -> value rank (1 = best actual performer)
    picksWithStats.forEach((p, i) => { valueRankMap[p.overall] = i + 1; });

    // Group by roster
    const byRoster = {};
    allPicks.forEach(p => {
      if (!byRoster[p.rid]) byRoster[p.rid] = [];
      byRoster[p.rid].push(p);
    });

    const POS_COLOR = { QB:'#e88c30', RB:'#3b82f6', WR:'#22c55e', TE:'#a855f7' };
    const hasStats  = picksWithStats.length > 0;

    // Compute team value scores (avg: draft_position - value_rank, positive = stole picks)
    const summaries = Object.entries(byRoster).map(([rid, rPicks]) => {
      const name = teamNames[rid] || `Roster ${rid}`;
      const totalPts = rPicks.reduce((s,p) => s + (p.pts||0), 0);
      const topPicks = rPicks.filter(p=>p.round<=2).sort((a,b)=>a.overall-b.overall);
      // Steals: players whose actual value rank is much better than draft rank
      const steals = rPicks
        .filter(p => valueRankMap[p.overall] && valueRankMap[p.overall] < p.overall * 0.6)
        .sort((a,b) => valueRankMap[a.overall] - valueRankMap[b.overall])
        .slice(0, 2);
      const busts = rPicks
        .filter(p => p.pts !== null && p.pts < 30 && p.round <= 3)
        .sort((a,b) => a.overall - b.overall)
        .slice(0, 2);
      return { rid, name, picks: rPicks, totalPts, topPicks, steals, busts };
    }).sort((a,b) => b.totalPts - a.totalPts || a.picks[0]?.overall - b.picks[0]?.overall);

    const maxPts = summaries[0]?.totalPts || 1;

    el.innerHTML = `
      <div style="font-size:13px;color:var(--text3);margin-bottom:4px;">
        ${isSnak ? 'Redraft' : 'Rookie/Dynasty'} draft · ${rounds} rounds · ${teams} teams · ${year} season
      </div>
      <div style="font-size:12px;color:var(--text3);margin-bottom:16px;">
        ${hasStats ? 'Sorted by total fantasy points scored by drafted players (PPR).' : 'Season stats not available — showing draft order.'}
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${summaries.map((s, rank) => {
          const medals = ['🥇','🥈','🥉'];
          const pctBar = hasStats ? (s.totalPts / maxPts * 100).toFixed(1) : 0;
          const posMap = {};
          s.picks.forEach(p => { posMap[p.pos] = (posMap[p.pos]||0)+1; });
          const posBadges = Object.entries(posMap)
            .map(([pos,n]) => `<span style="font-size:10px;padding:2px 6px;border-radius:99px;background:${POS_COLOR[pos]||'#6b7280'}22;color:${POS_COLOR[pos]||'#6b7280'};border:1px solid ${POS_COLOR[pos]||'#6b7280'}55;margin-right:3px;">${pos}×${n}</span>`)
            .join('');
          const topPickStr = s.topPicks.slice(0,3).map(p =>
            `<span style="color:var(--text2);">${p.name}</span><span style="color:var(--text3);font-size:10px;"> #${p.overall}</span>`
          ).join('<span style="color:var(--border);"> · </span>');
          const stealStr = s.steals.map(p =>
            `<span style="color:var(--green);">🎯 ${p.name} <span style="color:var(--text3);font-size:10px;">(#${p.overall}→ #${valueRankMap[p.overall]} actual)</span></span>`
          ).join(' ');
          const bustStr = s.busts.map(p =>
            `<span style="color:var(--red);">💥 ${p.name} <span style="color:var(--text3);font-size:10px;">(Rd ${p.round}, ${p.pts?.toFixed(0)||0} pts)</span></span>`
          ).join(' ');
          return `
            <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:12px 16px;border-left:3px solid ${rank<3?'var(--accent)':'var(--border)'};">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
                <span style="font-size:16px;flex-shrink:0;">${medals[rank]||`<span style="font-size:12px;color:var(--text3);">#${rank+1}</span>`}</span>
                <span style="font-size:14px;font-weight:600;">${s.name}</span>
                ${hasStats ? `<span style="font-size:12px;color:var(--text3);margin-left:auto;">${s.totalPts.toFixed(0)} total pts</span>` : ''}
              </div>
              ${hasStats ? `
              <div style="background:var(--surface3,var(--surface));border-radius:99px;height:6px;overflow:hidden;margin-bottom:8px;">
                <div style="height:100%;width:${pctBar}%;background:linear-gradient(90deg,var(--accent),var(--green));border-radius:99px;"></div>
              </div>` : ''}
              <div style="font-size:11px;color:var(--text3);margin-bottom:4px;">Early picks: ${topPickStr || '—'}</div>
              <div style="margin-bottom:4px;">${posBadges}</div>
              ${stealStr ? `<div style="font-size:11px;margin-top:4px;">${stealStr}</div>` : ''}
              ${bustStr  ? `<div style="font-size:11px;margin-top:3px;">${bustStr}</div>`  : ''}
            </div>`;
        }).join('')}
      </div>`;
  } catch(e) {
    el.innerHTML = `<div style="color:var(--red);padding:20px;">Could not load draft recap: ${e.message}</div>`;
    console.warn('renderDraftGrades error:', e);
  }
}

// ── 5. WAIVER IMPACT ────────────────────────────────────────────
async function renderWaiverImpact(el) {
  el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3);">Analyzing waiver activity…</div>';
  const lid = _vizYear || localStorage.getItem('sb_leagueId');
  try {
    const weeks = await Promise.all(Array.from({length:18},(_,i)=>i+1).map(w=>
      Sleeper.fetchTransactions(lid,w).catch(()=>[])));
    const allTxns = weeks.flat().filter(t=>['waiver','free_agent'].includes(t.type)&&t.status==='complete');

    if (!allTxns.length) {
      el.innerHTML = '<div style="padding:32px;text-align:center;color:var(--text3);">No waiver activity found this season.</div>';
      return;
    }

    const teamNames = await getVizTeamNames(lid);
    const byId = window._playerById||{};

    // Count pickups per team, find most added players
    const teamPickups = {};
    const playerPickups = {};

    allTxns.forEach(t=>{
      const rid = String((t.roster_ids||[])[0]);
      if (!teamPickups[rid]) teamPickups[rid] = {adds:0, drops:0};
      const adds = Object.keys(t.adds||{});
      const drops = Object.keys(t.drops||{});
      teamPickups[rid].adds  += adds.length;
      teamPickups[rid].drops += drops.length;
      adds.forEach(pid=>{
        const name = byId[pid]?.name||pid;
        playerPickups[name] = (playerPickups[name]||0)+1;
      });
    });

    const teamRows = Object.entries(teamPickups)
      .map(([rid,{adds,drops}])=>({name:teamNames[rid]||`R${rid}`,adds,drops}))
      .sort((a,b)=>b.adds-a.adds);
    const maxAdds = teamRows[0]?.adds||1;

    const hotPlayers = Object.entries(playerPickups)
      .filter(([,n])=>n>1)
      .sort((a,b)=>b[1]-a[1])
      .slice(0,10);

    el.innerHTML = `
      <div style="font-size:16px;font-weight:600;margin-bottom:12px;">Waiver Activity by Team</div>
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:24px;">
        ${teamRows.map(r=>`
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:130px;font-size:12px;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${r.name}</div>
            <div style="flex:1;background:var(--surface2);border-radius:99px;height:14px;overflow:hidden;">
              <div style="height:100%;width:${(r.adds/maxAdds)*100}%;background:var(--accent);border-radius:99px;"></div>
            </div>
            <div style="font-size:11px;color:var(--text3);width:80px;text-align:right;">${r.adds} adds · ${r.drops} drops</div>
          </div>`).join('')}
      </div>
      ${hotPlayers.length ? `
        <div style="font-size:16px;font-weight:600;margin-bottom:12px;">Most Claimed Players</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${hotPlayers.map(([name,n])=>`
            <div style="background:var(--surface2);border:1px solid var(--border);border-radius:99px;padding:5px 12px;font-size:12px;">
              ${name} <span style="color:var(--accent2);font-weight:600;">${n}×</span>
            </div>`).join('')}
        </div>` : ''}`;
  } catch(e) {
    el.innerHTML = `<div style="color:var(--red);padding:20px;">Could not load waiver data: ${e.message}</div>`;
  }
}

function noData(msg) {
  return `<div style="text-align:center;padding:40px;color:var(--text3);">
    <div style="font-size:32px;margin-bottom:8px;">📭</div>
    <div style="font-size:14px;">${msg}</div>
  </div>`;
}

// Expose for lazy loader
window._vizInit = initVizView;
