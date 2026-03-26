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
  const userId = window.App?.state?.user?.user_id;
  const season = new Date().getFullYear();

  // Fetch all of user's Sleeper leagues this season
  const sleeperLeagues = await fetch(`https://api.sleeper.app/v1/user/${userId}/leagues/nfl/${season}`).then(r=>r.json()).catch(()=>[]);
  if (!sleeperLeagues?.length) {
    el.innerHTML = '<div style="padding:20px;color:var(--text3);">No Sleeper leagues found for this season.</div>';
    return;
  }

  // For each league, get the user's roster
  el.innerHTML = `<div style="color:var(--text3);font-size:13px;padding:8px 0 16px;">Scanning ${sleeperLeagues.length} leagues…</div>`;

  const playerLeagues = {}; // player_id -> [{ leagueName, leagueId, salary, slot }]
  const playerMeta    = {}; // player_id -> { name, pos, team }

  await Promise.all(sleeperLeagues.map(async league => {
    try {
      const [rosters, users] = await Promise.all([
        fetch(`https://api.sleeper.app/v1/league/${league.league_id}/rosters`).then(r=>r.json()),
        fetch(`https://api.sleeper.app/v1/league/${league.league_id}/users`).then(r=>r.json()),
      ]);
      const myRoster = (rosters||[]).find(r => r.owner_id === userId);
      if (!myRoster) return;

      const allPlayers = [
        ...(myRoster.players || []).map(id => ({ id, slot: 'roster' })),
        ...(myRoster.reserve || []).map(id => ({ id, slot: 'IR' })),
        ...(myRoster.taxi   || []).map(id => ({ id, slot: 'Taxi' })),
      ];

      // Try to get salary from Firebase rosterData
      let salaryMap = {};
      try {
        const snap = await db.ref(`leagues/${league.league_id}/rosterData/${myRoster.roster_id}/starters`).once('value');
        const starters = snap.val() || [];
        starters.forEach(p => { if (p.player_id || p.name) salaryMap[p.player_id || p.name] = p.salary; });
      } catch(e) {}

      allPlayers.forEach(({ id, slot }) => {
        if (!playerLeagues[id]) playerLeagues[id] = [];
        playerLeagues[id].push({
          leagueName: league.name,
          leagueId:   league.league_id,
          slot,
          salary: salaryMap[id] || null,
        });
      });
    } catch(e) {}
  }));

  // Build player metadata from _playerById cache
  const byId = window._playerById || {};

  // Collect all unique players owned
  const owned = Object.entries(playerLeagues).map(([pid, leagues]) => {
    const info = byId[pid] || {};
    const name = info.name || pid;
    const pos  = info.pos  || '?';
    const team = info.team || '—';
    return { pid, name, pos, team, leagues, count: leagues.length };
  });

  // Sort by: owned in most leagues first, then by name
  owned.sort((a,b) => b.count - a.count || a.name.localeCompare(b.name));

  // Players owned in 2+ leagues (interesting cross-league ownership)
  const multiOwned = owned.filter(p => p.count > 1);
  const allOwned   = owned;

  const totalPlayers = new Set(Object.keys(playerLeagues)).size;
  const totalLeagues = sleeperLeagues.length;

  const POS_COLOR = { QB:'#e88c30', RB:'#3b82f6', WR:'#22c55e', TE:'#a855f7', K:'#9ca3af', DEF:'#9ca3af' };

  function posBadge(pos) {
    const c = POS_COLOR[pos] || '#9ca3af';
    return `<span style="font-size:10px;padding:1px 6px;border-radius:99px;background:${c}22;color:${c};border:1px solid ${c}55;font-weight:600;">${pos}</span>`;
  }

  function leagueTags(leagues) {
    return leagues.map(l =>
      `<span style="font-size:11px;padding:2px 7px;background:var(--surface2);border:1px solid var(--border);border-radius:4px;color:var(--text2);">${l.leagueName}${l.slot!=='roster'?` <span style="color:var(--text3);">(${l.slot})</span>`:''}${l.salary?` <span style="color:var(--accent2);">$${(l.salary/1000000).toFixed(1)}M</span>`:''}</span>`
    ).join(' ');
  }

  el.innerHTML = `
    <!-- Summary stats -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px;">
      <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:12px;text-align:center;">
        <div style="font-size:22px;font-weight:700;color:var(--accent);">${totalLeagues}</div>
        <div style="font-size:12px;color:var(--text3);">leagues</div>
      </div>
      <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:12px;text-align:center;">
        <div style="font-size:22px;font-weight:700;color:var(--accent);">${totalPlayers}</div>
        <div style="font-size:12px;color:var(--text3);">unique players</div>
      </div>
      <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:12px;text-align:center;">
        <div style="font-size:22px;font-weight:700;color:var(--accent);">${multiOwned.length}</div>
        <div style="font-size:12px;color:var(--text3);">in 2+ leagues</div>
      </div>
    </div>

    <!-- Positional breakdown -->
    <div style="margin-bottom:20px;">
      <div style="font-size:13px;font-weight:600;margin-bottom:8px;">Roster by Position</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        ${['QB','RB','WR','TE'].map(pos => {
          const count = allOwned.filter(p=>p.pos===pos).length;
          const c = POS_COLOR[pos];
          return `<div style="background:${c}18;border:1px solid ${c}44;border-radius:var(--radius-sm);padding:8px 16px;text-align:center;">
            <div style="font-size:18px;font-weight:700;color:${c};">${count}</div>
            <div style="font-size:11px;color:${c};font-weight:600;">${pos}</div>
          </div>`;
        }).join('')}
      </div>
    </div>

    ${multiOwned.length ? `
    <!-- Multi-league ownership -->
    <div style="margin-bottom:20px;">
      <div style="font-size:13px;font-weight:600;margin-bottom:8px;">🔁 Owned in Multiple Leagues</div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        ${multiOwned.map(p => `
          <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:10px 12px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
              ${posBadge(p.pos)}
              <span style="font-size:13px;font-weight:600;">${p.name}</span>
              <span style="font-size:11px;color:var(--text3);">${p.team}</span>
              <span style="margin-left:auto;font-size:11px;color:var(--accent2);font-weight:600;">${p.count} leagues</span>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;">${leagueTags(p.leagues)}</div>
          </div>`).join('')}
      </div>
    </div>` : ''}

    <!-- All players by league -->
    <div>
      <div style="font-size:13px;font-weight:600;margin-bottom:8px;">All My Players</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;" id="report-pos-filter">
        ${['ALL','QB','RB','WR','TE'].map(p =>
          `<button onclick="filterReportPos('${p}')" id="rpf-${p}"
            style="padding:4px 10px;font-size:11px;font-family:var(--font-body);
            background:${p==='ALL'?'var(--accent)':'var(--surface2)'};
            color:${p==='ALL'?'#fff':'var(--text2)'};
            border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;">${p}</button>`
        ).join('')}
      </div>
      <div id="report-player-list" style="display:flex;flex-direction:column;gap:4px;">
        ${allOwned.map(p => `
          <div class="report-player-row" data-pos="${p.pos}"
            style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:var(--surface2);border-radius:var(--radius-sm);">
            ${posBadge(p.pos)}
            <span style="font-size:13px;font-weight:500;">${p.name}</span>
            <span style="font-size:11px;color:var(--text3);">${p.team}</span>
            <span style="margin-left:auto;font-size:11px;color:var(--text3);">${p.leagues.map(l=>l.leagueName).join(' · ')}</span>
          </div>`).join('')}
      </div>
    </div>`;
}

function filterReportPos(pos) {
  document.querySelectorAll('[id^="rpf-"]').forEach(btn => {
    const isThis = btn.id === `rpf-${pos}`;
    btn.style.background = isThis ? 'var(--accent)' : 'var(--surface2)';
    btn.style.color       = isThis ? '#fff' : 'var(--text2)';
  });
  document.querySelectorAll('.report-player-row').forEach(row => {
    row.style.display = (pos === 'ALL' || row.dataset.pos === pos) ? '' : 'none';
  });
}

window.showCrossLeagueReport = showCrossLeagueReport;
