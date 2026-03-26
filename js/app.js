
// ── FAAB seed data — TRUE DOLLAR AMOUNTS ─────────────────────
// All values in full dollars. $1,123 → $1,123,000,000? No —
// these are FAAB budgets. Converting: old $1 = $100,000.
// So $1123 legacy → $112,300,000 real dollars.
const FAAB_SEED = {
  'schardt312':    112_300_000,
  'spicytunaroll': 113_600_000,
  'notgreatbob':   119_100_000,
  'tmill85':       106_100_000,
  'abomb25':       113_800_000,
  'kodypetey':     114_000_000,
  'mkim521':       130_300_000,
  'stupend0us':    106_100_000,
  'iowafan30':     130_700_000,
  'dlon16':        113_500_000,
  'southy610':     109_800_000,
  'mraladdin23':   106_400_000,
};

// ─────────────────────────────────────────────────────────────
//  APP  — main controller
// ─────────────────────────────────────────────────────────────

const App = (() => {

  const SKILL_POSITIONS    = new Set(['QB', 'RB', 'WR', 'TE']);
  const COMMISSIONER_USERNAME = 'mraladdin23';
  const MIN_BID            = Auction.MIN_BID; // $100,000

  const state = {
    user:            null,
    leagueId:        null,
    isGuest:         false,
    leagueFeatures:  { auctions: true, rosters: true, standings: true, draft: true },
    leagueType:      'salary_auction',
    leagueName:      '',
    leagueSettings:  null,
    scoringSettings: {},
    rosterPositions: [],
    teams:           [],
    players:         {},
    statsMap:        {},
    statYear:        2025,
    freeAgents:      [],
    auctions:        [],
    faabOverrides:   {},
    posFilter:       'ALL',
    isCommissioner:  false,
    activeNomPlayerId:  null,
    activeBidAuctionId: null,
    rosterSizes:     {},
    activityFeed:    [],
    watchlist:       {},     // { [playerId]: true }
    bidPending:      false,  // for 1-tap confirm
  };

  const session = {
    get username()  { return localStorage.getItem('sb_username')  || ''; },
    get leagueId()  { return localStorage.getItem('sb_leagueId')  || ''; },
    set username(v) { localStorage.setItem('sb_username', v); },
    set leagueId(v) { localStorage.setItem('sb_leagueId', v); },
    setUser(u)      { localStorage.setItem('sb_user', JSON.stringify(u)); },
    clear()         { localStorage.removeItem('sb_username'); localStorage.removeItem('sb_leagueId'); localStorage.removeItem('sb_user'); },
  };

  // ── Dollar formatting ────────────────────────────────────
  // Shared with UI — formats full dollar integers as $1.1M, $500K, $100K etc.
  function fmtFaab(n) {
    if (n === undefined || n === null) return '$0';
    if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'M';
    if (n >= 1_000)     return '$' + (n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 0) + 'K';
    return '$' + n;
  }

  // ── Boot ────────────────────────────────────────────────

  // ── League Registry & Picker ────────────────────────────────

  async function showLeaguePicker() {
    UI.showScreen('picker');
    if (!window.applyLeagueOrder) {
      loadScript('js/leaguegroups.js', () => {});
    }
    UI.setAvatar(document.getElementById('picker-avatar'), state.user);
    const el       = document.getElementById('picker-leagues');
    const subtitle = document.getElementById('picker-subtitle');
    if (!el) return;

    el.innerHTML = '<div style="color:var(--text3);font-size:13px;padding:20px 0;">Loading your leagues…</div>';

    try {
      const season = new Date().getFullYear();
      // Fetch this user's leagues from Sleeper
      const sleeperLeagues = await Sleeper.fetchUserLeagues(state.user.user_id, season);

      // Fetch registered leagues from Firebase
      const regSnap = await db.ref('leagues/_registry').once('value');
      const registry = regSnap.val() || {};

      // Leagues in both Sleeper + Firebase registry = selectable
      const sleeperIds     = new Set((sleeperLeagues || []).map(l => l.league_id));
      const registeredIds  = new Set(Object.keys(registry));
      const matches        = (sleeperLeagues || []).filter(l => registeredIds.has(l.league_id));
      // Leagues in registry but not in this user's Sleeper list
      // Only show ones THIS user added (addedBy check) to prevent leaking other users' leagues
      const myUsername = (state.user?.username || '').toLowerCase();
      const extraIds = [...registeredIds].filter(id => {
        if (sleeperIds.has(id)) return false; // already in matches
        const meta = registry[id];
        // Show if user added it themselves, or if they're the commissioner
        return (meta?.addedBy || '').toLowerCase() === myUsername;
      });
      // Leagues user is in on Sleeper but NOT yet registered -- offer to add
      // Also detect "renewed" leagues: new league_id whose previous_league_id IS registered
      const registeredPrevIds = new Set(
        Object.values(registry).map(r => r.previousLeagueId).filter(Boolean)
      );
      const unregistered = (sleeperLeagues || []).filter(l => !registeredIds.has(l.league_id));
      // Tag renewals: new league whose predecessor is registered
      const renewals = unregistered.filter(l => registeredIds.has(l.previous_league_id));

      // Build display list
      const displayLeagues = [
        ...matches.map(l => ({
          id:           l.league_id,
          name:         registry[l.league_id]?.name || l.name,
          season:       l.season || season,
          status:       l.status,
          avatar:       l.avatar,
          meta:         registry[l.league_id],
          unregistered: false,
        })),
        ...extraIds.map(id => ({
          id,
          name:         registry[id]?.name || `League ${id}`,
          season:       registry[id]?.season || season,
          status:       registry[id]?.status || 'unknown',
          meta:         registry[id],
          unregistered: false,
        })),
        ...unregistered.filter(l => !registeredIds.has(l.previous_league_id)).map(l => ({
          id:           l.league_id,
          name:         l.name,
          season:       l.season || season,
          status:       l.status,
          meta:         null,
          unregistered: true,
          isRenewal:    false,
        })),
        // Renewed leagues: current season version of a registered league
        ...renewals.map(l => ({
          id:           l.league_id,
          name:         l.name,
          season:       l.season || season,
          status:       l.status,
          meta:         registry[l.previous_league_id],
          unregistered: false,
          isRenewal:    true,
          previousId:   l.previous_league_id,
        })),
      ];

      // Sort: active first, then by name
      // Apply hide-commish-only filter
      const hideCommishOnly = document.getElementById('hide-commish-only')?.checked;
      // Build hide-commish-only filter
      // "Hide leagues without my team" = hide leagues where user has no roster (owner_id match)
      // We check rosters lazily and cache in sessionStorage
      let filteredLeagues = displayLeagues;
      if (hideCommishOnly) {
        // For leagues the user IS a Sleeper member of (matches), check if they own a roster
        const userId = state.user?.user_id;
        const rosterChecks = await Promise.all(
          matches.map(async l => {
            const cacheKey = `sb_hasroster_${l.league_id}`;
            const cached = sessionStorage.getItem(cacheKey);
            if (cached !== null) return { id: l.league_id, hasRoster: cached === '1' };
            try {
              const rosters = await fetch(`https://api.sleeper.app/v1/league/${l.league_id}/rosters`).then(r=>r.json());
              const has = (rosters||[]).some(r => r.owner_id === userId);
              sessionStorage.setItem(cacheKey, has ? '1' : '0');
              return { id: l.league_id, hasRoster: has };
            } catch(e) { return { id: l.league_id, hasRoster: true }; } // fail open
          })
        );
        const hasRosterIds = new Set(rosterChecks.filter(r => r.hasRoster).map(r => r.id));
        // Keep league if: user has a roster in it, OR it's unregistered/renewal (handle separately)
        // Only keep leagues where user has an actual roster, plus unregistered/renewal cards
        filteredLeagues = displayLeagues.filter(l =>
          l.unregistered || l.isRenewal || hasRosterIds.has(l.id)
        );
      }

      // Sort: active first, then alphabetical
      filteredLeagues.sort((a,b) => {
        const aActive = a.status === 'in_season' || a.status === 'pre_draft';
        const bActive = b.status === 'in_season' || b.status === 'pre_draft';
        if (aActive !== bActive) return aActive ? -1 : 1;
        return (a.name||'').localeCompare(b.name||'');
      });

      // Apply user-defined drag order if leaguegroups.js is loaded
      const orderedLeagues = window.applyLeagueOrder ? applyLeagueOrder(filteredLeagues) : filteredLeagues;

      if (!displayLeagues.length) {
        el.innerHTML = `
          <div style="padding:32px;text-align:center;background:var(--surface);border:1px solid var(--border);
            border-radius:var(--radius);color:var(--text3);">
            <div style="font-size:24px;margin-bottom:12px;">🏈</div>
            <div style="font-size:14px;font-weight:600;margin-bottom:6px;">No registered leagues found</div>
            <div style="font-size:12px;">Register your league using the form below.</div>
          </div>`;
        if (subtitle) subtitle.textContent = 'No leagues registered yet';
        return;
      }

      if (subtitle) subtitle.textContent = `${displayLeagues.length} league${displayLeagues.length!==1?'s':''} available`;

      // Show cross-league player report button if user is in 2+ registered leagues
      const reportBtn = document.getElementById('picker-player-report-btn');
      if (reportBtn) reportBtn.style.display = matches.length > 1 ? '' : 'none';

      window._pickerLeagues = orderedLeagues;
      // Build personal label map for card chips
      const labelMap = window.getLeagueLabelMap ? getLeagueLabelMap() : {};
      el.innerHTML = orderedLeagues.map(l => {
        const statusColor = { in_season:'var(--green)', pre_draft:'var(--yellow)',
          drafting:'var(--accent2)', complete:'var(--text3)' }[l.status] || 'var(--text3)';
        const statusLabel = { in_season:'🟢 In Season', pre_draft:'🟡 Pre-Draft',
          drafting:'🟣 Drafting', complete:'⚪ Complete' }[l.status] || l.status || '—';
        const features    = l.meta?.features || {};
        const featureTags = Object.entries(features)
          .filter(([,v]) => v)
          .map(([k]) => `<span style="font-size:10px;padding:2px 7px;border-radius:99px;
            background:var(--surface2);color:var(--text3);border:1px solid var(--border);">${k}</span>`)
          .join('');
        const labelChip = labelMap[l.id]
          ? `<span style="font-size:10px;padding:2px 8px;border-radius:99px;
              background:${labelMap[l.id].color}22;color:${labelMap[l.id].color};
              border:1px solid ${labelMap[l.id].color}55;font-weight:600;">${labelMap[l.id].name}</span>`
          : '';
        if (l.unregistered) {
          return `
            <div style="background:var(--surface);border:1px dashed var(--border);border-radius:var(--radius);padding:16px 18px;opacity:.85;">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
                <div style="min-width:0;">
                  <div style="font-size:15px;font-weight:600;margin-bottom:3px;">${l.name}</div>
                  <div style="font-size:12px;color:var(--text3);">${l.season} Season · Not yet added</div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0;">
                  <div style="font-size:12px;color:${statusColor};font-weight:500;">${statusLabel}</div>
                  <button onclick="document.getElementById('picker-league-id').value='${l.id}';App.registerLeague()"
                    style="font-size:11px;padding:4px 12px;background:var(--accent);color:#fff;border:none;border-radius:4px;cursor:pointer;font-family:var(--font-body);font-weight:600;">
                    + Add League
                  </button>
                </div>
              </div>
            </div>`;
        }
        if (l.isRenewal) {
          return `
            <div style="background:var(--surface);border:1px solid var(--accent2);border-radius:var(--radius);padding:16px 18px;">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
                <div style="min-width:0;">
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;">
                    <div style="font-size:15px;font-weight:600;">${l.name}</div>
                    <span style="font-size:10px;padding:2px 7px;background:var(--accent2);color:#fff;border-radius:99px;font-weight:600;">NEW SEASON</span>
                  </div>
                  <div style="font-size:12px;color:var(--text3);">${l.season} · Previous league updated to new ID</div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0;">
                  <button onclick="App.updateLeagueSeason('${l.id}','${l.previousId}')"
                    style="font-size:11px;padding:5px 14px;background:var(--accent2);color:#fff;border:none;border-radius:4px;cursor:pointer;font-family:var(--font-body);font-weight:600;">
                    🔄 Update to ${l.season}
                  </button>
                </div>
              </div>
            </div>`;
        }
        return `
          <div onclick="App.pickLeague('${l.id}')"
            data-league-id="${l.id}"
            draggable="true"
            ondragstart="if(window.onLeagueDragStart)onLeagueDragStart(event,'${l.id}')"
            ondragend="if(window.onLeagueDragEnd)onLeagueDragEnd(event)"
            ondragover="if(window.onLeagueDragOver)onLeagueDragOver(event)"
            ondragleave="if(window.onLeagueDragLeave)onLeagueDragLeave(event)"
            ondrop="if(window.onLeagueDrop)onLeagueDrop(event,'${l.id}')"
            style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);
            padding:16px 18px;cursor:pointer;transition:border-color .15s;"
            onmouseover="this.style.borderColor='var(--accent)'"
            onmouseout="this.style.borderColor='var(--border)'">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
              <div style="min-width:0;">
                <div style="font-size:15px;font-weight:600;margin-bottom:3px;">${l.name}</div>
                <div style="font-size:12px;color:var(--text3);">${l.season} Season</div>
                <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px;">${[featureTags, labelChip].filter(Boolean).join('')}</div>
              </div>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0;">
                <div style="font-size:12px;color:${statusColor};font-weight:500;">${statusLabel}</div>
                <div style="font-size:11px;color:var(--text3);">ID: ${l.id.slice(-8)}</div>
                ${l.meta?.addedBy === (state.user?.username||'').toLowerCase() || state.isCommissioner
                  ? `<button onclick="event.stopPropagation();App.deleteLeague('${l.id}','${l.name.replace(/'/g,"\'")}')"
                      style="font-size:11px;padding:3px 9px;background:none;border:1px solid rgba(255,77,106,.4);
                      border-radius:4px;color:var(--red);cursor:pointer;font-family:var(--font-body);">
                      🗑 Remove
                    </button>`
                  : ''}
              </div>
            </div>
          </div>`;
      }).join('');

    } catch(e) {
      el.innerHTML = `<div style="color:var(--red);font-size:13px;">Error loading leagues: ${e.message}</div>`;
    }
  }

  async function pickLeague(leagueId) {
    // Clear all view caches so every view re-initializes for the new league
    if (typeof viewsLoaded !== 'undefined') {
      Object.keys(viewsLoaded).forEach(k => delete viewsLoaded[k]);
    }
    if (window.capUnsubscribe) window.capUnsubscribe();
    window._standingsInitPending = false;
    window._capLeagueType = null;
    window._capTeams      = null;

    state.leagueId   = leagueId;
    session.leagueId = leagueId;
    // Reset draft viewing state so draft shows correct league
    window.viewingDraftLeagueId = null;
    window.draftSeasons = null;
    UI.showScreen('loading');
    UI.setLoading('Loading league…');
    await initApp();
  }

  function showLeaguePasswordPrompt(leagueId, username) {
    if (!document.getElementById('league-pw-modal')) {
      const overlay = document.createElement('div');
      overlay.id = 'league-pw-modal';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;display:flex;align-items:center;justify-content:center;';
      overlay.innerHTML = `
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);
          padding:28px 24px;width:340px;max-width:90vw;">
          <div style="font-size:15px;font-weight:600;margin-bottom:16px;">🔑 League Password</div>
          <input type="password" id="league-pw-input" placeholder="Enter your team password"
            style="width:100%;padding:10px 12px;background:var(--surface2);border:1px solid var(--border);
            border-radius:var(--radius-sm);color:var(--text);font-family:var(--font-body);font-size:14px;
            outline:none;box-sizing:border-box;margin-bottom:10px;"
            onkeydown="if(event.key==='Enter')App.submitLeaguePassword()"/>
          <div id="league-pw-error" style="font-size:12px;color:var(--red);min-height:16px;margin-bottom:12px;"></div>
          <div style="display:flex;gap:8px;">
            <button onclick="App.submitLeaguePassword()"
              style="flex:1;padding:9px;background:var(--accent);border:none;border-radius:var(--radius-sm);
              color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--font-body);">Enter</button>
            <button onclick="document.getElementById('league-pw-modal').remove()"
              style="padding:9px 14px;background:var(--surface2);border:1px solid var(--border);
              border-radius:var(--radius-sm);color:var(--text2);font-size:13px;cursor:pointer;
              font-family:var(--font-body);">Cancel</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
    }
    document.getElementById('league-pw-input').value = '';
    document.getElementById('league-pw-error').textContent = '';
    setTimeout(() => document.getElementById('league-pw-input')?.focus(), 50);
    window._pendingLeagueId = leagueId;
    window._pendingPwUsername = username;
  }

  async function submitLeaguePassword() {
    const pw      = (document.getElementById('league-pw-input')?.value || '').trim();
    const errEl   = document.getElementById('league-pw-error');
    if (!pw) { if(errEl) errEl.textContent = 'Enter your password.'; return; }
    const hash    = await hashPassword(pw);
    if (hash !== window._pendingLoginHash) {
      if(errEl) errEl.textContent = 'Incorrect password.';
      document.getElementById('league-pw-input').value = '';
      return;
    }
    document.getElementById('league-pw-modal')?.remove();
    state.leagueId   = window._pendingLeagueId;
    session.leagueId = window._pendingLeagueId;
    window._pendingLeagueId  = null;
    window._pendingLoginHash = null;
    UI.showScreen('loading');
    UI.setLoading('Loading league…');
    await initApp();
  }

  async function registerLeague() {
    const lid   = (document.getElementById('picker-league-id')?.value || '').trim();
    const errEl = document.getElementById('picker-register-error');
    if (!lid) { if(errEl) errEl.textContent = 'Enter a league ID.'; return; }
    if(errEl) errEl.textContent = 'Verifying league…';

    try {
      const league = await Sleeper.fetchLeague(lid);
      if (!league?.league_id) throw new Error('League not found on Sleeper.');

      const users  = await Sleeper.fetchLeagueUsers(lid);
      const myUser = users?.find(u => u.user_id === state.user?.user_id);
      if (!myUser) {
        if(errEl) errEl.textContent = 'You must be a member of this league to add it.';
        return;
      }
      if(errEl) errEl.textContent = '';

      // Check if user is the commissioner
      const isLeagueComm = league.commissioner_id === state.user?.user_id ||
                           (league.commissioner_ids||[]).includes(state.user?.user_id);

      // Store pending league data for wizard submission
      window._wizardLeagueId    = lid;
      window._wizardLeague      = league;
      window._wizardIsCommish   = isLeagueComm;

      // Show setup wizard (works for both comms and non-comms)
      const meta = `${league.season} · ${league.total_rosters} teams · ${league.status}`;
      if (typeof initWizard === 'function') {
        initWizard(league.name, meta, league, isLeagueComm);
      }
    } catch(e) {
      if(errEl) errEl.textContent = 'Error: ' + (e.message || e);
    }
  }

  async function submitLeagueSetup() {
    const lid    = window._wizardLeagueId;
    const league = window._wizardLeague;
    const errEl  = document.getElementById('wizard-error');
    if (!lid || !league) { if(errEl) errEl.textContent = 'Something went wrong. Try again.'; return; }

    const leagueType = document.querySelector('input[name="wiz-type"]:checked')?.value;
    if (!leagueType) { if(errEl) errEl.textContent = 'Please select a league type.'; return; }

    const isSalary  = leagueType === 'salary_auction';
    const isDynasty = leagueType === 'dynasty_no_auction';

    const features = {
      auctions:  document.getElementById('wiz-feat-auctions')?.checked  || false,
      rosters:   document.getElementById('wiz-feat-rosters')?.checked   || false,
      standings: document.getElementById('wiz-feat-standings')?.checked || false,
      draft:     document.getElementById('wiz-feat-draft')?.checked     || false,
    };

    const settings = {};
    if (isSalary) {
      const capVal = parseFloat(document.getElementById('wiz-cap')?.value);
      if (!isNaN(capVal) && capVal > 0) settings.cap = Math.round(capVal * 1_000_000);
      const salarySetup = document.querySelector('input[name="wiz-salary"]:checked')?.value;
      settings.salarySetup = salarySetup || 'existing';
    }
    if (isSalary || isDynasty) {
      const maxIR   = parseInt(document.getElementById('wiz-max-ir')?.value);
      const maxTaxi = parseInt(document.getElementById('wiz-max-taxi')?.value);
      if (!isNaN(maxIR))   settings.maxIR   = maxIR;
      if (!isNaN(maxTaxi)) settings.maxTaxi = maxTaxi;
    }

    try {
      // Write registry entry
      await db.ref(`leagues/_registry/${lid}`).set({
        name:        league.name,
        season:      league.season,
        status:      league.status,
        leagueType,
        addedBy:     state.user?.username,
        addedAt:     Date.now(),
        features,
      });

      // Write initial settings to the league path
      if (Object.keys(settings).length) {
        await db.ref(`leagues/${lid}/settings`).update(settings);
      }

      document.getElementById('league-setup-wizard').style.display = 'none';
      if(document.getElementById('picker-league-id')) document.getElementById('picker-league-id').value = '';
      window._wizardLeagueId = null;
      window._wizardLeague   = null;
      showLeaguePicker();
    } catch(e) {
      if(errEl) errEl.textContent = 'Failed to save: ' + (e.message || e);
    }
  }

  // Update a league's registry entry to a new season's league ID
  async function updateLeagueSeason(newId, oldId) {
    try {
      const snap = await db.ref(`leagues/_registry/${oldId}`).once('value');
      const meta = snap.val();
      if (!meta) { UI.toast('Could not find previous league data.', 'error'); return; }
      const newLeague = await Sleeper.fetchLeague(newId);
      // Copy registry entry to new ID, preserve settings
      await db.ref(`leagues/_registry/${newId}`).set({
        ...meta,
        name:           newLeague.name || meta.name,
        season:         newLeague.season || meta.season,
        status:         newLeague.status || meta.status,
        previousLeagueId: oldId,
        updatedAt:      Date.now(),
      });
      // Copy settings to new league path
      const settingsSnap = await db.ref(`leagues/${oldId}/settings`).once('value');
      if (settingsSnap.val()) await db.ref(`leagues/${newId}/settings`).set(settingsSnap.val());
      // Copy rules
      const rulesSnap = await db.ref(`leagues/${oldId}/rules`).once('value');
      if (rulesSnap.val()) await db.ref(`leagues/${newId}/rules`).set(rulesSnap.val());
      UI.toast(`League updated to ${newLeague.season} season!`, 'success');
      showLeaguePicker();
    } catch(e) {
      UI.toast('Update failed: ' + e.message, 'error');
    }
  }

  // Refresh picker respecting the hide-commish-only toggle
  function refreshLeaguePicker() { showLeaguePicker(); }

  async function boot() {
    // Clean up any stale modals that may have persisted from a previous session
    ['change-pw-modal', 'league-pw-modal'].forEach(id => {
      document.getElementById(id)?.remove();
    });
    if (session.username && session.leagueId) {
      UI.showScreen('loading');
      UI.setLoading('Reconnecting…');
      try {
        state.user     = await Sleeper.fetchUser(session.username);
        session.setUser(state.user);
        state.leagueId = session.leagueId;

        // Skip password re-check if already authenticated this browser session
        const username = session.username.toLowerCase();
        const alreadyAuthed = sessionStorage.getItem('sb_authed');
        if (!alreadyAuthed) {
          try {
            const pwSnap = await db.ref(`users/${username}/password`).once('value');
            if (pwSnap.val()) {
              // Check mustChange flag first
              const mcSnap = await db.ref(`users/${username}/passwordMustChange`).once('value');
              UI.showScreen('login');
              document.getElementById('login-username').value = session.username;
              window._pendingLoginUser = state.user;
              window._pendingLoginHash = pwSnap.val();
              if (mcSnap.val()) {
                showChangePasswordModal(username, session.leagueId, true);
              } else {
                const pwWrap = document.getElementById('login-password-wrap');
                if (pwWrap) { pwWrap.style.display = ''; }
                document.getElementById('login-password')?.focus();
              }
              return;
            }
          } catch(e) { /* no password set, continue normally */ }
        }

        await initApp();
        return;
      } catch (e) { /* fall through */ }
    }
    // If we have a username but no leagueId, show picker after re-auth
    if (session.username) {
      try {
        UI.showScreen('loading');
        UI.setLoading('Reconnecting…');
        state.user = await Sleeper.fetchUser(session.username);
        session.setUser(state.user);
        await showLeaguePicker();
        return;
      } catch(e) {}
    }
    UI.showScreen('login');
    if (session.username) document.getElementById('login-username').value = session.username;
  }

  // ── Login ───────────────────────────────────────────────
  async function browseAsGuest() {
    state.isGuest  = true;
    state.user     = { username: 'guest', user_id: null };
    state.leagueId = session.leagueId || localStorage.getItem('sb_leagueId') || '';
    if (!state.leagueId) {
      showLoginError('No league set up yet. Ask the commissioner to log in first.');
      return;
    }
    await initApp();
  }

  async function doLogin() {
    const username = document.getElementById('login-username').value.trim();
    if (!username) { showLoginError('Enter your Sleeper username.'); return; }
    showLoginError('');
    UI.showScreen('loading');
    UI.setLoading('Looking up your Sleeper account…');
    try {
      state.user = await Sleeper.fetchUser(username);
      session.username = username;
      session.setUser(state.user);

      // Check if this user has a global password in Firebase
      try {
        const pwSnap = await db.ref(`users/${username.toLowerCase()}/password`).once('value');
        if (pwSnap.val()) {
          UI.showScreen('login');
          const pwWrap = document.getElementById('login-password-wrap');
          if (pwWrap) { pwWrap.style.display = ''; }
          document.getElementById('login-password')?.focus();
          window._pendingLoginUser = state.user;
          window._pendingLoginHash = pwSnap.val();
          showLoginError('');
          return;
        }
      } catch(e) {}

      // No password set -- just log in directly
      // (Commissioner can set passwords via the Commish tab if desired)
      sessionStorage.setItem('sb_authed', username);
      await showLeaguePicker();
    } catch (e) {
      UI.showScreen('login');
      showLoginError('Username not found. Check spelling and try again.');
    }
  }

  async function submitPassword() {
    const pw = (document.getElementById('login-password')?.value || '').trim();
    if (!pw) { showLoginError('Enter your team password.'); return; }
    const hash = await hashPassword(pw);

    if (hash !== window._pendingLoginHash) {
      showLoginError('Incorrect password. Try again.');
      document.getElementById('login-password').value = '';
      return;
    }
    // Password correct -- check if they must change it
    const username = (window._pendingLoginUser?.username || '').toLowerCase();
    const lid = session.leagueId || localStorage.getItem('sb_leagueId') || '';
    let mustChange = false;
    if (lid && username) {
      try {
        const mcSnap = await db.ref(`users/${username}/passwordMustChange`).once('value');
        mustChange = !!mcSnap.val();
      } catch(e) {}
    }

    state.user = window._pendingLoginUser;
    session.setUser(state.user);
    window._pendingLoginUser = null;
    window._pendingLoginHash = null;
    showLoginError('');

    if (mustChange) {
      showChangePasswordModal(username, lid, true);
      return;
    }

    // Password verified — mark session as authenticated to skip re-auth on refresh
    sessionStorage.setItem('sb_authed', session.username || '1');
    if (window._trackEvent) _trackEvent('login', { method: 'password' });
    // Go directly to league if one is already selected
    if (session.leagueId) {
      await initApp();
    } else {
      await showLeaguePicker();
    }
  }

  // ── Change Password flow ──────────────────────────────────────
  function showChangePasswordModal(username, leagueId, isFirstTime) {
    // Inject modal if not already present
    if (!document.getElementById('change-pw-modal')) {
      const overlay = document.createElement('div');
      overlay.id = 'change-pw-modal';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;display:flex;align-items:center;justify-content:center;';
      overlay.innerHTML = `
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);
          padding:28px 24px;width:360px;max-width:90vw;box-shadow:0 8px 32px rgba(0,0,0,.4);">
          <div style="font-size:16px;font-weight:600;margin-bottom:6px;" id="cpw-title">Set Your Password</div>
          <div style="font-size:13px;color:var(--text3);margin-bottom:20px;" id="cpw-subtitle"></div>
          <div style="margin-bottom:12px;">
            <label style="font-size:12px;color:var(--text3);display:block;margin-bottom:5px;">New Password</label>
            <input type="password" id="cpw-new" placeholder="Choose a password"
              style="width:100%;padding:10px 12px;background:var(--surface2);border:1px solid var(--border);
              border-radius:var(--radius-sm);color:var(--text);font-family:var(--font-body);font-size:14px;
              outline:none;box-sizing:border-box;"/>
          </div>
          <div style="margin-bottom:18px;">
            <label style="font-size:12px;color:var(--text3);display:block;margin-bottom:5px;">Confirm Password</label>
            <input type="password" id="cpw-confirm" placeholder="Confirm password"
              style="width:100%;padding:10px 12px;background:var(--surface2);border:1px solid var(--border);
              border-radius:var(--radius-sm);color:var(--text);font-family:var(--font-body);font-size:14px;
              outline:none;box-sizing:border-box;"
              onkeydown="if(event.key==='Enter')App.submitChangePassword()"/>
          </div>
          <div id="cpw-error" style="font-size:12px;color:var(--red);min-height:18px;margin-bottom:10px;"></div>
          <div style="display:flex;gap:10px;">
            <button onclick="App.submitChangePassword()"
              style="flex:1;padding:10px;background:var(--accent);border:none;border-radius:var(--radius-sm);
              color:#fff;font-size:14px;font-weight:600;cursor:pointer;font-family:var(--font-body);">
              Set Password
            </button>
            <button onclick="App.skipChangePassword()"
              style="padding:10px 16px;background:var(--surface2);border:1px solid var(--border);
              border-radius:var(--radius-sm);color:var(--text2);font-size:13px;cursor:pointer;
              font-family:var(--font-body);">${isFirstTime ? 'Skip for now' : 'Cancel'}</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
    }
    document.getElementById('cpw-title').textContent = isFirstTime ? '🔑 Set Your Password' : '🔑 Change Password';
    document.getElementById('cpw-subtitle').textContent = isFirstTime
      ? 'The commissioner set a temporary password for you. Choose your own now.'
      : 'Enter a new password for your account.';
    document.getElementById('cpw-error').textContent = '';
    document.getElementById('cpw-new').value = '';
    document.getElementById('cpw-confirm').value = '';
    document.getElementById('change-pw-modal').style.display = 'flex';
    // Store context for submit
    window._cpwUsername   = username;
    window._cpwLeagueId   = leagueId;
    window._cpwFirstTime  = isFirstTime;
    setTimeout(() => document.getElementById('cpw-new')?.focus(), 50);
  }

  async function submitChangePassword() {
    const newPw  = (document.getElementById('cpw-new')?.value || '').trim();
    const confPw = (document.getElementById('cpw-confirm')?.value || '').trim();
    const errEl  = document.getElementById('cpw-error');
    if (!newPw)              { if(errEl) errEl.textContent = 'Enter a new password.'; return; }
    if (newPw.length < 6)    { if(errEl) errEl.textContent = 'Password must be at least 6 characters.'; return; }
    if (newPw !== confPw)    { if(errEl) errEl.textContent = 'Passwords do not match.'; return; }

    const hash = await hashPassword(newPw);
    const username  = window._cpwUsername;
    const lid       = window._cpwLeagueId;
    const firstTime = window._cpwFirstTime;

    try {
      await db.ref(`users/${username}/password`).set(hash);
      if (firstTime) {
        await db.ref(`users/${username}/passwordMustChange`).remove();
      }
      document.getElementById('change-pw-modal')?.remove();
      UI.toast('Password updated!', 'success');

      // If first-time change, go to league picker
      if (firstTime) {
        await showLeaguePicker();
      }
    } catch(e) {
      if(errEl) errEl.textContent = 'Failed to save: ' + (e.message || e);
    }
  }

  async function skipChangePassword() {
    // Clear mustChange flag and proceed to app without changing password
    const username = window._cpwUsername;
    if (username) {
      try {
        await db.ref(`users/${username}/passwordMustChange`).remove();
      } catch(e) {}
    }
    document.getElementById('change-pw-modal')?.remove();
    await showLeaguePicker();
  }

  function openChangePassword() {
    const username = (state.user?.username || '').toLowerCase();
    showChangePasswordModal(username, state.leagueId, false);
  }

  async function deleteLeague(leagueId, leagueName) {
    if (!confirm(`Remove "${leagueName}" from your league list?

This only removes it from the registry — all league data in Firebase is preserved.`)) return;
    try {
      await db.ref(`leagues/_registry/${leagueId}`).remove();
      // If this is the currently active league, switch to picker
      if (state.leagueId === leagueId) {
        await switchLeague();
      } else {
        showLeaguePicker(); // just refresh the list
      }
    } catch(e) {
      UI.toast('Failed to remove league: ' + (e.message || e), 'error');
    }
  }

  async function switchLeague() {
    // Unsubscribe from current league
    if (state.leagueId) Auction.unsubscribe(state.leagueId);

    // Reset ALL view loaded flags so every view re-initializes for the new league
    if (typeof viewsLoaded !== 'undefined') {
      Object.keys(viewsLoaded).forEach(k => delete viewsLoaded[k]);
    }

    // Reset cap.js subscription so it re-subscribes to new league
    if (window.capUnsubscribe) window.capUnsubscribe();
    window._standingsInitPending = false;

    // Reset state except user
    Object.assign(state, {
      leagueId: null, leagueSettings: null,
      scoringSettings: {}, rosterPositions: [],
      teams: [], statsMap: {}, freeAgents: [],
      auctions: [], faabOverrides: {}, activityFeed: [], watchlist: {},
    });
    await showLeaguePicker();
  }

  async function hashPassword(pw) {
    const enc  = new TextEncoder().encode(pw);
    const buf  = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  function showLoginError(msg) {
    const el = document.getElementById('login-error');
    el.textContent = msg;
    el.classList.toggle('hidden', !msg);
  }

  // ── Setup ───────────────────────────────────────────────
  async function doSetup() {
    const lid = document.getElementById('setup-league-id').value.trim();
    if (!lid) { showSetupError('Enter your league ID.'); return; }
    const btn = document.querySelector('#setup-screen .btn-primary');
    btn.textContent = 'Loading…'; btn.disabled = true;
    try {
      state.leagueId   = lid;
      session.leagueId = lid;
      // Auto-register this league in the registry
      try {
        const league = await Sleeper.fetchLeague(lid);
        await db.ref(`leagues/_registry/${lid}`).set({
          name:      league.name,
          season:    league.season,
          status:    league.status,
          addedBy:   state.user?.username,
          addedAt:   Date.now(),
          features:  { auctions: true, rosters: true, standings: true, draft: true },
        });
      } catch(e) { /* registry write failed -- not critical */ }
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

  // ── Logout ──────────────────────────────────────────────
  function logout() {
    sessionStorage.removeItem('sb_authed'); // clear auth flag so next login requires password
    const savedLeagueId = session.leagueId; // preserve for next login
    Auction.unsubscribe(state.leagueId);
    session.clear(); // clears username + leagueId
    // Restore leagueId so the next user logging in on this browser
    // goes straight to the app (and password check) without the setup screen
    if (savedLeagueId) {
      localStorage.setItem('sb_leagueId', savedLeagueId);
    }
    Object.assign(state, {
      user: null, leagueId: null, leagueSettings: null,
      scoringSettings: {}, rosterPositions: [],
      teams: [], players: {}, statsMap: {}, freeAgents: [],
      auctions: [], faabOverrides: {}, activityFeed: [], watchlist: {},
    });
    UI.showScreen('login');
  }

  // ── Init app ────────────────────────────────────────────
  async function initApp() {
    UI.showScreen('loading');
    UI.setLoading('Loading league…');
    try {
    // Try to load league/roster/user data from Firebase cache first (avoids Sleeper API on every boot)
    // Falls back to Sleeper API and updates the cache
    let league, rosters, users, players;
    // Try Firebase cache with 4s timeout — fall back to Sleeper API if slow/unavailable
    const CACHE_TTL = 15 * 60 * 1000;
    let cache = null;
    try {
      const cacheRef  = db.ref(`leagues/${state.leagueId}/sleeperCache`);
      const cacheSnap = await Promise.race([
        cacheRef.once('value'),
        new Promise((_, rej) => setTimeout(() => rej(new Error('cache timeout')), 4000)),
      ]);
      const raw = cacheSnap.val();
      const age = raw?.cachedAt ? Date.now() - raw.cachedAt : Infinity;
      if (raw && age < CACHE_TTL) cache = raw;
    } catch(e) { /* cache miss or timeout — fetch from Sleeper */ }

    if (cache) {
      league  = cache.league;
      rosters = cache.rosters;
      users   = cache.users;
      UI.setLoading('Loading player database…');
      players = await Sleeper.fetchPlayers();
    } else {
      UI.setLoading('Syncing league data…');
      [league, rosters, users, players] = await Promise.all([
        Sleeper.fetchLeague(state.leagueId),
        Sleeper.fetchRosters(state.leagueId),
        Sleeper.fetchLeagueUsers(state.leagueId),
        Sleeper.fetchPlayers(),
      ]);
      // Update cache in background — don't await
      try {
        db.ref(`leagues/${state.leagueId}/sleeperCache`)
          .set({ league, rosters, users, cachedAt: Date.now() });
      } catch(e) {}
    }

    state.leagueName      = league.name;
    localStorage.setItem('sb_leagueName', league.name);

    // Read feature flags from registry and apply to nav
    try {
      const regSnap = await db.ref(`leagues/_registry/${state.leagueId}`).once('value');
      const reg     = regSnap.val() || {};
      state.leagueFeatures = reg.features || { auctions: true, rosters: true, standings: true, draft: true };
      state.leagueType     = reg.leagueType || 'salary_auction';
    } catch(e) {
      state.leagueFeatures = { auctions: true, rosters: true, standings: true, draft: true };
      state.leagueType     = 'salary_auction';
    }

    // Load auction start time setting
    try {
      const astSnap = await db.ref(`leagues/${state.leagueId}/settings/auctionStartTime`).once('value');
      window._auctionStartTime = astSnap.val() || null;
    } catch(e) {}

    // Load Firebase co-manager overrides: {username: roster_id}
    try {
      const cmSnap = await db.ref(`leagues/${state.leagueId}/coManagers`).once('value');
      const cmMap  = cmSnap.val() || {};
      const myUser = (state.user?.username || '').toLowerCase();
      window._coManagerRosterId = cmMap[myUser] || null;
    } catch(e) {}

    // Configure avatar dropdown items based on user state
    if (!state.isGuest) {
      const myUser = (state.user?.username || '').toLowerCase();
      try {
        const pwSnap = await db.ref(`users/${myUser}/password`).once('value');
        const cpwItem = document.getElementById('avatar-dd-changepw');
        if (cpwItem) cpwItem.style.display = pwSnap.val() ? '' : 'none';
      } catch(e) {}
    }
    state.leagueSettings  = league;
    state.scoringSettings = league.scoring_settings || {};
    state.rosterPositions = league.roster_positions || [];
    state.players         = players;

    const leagueFaabBudget = league.settings?.waiver_budget ?? 100;
    const userMap = {};
    users.forEach(u => { userMap[u.user_id] = u; });

    state.teams = rosters.map(r => {
      const u    = userMap[r.owner_id] || {};
      const used = r.settings?.waiver_bid_used ?? 0;
      return {
        roster_id:    r.roster_id,
        owner_id:     r.owner_id,
        co_owners:    r.co_owners || [],  // Sleeper co-manager user IDs
        username:     u.display_name || u.username || `Team ${r.roster_id}`,
        display_name: u.display_name || u.username || `Team ${r.roster_id}`,
        avatar:       u.avatar,
        faab_budget:  leagueFaabBudget,
        faab_used:    used,
        players:      r.players || [],
        taxi:         r.taxi    || [],
        reserve:      r.reserve || [],  // IR players
      };
    });

    // Make teams available to cap.js before capInit runs
    window._capTeams      = state.teams;
    window._capLeagueType = state.leagueType || 'salary_auction';

    // Build _playerById now so player cards and activity feed have names ready
    if (!window._playerById || Object.keys(window._playerById).length < 100) {
      (async () => {
        try {
          let cached = localStorage.getItem('sb_players');
          if (!cached) {
            const r = await fetch('https://api.sleeper.app/v1/players/nfl');
            if (r.ok) {
              cached = await r.text();
              try { localStorage.setItem('sb_players', cached); } catch(e) {}
            }
          }
          if (cached) {
            const players = JSON.parse(cached);
            window._playerById = {};
            Object.entries(players).forEach(([id, p]) => {
              if (p.first_name && p.last_name) {
                window._playerById[id] = {
                  name:       p.first_name + ' ' + p.last_name,
                  pos:        (p.fantasy_positions||[])[0] || p.position || '—',
                  team:       p.team || '—',
                  rank:       p.rank || p.search_rank || 9999,
                  age:        p.age || null,
                  height:     p.height || null,
                  weight:     p.weight || null,
                  college:    p.college || null,
                  years_exp:  p.years_exp ?? null,
                  birth_date: p.birth_date || null,
                  status:     p.status || null,
                  injury_status: p.injury_status || null,
                };
              }
            });
            localStorage.setItem('sb_players_ver', '3');
            
          }
        } catch(e) { console.warn('[app] player build error:', e); }
      })();
    }




    // Write username -> roster_id map so cap.js can sync rosterSizes
    try {
      const usernameMap = {};
      users.forEach(u => {
        const r = rosters.find(r => r.owner_id === u.user_id);
        if (r && u.username) usernameMap[u.username.toLowerCase()] = r.roster_id;
      });
      db.ref(`leagues/${state.leagueId}/usernameToRosterId`).set(usernameMap).catch(()=>{});
    } catch(e) { /* non-fatal */ }

    UI.setLoading('Loading ' + state.statYear + ' stats…');
    let rawStats = {};
    try {
      rawStats = await Promise.race([
        Sleeper.fetchStats(state.statYear),
        new Promise((_, rej) => setTimeout(() => rej(new Error('stats timeout')), 6000)),
      ]);
    } catch (e) { /* non-fatal — use empty stats */ }
    state.statsMap = rawStats;

    const rostered = new Set(rosters.flatMap(r => r.players || []));
    state.freeAgents = Object.keys(players)
      .filter(id => {
        const p = players[id];
        if (rostered.has(id)) return false;
        if (!p.fantasy_positions?.some(pos => SKILL_POSITIONS.has(pos))) return false;
        // Keep if on an NFL roster OR scored any points in 2025 (most recent completed season)
        const hasTeam  = p.team && p.team !== 'FA';
        const hasPts   = (state.statsMap[id]?.pts_ppr ?? 0) > 0;
        return hasTeam || hasPts;
      })
      .sort((a, b) => {
        const apts = computeCustomPts(a);
        const bpts = computeCustomPts(b);
        if (apts !== null && bpts !== null) return bpts - apts;
        if (apts !== null) return -1;
        if (bpts !== null) return 1;
        return (players[a].search_rank || 9999) - (players[b].search_rank || 9999);
      });

    const myUsername = (state.user.username || '').toLowerCase().trim();
    state.isCommissioner = myUsername === COMMISSIONER_USERNAME;

    document.getElementById('league-name-badge').textContent = league.name;
    UI.setAvatar(document.getElementById('user-avatar'), state.user);
    updateCommissionerTab();

    UI.showScreen('app');
    UI.renderPauseBanner();
    if (window._trackEvent) _trackEvent('league_opened', { league_id: state.leagueId });
    // Init chat sidebar after league loaded
    if (typeof initChatSidebar === 'function') {
      initChatSidebar(state.leagueId);
    } else {
      // Load chat.js and init sidebar
      const s = document.createElement('script');
      s.src = 'js/chat.js';
      s.onload = () => { if (window.initChatSidebar) window.initChatSidebar(state.leagueId); };
      document.head.appendChild(s);
    }

    // Apply feature flags to nav tabs AND home cards
    const feats = state.leagueFeatures || {};
    const featVis = {
      auction:   feats.auctions  !== false,
      roster:    feats.rosters   !== false,
      standings: feats.standings !== false,
      draft:     feats.draft     !== false,
    };
    // Nav tabs
    Object.entries(featVis).forEach(([key, show]) => {
      const navEl  = document.getElementById(`nav-${key}`);
      const cardEl = document.getElementById(`home-card-${key}`);
      if (navEl)  navEl.style.display  = show ? '' : 'none';
      if (cardEl) cardEl.style.display = show ? '' : 'none';
    });
    // Update roster card subtitle based on league type
    const rosterSub = document.getElementById('home-sub-roster');
    if (rosterSub) {
      rosterSub.textContent = state.leagueType === 'salary_auction'
        ? 'Salary cap · tracking'
        : state.leagueType === 'dynasty_no_auction'
          ? 'Dynasty rosters · tracking'
          : 'Rosters · tracking';
    }
    // If current view is a disabled feature, redirect to home
    if (currentView && !featVis[currentView]) navigateTo('home');

    // Avatar dropdown is always available -- no extra button logic needed

    // Guest mode: update avatar dropdown logout to say "Login"
    if (state.isGuest) {
      const logoutItem = document.querySelector('.avatar-dd-logout');
      if (logoutItem) logoutItem.innerHTML = '🔑 <span>Login</span>';
    }

    // ── Firebase subscriptions ───────────────────────────
    // Set up ALL subscriptions before firing sb:ready so that when
    // navigateTo runs, state is already populated from Firebase cache.
    let _readyFired = false;
    // _maybeFirReady fires sb:ready on the FIRST call (when Auction.subscribe
    // callback fires with real Firebase data), then just calls renderAll().
    let _readyTimeout;
    function _maybeFirReady() {
      if (_readyFired) { renderAll(); return; }
      _readyFired = true;
      clearTimeout(_readyTimeout);
      window.dispatchEvent(new Event('sb:ready'));
    }

    // Safety timeout: if Firebase doesn't respond in 8s, fire sb:ready anyway
    _readyTimeout = setTimeout(() => _maybeFirReady(), 8000);

    Auction.subscribe(state.leagueId, auctions => {
      const prevAuctions = state.auctions;
      state.auctions = auctions;
      checkOutbidNotifications(prevAuctions, auctions);
      checkWatchlistNotifications(prevAuctions, auctions);
      _maybeFirReady();
    });

    Auction.subscribeRosterSizes(state.leagueId, sizes => {
      state.rosterSizes = sizes;
      renderAll();
    });

    Auction.subscribeFaabOverrides(state.leagueId, async overrides => {
      if (!overrides || Object.keys(overrides).length === 0) {
        await seedFaabFromKnownValues();
        // Still render — teams show Sleeper FAAB budget even without overrides
        renderAll();
        return;
      }
      state.faabOverrides = overrides;
      renderAll();
    });

    Auction.subscribeActivityFeed(state.leagueId, feed => {
      state.activityFeed = feed;
      UI.renderActivityFeed(feed);
      // Also update home page activity feed if visible
      updateHomeFeed(feed);
    });

    // Load Sleeper transactions for activity feed (non-blocking)
    window._reloadTxns = () => { window._sleeperTxnsLoaded = false; window._txnLoadedKey = null; loadSleeperTransactions(state.leagueId); };
    window.renderActivityFeedSleeperTxns = () => renderActivityFeedSleeperTxns();
    loadSleeperTransactions(state.leagueId);

    // Watchlist — keyed by Sleeper user_id
    const uid = state.user?.user_id;
    if (uid) {
      Auction.subscribeWatchlist(state.leagueId, uid, wl => {
        state.watchlist = wl || {};
        renderAll();
      });
    }

    UI.startTimers(() => state.auctions);
    requestNotificationPermission();
    } catch(e) {
      console.error('initApp error:', e);
      UI.setLoading('Error loading app. Please refresh. (' + (e?.message||e) + ')');
    }
  }

  async function seedFaabFromKnownValues() {
    for (const team of state.teams) {
      const uname = (team.username || '').toLowerCase();
      if (FAAB_SEED[uname] !== undefined) {
        await Auction.setFaabOverride(state.leagueId, team.roster_id, FAAB_SEED[uname]);
      }
    }
  }

  function computeCustomPts(playerId) {
    const raw = state.statsMap[playerId];
    if (!raw) return null;
    return Sleeper.calculatePoints(raw, state.scoringSettings);
  }

  function updateCommissionerTab() {
    const tab = document.getElementById('commissioner-tab');
    if (tab) tab.style.display = state.isCommissioner ? '' : 'none';
    const dd = document.getElementById('nav-dropdown');
    if (dd && state.isCommissioner && !dd.querySelector('option[value="commissioner"]')) {
      const opt = document.createElement('option');
      opt.value = 'commissioner';
      opt.textContent = '⚙️ Commissioner';
      dd.appendChild(opt);
    }
  }

  async function loadSleeperTransactions(leagueId) {
    if (!leagueId) return;
    const year = window._txnYear || 2026;
    // Don't re-fetch if already loaded for this league+year
    const _txnCacheKey = `${leagueId}_${year}`;
    if (window._txnLoadedKey === _txnCacheKey && window._sleeperTxns?.length) return;
    window._txnLoadedKey = _txnCacheKey;

    // For historical years, need to find the correct league ID for that season
    // Sleeper stores each season as a separate league -- get previous league via league.previous_league_id
    let targetLeagueId = leagueId;
    if (year < 2026) {
      try {
        let lid = leagueId;
        let checked = 0;
        while (lid && checked < 4) {
          const info = await fetch(`https://api.sleeper.app/v1/league/${lid}`).then(r=>r.json());
          if (String(info.season) === String(year)) { targetLeagueId = lid; break; }
          lid = info.previous_league_id || null;
          checked++;
        }
      } catch(e) {}
    }

    try {
      const weekNums = Array.from({length: 18}, (_, i) => i + 1);
      const weekResults = await Promise.all(
        weekNums.map(w => Sleeper.fetchTransactions(targetLeagueId, w).catch(() => []))
      );
      const txns = weekResults.flat();
      
      if (txns.length) 
      if (!Array.isArray(txns) || !txns.length) {
        window._sleeperTxns = [];
        window._sleeperTxnsLoaded = true;
        renderActivityFeedSleeperTxns();
        return;
      }

      // Build roster_id -> team name map
      const rosterMap = {};
      (state.teams||[]).forEach(t => {
        if (t.roster_id) rosterMap[String(t.roster_id)] = t.display_name || t.username || `Team ${t.roster_id}`;
      });

      // Wait for _playerById if needed
      let waited = 0;
      while ((!window._playerById || Object.keys(window._playerById).length < 100) && waited < 3000) {
        await new Promise(r => setTimeout(r, 200));
        waited += 200;
      }
      const byId = window._playerById || {};
      
      const items = txns
        .filter(t => ['waiver','free_agent','trade'].includes(t.type) && t.status === 'complete')
        .sort((a,b) => (b.created||0) - (a.created||0))
        .map(t => {
          const adds      = Object.keys(t.adds  || {});
          const drops     = Object.keys(t.drops || {});
          const addNames  = adds.map(id  => byId[id]?.name || id).join(', ');
          const dropNames = drops.map(id => byId[id]?.name || id).join(', ');
          const teams     = (t.roster_ids||[]).map(id => rosterMap[String(id)] || `Roster ${id}`);
          const teamStr   = teams[0] || 'A team';
          const date      = t.created ? new Date(t.created).toLocaleDateString('en-US', {month:'short',day:'numeric'}) : '';

          let msg = '', icon = '', detail = '', type = t.type;

          if (t.type === 'trade') {
            icon = '🔄';
            // Build per-team breakdown
            const sideA = rosterMap[String(t.roster_ids?.[0])] || teams[0] || '?';
            const sideB = rosterMap[String(t.roster_ids?.[1])] || teams[1] || '?';
            msg = `Trade: ${teams.join(' & ')}`;
            // What each side received
            const aReceived = adds.filter(id => t.adds[id] === t.roster_ids?.[0]);
            const bReceived = adds.filter(id => t.adds[id] === t.roster_ids?.[1]);
            const aNames = aReceived.map(id => byId[id]?.name || id).join(', ');
            const bNames = bReceived.map(id => byId[id]?.name || id).join(', ');
            const picks  = (t.draft_picks||[]).map(p => `${p.season} R${p.round}`).join(', ');
            const detailParts = [];
            if (aNames) detailParts.push(`${sideA} gets: ${aNames}`);
            if (bNames) detailParts.push(`${sideB} gets: ${bNames}`);
            if (picks)  detailParts.push(`Picks: ${picks}`);
            detail = detailParts.join(' | ');
          } else if (t.type === 'waiver' && addNames) {
            msg    = `${teamStr} claimed ${addNames}${dropNames ? ` / dropped ${dropNames}` : ''}`;
            icon   = '✅';
          } else if (t.type === 'free_agent' && addNames) {
            msg    = `${teamStr} added ${addNames}${dropNames ? ` / dropped ${dropNames}` : ''}`;
            icon   = '➕';
          } else if (dropNames) {
            msg    = `${teamStr} dropped ${dropNames}`;
            icon   = '➖';
            type   = 'drop';
          }
          return msg ? { icon, msg, detail, date, type, teams: t.roster_ids||[], ts: t.created } : null;
        })
        .filter(Boolean);

      
      window._sleeperTxns      = items;
      window._txnPage          = 0;
      window._txnTeamFilter    = window._txnTeamFilter || '';
      window._txnTypeFilter    = window._txnTypeFilter || '';
      window._sleeperTxnsLoaded = true;
      
      renderActivityFeedSleeperTxns();
    } catch(e) { console.error('Transactions error:', e.message); }
  }

  function renderActivityFeedSleeperTxns() {
    const el = document.getElementById('home-activity-feed');
    if (!el) {
      setTimeout(renderActivityFeedSleeperTxns, 500);
      return;
    }
    const hasFbActivity = el.querySelector('.feed-item:not(.txn-item)');
    if (hasFbActivity) return;

    const items      = window._sleeperTxns || [];
    const teamFilter = window._txnTeamFilter || '';
    const typeFilter = window._txnTypeFilter || '';
    const page       = window._txnPage || 0;
    const year       = window._txnYear || 2026;
    const PAGE_SIZE  = 10;

    const rosterMap = {};
    (state.teams||[]).forEach(t => {
      if (t.roster_id) rosterMap[String(t.roster_id)] = t.display_name || t.username;
    });

    // Filter
    let filtered = items;
    if (typeFilter) filtered = filtered.filter(i => i.type === typeFilter);
    if (teamFilter) filtered = filtered.filter(i => i.teams.map(String).includes(teamFilter));

    const total  = filtered.length;
    const start  = page * PAGE_SIZE;
    const slice  = filtered.slice(start, start + PAGE_SIZE);
    const pages  = Math.ceil(total / PAGE_SIZE);

    // Year toggle
    const yearToggle = `
      <div style="display:flex;gap:4px;margin-bottom:8px;align-items:center;flex-wrap:wrap;">
        <span style="font-size:11px;color:var(--text3);margin-right:2px;">Season:</span>
        ${[2026,2025,2024].map(y => `<button onclick="window._txnYear=${y};window._txnPage=0;window._sleeperTxnsLoaded=false;window._txnLoadedKey=null;window._reloadTxns&&window._reloadTxns()"
          style="padding:2px 8px;font-size:11px;font-family:var(--font-body);
          background:${y===year?'var(--accent)':'var(--surface2)'};
          color:${y===year?'#fff':'var(--text2)'};
          border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;">${y}</button>`).join('')}
      </div>`;

    // Team filter
    const teamOpts = Object.entries(rosterMap)
      .map(([id, name]) => `<option value="${id}"${teamFilter===id?' selected':''}>${name}</option>`)
      .join('');

    // Type filter
    const typeOpts = [
      ['', 'All Types'],
      ['trade', '🔄 Trades'],
      ['waiver', '✅ Waivers'],
      ['free_agent', '➕ Free Agent'],
      ['drop', '➖ Drops'],
    ].map(([v,l]) => `<option value="${v}"${typeFilter===v?' selected':''}>${l}</option>`).join('');

    const filters = `
      <div style="display:flex;gap:6px;margin-bottom:8px;">
        <select onchange="window._txnTypeFilter=this.value;window._txnPage=0;window.renderActivityFeedSleeperTxns&&window.renderActivityFeedSleeperTxns()"
          style="flex:1;padding:5px 6px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font-body);font-size:11px;outline:none;">
          ${typeOpts}
        </select>
        <select onchange="window._txnTeamFilter=this.value;window._txnPage=0;window.renderActivityFeedSleeperTxns&&window.renderActivityFeedSleeperTxns()"
          style="flex:1;padding:5px 6px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font-body);font-size:11px;outline:none;">
          <option value="">All Teams</option>${teamOpts}
        </select>
      </div>`;

    const rows = slice.map(i =>
      `<div class="feed-item txn-item" style="padding:7px 0;border-bottom:1px solid var(--border);">
        <div style="display:flex;align-items:flex-start;gap:8px;">
          <span style="font-size:14px;flex-shrink:0;">${i.icon}</span>
          <div style="flex:1;min-width:0;">
            <div style="font-size:12px;line-height:1.4;">${i.msg}</div>
            ${i.detail ? `<div style="font-size:11px;color:var(--text3);margin-top:2px;line-height:1.4;">${i.detail}</div>` : ''}
          </div>
          <div style="font-size:11px;color:var(--text3);flex-shrink:0;">${i.date}</div>
        </div>
      </div>`
    ).join('');

    const emptyMsg = `<div style="padding:12px 0;color:var(--text3);font-size:12px;">No transactions found${typeFilter||teamFilter?' for this filter':` for ${year}`}.</div>`;

    const pager = pages > 1 ? `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0 2px;gap:8px;">
        <button onclick="window._txnPage=Math.max(0,${page}-1);window.renderActivityFeedSleeperTxns&&window.renderActivityFeedSleeperTxns()"
          ${page===0?'disabled':''} style="padding:3px 10px;font-size:11px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;color:var(--text2);font-family:var(--font-body);">← Prev</button>
        <span style="font-size:11px;color:var(--text3);">${start+1}–${Math.min(start+PAGE_SIZE,total)} of ${total}</span>
        <button onclick="window._txnPage=Math.min(${pages-1},${page}+1);window.renderActivityFeedSleeperTxns&&window.renderActivityFeedSleeperTxns()"
          ${page>=pages-1?'disabled':''} style="padding:3px 10px;font-size:11px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;color:var(--text2);font-family:var(--font-body);">Next →</button>
      </div>` : '';

    
    el.innerHTML = yearToggle + filters + (rows || emptyMsg) + pager;
  }

  function updateHomeFeed(feed) {
    const el = document.getElementById('home-activity-feed');
    if (!el) return;
    // Never overwrite Sleeper transactions once loaded
    if (window._sleeperTxnsLoaded) { return; }
    if (!feed || !Object.keys(feed).length) {
      if (el.querySelector('.txn-item')) return;
      
      el.innerHTML = '<div class="feed-empty">No activity yet.</div>';
      return;
    }
    function feedMsg(item) {
      const p = item.playerName || '';
      const t = item.teamName   || '';
      switch(item.type) {
        case 'nomination': return '🏷 ' + (t||'Someone') + ' nominated ' + (p||'a player');
        case 'bid':        return '💰 ' + (t||'Someone') + ' bid on ' + (p||'a player');
        case 'claim':      return '✅ ' + (t||'Someone') + ' claimed ' + (p||'a player');
        case 'cancel':     return '❌ Auction cancelled for ' + (p||'a player');
        case 'pass':       return '⏭ ' + (t||'Someone') + ' passed on ' + (p||'a player');
        case 'autoclose':  return '🔒 Auction auto-closed for ' + (p||'a player');
        default:           return item.msg || item.message || item.type || 'Activity';
      }
    }
    const dotColors = { nomination:'var(--accent)', bid:'var(--accent2)', claim:'var(--green)',
                        cancel:'var(--red)', pass:'var(--text3)', autoclose:'var(--yellow)' };
    // Don't overwrite Sleeper transactions with Firebase auction feed
    if (window._sleeperTxnsLoaded) { return; }
    
    const items = Object.values(feed).sort((a,b) => (b.timestamp||0)-(a.timestamp||0)).slice(0,10);
    el.innerHTML = items.map(item => {
      const color = dotColors[item.type] || 'var(--text3)';
      const ts    = item.timestamp || item.ts || 0;
      const diff  = Date.now() - ts;
      const m     = Math.floor(diff/60000);
      const ago   = m < 1 ? 'just now' : m < 60 ? m+'m ago' : m < 1440 ? Math.floor(m/60)+'h ago' : Math.floor(m/1440)+'d ago';
      return '<div class="feed-row"><div class="feed-dot" style="background:' + color + ';"></div>' +
        '<div class="feed-body"><div>' + feedMsg(item) + '</div>' +
        '<div class="feed-time">' + ago + '</div></div></div>';
    }).join('');
  }

  function renderAll() {
    updateCommissionerTab();
    UI.renderAuctions(state.auctions, state.faabOverrides);
    UI.renderTeams(state.faabOverrides);
    UI.renderHistory(state.auctions);
    if (state.isCommissioner) UI.renderCommissioner(state.faabOverrides);
  }

  // ── Tab switching ────────────────────────────────────────
  function switchTab(name) {
    UI.switchTab(name);
    if (name === 'watchlist')     UI.renderWatchlistTab();
    if (name === 'free-agents')   UI.renderFreeAgents(state.posFilter || 'ALL', false);
    if (name === 'teams')         UI.renderTeams(state.faabOverrides);
    if (name === 'history')       UI.renderHistory(state.auctions);
    if (name === 'activity')      UI.renderActivityFeed(state.activityFeed);
    if (name === 'commissioner')  { updateCommissionerTab(); UI.renderCommissioner(state.faabOverrides); }
  }

  function faSort(col) { UI.faSort(col); }

  async function setStatYear(year) {
    state.statYear = year;
    // Update button highlights
    [2023,2024,2025].forEach(y => {
      const btn = document.getElementById('fa-yr-' + y);
      if (!btn) return;
      btn.style.background  = y === year ? 'var(--accent)' : '';
      btn.style.color       = y === year ? '#fff' : '';
      btn.style.borderColor = y === year ? 'var(--accent)' : '';
    });
    // Update column header
    const th = document.getElementById('fa-th-pts');
    if (th) th.innerHTML = 'Pts (' + year + ') <span id="fa-sort-pts">' + (window._faSort?.col === 'pts' ? '▼' : '') + '</span>';
    // Load stats for selected year (cached in localStorage)
    const key = 'sb_stats_' + year;
    let data = {};
    try {
      const cached = localStorage.getItem(key);
      if (cached) { data = JSON.parse(cached); }
      else {
        UI.toast('Loading ' + year + ' stats…', 'info');
        data = await Sleeper.fetchStats(year);
        try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) {}
      }
    } catch(e) {}
    state.statsMap = data;
    UI.renderFreeAgents(state.posFilter || 'ALL', true);
  }

  // ── Free agents ──────────────────────────────────────────
  function setFilter(pos, el) {
    state.posFilter = pos;
    state.currentPosFilter = pos;
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    UI.renderFreeAgents(state.posFilter, true); // reset to page 0
  }

  function renderFreeAgents(resetPage) {
    UI.renderFreeAgents(state.posFilter || 'ALL', resetPage === true);
  }

  async function loadFreeAgents() {
    UI.toast('Refreshing free agents…', 'info');
    await Sleeper.invalidatePlayerCache();
    try {
      const [players, rosters] = await Promise.all([
        Sleeper.fetchPlayers(),
        Sleeper.fetchRosters(state.leagueId),
      ]);
      state.players = players;
      const rostered = new Set(rosters.flatMap(r => r.players || []));
      state.freeAgents = Object.keys(players)
        .filter(id => {
          const p = players[id];
          if (rostered.has(id)) return false;
          if (!p.fantasy_positions?.some(pos => SKILL_POSITIONS.has(pos))) return false;
          const hasTeam = p.team && p.team !== 'FA';
          const hasPts  = (state.statsMap[id]?.pts_ppr ?? 0) > 0;
          return hasTeam || hasPts;
        })
        .sort((a, b) => {
          const apts = computeCustomPts(a), bpts = computeCustomPts(b);
          if (apts !== null && bpts !== null) return bpts - apts;
          if (apts !== null) return -1;
          if (bpts !== null) return 1;
          return (players[a].search_rank || 9999) - (players[b].search_rank || 9999);
        });
      UI.renderFreeAgents(state.posFilter);
      UI.toast('Free agents updated!', 'success');
    } catch (e) { UI.toast('Refresh failed: ' + e.message, 'error'); }
  }

  async function refreshAll() {
    UI.toast('Refreshing from Sleeper…', 'info');
    try {
      const [league, rosters, users] = await Promise.all([
        Sleeper.fetchLeague(state.leagueId),
        Sleeper.fetchRosters(state.leagueId),
        Sleeper.fetchLeagueUsers(state.leagueId),
      ]);
      const leagueFaabBudget = league.settings?.waiver_budget ?? 100;
      const userMap = {};
      users.forEach(u => { userMap[u.user_id] = u; });

      state.teams = rosters.map(r => {
        const u    = userMap[r.owner_id] || {};
        const used = r.settings?.waiver_bid_used ?? 0;
        return {
          roster_id:    r.roster_id,
          owner_id:     r.owner_id,
          username:     u.display_name || u.username || `Team ${r.roster_id}`,
          display_name: u.display_name || u.username || `Team ${r.roster_id}`,
          avatar:       u.avatar,
          faab_budget:  leagueFaabBudget,
          faab_used:    used,
          players:      r.players || [],
          taxi:         r.taxi   || [],
        };
      });
      renderAll();
      UI.toast('Refreshed!', 'success');
    } catch (e) { UI.toast('Refresh failed: ' + e.message, 'error'); }
  }

  // ── Push notifications ───────────────────────────────────
  function requestNotificationPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      UI.toast('Enable notifications to get outbid alerts. Click 🔔 in the top bar.', 'info');
    }
  }

  async function enableNotifications() {
    if (!('Notification' in window)) { UI.toast('Notifications not supported in this browser.', 'error'); return; }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') UI.toast('Notifications enabled! 🔔', 'success');
    else UI.toast('Notification permission denied.', 'error');
  }

  function checkOutbidNotifications(prevAuctions, nextAuctions) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const myTeam = UI.getMyTeam(state);
    if (!myTeam) return;
    const myRid = myTeam.roster_id;
    const now   = Date.now();

    nextAuctions.forEach(auction => {
      if (auction.processed || auction.cancelled || auction.expiresAt <= now) return;
      const leading = Auction.computeLeadingBid(auction);
      const myMax   = Auction.getMyMaxBid(auction, myRid);
      if (myMax === 0) return;

      const prev        = prevAuctions.find(a => a.id === auction.id);
      const prevLeading = prev ? Auction.computeLeadingBid(prev) : null;
      const wasWinning  = prevLeading?.rosterId === myRid;
      const nowLosing   = leading.rosterId !== myRid;

      if (wasWinning && nowLosing) {
        const p    = state.players[auction.playerId] || {};
        const name = UI.playerName(p);
        new Notification('SleeperBid — Outbid!', {
          body: `${name} — new price: ${fmtFaab(leading.displayBid)}`,
          icon: `https://sleepercdn.com/content/nfl/players/thumb/${auction.playerId}.jpg`,
          tag:  auction.id,
        });
      }
    });
  }

  function checkWatchlistNotifications(prevAuctions, nextAuctions) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (!state.watchlist || !Object.keys(state.watchlist).length) return;
    const now = Date.now();

    nextAuctions.forEach(auction => {
      if (auction.processed || auction.cancelled || auction.expiresAt <= now) return;
      const watched = state.watchlist[auction.playerId];
      if (!watched) return;
      const p    = state.players[auction.playerId] || {};
      const name = UI.playerName(p);

      // New nomination?
      const existed = prevAuctions.find(a => a.id === auction.id);
      if (!existed) {
        new Notification('SleeperBid — Watched Player Nominated!', {
          body: `${name} is now in auction!`,
          icon: `https://sleepercdn.com/content/nfl/players/thumb/${auction.playerId}.jpg`,
          tag:  'watch_nom_' + auction.id,
        });
      }
    });
  }

  // ── Watchlist toggle ─────────────────────────────────────
  async function toggleWatch(playerId) {
    const uid = state.user?.user_id;
    if (!uid) return;
    if (state.watchlist[playerId]) {
      await Auction.removeWatch(state.leagueId, uid, playerId);
      UI.toast('Removed from watchlist', 'info');
    } else {
      await Auction.addWatch(state.leagueId, uid, playerId);
      UI.toast('Added to watchlist ⭐', 'success');
    }
  }

  // ── Roster size enforcement ──────────────────────────────
  function getMyFaab() {
    const myTeam = UI.getMyTeam(state);
    if (!myTeam) return 0;
    const override = state.faabOverrides[myTeam.roster_id];
    const base     = override !== undefined
      ? override
      : Math.max(0, myTeam.faab_budget - (myTeam.faab_used || 0));
    return Math.max(0, base - Auction.getCommittedFaab(state.auctions, myTeam.roster_id));
  }

  // ── Nominate modal ───────────────────────────────────────
  function openNomModal(playerId) {
    if (state.isGuest) { UI.toast('Log in to nominate players.', 'error'); return; }
    const myTeam = UI.getMyTeam(state);
    if (!myTeam) { UI.toast('You are not in this league.', 'error'); return; }

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

    const teamSel = document.getElementById('nom-team-select');
    const teamRow = document.getElementById('nom-team-row');
    if (state.isCommissioner && teamSel && teamRow) {
      teamRow.style.display = '';
      teamSel.innerHTML = state.teams
        .map(t => `<option value="${t.roster_id}"${t.roster_id === myTeam.roster_id ? ' selected' : ''}>${t.display_name || t.username}</option>`)
        .join('');
    } else if (teamRow) {
      teamRow.style.display = 'none';
    }

    updateNomFaabDisplay();
    if (teamSel) teamSel.onchange = updateNomFaabDisplay;

    document.getElementById('nom-bid-input').value = MIN_BID;
    document.getElementById('nom-error').classList.add('hidden');
    document.getElementById('nom-hint').textContent = `Minimum ${fmtFaab(MIN_BID)}. Bids in ${fmtFaab(MIN_BID)} increments.`;
    UI.openModal('nom-modal');
  }

  function getNomTeam() {
    const sel = document.getElementById('nom-team-select');
    const rid = sel && state.isCommissioner ? parseInt(sel.value) : null;
    return rid ? state.teams.find(t => t.roster_id === rid) : UI.getMyTeam(state);
  }

  function updateNomFaabDisplay() {
    const team = getNomTeam();
    if (!team) return;
    const override  = state.faabOverrides[team.roster_id];
    const base      = override !== undefined ? override : Math.max(0, team.faab_budget - (team.faab_used || 0));
    const committed = Auction.getCommittedFaab(state.auctions, team.roster_id);
    document.getElementById('nom-faab').textContent = fmtFaab(Math.max(0, base - committed));
  }

  function closeNomModal()         { UI.closeModal('nom-modal'); }
  function closeNomModalOutside(e) { if (e.target.id === 'nom-modal') closeNomModal(); }

  async function submitNomination() {
    const nomTeam = getNomTeam();
    if (!nomTeam) return;

    const now = Date.now();

    // Auction start time gate
    if (window._auctionStartTime && now < window._auctionStartTime && !state.isCommissioner) {
      showNomError('Auctions open on ' + new Date(window._auctionStartTime).toLocaleString());
      return;
    }

    const teamActiveNom = state.auctions.find(a =>
      !a.processed && !a.cancelled && a.expiresAt > now && a.nominatedBy === nomTeam.roster_id
    );
    if (teamActiveNom && !state.isCommissioner) {
      showNomError('This team already has an active nomination.'); return;
    }

    const bidVal    = parseInt(document.getElementById('nom-bid-input').value) || 0;
    const override  = state.faabOverrides[nomTeam.roster_id];
    const base      = override !== undefined ? override : Math.max(0, nomTeam.faab_budget - (nomTeam.faab_used || 0));
    const committed = Auction.getCommittedFaab(state.auctions, nomTeam.roster_id);
    const faab      = Math.max(0, base - committed);

    if (bidVal < MIN_BID) { showNomError(`Minimum bid is ${fmtFaab(MIN_BID)}.`); return; }
    if (bidVal % MIN_BID !== 0) { showNomError(`Bids must be in ${fmtFaab(MIN_BID)} increments.`); return; }
    if (bidVal > faab)   { showNomError(`${nomTeam.display_name} only has ${fmtFaab(faab)} available.`); return; }

    const p = state.players[state.activeNomPlayerId] || {};
    try {
      await Auction.nominate(
        state.leagueId, state.activeNomPlayerId, nomTeam.roster_id, bidVal,
        nomTeam.display_name || nomTeam.username,
        UI.playerName(p)
      );
      closeNomModal();
      UI.toast(`Auction started for ${UI.playerName(p)}!`, 'success');
    } catch (e) { showNomError('Failed: ' + e.message); }
  }

  function showNomError(msg) {
    const el = document.getElementById('nom-error');
    el.textContent = msg;
    el.classList.remove('hidden');
  }

  // ── Bid modal ────────────────────────────────────────────
  function openBidModal(auctionId) {
    if (state.isGuest) { UI.toast('Log in to place bids.', 'error'); return; }
    const myTeam = UI.getMyTeam(state);
    if (!myTeam) { UI.toast('You are not in this league.', 'error'); return; }

    const auction = state.auctions.find(a => a.id === auctionId);
    if (!auction) return;

    state.activeBidAuctionId = auctionId;
    state.bidPending = false; // reset confirm state

    const p       = state.players[auction.playerId] || {};
    const pos     = UI.playerPos(p);
    const leading = Auction.computeLeadingBid(auction);
    const myMax   = Auction.getMyMaxBid(auction, myTeam.roster_id);
    const avail   = getMyFaab() + myMax;

    const customPts = computeCustomPts(auction.playerId);
    const ptsHtml   = customPts !== null
      ? `<span style="font-size:11px;color:var(--text3);margin-top:4px;display:block;">2025 pts: <strong style="color:var(--accent2);">${customPts.toFixed(1)}</strong></span>`
      : '';

    document.getElementById('bid-modal-player-info').innerHTML = `
      ${UI.playerAvatarHTML(auction.playerId, 40)}
      <div>
        <div style="font-weight:600;">${UI.playerName(p)}</div>
        <div style="display:flex;gap:6px;margin-top:2px;">
          <span class="pos-badge pos-${pos}">${pos}</span>
          <span style="color:var(--text3);font-size:12px;">${UI.playerTeam(p)}</span>
        </div>
        ${ptsHtml}
      </div>`;

    document.getElementById('bid-modal-faab').textContent = fmtFaab(avail);

    const input = document.getElementById('bid-amount-input');
    input.value = myMax || Math.max(MIN_BID, leading.displayBid + MIN_BID);
    input.step  = MIN_BID;
    input.min   = MIN_BID;
    input.max   = avail;

    document.getElementById('bid-current-info').innerHTML =
      `Current price: <strong style="color:var(--text);">${fmtFaab(leading.displayBid)}</strong>` +
      ` — Leader: <strong style="color:var(--accent2);">${leading.rosterId ? UI.getTeamName(leading.rosterId, state) : '—'}</strong>` +
      (myMax && !state.isCommissioner ? ` &nbsp;|&nbsp; Your max: <strong style="color:var(--yellow);">${fmtFaab(myMax)}</strong>` : '');

    // Cap impact preview
    updateCapImpact();
    input.addEventListener('input', updateCapImpact);

    UI.renderStatBreakdown(auction.playerId, state.statsMap[auction.playerId], state.scoringSettings);

    const bids    = Array.isArray(auction.bids) ? auction.bids : Object.values(auction.bids || {});
    const sorted  = [...bids].sort((a, b) => b.timestamp - a.timestamp);
    const seenRosters = new Set();
    const deduped = sorted.filter(b => {
      if (seenRosters.has(b.rosterId)) return false;
      seenRosters.add(b.rosterId);
      return true;
    });
    document.getElementById('bid-history-list').innerHTML = deduped.length
      ? deduped.map(b => {
          const isMe    = b.rosterId === myTeam.roster_id;
          const showMax = isMe && !state.isCommissioner;
          return `<div class="bid-row">
            <span class="bid-row-team">${UI.getTeamName(b.rosterId, state)}${isMe ? ' <span style="color:var(--accent2);font-size:10px;">(you)</span>' : ''}</span>
            <span class="bid-row-amount">${showMax ? fmtFaab(b.maxBid) : 'bid placed'}</span>
            <span class="bid-row-time">${UI.timeAgo(b.timestamp)}</span>
          </div>`;
        }).join('')
      : `<div style="padding:10px 12px;color:var(--text3);font-size:12px;">No bids yet.</div>`;

    // Reset confirm button state
    resetBidButton();
    updateBidHint();
    UI.openModal('bid-modal');
  }

  function updateCapImpact() {
    const el = document.getElementById('cap-impact-preview');
    if (!el) return;
    const auction = state.auctions.find(a => a.id === state.activeBidAuctionId);
    if (!auction) return;
    const myTeam  = UI.getMyTeam(state);
    if (!myTeam) return;
    const bidVal  = parseInt(document.getElementById('bid-amount-input').value) || 0;
    const myMax   = Auction.getMyMaxBid(auction, myTeam.roster_id);
    const avail   = getMyFaab() + myMax;
    const afterBid = avail - bidVal;

    // Salary cap impact from rosters.html embedded data (if available)
    el.innerHTML = `
      <div style="font-size:11px;color:var(--text3);margin-top:10px;padding:8px 12px;background:var(--surface2);border-radius:var(--radius-sm);border:1px solid var(--border);">
        <span style="font-weight:600;color:var(--text2);">Cap Impact Preview</span>
        <span style="display:block;margin-top:4px;">If you win at ${fmtFaab(bidVal)}: 
          <strong style="color:${afterBid < 0 ? 'var(--red)' : 'var(--green)'};">${fmtFaab(Math.max(0, afterBid))}</strong> FAAB remaining
          ${afterBid < 0 ? '<span style="color:var(--red);"> — exceeds balance!</span>' : ''}
        </span>
      </div>`;
  }

  function closeBidModal()         {
    UI.closeModal('bid-modal');
    state.bidPending = false;
    resetBidButton();
  }
  function closeBidModalOutside(e) { if (e.target.id === 'bid-modal') closeBidModal(); }

  function resetBidButton() {
    const btn = document.getElementById('bid-submit-btn');
    if (!btn) return;
    btn.textContent = 'Place Max Bid';
    btn.style.background = '';
    btn.dataset.confirm = '0';
    state.bidPending = false;
  }

  function updateBidHint() {
    const auction = state.auctions.find(a => a.id === state.activeBidAuctionId);
    if (!auction) return;
    const val     = parseInt(document.getElementById('bid-amount-input').value) || 0;
    const leading = Auction.computeLeadingBid(auction);
    const hint    = document.getElementById('bid-hint');
    if (val < MIN_BID) {
      hint.style.color = 'var(--red)'; hint.textContent = `Minimum bid is ${fmtFaab(MIN_BID)}.`; return;
    }
    if (val % MIN_BID !== 0) {
      hint.style.color = 'var(--red)'; hint.textContent = `Bids must be in ${fmtFaab(MIN_BID)} increments.`; return;
    }
    if (val <= leading.displayBid) {
      hint.style.color = 'var(--red)';
      hint.textContent = `Must exceed current price of ${fmtFaab(leading.displayBid)}.`; return;
    }
    hint.style.color = '';
    hint.textContent = `You win unless someone bids more than ${fmtFaab(val)}. System pays just ${fmtFaab(MIN_BID)} above next highest.`;
  }

  // 1-tap confirm: first tap arms the button, second tap fires
  async function submitBid() {
    const btn = document.getElementById('bid-submit-btn');
    if (!btn) return;

    // First tap — arm confirm
    if (btn.dataset.confirm !== '1') {
      btn.dataset.confirm  = '1';
      btn.textContent      = '✓ Confirm Bid';
      btn.style.background = 'var(--green)';
      btn.style.color      = '#000';
      // Auto-reset after 4 seconds if not confirmed
      setTimeout(() => {
        if (btn.dataset.confirm === '1') resetBidButton();
      }, 4000);
      return;
    }

    // Second tap — actually submit
    const myTeam = UI.getMyTeam(state);
    if (!myTeam) return;
    const auction = state.auctions.find(a => a.id === state.activeBidAuctionId);
    if (!auction) return;

    const bidVal  = parseInt(document.getElementById('bid-amount-input').value) || 0;
    const leading = Auction.computeLeadingBid(auction);
    const myMax   = Auction.getMyMaxBid(auction, myTeam.roster_id);
    const avail   = getMyFaab() + myMax;
    const p       = state.players[auction.playerId] || {};

    if (bidVal < MIN_BID) { UI.toast(`Minimum bid is ${fmtFaab(MIN_BID)}.`, 'error'); resetBidButton(); return; }
    if (bidVal % MIN_BID !== 0) { UI.toast(`Bids must be in ${fmtFaab(MIN_BID)} increments.`, 'error'); resetBidButton(); return; }
    if (bidVal <= leading.displayBid && leading.rosterId !== myTeam.roster_id) {
      UI.toast(`Bid must exceed ${fmtFaab(leading.displayBid)}.`, 'error'); resetBidButton(); return;
    }
    if (bidVal > avail) { UI.toast(`You only have ${fmtFaab(avail)} available.`, 'error'); resetBidButton(); return; }

    btn.textContent = 'Placing…'; btn.disabled = true;
    try {
      const updated    = await Auction.placeBid(
        state.leagueId, auction.id, myTeam.roster_id, bidVal,
        myTeam.display_name || myTeam.username,
        UI.playerName(p),
        auction.playerId
      );
      const newLeading = Auction.computeLeadingBid(updated);
      closeBidModal();
      UI.toast(
        newLeading.rosterId === myTeam.roster_id
          ? `You're winning at ${fmtFaab(newLeading.displayBid)}! 🏆`
          : `Bid placed but you're currently losing — the leader has a higher max.`,
        newLeading.rosterId === myTeam.roster_id ? 'success' : 'info'
      );
    } catch (e) { UI.toast('Bid failed: ' + e.message, 'error'); }
    finally    { btn.textContent = 'Place Max Bid'; btn.disabled = false; btn.dataset.confirm = '0'; btn.style.background = ''; btn.style.color = ''; }
  }

  // ── Push to Claim (commissioner) ─────────────────────────
  async function pushToClaim(auctionId) {
    const auction = state.auctions.find(a => a.id === auctionId);
    if (!auction) return;
    const leading = Auction.computeLeadingBid(auction);
    const p       = state.players[auction.playerId] || {};

    if (leading.rosterId) {
      const team    = state.teams.find(t => t.roster_id === leading.rosterId);
      if (team) {
        const current = state.faabOverrides[leading.rosterId] !== undefined
          ? state.faabOverrides[leading.rosterId]
          : Math.max(0, team.faab_budget - (team.faab_used || 0));
        await Auction.setFaabOverride(state.leagueId, leading.rosterId, Math.max(0, current - leading.displayBid));
      }
      await Auction.claimAuction(
        state.leagueId, auctionId, leading.rosterId,
        state.teams.find(t => t.roster_id === leading.rosterId)?.display_name || `Team ${leading.rosterId}`,
        leading.displayBid,
        UI.playerName(p),
        auction.playerId
      );

      // Push notification to winner
      if ('Notification' in window && Notification.permission === 'granted') {
        const myTeam = UI.getMyTeam(state);
        if (myTeam?.roster_id === leading.rosterId) {
          new Notification('SleeperBid — Player Claimed! 🎉', {
            body: `${UI.playerName(p)} added to your roster for ${fmtFaab(leading.displayBid)}`,
            icon: `https://sleepercdn.com/content/nfl/players/thumb/${auction.playerId}.jpg`,
            tag:  'claim_' + auctionId,
          });
        }
      }
    } else {
      await Auction.markProcessed(state.leagueId, auctionId);
    }
    UI.toast(`${UI.playerName(p)} claimed! FAAB deducted. ✅`, 'success');
  }

  async function cancelAuction(auctionId) {
    if (!confirm('Cancel this auction? All bids will be voided. Cannot be undone.')) return;
    const auction = state.auctions.find(a => a.id === auctionId);
    const p       = auction ? (state.players[auction.playerId] || {}) : {};
    const myTeam  = UI.getMyTeam(state);
    await Auction.cancelAuction(
      state.leagueId, auctionId,
      UI.playerName(p),
      myTeam?.display_name || COMMISSIONER_USERNAME
    );
    UI.toast('Auction cancelled.', 'info');
  }

  async function passAuction(auctionId) {
    const auction = state.auctions.find(a => a.id === auctionId);
    if (!auction) return;
    const myTeam = UI.getMyTeam(state);
    if (!myTeam) return;
    const p           = state.players[auction.playerId] || {};
    const allRosterIds = state.teams.map(t => t.roster_id);
    try {
      const closed = await Auction.passAuction(
        state.leagueId, auctionId,
        myTeam.roster_id, allRosterIds,
        myTeam.display_name || myTeam.username,
        UI.playerName(p)
      );
      if (closed) {
        UI.toast('All teams passed — auction closed early!', 'success');
      } else {
        UI.toast('Marked as not interested.', 'info');
      }
    } catch(e) {
      UI.toast('Could not record pass: ' + e.message, 'error');
    }
  }

  async function deleteAuction(auctionId) {
    if (!confirm('PERMANENTLY DELETE this auction? Cannot be undone.')) return;
    await Auction.deleteAuction(state.leagueId, auctionId);
    UI.toast('Auction deleted.', 'info');
  }

  async function commOverrideFaab() {
    const rId = parseInt(document.getElementById('comm-team-select').value);
    const val = parseInt(document.getElementById('comm-faab-val').value);
    if (isNaN(val) || val < 0) { UI.toast('Enter a valid FAAB amount.', 'error'); return; }
    const team = state.teams.find(t => t.roster_id === rId);
    await Auction.setFaabOverride(state.leagueId, rId, val);
    UI.toast(`FAAB updated for ${team?.display_name || 'team'}.`, 'success');
  }

  async function commSetAllFaab() {
    const rows = document.querySelectorAll('.faab-bulk-row');
    const updates = [];
    for (const row of rows) {
      const rId = parseInt(row.dataset.rosterId);
      const val = parseInt(row.querySelector('input').value);
      if (isNaN(val) || val < 0) { UI.toast('All values must be 0 or greater.', 'error'); return; }
      updates.push({ rId, val });
    }
    for (const { rId, val } of updates) {
      await Auction.setFaabOverride(state.leagueId, rId, val);
    }
    UI.toast('All FAAB balances updated!', 'success');
  }

  async function commSetAllRosterSizes() {
    const rows = document.querySelectorAll('.roster-bulk-row');
    const updates = [];
    for (const row of rows) {
      const rId = parseInt(row.dataset.rosterId);
      const val = parseInt(row.querySelector('input').value);
      if (isNaN(val) || val < 0) { UI.toast('All values must be 0 or greater.', 'error'); return; }
      updates.push({ rId, val });
    }
    for (const { rId, val } of updates) {
      await Auction.setRosterSize(state.leagueId, rId, val);
    }
    UI.toast('Roster sizes saved!', 'success');
  }

  async function confirmReset() {
    if (confirm('Reset ALL auction data and FAAB overrides? Cannot be undone.')) {
      await Auction.resetAll(state.leagueId);
      UI.toast('All auction data cleared.', 'info');
    }
  }

  // ── History filters ──────────────────────────────────────
  function filterHistory() {
    UI.renderHistory(state.auctions);
  }

  // ── Public API ───────────────────────────────────────────
  return {
    state, fmtFaab,
    boot,
    doLogin, logout,
    doSetup,
    switchTab,
    setFilter, renderFreeAgents, loadFreeAgents,
    browseAsGuest, submitPassword, submitChangePassword, openChangePassword, skipChangePassword, switchLeague, deleteLeague, showLeaguePicker, pickLeague, registerLeague, updateLeagueSeason, refreshLeaguePicker, submitLeaguePassword, submitLeagueSetup, refreshAll, renderAll, updateHomeFeed, faSort, setStatYear,
    enableNotifications,
    computeCustomPts,
    toggleWatch,
    openNomModal, closeNomModal, closeNomModalOutside, submitNomination,
    commSetAllRosterSizes,
    openBidModal, closeBidModal, closeBidModalOutside, submitBid, updateBidHint,
    pushToClaim, cancelAuction, deleteAuction, passAuction,
    commOverrideFaab, commSetAllFaab, confirmReset,
    filterHistory,
  };
})();

document.addEventListener('DOMContentLoaded', () => App.boot());
