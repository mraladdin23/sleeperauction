// ─────────────────────────────────────────────────────────────
//  SLEEPER API
// ─────────────────────────────────────────────────────────────

const Sleeper = (() => {
  const BASE = 'https://api.sleeper.app/v1';

  async function fetchUser(username) {
    const r = await fetch(`${BASE}/user/${username}`);
    if (!r.ok) throw new Error('User not found');
    return r.json();
  }

  async function fetchLeague(leagueId) {
    const r = await fetch(`${BASE}/league/${leagueId}`);
    if (!r.ok) throw new Error('League not found');
    return r.json();
  }

  async function fetchRosters(leagueId) {
    const r = await fetch(`${BASE}/league/${leagueId}/rosters`);
    if (!r.ok) throw new Error('Could not load rosters');
    return r.json();
  }

  async function fetchLeagueUsers(leagueId) {
    const r = await fetch(`${BASE}/league/${leagueId}/users`);
    if (!r.ok) throw new Error('Could not load users');
    return r.json();
  }

  async function fetchPlayers() {
    const cached   = localStorage.getItem('sb_players');
    const cachedAt = localStorage.getItem('sb_players_at');
    const age      = cachedAt ? Date.now() - parseInt(cachedAt) : Infinity;

    if (cached && age < 24 * 60 * 60 * 1000) return JSON.parse(cached);

    UI.setLoading('Loading player database (one-time, ~10MB)…');
    const r = await fetch('https://api.sleeper.app/v1/players/nfl');
    if (!r.ok) throw new Error('Could not load players');
    const data = await r.json();
    try {
      localStorage.setItem('sb_players', JSON.stringify(data));
      localStorage.setItem('sb_players_at', Date.now().toString());
    } catch (e) { /* storage full */ }
    return data;
  }

  async function invalidatePlayerCache() {
    localStorage.removeItem('sb_players');
    localStorage.removeItem('sb_players_at');
  }

  // Fetch raw per-player season stats (cached 24h)
  async function fetchStats(season) {
    const key   = `sb_stats_${season}`;
    const keyAt = `sb_stats_${season}_at`;
    const cached   = localStorage.getItem(key);
    const cachedAt = localStorage.getItem(keyAt);
    const age      = cachedAt ? Date.now() - parseInt(cachedAt) : Infinity;

    if (cached && age < 24 * 60 * 60 * 1000) return JSON.parse(cached);

    UI.setLoading(`Loading ${season} season stats…`);
    // Fetch all weeks and aggregate — Sleeper aggregated endpoint
    const r = await fetch(`${BASE}/stats/nfl/regular/${season}?season_type=regular&position[]=QB&position[]=RB&position[]=WR&position[]=TE`);
    if (!r.ok) return {};
    const data = await r.json();
    try {
      localStorage.setItem(key, JSON.stringify(data));
      localStorage.setItem(keyAt, Date.now().toString());
    } catch (e) { /* storage full */ }
    return data;
  }

  // ── Calculate fantasy points from raw stats using league scoring ──
  // scoringSettings comes from league.scoring_settings (Sleeper format)
  // rawStats is a single player's season stat object
  function calculatePoints(rawStats, scoringSettings) {
    if (!rawStats || !scoringSettings) return null;
    let pts = 0;

    // Map of Sleeper stat keys → scoring setting keys (they mostly match)
    // Sleeper uses the same key names in scoring_settings as in player stats
    for (const [key, val] of Object.entries(rawStats)) {
      if (typeof val !== 'number') continue;
      const multiplier = scoringSettings[key];
      if (multiplier) pts += val * multiplier;
    }

    return Math.round(pts * 10) / 10;
  }

  return {
    fetchUser, fetchLeague, fetchRosters, fetchLeagueUsers,
    fetchPlayers, fetchStats, invalidatePlayerCache,
    calculatePoints,
  };
})();
