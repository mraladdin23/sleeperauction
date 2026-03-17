// draft.js — extracted from draft.html, works standalone or in SPA

// ── Auth helpers ─────────────────────────────────────────────
function leagueId()  { return localStorage.getItem('sb_leagueId') || ''; }
function username()  { return localStorage.getItem('sb_username') || ''; }
const COMM = 'mraladdin23';
function isComm()    { return username().toLowerCase() === COMM; }
// CAP: use window.CAP if cap.js is loaded (SPA roster view loaded first),
// otherwise use the default. Loaded fresh from Firebase in refreshDraft.
let CAP = (typeof window !== 'undefined' && window.CAP) ? window.CAP : 301_200_000;

function capLogout() {
  localStorage.removeItem('sb_username');
  localStorage.removeItem('sb_leagueId');
  localStorage.removeItem('sb_user');
  window.location = 'index.html';
}

// Avatar
(function() {
  const el = document.getElementById('cap-avatar');
  if (!el) return;
  try {
    const u = JSON.parse(localStorage.getItem('sb_user') || 'null');
    const name = u?.display_name || u?.username || localStorage.getItem('sb_username') || '?';
    const initial = name[0]?.toUpperCase() || '?';
    if (u?.avatar) {
      el.innerHTML = `<img src="https://sleepercdn.com/avatars/thumbs/${u.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.parentElement.textContent='${initial}'" />`;
    } else { el.textContent = initial; }
    el.title = name;
  } catch(e) { el.textContent = '?'; }
})();

// Theme
function toggleTheme() {
  const lm = document.body.classList.toggle('light-mode');
  localStorage.setItem('sb_theme', lm ? 'light' : 'dark');
  document.getElementById('theme-btn').textContent = lm ? '🌙' : '☀️';
}
if (localStorage.getItem('sb_theme') === 'light') {
  document.body.classList.add('light-mode');
  document.getElementById('theme-btn').textContent = '🌙';
}

// ── Salary scale ─────────────────────────────────────────────
const ROOKIE_SALARY = {
  '1-1':15e6,'1-2':15e6,'1-3':15e6,'1-4':15e6,'1-5':15e6,'1-6':15e6,
  '1-7':10e6,'1-8':10e6,'1-9':10e6,'1-10':10e6,'1-11':10e6,'1-12':10e6,
  '2-1':7.5e6,'2-2':7.5e6,'2-3':7.5e6,'2-4':7.5e6,'2-5':7.5e6,'2-6':7.5e6,
  '2-7':5e6,'2-8':5e6,'2-9':5e6,'2-10':5e6,'2-11':5e6,'2-12':5e6,
  '3-1':3e6,'3-2':3e6,'3-3':3e6,'3-4':3e6,'3-5':3e6,'3-6':3e6,
  '3-7':2e6,'3-8':2e6,'3-9':2e6,'3-10':2e6,'3-11':2e6,'3-12':2e6,
};
function rookieSal(r, p) { return r >= 4 ? 1_000_000 : (ROOKIE_SALARY[`${r}-${p}`] || 1_000_000); }
const fmtM = n => n >= 1e6 ? '$' + (n/1e6).toFixed(1) + 'M' : n >= 1e3 ? '$' + (n/1e3).toFixed(0) + 'K' : '$' + n;

// ── State ─────────────────────────────────────────────────────
let DATA = null;            // roster data
let board = {};             // { 'r-p': { player, team, salary, sleeperPick } }
let rookiePlayers = [];     // available rookie list
let availPosFilter = 'ALL';
let availSearch = '';
let draftInfo = null;

// ── Load everything ───────────────────────────────────────────
async function init() {
  if (!leagueId()) {
    if (window.navigateTo) { navigateTo('home'); return; }
    window.location = 'index.html'; return;
  }

  // Load roster data from Firebase (needed for team dropdowns)
  try {
    const snap = await db.ref(`leagues/${leagueId()}/rosterData`).once('value');
    DATA = snap.val() || {};
  } catch(e) {}
  // Refresh CAP from Firebase settings
  try {
    const capSnap = await db.ref(`leagues/${leagueId()}/settings/cap`).once('value');
    if (capSnap.val()) CAP = capSnap.val();
  } catch(e) {}

  await refreshDraft();
}

// ── State for draft board ─────────────────────────────────────
// slotOwners: { "r-p": teamKey } — who owns each round-pick combo
// e.g. "1-1", "2-3" etc. Allows traded picks to differ by round.
let slotOwners = {};   // "round-pick" → teamKey
let rosterIdToTeam        = {};  // Sleeper roster_id (string) → our teamKey
let rosterIdToDisplayName = {};  // Sleeper roster_id (string) → display name (fallback)

async function loadRosterMapping() {
  rosterIdToTeam = {};
  // The cap team keys ARE the Sleeper usernames — so we just need
  // Sleeper roster_id → username, then look up in DATA directly.
  try {
    const [rosters, users] = await Promise.all([
      fetch(`https://api.sleeper.app/v1/league/${leagueId()}/rosters`).then(r=>r.json()),
      fetch(`https://api.sleeper.app/v1/league/${leagueId()}/users`).then(r=>r.json()),
    ]);
    const userById = {};
    (users||[]).forEach(u => { userById[u.user_id] = u; });
    (rosters||[]).forEach(r => {
      const u = userById[r.owner_id] || {};
      const username = (u.username || '').toLowerCase();
      // Cap key is the username — verify it exists in DATA, fallback to display_name
      const capKey = DATA[username] ? username
                   : Object.keys(DATA||{}).find(k => k.toLowerCase() === (u.display_name||'').toLowerCase())
                   || username;
      rosterIdToTeam[String(r.roster_id)] = capKey;
      rosterIdToDisplayName[String(r.roster_id)] = u.display_name || u.username || `Roster ${r.roster_id}`;
      console.log(`Roster ${r.roster_id} → ${capKey} (${u.display_name})`);
    });
  } catch(e) {
    console.warn('loadRosterMapping:', e);
    // Last resort: try Firebase saved mapping
    try {
      const snap = await db.ref(`leagues/${leagueId()}/usernameToRosterId`).once('value');
      const mapping = snap.val() || {};
      Object.entries(mapping).forEach(([teamKey, rid]) => {
        rosterIdToTeam[String(rid)] = teamKey;
      });
    } catch(e2) {}
  }
}

async function refreshDraft() {
  document.getElementById('board-container').innerHTML =
    '<div class="loading"><div class="spinner"></div><div style="margin-top:10px;">Loading board…</div></div>';

  // Load roster mapping first so we can display team names
  await loadRosterMapping();

  let draftPicks = {};    // key "r-slot" → { player, sleeperPick, rosterId }
  slotOwners = {};        // slot# → teamKey (from slot_to_roster_id)

  try {
    // 1. GET all drafts for this league
    const drafts = await fetch(`https://api.sleeper.app/v1/league/${leagueId()}/drafts`).then(r=>r.json());
    if (!drafts?.length) throw new Error('no drafts');

    // Prefer rookie/linear type over startup
    draftInfo = drafts.find(d => d.type === 'rookie' || d.type === 'linear')
             || drafts.find(d => d.type !== 'startup')
             || drafts[drafts.length - 1];

    if (!draftInfo) throw new Error('no suitable draft');

    // Log the raw draft object so we can see what Sleeper returned
    console.log('=== draftInfo ===', JSON.stringify({
      draft_id: draftInfo.draft_id,
      type: draftInfo.type,
      status: draftInfo.status,
      slot_to_roster_id: draftInfo.slot_to_roster_id,
      draft_order: draftInfo.draft_order,
      settings: draftInfo.settings,
    }, null, 2));
    console.log('=== rosterIdToTeam ===', JSON.stringify(rosterIdToTeam));

    // 2. Build slotOwners from slot_to_roster_id OR draft_order
    //
    // slot_to_roster_id: { "1": roster_id, ... } — set after commissioner locks order
    // draft_order: { user_id: slot_number, ... } — set when draft is created
    // We try slot_to_roster_id first, then fall back to draft_order

    if (draftInfo.slot_to_roster_id && Object.keys(draftInfo.slot_to_roster_id).length) {
      // Expand slot → roster_id to all round-pick combos
      const ROUNDS_N = draftInfo.settings?.rounds || 4;
      const TEAMS_N  = draftInfo.settings?.teams  || 12;
      const isSnakeS = draftInfo.settings?.reversal_round > 0 || draftInfo.type === 'snake';
      Object.entries(draftInfo.slot_to_roster_id).forEach(([slot, rid]) => {
        const teamKey = rosterIdToTeam[String(rid)] || rosterIdToDisplayName[String(rid)] || `roster_${rid}`;
        for (let r = 1; r <= ROUNDS_N; r++) {
          // For snake, even rounds reverse: slot 1 picks last
          const pick = (isSnakeS && r % 2 === 0) ? String(TEAMS_N + 1 - Number(slot)) : String(slot);
          slotOwners[`${r}-${pick}`] = teamKey;
        }
        console.log(`Slot ${slot} → ${teamKey}`);
      });

    } else if (draftInfo.draft_order && Object.keys(draftInfo.draft_order).length) {
      // draft_order: { user_id: slot_number } — invert to slot → user_id
      // Also need user_id → roster_id mapping
      const userIdToRosterId = {};
      try {
        const rosters = await fetch(`https://api.sleeper.app/v1/league/${leagueId()}/rosters`).then(r=>r.json());
        (rosters||[]).forEach(r => { userIdToRosterId[r.owner_id] = r.roster_id; });
      } catch(e) { console.warn('Could not fetch rosters for draft_order mapping:', e); }

      const ROUNDS_D = draftInfo.settings?.rounds || 4;
      const TEAMS_D  = draftInfo.settings?.teams  || 12;
      const isSnakeD = draftInfo.settings?.reversal_round > 0 || draftInfo.type === 'snake';
      Object.entries(draftInfo.draft_order).forEach(([userId, slot]) => {
        const rosterId = userIdToRosterId[userId];
        const teamKey  = rosterId ? rosterIdToTeam[String(rosterId)] : null;
        const dispName = rosterId ? rosterIdToDisplayName[String(rosterId)] : null;
        const val = teamKey || dispName || userId;
        for (let r = 1; r <= ROUNDS_D; r++) {
          const pick = (isSnakeD && r % 2 === 0) ? String(TEAMS_D + 1 - Number(slot)) : String(slot);
          slotOwners[`${r}-${pick}`] = val;
        }
        console.log(`draft_order: user ${userId} → slot ${slot} → ${val}`);
      });

    } else {
      console.warn('No slot_to_roster_id or draft_order found — draft order not set in Sleeper yet');
    }

    // Override with any manually saved pick order from Firebase
    // (takes precedence over Sleeper API data for traded picks)
    try {
      const savedOrder = await db.ref(`leagues/${leagueId()}/draftSlotOwners`).once('value');
      const saved = savedOrder.val();
      if (saved && Object.keys(saved).length) {
        Object.assign(slotOwners, saved);
        console.log('Loaded saved pick order from Firebase:', saved);
      }
    } catch(e) { console.warn('Could not load saved pick order:', e); }

    // 3. Fetch actual picks made (empty array for pre_draft, populated otherwise)
    const picks = await fetch(`https://api.sleeper.app/v1/draft/${draftInfo.draft_id}/picks`).then(r=>r.json());
    if (Array.isArray(picks)) {
      picks.forEach(pk => {
        // draft_slot = position within round (1-12), round = round number
        const slot = pk.draft_slot || pk.pick_no;
        const key  = `${pk.round}-${slot}`;
        const fn   = pk.metadata?.first_name || '';
        const ln   = pk.metadata?.last_name  || '';
        const name = (fn || ln) ? `${fn} ${ln}`.trim() : null;
        if (name) {
          draftPicks[key] = {
            player: name,
            sleeperPick: true,
            rosterId: pk.roster_id,
            // Who actually made this pick (may differ from slot owner if traded)
            pickedByTeam: rosterIdToTeam[String(pk.roster_id)] || null,
          };
        }
      });
    }

    const statusLabel = {
      pre_draft: `📅 Scheduled — pick order is set`,
      in_progress: `🔴 LIVE`,
      complete: `✅ Complete`,
    }[draftInfo.status] || draftInfo.status;

    // Build slot owner debug string
    const slotDebug = Object.entries(slotOwners)
      .sort((a,b) => { const [ar,ap]=a[0].split('-').map(Number); const [br,bp]=b[0].split('-').map(Number); return ar!==br?ar-br:ap-bp; })
      .map(([key, val]) => `${key}:${DATA[val]?.team_name||val}`).join(' · ');
    document.getElementById('draft-subtitle').textContent =
      `${statusLabel} · ${draftInfo.season || ''} · type: ${draftInfo.type} · ID: ${draftInfo.draft_id}`;
    document.getElementById('draft-subtitle').title =
      `Slot owners: ${slotDebug || '(none)'}  |  rosterIdToTeam: ${JSON.stringify(rosterIdToTeam)}`;
    console.log('Slot owners:', slotDebug);

    // Show "Assign All" button when draft is complete and user is commissioner
    const assignBtn = document.getElementById('assign-all-btn');
    if (assignBtn && isComm() && (draftInfo.status === 'complete' || Object.keys(draftPicks).length > 0)) {
      assignBtn.style.display = '';
    }
    // Auto-save complete draft picks to rosters
    if (draftInfo.status === 'complete') {
      await autoSaveCompletedDraft(draftPicks);
    }

  } catch(e) {
    console.warn('Draft load error:', e);
    document.getElementById('draft-subtitle').textContent =
      'Could not load Sleeper draft — check league ID. Manual entry mode active.';
  }

  // 4. Load manual/saved board from Firebase (overrides Sleeper)
  let savedBoard = {};
  try {
    const snap = await db.ref(`leagues/${leagueId()}/rookieDraft`).once('value');
    savedBoard = snap.val() || {};
  } catch(e) {}

  // Merge: Sleeper picks first, Firebase manual picks override
  board = { ...draftPicks, ...savedBoard };

  // 5. Load available rookies
  await loadRookiePlayers();

  // 6. Render
  renderBoard();
  (document.getElementById('draft-loading') || document.getElementById('loading')).style.display = 'none';
  (document.getElementById('draft-app') || document.getElementById('app')).style.display = '';

  // Only show assign/order panels to commissioner
  const draftPanelEl = document.getElementById('draft-action-panel');
  if (draftPanelEl) draftPanelEl.style.display = isComm() ? '' : 'none';
}

async function loadRookiePlayers() {
  try {
    let cached = localStorage.getItem('sb_players');
    if (!cached) {
      // Auto-fetch player database if not cached
      const dbg = document.getElementById('avail-debug');
      if (dbg) dbg.textContent = '(downloading player DB…)';
      try {
        const r = await fetch('https://api.sleeper.app/v1/players/nfl');
        cached = await r.text();
        try { localStorage.setItem('sb_players', cached); } catch(e) {}
      } catch(e) {
        rookiePlayers = []; renderAvailList(); return;
      }
    }
    const players = JSON.parse(cached);
    const SKILL = new Set(['QB','RB','WR','TE']);
    const draftedNames = new Set(Object.values(board).map(p => (p.player||'').toLowerCase()));
    const rostered = new Set();
    Object.values(DATA || {}).forEach(t => {
      [...(t.starters||[]),...(t.ir||[]),...(t.taxi||[])].forEach(p => {
        if (p.name) rostered.add(p.name.toLowerCase());
      });
    });

    rookiePlayers = Object.entries(players)
      .filter(([,p]) => {
        if (!p.fantasy_positions?.some(pos => SKILL.has(pos))) return false;
        // Only confirmed 2026 NFL draftees: years_exp===0 AND active===true
        if (p.years_exp !== 0) return false;
        if (p.active !== true) return false;
        return true;
      })
      .map(([id, p]) => ({
        id,
        name: `${p.first_name} ${p.last_name}`.trim(),
        pos:  p.fantasy_positions?.find(pos => SKILL.has(pos)) || '',
        nflTeam: (p.team && p.team !== 'FA') ? p.team : '—',
        adp: p.search_rank || 999,
        active: p.active === true,
        age: p.age || null,
        ye: p.years_exp != null ? Number(p.years_exp) : null,
        taken: draftedNames.has(`${p.first_name} ${p.last_name}`.trim().toLowerCase())
            || rostered.has(`${p.first_name} ${p.last_name}`.trim().toLowerCase()),
      }))
      .filter(rk => rk.name && rk.name.trim().length > 1)  // remove blank / single-char names
      .sort((a, b) => a.adp - b.adp);

    const ye0  = rookiePlayers.filter(r => r.ye === 0).length;
    const ye1  = rookiePlayers.filter(r => r.ye === 1).length;
    const yeN  = rookiePlayers.filter(r => r.ye === null).length;
    console.log(`Loaded ${rookiePlayers.length} rookie players (ye=0: ${ye0}, ye=1: ${ye1}, ye=null: ${yeN})`);
  } catch(e) {
    console.warn('loadRookiePlayers:', e);
    rookiePlayers = [];
  }
  renderAvailList();
  // Show debug stats in panel header
  const dbg = document.getElementById('avail-debug');
  if (dbg) {
    const ye0c  = rookiePlayers.filter(r => r.ye === 0).length;
    const ye1c  = rookiePlayers.filter(r => r.ye === 1).length;
    const total = rookiePlayers.length;
    dbg.textContent = `(${total} total · ${ye0c} confirmed · ${ye1c} 2nd yr)`;
  }
}


async function assignAllCompleted() {
  const btn = document.getElementById('assign-all-btn');
  if (btn) { btn.textContent = 'Saving…'; btn.disabled = true; }
  // Re-fetch picks from Sleeper and save them all
  if (draftInfo) {
    const picks = await fetch(`https://api.sleeper.app/v1/draft/${draftInfo.draft_id}/picks`).then(r=>r.json());
    const draftPicks = {};
    if (Array.isArray(picks)) {
      picks.forEach(pk => {
        const slot = pk.draft_slot || pk.pick_no;
        const key  = `${pk.round}-${slot}`;
        const fn   = pk.metadata?.first_name || '';
        const ln   = pk.metadata?.last_name  || '';
        const name = (fn || ln) ? `${fn} ${ln}`.trim() : null;
        if (name) draftPicks[key] = { player: name, sleeperPick: true, rosterId: pk.roster_id };
      });
    }
    await autoSaveCompletedDraft(draftPicks);
  }
  if (btn) { btn.textContent = '✅ Done'; setTimeout(() => { btn.textContent = '✓ Assign All Picks to Active Rosters'; btn.disabled = false; }, 2000); }
  renderBoard();
}

// Auto-save completed Sleeper draft picks to Firebase and roster data
async function autoSaveCompletedDraft(draftPicks) {
  try {
    // Load roster ID → teamKey mapping
    const mapSnap = await db.ref(`leagues/${leagueId()}/usernameToRosterId`).once('value');
    const rosterMap = mapSnap.val() || {};
    // Invert: rosterId → teamKey
    const rosterIdToTeam = {};
    Object.entries(rosterMap).forEach(([teamKey, rid]) => { rosterIdToTeam[rid] = teamKey; });

    const boardSnap = await db.ref(`leagues/${leagueId()}/rookieDraft`).once('value');
    const existingBoard = boardSnap.val() || {};

    let changed = false;
    for (const [key, pick] of Object.entries(draftPicks)) {
      if (existingBoard[key]) continue; // already saved manually, skip
      const teamKey = rosterIdToTeam[pick.rosterId];
      if (!teamKey || !DATA[teamKey]) continue;

      // Calculate salary from pick key
      const [r, p] = key.split('-').map(Number);
      const sal = rookieSal(r, p);

      // Add to active roster (not taxi - commissioner will move to taxi if needed)
      if (!DATA[teamKey].starters) DATA[teamKey].starters = [];
      const alreadyRostered = [...(DATA[teamKey].starters||[]),...(DATA[teamKey].taxi||[])].some(pl => pl.name === pick.player);
      if (!alreadyRostered) {
        DATA[teamKey].starters.push({ name: pick.player, pos: '—', salary: sal });
        changed = true;
      }

      // Save to draft board
      existingBoard[key] = { player: pick.player, team: teamKey, salary: sal, fromSleeper: true };
    }

    if (changed) {
      // Recalculate cap for affected teams and check over-cap
      Object.values(DATA).forEach(t => {
        t.cap_spent = (t.starters||[]).reduce((s,p)=>s+p.salary,0)
                    + (t.ir||[]).reduce((s,p)=>s+Math.round(p.salary*.75),0);
      });
      await db.ref(`leagues/${leagueId()}/rosterData`).set(DATA);
      await db.ref(`leagues/${leagueId()}/rookieDraft`).set(existingBoard);
    }
  } catch(e) { console.warn('autoSaveCompletedDraft:', e); }
}

// ── Render board ──────────────────────────────────────────────
function renderBoard() {
  const ROUNDS = 4, PICKS = 12;
  const comm = isComm();
  let html = '';

  for (let r = 1; r <= ROUNDS; r++) {
    const salLabel = r===1 ? '$15M / $10M' : r===2 ? '$7.5M / $5M' : r===3 ? '$3M / $2M' : '$1M';
    html += `<div class="round-section">
      <div class="round-header">
        <span class="round-label">Round ${r}</span>
        <span class="round-salary">${salLabel}</span>
      </div>
      <div class="picks-grid">`;

    for (let p = 1; p <= PICKS; p++) {
      const key = `${r}-${p}`;
      const sal = rookieSal(r, p);
      const pick = board[key] || {};
      const assigned = !!pick.player;
      // Who currently OWNS this slot (after trades), from slot_to_roster_id
      // For snake drafts, even rounds reverse the pick order
      // Look up owner by round-pick key directly
      const ownerKey  = slotOwners[`${r}-${p}`] || null;
      const ownerName = ownerKey ? (DATA[ownerKey]?.team_name || ownerKey) : null;
      const isSleeper = pick.sleeperPick && !pick.team;
      const assignedTeamKey  = pick.team || null;
      const assignedTeamName = assignedTeamKey ? (DATA[assignedTeamKey]?.team_name || assignedTeamKey) : '';
      const isOverCap = assignedTeamKey && DATA[assignedTeamKey]?.cap_spent > CAP;

      const cardCls = assigned
        ? (pick.team ? 'assigned' : 'sleeper-pick')
        : (ownerKey ? 'has-owner' : '');

      html += `<div class="pick-card ${cardCls}">
        <div class="pick-num">
          <span>Pick ${r}.${String(p).padStart(2,'0')}</span>
          <span class="pick-sal">${fmtM(sal)}</span>
        </div>`;

      // Always show slot owner on every card
      if (ownerName) {
        html += `<div class="pick-owner">${ownerName}</div>`;
      }

      if (assigned) {
        html += `<div class="pick-player">${pick.player}</div>
          <div class="pick-team" style="${isOverCap?'color:var(--red);font-weight:600;':''}">
            ${assignedTeamName || ownerName || ''}${isOverCap?' ⚠️ OVER CAP':''}
          </div>
          ${isSleeper ? '<div class="pick-source">via Sleeper</div>' : ''}
          ${comm ? `<button class="pick-clear" onclick="clearPick('${key}')">✕ Clear</button>` : ''}`;
      } else if (comm) {
        // Nothing shown in card — use the assign panel on the right
      } else {
        html += `<div style="font-size:12px;color:var(--text3);margin-top:4px;">Open pick</div>`;
      }

      html += '</div>'; // pick-card
    }
    html += '</div></div>'; // picks-grid + round-section
  }

  document.getElementById('board-container').innerHTML = html;
}

// ── Render available list ─────────────────────────────────────
function renderAvailList() {
  const draftedNames = new Set(Object.values(board).map(p => (p.player||'').toLowerCase()));
  const list = document.getElementById('avail-list');

  if (!rookiePlayers.length) {
    list.innerHTML = localStorage.getItem('sb_players')
      ? '<div style="padding:16px;text-align:center;color:var(--text3);font-size:12px;">No rookies found. Try refreshing.</div>'
      : '<div style="padding:16px;text-align:center;color:var(--text3);font-size:12px;">Loading player database…</div>';
    return;
  }

  // Filter: exclude taken/already-drafted, apply pos + search filters
  let filtered = rookiePlayers.filter(rk => {
    if (rk.taken || draftedNames.has(rk.name.toLowerCase())) return false;
    if (availPosFilter !== 'ALL' && rk.pos !== availPosFilter) return false;
    if (availSearch && !rk.name.toLowerCase().includes(availSearch)) return false;
    return true;
  });

  // Sort: by search_rank if available, otherwise alphabetical by name
  filtered.sort((a, b) => {
    const ar = a.adp < 999 ? a.adp : null;
    const br = b.adp < 999 ? b.adp : null;
    if (ar !== null && br !== null) return ar - br;
    if (ar !== null) return -1;  // ranked players first
    if (br !== null) return 1;
    return a.name.localeCompare(b.name);  // alphabetical for unranked
  });

  if (!filtered.length) {
    list.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text3);font-size:12px;">'
      + (availSearch ? 'No players match "' + availSearch + '"' : 'No available rookies at this position.') + '</div>';
    return;
  }

  list.innerHTML = filtered.map(rk =>
    `<div class="avail-player">
      <div>
        <div class="avail-player-name">
          <span class="pb pb-${rk.pos}">${rk.pos}</span>
          <span style="margin-left:5px;">${rk.name}</span>
        </div>
        <div class="avail-player-sub">${rk.nflTeam !== '—' ? rk.nflTeam : 'Unsigned'}</div>
      </div>
      <div class="avail-adp">${rk.adp < 999 ? '#'+rk.adp : '—'}</div>
    </div>`
  ).join('');
}

function setAvailPos(pos, el) {
  availPosFilter = pos;
  const draftScope = document.getElementById('view-draft') || document;
  draftScope.querySelectorAll('.avail-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderAvailList();
}
function clearAvailSearch() {
  availSearch = '';
  const inp = document.getElementById('avail-search-input');
  if (inp) inp.value = '';
  renderAvailList();
}

// ── Assign / clear picks ──────────────────────────────────────
function onPlayerSelect(key, sel) {
  const manual = document.getElementById(`pman-${key}`);
  if (manual) manual.style.display = sel.value === '__manual__' ? '' : 'none';
}

// ── Assign panel ─────────────────────────────────────────────
function onAssignRoundOrSlotChange() {
  const r = document.getElementById('assign-round-sel').value;
  const p = document.getElementById('assign-slot-sel').value;
  const ownerLabel = document.getElementById('assign-owner-label');
  const tSel = document.getElementById('assign-team-sel');
  const pSel = document.getElementById('assign-player-sel');

  if (!r || !p) {
    ownerLabel.textContent = '';
    return;
  }

  // Look up owner by round-pick key directly
  const ownerKey = slotOwners[`${r}-${p}`] || null;
  const ownerName = ownerKey ? (DATA[ownerKey]?.team_name || ownerKey) : null;

  // Show who owns the pick
  ownerLabel.textContent = ownerName ? `Pick ${r}.${String(p).padStart(2,'0')} owned by: ${ownerName}` : '';

  // Pre-populate team dropdown with owner
  tSel.innerHTML = '<option value="">— assign to team —</option>' +
    Object.entries(DATA||{}).map(([k,t]) =>
      `<option value="${k}"${k===ownerKey?' selected':''}>${t.team_name}</option>`
    ).join('');

  // Populate player dropdown with available rookies (sorted rank then alpha)
  const draftedNames = new Set(Object.values(board).map(b => (b.player||'').toLowerCase()));
  const avail = rookiePlayers
    .filter(rk => !rk.taken && !draftedNames.has(rk.name.toLowerCase()))
    .sort((a, b) => {
      const ar = a.adp < 999 ? a.adp : null;
      const br = b.adp < 999 ? b.adp : null;
      if (ar !== null && br !== null) return ar - br;
      if (ar !== null) return -1;
      if (br !== null) return 1;
      return a.name.localeCompare(b.name);
    });
  pSel.innerHTML = '<option value="">— select player —</option>' +
    avail.map(rk =>
      `<option value="${rk.name}">${rk.name} · ${rk.pos}${rk.nflTeam!=='—'?' · '+rk.nflTeam:''}${rk.adp<999?' (#'+rk.adp+')':''}</option>`
    ).join('') +
    '<option value="__manual__">✏️ Type name manually…</option>';
}

async function doAssignFromPanel() {
  const r = document.getElementById('assign-round-sel').value;
  const p = document.getElementById('assign-slot-sel').value;
  let playerName  = document.getElementById('assign-player-sel').value;
  const teamKey   = document.getElementById('assign-team-sel').value;

  if (!r || !p)      { alert('Select a round and pick number.'); return; }
  if (!playerName)   { alert('Select a player.'); return; }
  if (!teamKey)      { alert('Select a team.'); return; }

  if (playerName === '__manual__') {
    playerName = prompt('Enter player name:');
    if (!playerName?.trim()) return;
    playerName = playerName.trim();
  }

  const key = `${r}-${p}`;
  const sal = rookieSal(Number(r), Number(p));
  await assignPick(key, sal, playerName, teamKey);

  // Reset round/slot selects and refresh player list
  document.getElementById('assign-round-sel').value = '';
  document.getElementById('assign-slot-sel').value  = '';
  document.getElementById('assign-owner-label').textContent = '';
  document.getElementById('assign-player-sel').innerHTML = '<option value="">— select player —</option>';
  document.getElementById('assign-team-sel').innerHTML   = '<option value="">— assign to team —</option>';
}


async function assignPick(key, salary, suppliedPlayer, suppliedTeam) {
  // Called either from old per-card selects OR from the new bottom panel
  let pName, teamKey;

  if (suppliedPlayer && suppliedTeam) {
    pName   = suppliedPlayer;
    teamKey = suppliedTeam;
  } else {
    const pSel = document.getElementById(`psel-${key}`);
    const pMan = document.getElementById(`pman-${key}`);
    const tSel = document.getElementById(`tsel-${key}`);
    if (!pSel || !tSel) return;
    pName   = pSel.value === '__manual__' ? (pMan?.value || '').trim() : pSel.value;
    teamKey = tSel.value;
  }

  if (!pName)   { alert('Select or enter a player name'); return; }
  if (!teamKey) { alert('Select an owner'); return; }

  // Add to Firebase rookieDraft board
  const entry = { player: pName, team: teamKey, salary, assignedAt: Date.now() };
  await db.ref(`leagues/${leagueId()}/rookieDraft/${key}`).set(entry);
  board[key] = entry;

  // Add to team's ACTIVE roster (not taxi — commissioner moves to taxi manually if needed)
  if (DATA && DATA[teamKey]) {
    if (!DATA[teamKey].starters) DATA[teamKey].starters = [];
    const already = [...(DATA[teamKey].starters||[]),...(DATA[teamKey].taxi||[])].some(p => p.name === pName);
    if (!already) {
      DATA[teamKey].starters.push({ name: pName, pos: '—', salary });
    }
    // Recalculate cap
    DATA[teamKey].cap_spent = (DATA[teamKey].starters||[]).reduce((s,p)=>s+p.salary,0)
      + (DATA[teamKey].ir||[]).reduce((s,p)=>s+Math.round(p.salary*.75),0);
    await db.ref(`leagues/${leagueId()}/rosterData`).set(DATA);
    // Warn if over cap
    if (DATA[teamKey].cap_spent > CAP) {
      const over = fmtM(DATA[teamKey].cap_spent - CAP);
      setTimeout(() => alert(`⚠️ ${DATA[teamKey].team_name} is now OVER CAP by ${over}!\nThey need to drop players to get under ${fmtM(CAP)}.`), 100);
    }
  }

  await loadRookiePlayers();
  renderBoard();
}

async function clearPick(key) {
  const pick = board[key];
  if (!pick) return;

  // Remove from starters (where assignPick places them)
  if (pick.team && DATA && DATA[pick.team]) {
    const t = DATA[pick.team];
    for (const slot of ['starters', 'taxi']) {
      const arr = t[slot] || [];
      const idx = arr.findIndex(p => p.name === pick.player);
      if (idx > -1) {
        arr.splice(idx, 1);
        t.cap_spent = (t.starters||[]).reduce((s,p)=>s+p.salary,0)
          + (t.ir||[]).reduce((s,p)=>s+Math.round(p.salary*.75),0);
        await db.ref(`leagues/${leagueId()}/rosterData`).set(DATA);
        break;
      }
    }
  }

  await db.ref(`leagues/${leagueId()}/rookieDraft/${key}`).remove();
  delete board[key];
  await loadRookiePlayers();
  renderBoard();
}

// ── Draft panel tab switching ─────────────────────────────────
function switchDraftTab(tab) {
  const isAssign = tab === 'assign';
  document.getElementById('assign-panel').style.display = isAssign ? '' : 'none';
  document.getElementById('order-panel').style.display  = isAssign ? 'none' : '';
  document.getElementById('tab-assign').style.background = isAssign ? 'var(--accent)' : 'var(--surface2)';
  document.getElementById('tab-assign').style.color      = isAssign ? '#fff' : 'var(--text3)';
  document.getElementById('tab-order').style.background  = isAssign ? 'var(--surface2)' : 'var(--accent)';
  document.getElementById('tab-order').style.color       = isAssign ? 'var(--text3)' : '#fff';
  if (!isAssign) renderOrderPanel();
}

// ── Pick order editor ─────────────────────────────────────────
function renderOrderPanel() {
  const ROUNDS = draftInfo?.settings?.rounds || 4;
  const TEAMS  = draftInfo?.settings?.teams  || 12;
  const container = document.getElementById('order-rows');
  if (!container) return;

  const selStyle = 'padding:4px 6px;background:var(--surface2);border:1px solid var(--border);border-radius:4px;color:var(--text);font-family:var(--font-body);font-size:11px;outline:none;flex:1;';

  let rows = '';
  for (let r = 1; r <= ROUNDS; r++) {
    rows += `<div style="font-size:10px;font-weight:600;text-transform:uppercase;color:var(--text3);letter-spacing:.4px;padding:8px 0 4px;${r>1?'border-top:1px solid var(--border);margin-top:4px;':''}">Round ${r}</div>`;
    for (let p = 1; p <= TEAMS; p++) {
      const key   = r + '-' + p;
      const owner = slotOwners[key] || '';
      const teamOpts = '<option value="">— owner —</option>' +
        Object.entries(DATA||{}).map(([k,t]) =>
          '<option value="' + k + '"' + (k===owner?' selected':'') + '>' + t.team_name + '</option>'
        ).join('');
      rows += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">' +
        '<span style="font-size:11px;font-family:var(--font-mono);color:var(--text3);min-width:36px;">' + r + '.' + String(p).padStart(2,'0') + '</span>' +
        '<select data-key="' + key + '" style="' + selStyle + '">' + teamOpts + '</select>' +
        '</div>';
    }
  }
  container.innerHTML = rows;
}

async function savePickOrder(btn) {
  btn.disabled = true;
  btn.textContent = 'Saving…';

  // Read each round-pick select and update slotOwners
  document.querySelectorAll('#order-rows select[data-key]').forEach(sel => {
    const key = sel.dataset.key;
    const teamKey = sel.value;
    if (key && teamKey) slotOwners[key] = teamKey;
  });

  // Save to Firebase
  try {
    if (leagueId()) {
      await db.ref(`leagues/${leagueId()}/draftSlotOwners`).set(slotOwners);
    }
    renderBoard();
    onAssignRoundOrSlotChange();
    btn.textContent = '✅ Saved!';
  } catch(e) {
    console.error('savePickOrder failed:', e);
    btn.textContent = '❌ Save failed';
  }
  setTimeout(() => { btn.textContent = '💾 Save Pick Order'; btn.disabled = false; }, 2000);
}


function showSlotData() {
  const rows = Object.entries(slotOwners)
    .sort((a,b) => { const [ar,ap]=a[0].split('-').map(Number); const [br,bp]=b[0].split('-').map(Number); return ar!==br?ar-br:ap-bp; })
    .map(([key, val]) => {
      const teamName = DATA[val]?.team_name || val;
      return `Pick ${key}: ${teamName}`;
    });
  const rMap = Object.entries(rosterIdToTeam)
    .map(([rid, key]) => `  rid ${rid} → "${key}" (${DATA[key]?.team_name||'NOT IN DATA'})`).join('\n');
  const rawSlot = JSON.stringify(draftInfo?.slot_to_roster_id || 'MISSING', null, 2);
  const rawOrder = JSON.stringify(draftInfo?.draft_order || 'MISSING', null, 2);
  alert(
    `=== slotOwners (${rows.length}) ===\n${rows.join('\n') || '(empty)'}\n\n` +
    `=== raw slot_to_roster_id ===\n${rawSlot}\n\n` +
    `=== raw draft_order ===\n${rawOrder}\n\n` +
    `=== rosterIdToTeam (${Object.keys(rosterIdToTeam).length}) ===\n${rMap}\n\n` +
    `Draft: ${draftInfo?.type || '?'} · status: ${draftInfo?.status || '?'} · teams: ${draftInfo?.settings?.teams || '?'}`
  );
}

// ── Boot ──────────────────────────────────────────────────────
// Works as standalone page (DOM ready) or SPA injection (called by initDraftView)
function draftInit() { init(); }
if (document.getElementById('board-container')) {
  draftInit();
} else {
  window._draftInitPending = true;
}
