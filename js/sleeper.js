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
    // Cache for 24h — the full NFL player list is ~10MB
    const cached   = localStorage.getItem('sb_players');
    const cachedAt = localStorage.getItem('sb_players_at');
    const age      = cachedAt ? Date.now() - parseInt(cachedAt) : Infinity;

    if (cached && age < 24 * 60 * 60 * 1000) {
      return JSON.parse(cached);
    }

    UI.setLoading('Loading player database (one-time, ~10MB)…');
    const r = await fetch('https://api.sleeper.app/v1/players/nfl');
    if (!r.ok) throw new Error('Could not load players');
    const data = await r.json();

    try {
      localStorage.setItem('sb_players', JSON.stringify(data));
      localStorage.setItem('sb_players_at', Date.now().toString());
    } catch (e) { /* storage full – that's fine, just won't cache */ }

    return data;
  }

  async function invalidatePlayerCache() {
    localStorage.removeItem('sb_players');
    localStorage.removeItem('sb_players_at');
  }

  // Fetch last season's stats to rank free agents (cached 24h)
  async function fetchStats(season) {
    const key   = `sb_stats_${season}`;
    const keyAt = `sb_stats_${season}_at`;
    const cached   = localStorage.getItem(key);
    const cachedAt = localStorage.getItem(keyAt);
    const age      = cachedAt ? Date.now() - parseInt(cachedAt) : Infinity;

    if (cached && age < 24 * 60 * 60 * 1000) {
      return JSON.parse(cached);
    }

    UI.setLoading(`Loading ${season} season stats…`);
    const r = await fetch(`${BASE}/stats/nfl/regular/${season}?season_type=regular&position[]=QB&position[]=RB&position[]=WR&position[]=TE`);
    if (!r.ok) return {}; // non-fatal — just fall back to search_rank

    const data = await r.json();
    try {
      localStorage.setItem(key, JSON.stringify(data));
      localStorage.setItem(keyAt, Date.now().toString());
    } catch (e) { /* storage full */ }

    return data;
  }

  return { fetchUser, fetchLeague, fetchRosters, fetchLeagueUsers, fetchPlayers, fetchStats, invalidatePlayerCache };
})();
