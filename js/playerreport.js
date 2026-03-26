// playerreport.js — Cross-league player ownership report

async function showCrossLeagueReport() {
  // Build a modal overlay
  let modal = document.getElementById('player-report-modal');
  if (modal) modal.remove();

  modal = document.createElement('div');
  modal.id = 'player-report-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9998;display:flex;align-items:flex-start;justify-content:center;padding:24px 16px;overflow-y:auto;';
  modal.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);width:100%;max-width:780px;min-height:200px;position:relative;">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border);">
        <div style="font-size:18px;font-weight:700;">📋 My Player Report</div>
        <button onclick="document.getElementById('player-report-modal').remove()" style="background:none;border:none;color:var(--text3);font-size:22px;cursor:pointer;line-height:1;">✕</button>
      </div>
      <div id="player-report-body" style="padding:20px;">
        <div style="text-align:center;padding:40px;color:var(--text3);">Loading your players across all leagues…</div>
      </div>
    </div>`;
  document.body.appendChild(modal);

  try {
    await buildPlayerReport();
  } catch(e) {
    document.getElementById('player-report-body').innerHTML =
      `<div style="color:var(--red);padding:20px;">Error: ${e.message}</div>`;
  }
}

async function buildPlayerReport() {
  const el = document.getElementById('player-report-body');
  const userJson = localStorage.getItem('sb_user');
  const userObj  = userJson ? JSON.parse(userJson) : null;
  const userId   = userObj?.user_id;
  const season   = new Date().getFullYear();

  if (!userId) {
    el.innerHTML = '<div style="padding:20px;color:var(--text3);">Could not find your user ID. Please log out and log back in.</div>';
    return;
  }

  el.innerHTML = `<div style="color:var(--text3);font-size:13px;padding:8px 0 16px;">Fetching your ${season} leagues from Sleeper…</div>`;
  const sleeperLeagues = await fetch(`https://api.sleeper.app/v1/user/${userId}/leagues/nfl/${season}`).then(r=>r.json()).catch(()=>[]);
  if (!sleeperLeagues?.length) {
    el.innerHTML = `<div style="padding:20px;color:var(--text3);">No Sleeper leagues found for ${season}.</div>`;
    return;
  }

  el.innerHTML = `<div style="color:var(--text3);font-size:13px;padding:8px 0 16px;">Scanning ${sleeperLeagues.length} leagues…</div>`;

  // Fetch all rosters in parallel
  const playerLeagues = {}; // player_id -> [{ leagueName, slot, salary }]
  const totalLeagues  = sleeperLeagues.length;

  await Promise.all(sleeperLeagues.map(async league => {
    try {
      const rosters = await fetch(`https://api.sleeper.app/v1/league/${league.league_id}/rosters`).then(r=>r.json());
      const myRoster = (rosters||[]).find(r => r.owner_id === userId);
      if (!myRoster) return;
      const allPlayerIds = [
        ...(myRoster.players||[]).map(id=>({id,slot:'roster'})),
        ...(myRoster.reserve||[]).map(id=>({id,slot:'IR'})),
        ...(myRoster.taxi||[]).map(id=>({id,slot:'Taxi'})),
      ];
      let salaryMap = {};
      try {
        const snap = await db.ref(`leagues/${league.league_id}/rosterData/${myRoster.roster_id}/starters`).once('value');
        (snap.val()||[]).forEach(p => { if (p.player_id) salaryMap[p.player_id] = p.salary; });
      } catch(e) {}
      allPlayerIds.forEach(({id,slot}) => {
        if (!playerLeagues[id]) playerLeagues[id] = [];
        playerLeagues[id].push({ leagueName: league.name, leagueId: league.league_id, slot, salary: salaryMap[id]||null });
      });
    } catch(e) {}
  }));

  // Wait for _playerById to be populated (it's built async in app.js)
  let waited = 0;
  while ((!window._playerById || Object.keys(window._playerById).length < 100) && waited < 4000) {
    await new Promise(r => setTimeout(r, 200));
    waited += 200;
  }
  const byId = window._playerById || {};
  const POS_COLOR = { QB:'#e88c30', RB:'#3b82f6', WR:'#22c55e', TE:'#a855f7', K:'#9ca3af', DEF:'#9ca3af' };
  const ownedIds = new Set(Object.keys(playerLeagues));

  // Build owned list
  const owned = Object.entries(playerLeagues).map(([pid, leagues]) => {
    const info = byId[pid] || {};
    return { pid, name: info.name||pid, pos: info.pos||'?', team: info.team||'—', leagues, count: leagues.length, adp: info.adp||9999 };
  }).sort((a,b) => b.count - a.count || (a.adp||9999)-(b.adp||9999) || a.name.localeCompare(b.name));

  // Build unowned top players:
  // Include if: (currently active AND on an NFL team) OR (search_rank < 350, meaning
  // Sleeper considers them fantasy-relevant — covers IR players who played last year)
  const unowned = Object.entries(byId)
    .filter(([pid, p]) => {
      if (ownedIds.has(pid)) return false;
      if (!['QB','RB','WR','TE'].includes(p.pos)) return false;
      const hasTeam = p.team && p.team !== '—' && p.team !== 'FA';
      const isRelevant = (p.adp || 9999) < 350; // Sleeper only ranks relevant players
      if (!isRelevant) return false; // exclude truly inactive/retired
      if (!p.active && !hasTeam) return false; // must be active or on a team
      return true;
    })
    .map(([pid, p]) => ({ pid, name: p.name, pos: p.pos, team: p.team||'—', adp: p.adp||9999 }))
    .sort((a,b) => a.adp - b.adp)
    .slice(0, 150);

  // Positional counts
  const posCounts = {};
  owned.forEach(p => { posCounts[p.pos] = (posCounts[p.pos]||0)+1; });

  function posBadge(pos) {
    const c = POS_COLOR[pos]||'#9ca3af';
    return `<span style="font-size:10px;padding:1px 6px;border-radius:99px;background:${c}22;color:${c};border:1px solid ${c}55;font-weight:600;">${pos}</span>`;
  }

  function pctBar(count, total) {
    const pct = Math.round((count/total)*100);
    const color = pct===100?'var(--accent2)':count>1?'var(--green)':'var(--text3)';
    return `<div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
      <div style="width:48px;height:5px;background:var(--surface3,var(--surface));border-radius:99px;overflow:hidden;">
        <div style="height:100%;width:${pct}%;background:${color};border-radius:99px;"></div>
      </div>
      <span style="font-size:11px;color:${color};font-weight:600;width:32px;text-align:right;">${pct}%</span>
      <span style="font-size:10px;color:var(--text3);">${count}/${total}</span>
    </div>`;
  }

  // Render
  el.innerHTML = `
    <!-- Summary stats -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px;">
      <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:10px;text-align:center;">
        <div style="font-size:20px;font-weight:700;color:var(--accent);">${totalLeagues}</div>
        <div style="font-size:11px;color:var(--text3);">leagues</div>
      </div>
      ${['QB','RB','WR','TE'].map(pos=>`
      <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:10px;text-align:center;border-left:3px solid ${POS_COLOR[pos]};">
        <div style="font-size:20px;font-weight:700;color:${POS_COLOR[pos]};">${posCounts[pos]||0}</div>
        <div style="font-size:11px;color:var(--text3);">${pos}s</div>
      </div>`).join('')}
    </div>

    <!-- Tab bar -->
    <div style="display:flex;gap:4px;margin-bottom:14px;">
      <button onclick="switchReportTab('owned')" id="rtab-owned"
        style="padding:6px 14px;font-size:12px;font-family:var(--font-body);background:var(--accent);color:#fff;border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;">
        My Players (${owned.length})
      </button>
      <button onclick="switchReportTab('unowned')" id="rtab-unowned"
        style="padding:6px 14px;font-size:12px;font-family:var(--font-body);background:var(--surface2);color:var(--text2);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;">
        Available Gems (${unowned.length})
      </button>
    </div>

    <!-- My Players tab -->
    <div id="rtab-content-owned">
      <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px;">
        ${['ALL','QB','RB','WR','TE'].map(p=>
          `<button onclick="filterReportPos('${p}')" id="rpf-${p}"
            style="padding:3px 10px;font-size:11px;font-family:var(--font-body);
            background:${p==='ALL'?'var(--accent)':'var(--surface2)'};
            color:${p==='ALL'?'#fff':'var(--text2)'};
            border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;">${p}</button>`
        ).join('')}
      </div>
      <div id="report-player-list">
        ${owned.map(p=>`
          <div class="report-player-row" data-pos="${p.pos}"
            style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:var(--surface2);border-radius:var(--radius-sm);margin-bottom:4px;">
            ${posBadge(p.pos)}
            <span style="font-size:13px;font-weight:500;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.name}</span>
            <span style="font-size:11px;color:var(--text3);flex-shrink:0;">${p.team}</span>
            ${pctBar(p.count, totalLeagues)}
          </div>`).join('')}
      </div>
    </div>

    <!-- Available Gems tab (hidden initially) -->
    <div id="rtab-content-unowned" style="display:none;">
      <div style="font-size:12px;color:var(--text3);margin-bottom:10px;">
        Top ${unowned.length} players by ADP not on any of your rosters across ${totalLeagues} leagues.
      </div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px;">
        ${['ALL','QB','RB','WR','TE'].map(p=>
          `<button onclick="filterUnowned('${p}')" id="upf-${p}"
            style="padding:3px 10px;font-size:11px;font-family:var(--font-body);
            background:${p==='ALL'?'var(--accent)':'var(--surface2)'};
            color:${p==='ALL'?'#fff':'var(--text2)'};
            border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;">${p}</button>`
        ).join('')}
      </div>
      <div id="unowned-player-list">
        ${unowned.map((p,i)=>`
          <div class="unowned-row" data-pos="${p.pos}"
            style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:var(--surface2);border-radius:var(--radius-sm);margin-bottom:4px;">
            <span style="font-size:11px;color:var(--text3);width:24px;text-align:right;flex-shrink:0;">${i+1}</span>
            ${posBadge(p.pos)}
            <span style="font-size:13px;font-weight:500;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.name}</span>
            <span style="font-size:11px;color:var(--text3);flex-shrink:0;">${p.team}</span>
            <span style="font-size:11px;color:var(--text3);flex-shrink:0;">ADP #${p.adp}</span>
          </div>`).join('')}
      </div>
    </div>`;
}

function switchReportTab(tab) {
  ['owned','unowned'].forEach(t => {
    document.getElementById('rtab-content-'+t).style.display = t===tab?'':'none';
    const btn = document.getElementById('rtab-'+t);
    if (btn) { btn.style.background = t===tab?'var(--accent)':'var(--surface2)'; btn.style.color = t===tab?'#fff':'var(--text2)'; }
  });
}

function filterReportPos(pos) {
  document.querySelectorAll('[id^="rpf-"]').forEach(btn => {
    const isThis = btn.id===`rpf-${pos}`;
    btn.style.background = isThis?'var(--accent)':'var(--surface2)';
    btn.style.color       = isThis?'#fff':'var(--text2)';
  });
  document.querySelectorAll('.report-player-row').forEach(row => {
    row.style.display = (pos==='ALL'||row.dataset.pos===pos)?'':'none';
  });
}

function filterUnowned(pos) {
  document.querySelectorAll('[id^="upf-"]').forEach(btn => {
    const isThis = btn.id===`upf-${pos}`;
    btn.style.background = isThis?'var(--accent)':'var(--surface2)';
    btn.style.color       = isThis?'#fff':'var(--text2)';
  });
  document.querySelectorAll('.unowned-row').forEach(row => {
    row.style.display = (pos==='ALL'||row.dataset.pos===pos)?'':'none';
  });
}

window.showCrossLeagueReport = showCrossLeagueReport;
