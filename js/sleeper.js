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


  async function fetchStats(season) {
    const key    = `sb_stats_${season}`;
    const keyAt  = `sb_stats_${season}_at`;
    const cached   = localStorage.getItem(key);
    const cachedAt = localStorage.getItem(keyAt);
    const age      = cachedAt ? Date.now() - parseInt(cachedAt) : Infinity;
    // Stats for completed seasons cache for 7 days; current season 6h
    const maxAge   = season < new Date().getFullYear() ? 7*24*60*60*1000 : 6*60*60*1000;

    if (cached && age < maxAge) {
      return JSON.parse(cached);
    }

    const r = await fetch(
      `https://api.sleeper.app/v1/stats/nfl/regular/${season}?season_type=regular&position[]=QB&position[]=RB&position[]=WR&position[]=TE`
    );
    if (!r.ok) throw new Error('Could not load stats');
    const data = await r.json();
    try {
      localStorage.setItem(key,   JSON.stringify(data));
      localStorage.setItem(keyAt, Date.now().toString());
    } catch(e) {}
    return data;
  }

  function calculatePoints(rawStats, scoringSettings) {
    if (!rawStats || !scoringSettings) return 0;
    let pts = 0;
    const map = {
      pass_yd: 'pass_yd', pass_td: 'pass_td', pass_int: 'pass_int',
      rush_yd: 'rush_yd', rush_td: 'rush_td',
      rec: 'rec', rec_yd: 'rec_yd', rec_td: 'rec_td',
      bonus_rec_te: 'bonus_rec_te', fum_lost: 'fum_lost',
    };
    for (const [stat, key] of Object.entries(map)) {
      if (rawStats[stat] !== undefined && scoringSettings[key] !== undefined) {
        pts += rawStats[stat] * scoringSettings[key];
      }
    }
    return pts;
  }


  async function fetchMatchups(leagueId, week) {
    const r = await fetch(`${BASE}/league/${leagueId}/matchups/${week}`);
    if (!r.ok) throw new Error(`Could not load matchups week ${week}`);
    return r.json();
  }

  async function fetchWinnersBracket(leagueId) {
    const r = await fetch(`${BASE}/league/${leagueId}/winners_bracket`);
    if (!r.ok) return [];
    return r.json();
  }

  async function fetchLosersBracket(leagueId) {
    const r = await fetch(`${BASE}/league/${leagueId}/losers_bracket`);
    if (!r.ok) return [];
    return r.json();
  }


  async function fetchUserLeagues(userId, season) {
    const r = await fetch(`${BASE}/user/${userId}/leagues/nfl/${season}`);
    if (!r.ok) return [];
    return r.json();
  }

  async function fetchTradedPicks(leagueId) {
    const r = await fetch(`${BASE}/league/${leagueId}/traded_picks`);
    if (!r.ok) return [];
    return r.json();
  }

  async function fetchTransactions(leagueId, week) {
    const r = await fetch(`${BASE}/league/${leagueId}/transactions/${week}`);
    if (!r.ok) return [];
    return r.json();
  }

  async function fetchAllTransactions(leagueId, maxWeek) {
    // Fetch transactions for all weeks up to maxWeek (or 18)
    const weeks = Array.from({length: maxWeek || 18}, (_,i) => i+1);
    const results = await Promise.all(weeks.map(w => fetchTransactions(leagueId, w).catch(()=>[])));
    return results.flat();
  }

    return { fetchUser, fetchLeague, fetchRosters, fetchLeagueUsers, fetchPlayers, fetchStats, calculatePoints, invalidatePlayerCache, fetchUserLeagues, fetchMatchups, fetchWinnersBracket, fetchLosersBracket, fetchTradedPicks, fetchTransactions, fetchAllTransactions };
})();
