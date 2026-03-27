// SleeperBid cap.js v20260325-bulk-weekly

var CAP      = 301_200_000; // loaded from Firebase leagues/{id}/settings/cap
var MAX_IR   = 2;            // loaded from Firebase leagues/{id}/settings/maxIR
function isSalaryLeague() { return (window._capLeagueType || window.App?.state?.leagueType || 'salary_auction') === 'salary_auction'; }
var MAX_TAXI = 8;            // loaded from Firebase leagues/{id}/settings/maxTaxi
var COMM     = 'mraladdin23';
const FB_PATH     = () => `leagues/${leagueId()}/rosterData`;
const POSITIONS   = ['QB','RB','WR','TE'];
const POS_COLORS  = {QB:'#b89ffe',RB:'#18e07a',WR:'#00d4ff',TE:'#ffc94d'};
const TOP_LIMITS  = {QB:10,RB:10,WR:15,TE:5};

const FALLBACK = {"mraladdin23": {"team_name": "Show Me The Money!!!", "cap_spent": 194800000, "starters": [{"pos": "QB", "name": "Jalen Hurts", "salary": 61000000}, {"pos": "QB", "name": "Dak Prescott", "salary": 44500000}, {"pos": "RB", "name": "Jonathan Taylor", "salary": 20000000}, {"pos": "RB", "name": "Saquon Barkley", "salary": 17000000}, {"pos": "RB", "name": "Kyren Williams", "salary": 16100000}, {"pos": "RB", "name": "Keaton Mitchell", "salary": 1000000}, {"pos": "WR", "name": "DK Metcalf", "salary": 17000000}, {"pos": "WR", "name": "Courtland Sutton", "salary": 17100000}, {"pos": "TE", "name": "Cade Otton", "salary": 1000000}, {"pos": "TE", "name": "Colby Parkinson", "salary": 100000}], "ir": [], "taxi": [{"name": "Darnell Washington", "salary": 2000000}, {"name": "Troy Franklin", "salary": 5000000}, {"name": "Ja'Tavion Sanders", "salary": 2000000}, {"name": "Kaleb Johnson", "salary": 10000000}, {"name": "Elijah Arroyo", "salary": 5000000}, {"name": "Kyle Williams", "salary": 2000000}, {"name": "Tahj Brooks", "salary": 1000000}]}, "spicytunaroll": {"team_name": "SpicyTunaRoll", "cap_spent": 187600000, "starters": [{"pos": "QB", "name": "Patrick Mahomes", "salary": 60000000}, {"pos": "QB", "name": "Jared Goff", "salary": 41500000}, {"pos": "QB", "name": "Aaron Rodgers", "salary": 5500000}, {"pos": "RB", "name": "Breece Hall", "salary": 21000000}, {"pos": "RB", "name": "Jordan Mason", "salary": 14000000}, {"pos": "RB", "name": "RJ Harvey", "salary": 10000000}, {"pos": "RB", "name": "Tyrone Tracy", "salary": 1000000}, {"pos": "WR", "name": "DJ Moore", "salary": 14500000}, {"pos": "WR", "name": "Jayden Reed", "salary": 10000000}, {"pos": "WR", "name": "Tank Dell", "salary": 3000000}, {"pos": "WR", "name": "Alec Pierce", "salary": 2000000}, {"pos": "WR", "name": "Curtis Samuel", "salary": 1000000}, {"pos": "WR", "name": "Khalil Shakir", "salary": 1000000}, {"pos": "WR", "name": "Xavier Hutchinson", "salary": 100000}, {"pos": "TE", "name": "Juwan Johnson", "salary": 2000000}, {"pos": "TE", "name": "Noah Gray", "salary": 1000000}], "ir": [], "taxi": [{"name": "Blake Corum", "salary": 5000000}, {"name": "Jared Wiley", "salary": 700000}, {"name": "Jalen Royals", "salary": 2000000}, {"name": "Jordan James", "salary": 1000000}]}, "schardt312": {"team_name": "schardt312", "cap_spent": 188900000, "starters": [{"pos": "QB", "name": "Brock Purdy", "salary": 36500000}, {"pos": "QB", "name": "Jarrett Stidham", "salary": 2000000}, {"pos": "QB", "name": "Gardner Minshew", "salary": 1000000}, {"pos": "RB", "name": "Travis Etienne", "salary": 17000000}, {"pos": "RB", "name": "Brian Robinson", "salary": 16000000}, {"pos": "RB", "name": "Ashton Jeanty", "salary": 15000000}, {"pos": "RB", "name": "Zach Charbonnet", "salary": 10000000}, {"pos": "RB", "name": "Tyler Allgeier", "salary": 4000000}, {"pos": "RB", "name": "Dylan Sampson", "salary": 3000000}, {"pos": "RB", "name": "Elijah Mitchell", "salary": 2100000}, {"pos": "WR", "name": "Chris Olave", "salary": 26000000}, {"pos": "WR", "name": "Christian Watson", "salary": 14000000}, {"pos": "WR", "name": "John Metchie", "salary": 5000000}, {"pos": "WR", "name": "Wan'Dale Robinson", "salary": 12200000}, {"pos": "WR", "name": "Luke McCaffrey", "salary": 1000000}, {"pos": "WR", "name": "Ricky Pearsall", "salary": 7500000}, {"pos": "WR", "name": "Jalen Nailor", "salary": 100000}, {"pos": "TE", "name": "Colston Loveland", "salary": 7500000}, {"pos": "TE", "name": "Tucker Kraft", "salary": 4000000}, {"pos": "TE", "name": "Erick All", "salary": 3000000}, {"pos": "TE", "name": "Dawson Knox", "salary": 2000000}], "ir": [], "taxi": [{"name": "DeWayne McBride", "salary": 5000000}, {"name": "Luke Musgrave", "salary": 4000000}, {"name": "Elic Ayomanor", "salary": 1000000}]}, "stupend0us": {"team_name": "Achilles Healed?", "cap_spent": 195100000, "starters": [{"pos": "QB", "name": "Josh Allen", "salary": 61000000}, {"pos": "QB", "name": "Cameron Ward", "salary": 15000000}, {"pos": "QB", "name": "Dillon Gabriel", "salary": 1000000}, {"pos": "QB", "name": "Tyson Bagent", "salary": 100000}, {"pos": "RB", "name": "Christian McCaffrey", "salary": 26000000}, {"pos": "RB", "name": "Kenneth Walker", "salary": 18000000}, {"pos": "RB", "name": "Cam Skattebo", "salary": 7500000}, {"pos": "RB", "name": "Ty Johnson", "salary": 500000}, {"pos": "RB", "name": "Malik Davis", "salary": 300000}, {"pos": "RB", "name": "LeQuint Allen", "salary": 100000}, {"pos": "WR", "name": "Amon-Ra St. Brown", "salary": 28000000}, {"pos": "WR", "name": "Brian Thomas", "salary": 21500000}, {"pos": "WR", "name": "Parker Washington", "salary": 1000000}, {"pos": "TE", "name": "Hunter Henry", "salary": 12100000}, {"pos": "TE", "name": "Harold Fannin", "salary": 3000000}], "ir": [], "taxi": [{"name": "Thomas Fidone", "salary": 100000}, {"name": "Darius Cooper", "salary": 100000}, {"name": "Arian Smith", "salary": 100000}, {"name": "Cam Miller", "salary": 100000}, {"name": "LaJohntay Wester", "salary": 100000}, {"name": "Kyle McCord", "salary": 100000}, {"name": "Beaux Collins", "salary": 100000}]}, "mkim521": {"team_name": "mkim521", "cap_spent": 170900000, "starters": [{"pos": "QB", "name": "Anthony Richardson", "salary": 31000000}, {"pos": "QB", "name": "JJ McCarthy", "salary": 15000000}, {"pos": "QB", "name": "Jake Browning", "salary": 9100000}, {"pos": "QB", "name": "Mac Jones", "salary": 7000000}, {"pos": "RB", "name": "TreVeon Henderson", "salary": 15000000}, {"pos": "RB", "name": "Rachaad White", "salary": 1100000}, {"pos": "RB", "name": "Jaleel McLaughlin", "salary": 400000}, {"pos": "RB", "name": "Emanuel Wilson", "salary": 100000}, {"pos": "WR", "name": "Jaxon Smith-Njigba", "salary": 21000000}, {"pos": "WR", "name": "Jordan Addison", "salary": 21000000}, {"pos": "WR", "name": "Jerry Jeudy", "salary": 17500000}, {"pos": "WR", "name": "Josh Downs", "salary": 11000000}, {"pos": "WR", "name": "Matthew Golden", "salary": 7500000}, {"pos": "WR", "name": "Malik Washington", "salary": 4000000}, {"pos": "WR", "name": "Kayshon Boutte", "salary": 3000000}, {"pos": "WR", "name": "Ryan Flournoy", "salary": 1100000}, {"pos": "WR", "name": "Dontayvion Wicks", "salary": 1000000}, {"pos": "WR", "name": "Tyler Lockett", "salary": 700000}, {"pos": "WR", "name": "Dyami Brown", "salary": 500000}, {"pos": "WR", "name": "Olamide Zaccheaus", "salary": 100000}, {"pos": "TE", "name": "Gunnar Helm", "salary": 3000000}, {"pos": "TE", "name": "Taysom Hill", "salary": 600000}, {"pos": "TE", "name": "Michael Mayer", "salary": 100000}, {"pos": "TE", "name": "Tyler Higbee", "salary": 100000}], "ir": [], "taxi": [{"name": "Jalen Milroe", "salary": 5000000}, {"name": "Mitchell Evans", "salary": 100000}, {"name": "KeAndre Lambert-Smith", "salary": 100000}, {"name": "Efton Chism", "salary": 200000}, {"name": "Jarquez Hunter", "salary": 1000000}]}, "iowafan30": {"team_name": "iowafan30", "cap_spent": 170500000, "starters": [{"pos": "QB", "name": "Jordan Love", "salary": 37500000}, {"pos": "QB", "name": "Drake Maye", "salary": 35500000}, {"pos": "QB", "name": "Malik Willis", "salary": 900000}, {"pos": "QB", "name": "Deshaun Watson", "salary": 400000}, {"pos": "QB", "name": "Sam Howell", "salary": 100000}, {"pos": "QB", "name": "Josh Dobbs", "salary": 100000}, {"pos": "QB", "name": "Zach Wilson", "salary": 100000}, {"pos": "QB", "name": "Will Levis", "salary": 100000}, {"pos": "RB", "name": "Aaron Jones", "salary": 13000000}, {"pos": "RB", "name": "Tyjae Spears", "salary": 11000000}, {"pos": "RB", "name": "James Conner", "salary": 10500000}, {"pos": "RB", "name": "Rico Dowdle", "salary": 6000000}, {"pos": "RB", "name": "Michael Carter", "salary": 100000}, {"pos": "RB", "name": "Roschon Johnson", "salary": 100000}, {"pos": "WR", "name": "Tetairoa McMillan", "salary": 10000000}, {"pos": "WR", "name": "Stefon Diggs", "salary": 7000000}, {"pos": "WR", "name": "Jalin Hyatt", "salary": 100000}, {"pos": "TE", "name": "Mark Andrews", "salary": 18000000}, {"pos": "TE", "name": "Isaiah Likely", "salary": 14000000}, {"pos": "TE", "name": "Dalton Schultz", "salary": 6000000}], "ir": [], "taxi": [{"name": "Audric Estime", "salary": 2000000}, {"name": "Adonai Mitchell", "salary": 5000000}, {"name": "Theo Johnson", "salary": 1000000}, {"name": "Jayden Higgins", "salary": 5000000}, {"name": "Tyler Shough", "salary": 2000000}, {"name": "Tory Horton", "salary": 1000000}, {"name": "Xavier Restrepo", "salary": 100000}, {"name": "Luke Lachey", "salary": 100000}]}, "southy610": {"team_name": "Southy610", "cap_spent": 191400000, "starters": [{"pos": "QB", "name": "Bryce Young", "salary": 20000000}, {"pos": "QB", "name": "CJ Stroud", "salary": 20000000}, {"pos": "QB", "name": "Caleb Williams", "salary": 37000000}, {"pos": "QB", "name": "Joe Milton", "salary": 100000}, {"pos": "RB", "name": "Devon Achane", "salary": 16200000}, {"pos": "RB", "name": "Omarion Hampton", "salary": 15000000}, {"pos": "RB", "name": "Jacory Croskey-Merritt", "salary": 1500000}, {"pos": "RB", "name": "Jaylen Wright", "salary": 900000}, {"pos": "WR", "name": "Puka Nacua", "salary": 55000000}, {"pos": "WR", "name": "Rome Odunze", "salary": 15000000}, {"pos": "WR", "name": "Luther Burden", "salary": 7500000}, {"pos": "WR", "name": "Jalen Coker", "salary": 100000}, {"pos": "WR", "name": "Jordan Whittington", "salary": 100000}, {"pos": "TE", "name": "Mason Taylor", "salary": 3000000}], "ir": [], "taxi": [{"name": "Damien Martinez", "salary": 1700000}, {"name": "Javon Baker", "salary": 3000000}, {"name": "Dallin Holker", "salary": 100000}, {"name": "Johnny Wilson", "salary": 300000}, {"name": "Jaheim Bell", "salary": 100000}, {"name": "Chimere Dike", "salary": 1400000}, {"name": "Ja'Corey Brooks", "salary": 100000}, {"name": "Kurtis Rourke", "salary": 100000}, {"name": "Isaiah Bond", "salary": 1000000}, {"name": "Jimmy Horn Jr.", "salary": 100000}]}, "kodypetey": {"team_name": "kissin TDs", "cap_spent": 187200000, "starters": [{"pos": "QB", "name": "Lamar Jackson", "salary": 53000000}, {"pos": "QB", "name": "Baker Mayfield", "salary": 43500000}, {"pos": "QB", "name": "Jimmy Garoppolo", "salary": 100000}, {"pos": "QB", "name": "Tanner McKee", "salary": 100000}, {"pos": "QB", "name": "Mason Rudolph", "salary": 100000}, {"pos": "RB", "name": "Jahmyr Gibbs", "salary": 19000000}, {"pos": "RB", "name": "Jaylen Warren", "salary": 2000000}, {"pos": "RB", "name": "Najee Harris", "salary": 500000}, {"pos": "RB", "name": "Isaiah Davis", "salary": 300000}, {"pos": "WR", "name": "Garrett Wilson", "salary": 34000000}, {"pos": "WR", "name": "Ladd McConkey", "salary": 15000000}, {"pos": "WR", "name": "Emeka Egbuka", "salary": 10000000}, {"pos": "WR", "name": "Jalen McMillan", "salary": 2000000}, {"pos": "WR", "name": "Demario Douglas", "salary": 1000000}, {"pos": "WR", "name": "Jahdae Walker", "salary": 100000}, {"pos": "TE", "name": "AJ Barner", "salary": 5500000}, {"pos": "WR", "name": "Dont'e Thornton", "salary": 1000000}], "ir": [], "taxi": [{"name": "Ricky White", "salary": 100000}, {"name": "Xavier Legette", "salary": 5000000}, {"name": "Cade Stover", "salary": 800000}, {"name": "Jaylin Noel", "salary": 5000000}, {"name": "Pat Bryant", "salary": 2000000}, {"name": "Breshard Smith", "salary": 1000000}, {"name": "Riley Leonard", "salary": 1000000}, {"name": "Tai Felton", "salary": 1000000}, {"name": "Konata Mumpfield", "salary": 100000}, {"name": "Savion Williams", "salary": 1000000}]}, "tmill85": {"team_name": "Tmill85", "cap_spent": 195100000, "starters": [{"pos": "QB", "name": "Justin Herbert", "salary": 61000000}, {"pos": "QB", "name": "Bo Nix", "salary": 40000000}, {"pos": "RB", "name": "Quinshon Judkins", "salary": 15000000}, {"pos": "RB", "name": "Chase Brown", "salary": 12000000}, {"pos": "RB", "name": "Kyle Monangai", "salary": 2100000}, {"pos": "WR", "name": "Malik Nabers", "salary": 23000000}, {"pos": "WR", "name": "Tee Higgins", "salary": 19500000}, {"pos": "WR", "name": "Isaac TeSlaa", "salary": 2500000}, {"pos": "TE", "name": "Kyle Pitts", "salary": 19000000}, {"pos": "TE", "name": "Brenton Strange", "salary": 1000000}], "ir": [], "taxi": [{"name": "Rasheen Ali", "salary": 1000000}, {"name": "Jacob Cowing", "salary": 1000000}, {"name": "Isaac Guerendo", "salary": 1000000}, {"name": "Will Howard", "salary": 1000000}, {"name": "Tre Harris", "salary": 7500000}]}, "dlon16": {"team_name": "dlon16", "cap_spent": 187700000, "starters": [{"pos": "QB", "name": "Jayden Daniels", "salary": 37500000}, {"pos": "QB", "name": "Kyler Murray", "salary": 27000000}, {"pos": "QB", "name": "Tyrod Taylor", "salary": 100000}, {"pos": "QB", "name": "Davis Mills", "salary": 100000}, {"pos": "RB", "name": "Bijan Robinson", "salary": 28000000}, {"pos": "WR", "name": "Devonta Smith", "salary": 20000000}, {"pos": "WR", "name": "Drake London", "salary": 18500000}, {"pos": "WR", "name": "George Pickens", "salary": 23000000}, {"pos": "WR", "name": "Rashee Rice", "salary": 5000000}, {"pos": "WR", "name": "Tre Tucker", "salary": 100000}, {"pos": "TE", "name": "Trey McBride", "salary": 15700000}, {"pos": "TE", "name": "Tyler Warren", "salary": 12700000}], "ir": [], "taxi": [{"name": "Devontez Walker", "salary": 1000000}, {"name": "Jack Bech", "salary": 5000000}, {"name": "Oronde Gadsden", "salary": 1600000}, {"name": "Jackson Hawes", "salary": 1600000}, {"name": "Jaylin Lane", "salary": 600000}]}, "abomb25": {"team_name": "abomb25", "cap_spent": 187400000, "starters": [{"pos": "QB", "name": "Jaxson Dart", "salary": 10000000}, {"pos": "QB", "name": "Matthew Stafford", "salary": 34000000}, {"pos": "RB", "name": "James Cook", "salary": 17700000}, {"pos": "RB", "name": "Javonte Williams", "salary": 7500000}, {"pos": "RB", "name": "Sean Tucker", "salary": 4000000}, {"pos": "RB", "name": "Kenneth Gainwell", "salary": 100000}, {"pos": "WR", "name": "Justin Jefferson", "salary": 39000000}, {"pos": "WR", "name": "Ja'Marr Chase", "salary": 38000000}, {"pos": "WR", "name": "Jaylen Waddle", "salary": 28000000}, {"pos": "WR", "name": "Mack Hollins", "salary": 100000}, {"pos": "TE", "name": "Jake Ferguson", "salary": 9000000}], "ir": [], "taxi": [{"name": "MarShawn Lloyd", "salary": 5000000}, {"name": "Terrance Ferguson", "salary": 5000000}, {"name": "Quinn Ewers", "salary": 2000000}, {"name": "DJ Giddens", "salary": 1000000}]}, "notgreatbob": {"team_name": "Not Great Bob", "cap_spent": 182100000, "starters": [{"pos": "QB", "name": "Joe Burrow", "salary": 59000000}, {"pos": "QB", "name": "Sam Darnold", "salary": 26200000}, {"pos": "QB", "name": "Cooper Rush", "salary": 300000}, {"pos": "QB", "name": "Marcus Mariota", "salary": 100000}, {"pos": "QB", "name": "Andy Dalton", "salary": 100000}, {"pos": "QB", "name": "Trey Lance", "salary": 100000}, {"pos": "QB", "name": "Jacoby Brissett", "salary": 100000}, {"pos": "QB", "name": "Teddy Bridgewater", "salary": 100000}, {"pos": "RB", "name": "Bucky Irving", "salary": 3000000}, {"pos": "RB", "name": "Woody Marks", "salary": 3000000}, {"pos": "RB", "name": "Devin Neal", "salary": 1000000}, {"pos": "RB", "name": "Raheim Sanders", "salary": 100000}, {"pos": "RB", "name": "Samaje Perine", "salary": 100000}, {"pos": "RB", "name": "Phil Mafah", "salary": 100000}, {"pos": "WR", "name": "CeeDee Lamb", "salary": 32000000}, {"pos": "WR", "name": "Marvin Harrison", "salary": 15000000}, {"pos": "WR", "name": "Jakobi Meyers", "salary": 4000000}, {"pos": "WR", "name": "Kendrick Bourne", "salary": 100000}, {"pos": "WR", "name": "Noah Brown", "salary": 100000}, {"pos": "TE", "name": "David Njoku", "salary": 10500000}, {"pos": "TE", "name": "Evan Engram", "salary": 12000000}, {"pos": "TE", "name": "Brock Bowers", "salary": 15000000}, {"pos": "RB", "name": "Chris Brooks", "salary": 100000}], "ir": [], "taxi": [{"name": "Tank Bigsby", "salary": 1000000}, {"name": "Chris Rodriguez", "salary": 1000000}, {"name": "Michael Penix", "salary": 7500000}, {"name": "Braelon Allen", "salary": 1000000}, {"name": "Ray Davis", "salary": 1000000}, {"name": "Will Shipley", "salary": 2000000}, {"name": "Travis Hunter", "salary": 15000000}, {"name": "Bhayshul Tuten", "salary": 7500000}]}};



function leagueId()  { return localStorage.getItem('sb_leagueId') || ''; }
function username()  { return localStorage.getItem('sb_username') || ''; }
function isComm()    { return username().toLowerCase() === COMM; }

let DATA = null;
let tab  = 'overview';
let rosterFilter = 'all';
let editCtx = null;
let offseasonMode = false;  // toggled by commissioner
let PLAYER_LOOKUP = {};     // name.toLowerCase() -> {birth_date, ...} from Sleeper cache
let holdouts = {};
let promos   = {};
let _promoTarget = null;

function rosterRef() { return db.ref(FB_PATH()); }

function subscribeRosters() {
  if (!leagueId()) { initWithFallback(); return; }
  const lid = leagueId();
  db.ref(`leagues/${lid}/holdouts`).once('value').then(s=>{holdouts=s.val()||{};if(DATA)renderTab(tab);}).catch(()=>{});
  db.ref(`leagues/${lid}/taxiPromos`).once('value').then(s=>{promos=s.val()||{};if(DATA)renderTab(tab);}).catch(()=>{});
  // Load cap setting and offseason mode
  db.ref(`leagues/${lid}/settings`).once('value').then(s => {
    const cfg = s.val() || {};
    if (cfg.cap)     CAP          = cfg.cap;
    if (cfg.offseason) offseasonMode = cfg.offseason;
    if (cfg.maxIR   != null) MAX_IR   = cfg.maxIR;
    if (cfg.maxTaxi != null) MAX_TAXI = cfg.maxTaxi;
    if (cfg.salarySetup) window._capSalarySetup = cfg.salarySetup;
  }).catch(()=>{});

  // Build player name lookup from cached Sleeper DB for age badges + photos
  try {
    // Skip build if app.js already built _playerById with full bio fields
    const _existing = window._playerById || {};
    const _hasBio = Object.values(_existing).some(p => p.age != null);
    if (_hasBio) {
      // Already built with bio fields by app.js -- skip
    } else {
    const cacheVer = localStorage.getItem('sb_players_ver');
    if (cacheVer !== '3') {
      localStorage.removeItem('sb_players');
      localStorage.removeItem('sb_players_at');
    }
    const cached = localStorage.getItem('sb_players');
    if (cached) {
      const players = JSON.parse(cached);
      window._playerById = {};  // always rebuild fresh
      Object.entries(players).forEach(([playerId, p]) => {
        // Build reverse lookup: player_id -> player data
        if (p.first_name && p.last_name) {
          window._playerById[playerId] = {
            name:       `${p.first_name} ${p.last_name}`,
            pos:        p.fantasy_positions?.[0] || p.position || '—',
            team:       p.team || '—',
            rank:       p.rank || p.search_rank || 9999,
            age:        p.age || null,
            birth_date: p.birth_date || null,
            height:     p.height || null,
            weight:     p.weight || null,
            college:    p.college || null,
            years_exp:  p.years_exp ?? null,
            birth_country: p.birth_country || null,
            depth_chart_order: p.depth_chart_order || null,
            status:     p.status || null,
            injury_status: p.injury_status || null,
          };
        }
        if (p.first_name && p.last_name) {
          const key = `${p.first_name} ${p.last_name}`.toLowerCase();
          PLAYER_LOOKUP[key] = { birth_date: p.birth_date || null, player_id: playerId, nfl_team: p.team || null, age: p.age || null, years_exp: p.years_exp != null ? p.years_exp : null };
        }
      });
      console.log('[players] _playerById built:', Object.keys(window._playerById||{}).length, 'players');
      if (window._playerById) {
        const sample = Object.entries(window._playerById).find(([,p]) => p.age);
        console.log('[players] sample with age:', sample ? JSON.stringify(sample[1]) : 'none found');
      }
      localStorage.setItem('sb_players_ver', '3');
    }
    } // end else (_hasBio)
  } catch(e) { console.warn('[players] build error:', e); }

  // Overlay confirmed playerIdMap from Firebase (player_matcher.html writes this)
  // Firebase keys have . # $ / [ ] encoded — decode them back to real names
  function _unsafeKey(k) {
    return k.replace(/__dot__/g,'.').replace(/__hash__/g,'#').replace(/__dlr__/g,'$')
            .replace(/__sl__/g,'/').replace(/__lb__/g,'[').replace(/__rb__/g,']');
  }
  if (leagueId()) {
    db.ref(`leagues/${leagueId()}/playerIdMap`).once('value').then(snap => {
      const map = snap.val();
      if (!map) return;
      Object.entries(map).forEach(([safeKey, val]) => {
        // val has {player_id, nfl_team, age, years_exp, name}
        const realName = (val.name || _unsafeKey(safeKey)).toLowerCase();
        PLAYER_LOOKUP[realName] = {
          ...PLAYER_LOOKUP[realName],
          player_id: val.player_id,
          nfl_team:  val.nfl_team  || PLAYER_LOOKUP[realName]?.nfl_team  || null,
          age:       val.age       ?? PLAYER_LOOKUP[realName]?.age       ?? null,
          years_exp: val.years_exp ?? PLAYER_LOOKUP[realName]?.years_exp ?? null,
        };
      });
      // Re-render current tab so photos appear without reload
      if (DATA) renderTab(tab);
    }).catch(() => {});
  }

  // Store ref so we can unsubscribe when switching leagues
  window._capRosterRef = rosterRef();
  window.capUnsubscribe = () => {
    if (window._capRosterRef) { window._capRosterRef.off(); window._capRosterRef = null; }
    DATA = null;
  };
  window._capRosterRef.on('value', snap => {
    const fbData = snap.val();




    if (fbData && Object.keys(fbData).length > 0) {
      DATA = fbData;
      const _lu1 = document.getElementById('last-upd'); if(_lu1) _lu1.textContent = 'Live data';
    } else {
      // No Firebase roster data -- build from Sleeper live data if available
      // Build from Sleeper live teams -- window._capTeams set by app.js before capInit
      const appTeams = window._capTeams || window.App?.state?.teams || [];
  
      if (appTeams.length > 0) {
        DATA = {};
        appTeams.forEach(t => {
          const key = (t.username || t.display_name || `team_${t.roster_id}`).toLowerCase()
                        .replace(/ /g,'_');
          DATA[key] = {
            team_name: t.display_name || t.username || `Team ${t.roster_id}`,
            cap_spent: 0,
            starters:  [],
            ir:        [],
            taxi:      [],
          };
        });
        const _lu2 = document.getElementById('last-upd'); if(_lu2) _lu2.textContent = 'Sleeper data (no cap data yet)';
      } else {
        // Last resort: empty placeholder teams
        DATA = {};
        const _lu2 = document.getElementById('last-upd'); if(_lu2) _lu2.textContent = 'No roster data';
      }
    }
    (document.getElementById('cap-loading') || document.getElementById('loading')).style.display = 'none';
    (document.getElementById('cap-app') || document.getElementById('app')).style.display = '';
    if (isComm()) {
      document.getElementById('comm-tab').style.display = '';
      const dd = document.getElementById('nav-dd');
      if (dd && !dd.querySelector('option[value="commish"]')) {
        const opt = document.createElement('option');
        opt.value = 'commish';
        opt.textContent = '⚙️ Commish';
        dd.appendChild(opt);
      }
    }
    renderTab(tab);
    // Apply tab visibility for non-salary leagues
    if (typeof applyCapTabVisibility === 'function') applyCapTabVisibility();
    // Keep auction page open-spot counts in sync
    syncRosterSizes();
  });
}

function initWithFallback() {
  DATA = JSON.parse(JSON.stringify(FALLBACK));
  const _lu2 = document.getElementById('last-upd'); if(_lu2) _lu2.textContent = 'Built-in data';
  (document.getElementById('cap-loading') || document.getElementById('loading')).style.display = 'none';
  (document.getElementById('cap-app') || document.getElementById('app')).style.display = '';
  if (isComm()) document.getElementById('comm-tab').style.display = '';
  renderTab(tab);
}

async function saveToFirebase() {
  if (!leagueId()) return;
  Object.values(DATA).forEach(t => {
    t.cap_spent = t.starters.reduce((s,p)=>s+p.salary,0)
      + (t.ir||[]).reduce((s,p)=>s+Math.round(p.salary*.75),0);
  });
  await rosterRef().set(DATA);
  // Sync rosterSizes so auction page open-spot counts stay accurate
  await syncRosterSizes();
}

async function syncRosterSizes() {
  if (!leagueId()) return;
  try {
    const mapSnap = await db.ref(`leagues/${leagueId()}/usernameToRosterId`).once('value');
    const map = mapSnap.val();
    if (!map) return; // auction page hasn't run yet - nothing to sync
    const sizes = {};
    Object.entries(DATA).forEach(([uname, t]) => {
      const rosterId = map[uname.toLowerCase()];
      if (rosterId == null) return;
      // Count active starters + IR (taxi doesn't count toward 25-man)
      const count = (t.starters||[]).length + (t.ir||[]).filter(p=>p.name).length;
      sizes[rosterId] = count;
    });
    await db.ref(`leagues/${leagueId()}/rosterSizes`).set(sizes);
  } catch(e) { console.warn('rosterSizes sync failed:', e); }
}


function getAge(birthDate) {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}
function ageBadge(name) {
  // Look up age from PLAYER_LOOKUP (populated from Sleeper DB or playerIdMap)
  const lk = PLAYER_LOOKUP[(name||'').toLowerCase()] || {};
  // Use integer age field directly; fall back to calculating from birth_date
  let age = lk.age != null ? Number(lk.age) : getAge(lk.birth_date);
  if (!age || age < 18 || age > 55) return '';
  const clr = age >= 32 ? 'var(--red)'
            : age >= 30 ? 'rgba(255,130,80,1)'   // orange-red
            : age >= 28 ? 'var(--yellow)'
            : 'var(--text3)';
  const bg  = age >= 32 ? 'rgba(255,77,106,.15)'
            : age >= 30 ? 'rgba(255,130,80,.12)'
            : age >= 28 ? 'rgba(255,201,77,.12)'
            : 'transparent';
  const title = age >= 32 ? 'Age concern — consider cap exposure'
              : age >= 30 ? 'Entering decline window'
              : age >= 28 ? 'Prime, approaching 30'
              : '';
  return `<span style="font-size:10px;color:${clr};background:${bg};border-radius:3px;padding:0 4px;margin-left:4px;cursor:default;" title="${title}">${age}yo</span>`;
}

var fmtM    = n => n>=1e6?'$'+(n/1e6).toFixed(1)+'M':n>=1e3?'$'+(n/1e3).toFixed(0)+'K':'$'+n;
const pctOf   = n => ((n/CAP)*100).toFixed(1)+'%';
const capClr  = s => s/CAP>.72?'var(--red)':s/CAP>.58?'var(--yellow)':'var(--green)';
const posTotal= (t,pos) => t.starters.filter(p=>p.pos===pos).reduce((a,p)=>a+p.salary,0);
const badge   = pos => {
  if (pos === 'IR')   return '<span title="IR" style="font-size:13px;cursor:default;">🏥</span>';
  if (pos === 'Taxi') return '<span title="Taxi squad" style="font-size:13px;cursor:default;">🚕</span>';
  return `<span class="pos-badge pb-${pos}">${pos}</span>`;
};

// ── Tab switcher ──────────────────────────────────────────────
function setTab(t) {
  tab = t;
  ['overview','allplayers','compare','toppaid','taxi','watchlist','rookiedraft','commish'].forEach(n => {
    // In SPA, cap tabs are prefixed cap-tab-; fall back to tab- for standalone
    const el = document.getElementById('cap-tab-'+n) || document.getElementById('tab-'+n);
    if (el) el.style.display = n===t?'':'none';
  });
  const scope = document.getElementById('view-roster') || document;
  scope.querySelectorAll('.nav-tab').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === t)
  );
  const dd = document.getElementById('nav-dd');
  if (dd) dd.value = t;
  renderTab(t);
}
function renderTab(t) {
  if (!DATA) return;
  if      (t==='overview')   renderOverview();
  else if (t==='allplayers') renderAllPlayers();
  else if (t==='compare')    renderCompare();
  else if (t==='toppaid')    renderTopPaid();
  else if (t==='taxi')       renderTaxi();
  else if (t==='watchlist')  renderWatchlist();
  else if (t==='rookiedraft') renderRookieDraft();
  else if (t==='commish')    renderCommish();
}

// ── OVERVIEW ─────────────────────────────────────────────────
async function renderOverviewDynasty() {
  const el = document.getElementById('tab-overview');
  if (!el || !DATA) return;
  // Ensure player lookup is ready
  if (!window._playerById || Object.keys(window._playerById).length < 100) {
    await (async function() {
      const appP = window.App?.state?.players || {};
      if (Object.keys(appP).length > 100) {
        window._playerById = {};
        Object.entries(appP).forEach(([id,p]) => {
          if (p.first_name && p.last_name) window._playerById[id] = {
            name: p.first_name+' '+p.last_name,
            pos: (p.fantasy_positions||[])[0]||p.position||'—',
            team: p.team||'—', rank: p.search_rank||9999
          };
        });
      } else {
        try {
          const r = await fetch('https://api.sleeper.app/v1/players/nfl');
          if (r.ok) {
            const data = await r.json();
            window._playerById = {};
            Object.entries(data).forEach(([id,p]) => {
              if (p.first_name && p.last_name) window._playerById[id] = {
                name: p.first_name+' '+p.last_name,
                pos: (p.fantasy_positions||[])[0]||p.position||'—',
                team: p.team||'—', rank: p.search_rank||9999
              };
            });
            try { localStorage.setItem('sb_players', JSON.stringify(data)); } catch(e) {}
          }
        } catch(e) {}
      }
    })();
  }
  const teams = Object.values(DATA);

  el.innerHTML = `
    <div style="padding:16px 0;">
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;">
        ${teams.map(t => {
          const key = Object.keys(DATA).find(k => DATA[k] === t) || '';
          const appTeam = (window._capTeams||[]).find(tm =>
            (tm.username||'').toLowerCase() === key ||
            (tm.display_name||'').toLowerCase() === (t.team_name||'').toLowerCase()
          );
          const totalPlayers = appTeam ? appTeam.players.length : 0;
          const taxiCount    = appTeam ? (appTeam.taxi||[]).length : 0;
          const irCount      = appTeam ? (appTeam.reserve||[]).length : 0;
          const activeCount  = totalPlayers - taxiCount - irCount;
          const avatarUrl    = appTeam?.avatar
            ? `https://sleepercdn.com/avatars/thumbs/${appTeam.avatar}`
            : null;
          const initials     = (t.team_name||'?')[0].toUpperCase();
          return `<div onclick="openTeamPanel('${key}')" style="background:var(--surface);border:1px solid var(--border);
            border-radius:var(--radius);padding:16px;cursor:pointer;transition:border-color .15s;"
            onmouseover="this.style.borderColor='var(--accent)'"
            onmouseout="this.style.borderColor='var(--border)'">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
              ${avatarUrl
                ? '<img src="'+avatarUrl+'" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">'
                : '<div style="width:36px;height:36px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;color:#fff;">'+initials+'</div>'}
              <div>
                <div style="font-size:14px;font-weight:600;">${t.team_name}</div>
                <div style="font-size:11px;color:var(--text3);">${key}</div>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center;margin-bottom:10px;">
              <div style="background:var(--surface2);border-radius:6px;padding:8px 4px;">
                <div style="font-size:16px;font-weight:700;">${activeCount}</div>
                <div style="font-size:10px;color:var(--text3);">Active</div>
              </div>
              <div style="background:var(--surface2);border-radius:6px;padding:8px 4px;">
                <div style="font-size:16px;font-weight:700;color:var(--text3);">${taxiCount}</div>
                <div style="font-size:10px;color:var(--text3);">Taxi</div>
              </div>
              <div style="background:var(--surface2);border-radius:6px;padding:8px 4px;">
                <div style="font-size:16px;font-weight:700;color:${irCount>0?'var(--red)':'var(--text3)'};">${irCount}</div>
                <div style="font-size:10px;color:var(--text3);">IR</div>
              </div>
            </div>
            ${(() => {
              if (!window._playerById || Object.keys(window._playerById).length < 100) {
                const _ap = window.App?.state?.players || {};
                if (Object.keys(_ap).length > 0) {
                  window._playerById = {};
                  Object.entries(_ap).forEach(([id,p]) => {
                    if (p.first_name && p.last_name) window._playerById[id] = {
                      name: p.first_name+' '+p.last_name,
                      pos: (p.fantasy_positions||[])[0]||p.position||'—',
                      team: p.team||'—', rank: p.search_rank||9999
                    };
                  });
                }
              }
              const byIdOv = window._playerById || {};
              const activePlayerIds = (appTeam?.players||[])
                .filter(id => !(appTeam.taxi||[]).includes(id) && !(appTeam.reserve||[]).includes(id));
              // Sort by Sleeper rank ascending (lower = better)
              const sortedActive = [...activePlayerIds].sort((a,b) =>
                (byIdOv[a]?.rank || 9999) - (byIdOv[b]?.rank || 9999));
              const top4 = sortedActive.slice(0, 4).map(id => {
                const p = byIdOv[id] || {};
                const name = p.name ? p.name.split(' ').map((w,i) => i===0 ? w[0]+'. ' : w).join('') : 'Unknown';
                const pos  = p.pos || '—';
                const pc   = POS_COLORS[pos] || '#888';
                return '<div style="display:flex;align-items:center;gap:6px;padding:2px 0;font-size:11px;">'
                  + '<span style="background:'+pc+'22;color:'+pc+';padding:0 4px;border-radius:3px;font-size:9px;font-weight:600;">'+pos+'</span>'
                  + '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+name+'</span>'
                  + '</div>';
              }).join('');
              return top4 ? '<div style="border-top:1px solid var(--border);padding-top:8px;">'+top4+'</div>' : '';
            })()}
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

function renderOverview() {
  const el = document.getElementById('tab-overview');
  if (!isSalaryLeague()) { renderOverviewDynasty(); return; } // async, fire and forget
  const teams = Object.values(DATA);
  const spentArr = teams.map(t=>t.cap_spent), availArr = teams.map(t=>CAP-t.cap_spent);
  const avg = Math.round(spentArr.reduce((a,b)=>a+b)/teams.length);

  const summaryRows = isSalaryLeague() ? [
    ['Salary Cap',     fmtM(CAP),                  '$1 = $100,000',       'var(--accent2)'],
    ['Avg Cap Spent',  fmtM(avg),                  pctOf(avg)+' of cap',  'var(--yellow)'],
    ['Most Spent',     fmtM(Math.max(...spentArr)), '',                    'var(--red)'],
    ['Least Spent',    fmtM(Math.min(...spentArr)), '',                    'var(--green)'],
    ['Most Available', fmtM(Math.max(...availArr)), '',                    'var(--green)'],
    ['Least Available',fmtM(Math.min(...availArr)), '',                    'var(--red)'],
  ] : [];
  const summary = summaryRows.map(([l,v,s,c]) => `<div class="sum-card">
    <div class="sum-label">${l}</div>
    <div class="sum-val" style="color:${c};">${v}</div>
    ${s?`<div class="sum-sub">${s}</div>`:''}
  </div>`).join('');

  const cards = Object.entries(DATA).map(([key,t]) => {
    const sp=t.cap_spent, av=CAP-sp, clr=capClr(sp);
    const top3 = [...t.starters].sort((a,b)=>b.salary-a.salary).slice(0,3);
    const scarBadges = POSITIONS.map(pos=>{
      const cnt=t.starters.filter(p=>p.pos===pos).length;
      if(cnt===0) return `<span class="scar-zero">${pos}:0!</span>`;
      if(cnt===1) return `<span class="scar-one">${pos}:1</span>`;
      return '';
    }).filter(Boolean).join('');
    const showSal = isSalaryLeague();
  return `<div class="ov-card" onclick="openTeamPanel('${key}')" style="cursor:pointer;${showSal&&sp>CAP?'border-color:var(--red);':''}">
      ${showSal&&sp>CAP ? `<div style="background:rgba(255,77,106,.12);border-bottom:1px solid rgba(255,77,106,.3);padding:4px 12px;font-size:11px;font-weight:600;color:var(--red);">⚠️ OVER CAP by ${fmtM(sp-CAP)}</div>` : ''}
      <div class="ov-header">
        <div><div class="ov-name">${t.team_name}</div><div class="ov-user">${key}</div></div>
        ${showSal ? `<div style="text-align:right;">
          <div style="font-family:var(--font-mono);font-size:13px;font-weight:600;color:${clr};">${pctOf(sp)}</div>
          <div style="font-size:10px;color:var(--text3);">cap used</div>
        </div>` : ''}
      </div>
      ${showSal ? `<div class="cap-bar"><div class="cap-bar-fill" style="width:${Math.min((sp/CAP*100),100).toFixed(1)}%;background:${clr};"></div></div>` : ''}
      ${showSal ? `<div class="ov-money">
        <span><strong style="color:${clr};">${fmtM(sp)}</strong> spent</span>
        <span><strong style="color:var(--green);">${fmtM(av)}</strong> avail</span>
      </div>` : ''}
      <div class="pos-grid">${POSITIONS.map(pos=>{
        const tot=posTotal(t,pos),cnt=t.starters.filter(p=>p.pos===pos).length;
        const c=cnt===0?'var(--red)':cnt===1?'var(--yellow)':POS_COLORS[pos];
        return `<div class="pos-blk"><div class="pos-lbl" style="color:${c};">${pos}</div>${showSal?`<div class="pos-val" style="color:${c};">${fmtM(tot)}</div>`:''}</div>`;
      }).join('')}</div>
      ${scarBadges?`<div style="margin-bottom:8px;">${scarBadges}</div>`:''}
      <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.4px;margin-bottom:5px;">${showSal ? 'Top Salaries' : 'Top Players'}</div>
      ${top3.map(p=>`<div class="top-player">
        <div class="tp-left">${badge(p.pos)}<span class="tp-name" data-pname="${p.name}" data-pid="${PLAYER_LOOKUP[p.name.toLowerCase()]?.player_id||''}" onclick="showPlayerCard(this.dataset.pid,this.dataset.pname)" style="cursor:pointer;">${p.name}</span></div>
        ${showSal ? `<span class="tp-sal">${fmtM(p.salary)}</span>` : ''}
      </div>`).join('')}
      ${showSal && (t.ir||[]).filter(p=>p.name).length ? `<div style="margin-top:6px;padding:4px 8px;background:rgba(255,77,106,.1);border-radius:4px;font-size:11px;color:var(--red);font-weight:500;">🏥 ${(t.ir||[]).filter(p=>p.name).length} on IR — 75% cap hit</div>` : (t.ir||[]).filter(p=>p.name).length ? `<div style="margin-top:6px;padding:4px 8px;background:rgba(255,77,106,.1);border-radius:4px;font-size:11px;color:var(--red);font-weight:500;">🏥 ${(t.ir||[]).filter(p=>p.name).length} on IR</div>` : ''}
    </div>`;
  }).join('');

  el.innerHTML = `<div class="league-summary">${summary}</div><div class="overview-grid">${cards}</div>`;
}

// ── ROSTERS ───────────────────────────────────────────────────
function renderRosters() {
  const el = document.getElementById('tab-rosters');
  const comm = isComm();
  const maxSal = Math.max(...Object.values(DATA).flatMap(t=>t.starters.map(p=>p.salary)), 1);

  // Default to signed-in user on first load
  const myUser = username().toLowerCase();
  if (rosterFilter === 'all' && myUser && DATA[myUser]) rosterFilter = myUser;

  const options = `<option value="all">— All Teams —</option>` +
    Object.entries(DATA).map(([k,t]) =>
      `<option value="${k}"${k===rosterFilter?' selected':''}>${t.team_name}</option>`
    ).join('');

  // Always render ALL teams so search works across all rosters.
  // Non-selected teams are hidden by CSS display:none initially.
  const teamsToShow = Object.entries(DATA);

  const cards = teamsToShow.map(([key,t]) => {
    const hidden = (rosterFilter !== 'all' && key !== rosterFilter) ? ' style="display:none;"' : '';
    const sp=t.cap_spent, av=CAP-sp, clr=capClr(sp), pct=(sp/CAP*100).toFixed(1);
    const byPos={}; POSITIONS.forEach(p=>byPos[p]=[]);
    t.starters.forEach(p=>{if(byPos[p.pos])byPos[p.pos].push({...p});});

    const editTh = comm?'<th style="width:65px;"></th>':'';
    const colgroup = comm
      ? `<colgroup><col/><col style="width:50px;"/><col style="width:115px;"/><col style="width:65px;"/></colgroup>`
      : `<colgroup><col/><col style="width:50px;"/><col style="width:115px;"/></colgroup>`;

    const scarHtml = POSITIONS.map(pos=>{
      const cnt=(byPos[pos]||[]).length;
      if(cnt===0) return `<span class="scar-zero">${pos}:0!</span>`;
      if(cnt===1) return `<span class="scar-one">${pos}:1</span>`;
      return '';
    }).filter(Boolean).join(' ');

    let rows='';
    POSITIONS.forEach(pos=>{
      const players=(byPos[pos]||[])
        .map(p=>({...p,_idx:t.starters.findIndex(s=>s.name===p.name&&s.pos===pos&&s.salary===p.salary)}))
        .sort((a,b)=>b.salary-a.salary);
      if(!players.length){
        const ab=comm?`<button class="add-slot-btn" onclick="openAdd('${key}','starters','${pos}')">+</button>`:'';
        rows+=`<tr class="sec-row"><td colspan="${comm?3:2}">${pos} <span style="color:var(--red);">— none ⚠️</span></td><td class="sec-add">${ab}</td></tr>`;
        return;
      }
      const tot=players.reduce((s,p)=>s+p.salary,0);
      const ab=comm?`<button class="add-slot-btn" onclick="openAdd('${key}','starters','${pos}')">+${pos}</button>`:'';
      rows+=`<tr class="sec-row"><td colspan="${comm?3:2}">${pos} <span style="opacity:.55;font-size:10px;">— ${fmtM(tot)}</span></td><td class="sec-add">${ab}</td></tr>`;
      rows+=players.map(p=>{
        const bw=Math.round(p.salary/maxSal*100);
        const ho=(holdouts[key]||{})[p.name];
        const hoBadge=ho?'<span title="Holdout" style="font-size:13px;cursor:default;">🔥</span>':''; 
        const hoBtn=comm?`<button class="act-btn" onclick="toggleHoldout('${key}','${p.name.replace(/'/g,"\\'")}')" title="${ho?'Remove holdout':'Flag holdout'}">${ho?'🔥':'🏳'}</button>`:'';
        const editBtn=comm?`<td class="act-cell">${hoBtn}<button class="act-btn" onclick="openEdit('${key}','starters',${p._idx})">✏️</button></td>`:'';
        return `<tr class="pr">
          <td>
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="width:32px;height:32px;border-radius:50%;background:${(POS_COLORS[p.pos]||'#888')}22;flex-shrink:0;overflow:hidden;">
                ${PLAYER_LOOKUP[p.name.toLowerCase()]?.player_id
                  ? `<img src="https://sleepercdn.com/content/nfl/players/thumb/${PLAYER_LOOKUP[p.name.toLowerCase()].player_id}.jpg" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'" />`
                  : `<span style="display:flex;width:100%;height:100%;align-items:center;justify-content:center;font-size:11px;color:${POS_COLORS[p.pos]||'var(--text3)'};">${p.pos}</span>`}
              </div>
              <div>
                <div>${p.name}${ageBadge(p.name)}${hoBadge}</div>
                ${(PLAYER_LOOKUP[p.name.toLowerCase()]?.nfl_team)
                  ? `<div style="font-size:11px;color:var(--text3);">${PLAYER_LOOKUP[p.name.toLowerCase()].nfl_team}</div>`
                  : ''}
              </div>
            </div>
          </td>
          <td>${badge(p.pos)}</td>
          <td class="sal-cell"><div>${fmtM(p.salary)}</div>
            <div class="sal-bar"><div class="sal-bar-fill" style="width:${bw}%;background:${POS_COLORS[p.pos]||'var(--text3)'};" ></div></div>
          </td>${editBtn}</tr>`;
      }).join('');
    });

    const irArr=t.ir||[];
    if(irArr.length){
      const ab=comm?`<button class="add-slot-btn" onclick="openAdd('${key}','ir','')">+IR</button>`:'';
      rows+=`<tr class="sec-row"><td colspan="${comm?3:2}">IR <span style="opacity:.55;font-size:10px;">75% cap</span></td><td class="sec-add">${ab}</td></tr>`;
      rows+=irArr.map((p,i)=>{
        const eb=comm?`<td class="act-cell"><button class="act-btn" onclick="openEdit('${key}','ir',${i})">✏️</button></td>`:'';
        return `<tr class="pr"><td>${p.name}${ageBadge(p.name)}<span title="IR" style="font-size:11px;margin-left:3px;cursor:default;">🏥</span></td><td>${badge('IR')}</td><td class="sal-cell">${fmtM(Math.round(p.salary*.75))}</td>${eb}</tr>`;
      }).join('');
    } else if(comm){
      rows+=`<tr class="sec-row"><td colspan="3">IR <span style="opacity:.55;font-size:10px;">75% cap</span></td><td class="sec-add"><button class="add-slot-btn" onclick="openAdd('${key}','ir','')">+IR</button></td></tr>`;
    }

    const taxiArr=(t.taxi||[]).filter(p=>p.name);
    if(taxiArr.length){
      const taxiTot=taxiArr.reduce((s,p)=>s+p.salary,0);
      const ab=comm?`<button class="add-slot-btn" onclick="openAdd('${key}','taxi','')">+Taxi</button>`:'';
      rows+=`<tr class="sec-row"><td colspan="${comm?3:2}">Taxi <span style="opacity:.55;font-size:10px;">no cap · ${fmtM(taxiTot)}</span></td><td class="sec-add">${ab}</td></tr>`;
      rows+=taxiArr.map(p=>{
        const promo=(promos[key]||{})[p.name];
        const pb=promo?`<span class="promoted-badge">⬆️</span>`:'';
        const promoBtn=comm&&!promo?`<button class="promo-btn" onclick="openPromoModal('${key}','${p.name.replace(/'/g,"\\'")}')">⬆️</button>`:'';
        const undoBtn=comm&&promo?`<button class="undo-btn" onclick="undoPromo('${key}','${p.name.replace(/'/g,"\\'")}')">↩</button>`:'';
        const ti=(t.taxi||[]).findIndex(x=>x.name===p.name);
        const eb=comm?`<td class="act-cell">${promoBtn}${undoBtn}<button class="act-btn" onclick="openEdit('${key}','taxi',${ti})">✏️</button></td>`:'';
        return `<tr class="pr"><td style="color:var(--text3);">${p.name}${pb}</td><td>${badge('Taxi')}</td><td class="sal-cell" style="color:var(--text3);">${fmtM(p.salary)}</td>${eb}</tr>`;
      }).join('');
    } else if(comm){
      rows+=`<tr class="sec-row"><td colspan="3">Taxi</td><td class="sec-add"><button class="add-slot-btn" onclick="openAdd('${key}','taxi','')">+Taxi</button></td></tr>`;
    }

    return `<div class="det-card" data-team="${key}"${hidden}>
      <div class="det-header">
        <div>
          <div class="det-title" onclick="openTeamPanel('${key}')" style="cursor:pointer;">${t.team_name} <span style="font-size:11px;color:var(--accent2);">↗</span></div>
          <div class="det-user">${key}${scarHtml?' '+scarHtml:''}</div>
        </div>
        <div class="det-cap-row">
          <div class="det-cap-item"><div class="det-cap-label">Spent</div>
            <div class="det-cap-val" style="color:${clr};">${fmtM(sp)} <span style="font-size:10px;opacity:.6;">${pct}%</span></div>
          </div>
          <div class="det-cap-item"><div class="det-cap-label">Available</div>
            <div class="det-cap-val" style="color:var(--green);">${fmtM(av)}</div>
          </div>
        </div>
      </div>
      <div style="padding:4px 18px 0;">
        <div class="cap-bar"><div class="cap-bar-fill" style="width:${pct}%;background:${clr};"></div></div>
      </div>
      <table class="roster-table">${colgroup}
        <thead><tr><th>Player</th><th>Pos</th><th style="text-align:right;">Salary</th>${editTh}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  }).join('');

  el.innerHTML = `
    <div class="roster-controls">
      <select class="team-select" id="roster-team-select" onchange="rosterFilter=this.value;renderRosters();">${options}</select>
      <div class="search-wrap">🔍<input id="roster-search" type="text" placeholder="Search all rosters…"/></div>
      <span style="font-size:12px;color:var(--text3);" id="roster-info">${rosterFilter==='all'?'All '+Object.keys(DATA).length+' teams':'1 team'}${comm?' · Comm':''}</span>
    </div>
    <div id="rc">${cards}</div>`;

  // Attach AFTER render — no focus stealing
  document.getElementById('roster-search')?.addEventListener('input', function() {
    const q = this.value.toLowerCase().trim();
    if (!q) {
      // No query: restore normal team-filter view
      document.querySelectorAll('#rc .pr').forEach(r => r.style.display = '');
      document.querySelectorAll('#rc .sec-row').forEach(r => r.style.display = '');
      document.querySelectorAll('#rc .det-card').forEach(c => {
        const key = c.dataset.team;
        c.style.display = (rosterFilter==='all' || key===rosterFilter) ? '' : 'none';
      });
      document.getElementById('roster-info').textContent =
        (rosterFilter==='all'?'All '+Object.keys(DATA).length+' teams':'1 team')+(comm?' · Comm':'');
      return;
    }

    // Search ALL teams regardless of rosterFilter
    let matchCount = 0;
    document.querySelectorAll('#rc .det-card').forEach(card => {
      let cardHasMatch = false;
      card.querySelectorAll('.pr').forEach(r => {
        const name = (r.cells[0]?.textContent||'').toLowerCase();
        const hit = name.includes(q);
        r.style.display = hit ? '' : 'none';
        if (hit) cardHasMatch = true;
      });
      // Hide section headers with no visible rows
      card.querySelectorAll('.sec-row').forEach(sec => {
        let sib=sec.nextElementSibling, any=false;
        while(sib && !sib.classList.contains('sec-row')){
          if(sib.style.display!=='none'){any=true;break;}
          sib=sib.nextElementSibling;
        }
        sec.style.display=any?'':'none';
      });
      // Always show all team cards when searching so you can see which team
      card.style.display = cardHasMatch ? '' : 'none';
      if (cardHasMatch) matchCount++;
    });
    document.getElementById('roster-info').textContent =
      `Search results: ${matchCount} team${matchCount!==1?'s':''} matched`;
  });
}

// ── ALL PLAYERS ──────────────────────────────────────────────
let apPosFilter = 'ALL';
let apSearch    = '';
let apPage      = 0;
const AP_PAGE_SIZE = 25;

// ── ALL PLAYERS TAB ───────────────────────────────────────────
// Keep search state + stats cache at module level so search input 
// doesn't get destroyed on each keystroke
let apStatsMap  = null;   // player_id -> stats for current year
let apSort      = { col: 'pts', dir: -1 };  // col: 'name'|'pts'|'owner'|'salary'=desc
let apStatYear  = 2025;   // 2023 | 2024 | 2025 (2025 = last completed season)

async function loadApStats(year) {
  year = year || apStatYear;
  const key = 'sb_stats_' + year;
  try {
    const cached = localStorage.getItem(key);
    if (cached) return JSON.parse(cached);
  } catch(e) {}
  try {
    const r = await fetch('https://api.sleeper.app/v1/stats/nfl/regular/' + year + '?season_type=regular&position[]=QB&position[]=RB&position[]=WR&position[]=TE');
    const data = await r.json();
    try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) {}
    return data;
  } catch(e) { return {}; }
}

async function setApStatYear(year) {
  apStatYear = year;
  apStatsMap = await loadApStats(year);
  apRenderRows();
}

const AP_NFL_TEAMS = ['ARI','ATL','BAL','BUF','CAR','CHI','CIN','CLE','DAL','DEN','DET','GB','HOU','IND','JAX','KC','LAC','LAR','LV','MIA','MIN','NE','NO','NYG','NYJ','PHI','PIT','SEA','SF','TB','TEN','WAS'];

function apBuildShell(el) {
  const teamOpts  = AP_NFL_TEAMS.map(t => '<option value="' + t + '">' + t + '</option>').join('');
  const ownerOpts = Object.entries(DATA||{}).map(([k,t]) => '<option value="' + k + '">' + t.team_name + '</option>').join('');
  const selStyle  = 'padding:5px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-size:12px;font-family:var(--font-body);outline:none;cursor:pointer;';
  el.innerHTML =
    '<div style="padding:16px 0 8px;">' +
      '<div class="fa-search">' +
        '<span class="search-icon">🔍</span>' +
        '<input id="ap-search-input" type="text" placeholder="Search players…" oninput="apSearch=this.value.toLowerCase().trim();apRenderRows();" />' +
      '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px;">' +
        '<div class="fa-filters" style="margin-bottom:0;" id="ap-chips"></div>' +
        '<select id="ap-nfl-filter"   onchange="apRenderRows()" style="' + selStyle + '"><option value="">All NFL Teams</option>' + teamOpts + '</select>' +
        '<select id="ap-owner-filter" onchange="apRenderRows()" style="' + selStyle + '"><option value="">All Owners</option>' + ownerOpts + '</select>' +
        '<div style="display:flex;gap:0;margin-left:auto;">' +
          '<button id="ap-yr-2023" onclick="setApStatYear(2023)" style="' + selStyle + 'border-radius:var(--radius-sm) 0 0 var(--radius-sm);border-right:none;">2023</button>' +
          '<button id="ap-yr-2024" onclick="setApStatYear(2024)" style="' + selStyle + 'border-radius:0;border-right:none;">2024</button>' +
          '<button id="ap-yr-2025" onclick="setApStatYear(2025)" style="' + selStyle + 'border-radius:0 var(--radius-sm) var(--radius-sm) 0;">2025</button>' +
        '</div>' +
      '</div>' +
      '<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;">' +
        '<div style="padding:9px 14px;border-bottom:1px solid var(--border);background:var(--surface2);display:flex;align-items:center;justify-content:space-between;">' +
          '<span id="ap-title" style="font-size:14px;font-weight:600;"></span>' +
          '<span id="ap-count" style="font-size:12px;color:var(--text3);"></span>' +
        '</div>' +
        '<div style="overflow-x:auto;">' +
          '<table class="fa-table">' +
            '<thead><tr>' +
              '<th id="ap-th-name" onclick="apSortBy(&quot;name&quot;)" style="cursor:pointer;user-select:none;">Player <span id="ap-sort-name"></span></th>' +
              '<th>NFL Team</th>' +
              '<th id="ap-th-pts" onclick="apSortBy(&quot;pts&quot;)"    style="cursor:pointer;user-select:none;">Pts <span id="ap-sort-pts"></span></th>' +
              '<th id="ap-th-owner" onclick="apSortBy(&quot;owner&quot;)" style="cursor:pointer;user-select:none;">Owner <span id="ap-sort-owner"></span></th>' +
              (isSalaryLeague() ? '<th id="ap-th-sal" onclick="apSortBy(&quot;salary&quot;)" style="cursor:pointer;user-select:none;text-align:right;">Salary <span id="ap-sort-sal">▼</span></th>' : '') +
              '<th style="text-align:right;"></th>' +
            '</tr></thead>' +
            '<tbody id="ap-rows"></tbody>' +
          '</table>' +
        '</div>' +
        '<div id="ap-empty" style="display:none;padding:30px;text-align:center;color:var(--text3);">No players found.</div>' +
      '</div>' +
    '</div>';
}


function renderAllPlayers() {
  const el = document.getElementById('tab-allplayers');

  // Build flat player list from all roster slots
  const players = [];
  if (!isSalaryLeague() && window._capTeams && window._capTeams.length > 0) {
    // Dynasty: use Sleeper live roster data
    const byId = window._playerById || {};
    window._capTeams.forEach(tm => {
      const key      = (tm.username||tm.display_name||'').toLowerCase().replace(/ /g,'_');
      const teamName = tm.display_name || tm.username || `Team ${tm.roster_id}` || key;
      const taxiSet  = new Set(tm.taxi    || []);
      const resSet   = new Set(tm.reserve || []);
      (tm.players || []).forEach(id => {
        const p    = byId[id] || {};
        const name = p.name  || `Player ${id}`;
        const pos  = p.pos   || '—';
        const slot = resSet.has(id) ? 'IR' : taxiSet.has(id) ? 'Taxi' : 'Active';
        players.push({ name, pos, salary: 0, slot, teamName, teamKey: key, rank: p.rank || 9999, player_id: id });
      });
    });
  } else {
    Object.entries(DATA).forEach(([key, t]) => {
      (t.starters||[]).forEach(p => { if(p.name) players.push({name:p.name, pos:p.pos||'—', salary:p.salary, slot:'Active', teamName:t.team_name, teamKey:key}); });
      (t.ir||[]).forEach(p =>     { if(p.name) players.push({name:p.name, pos:p.pos||'—', salary:Math.round(p.salary*.75), rawSal:p.salary, slot:'IR',     teamName:t.team_name, teamKey:key}); });
      (t.taxi||[]).forEach(p =>   { if(p.name) players.push({name:p.name, pos:p.pos||'—', salary:p.salary, slot:'Taxi',   teamName:t.team_name, teamKey:key}); });
    });
  }

  // Filter
  const apNflFilter   = (document.getElementById('ap-nfl-filter')?.value   || '').toUpperCase();
  const apOwnerFilter = (document.getElementById('ap-owner-filter')?.value || '');
  let filtered = apPosFilter === 'ALL' ? players : players.filter(p => p.pos === apPosFilter);
  if (apSearch)      filtered = filtered.filter(p => p.name.toLowerCase().includes(apSearch));
  if (apNflFilter)   filtered = filtered.filter(p => (PLAYER_LOOKUP[p.name.toLowerCase()]?.nfl_team||'').toUpperCase() === apNflFilter);
  if (apOwnerFilter) filtered = filtered.filter(p => p.teamKey === apOwnerFilter);
  const stats = apStatsMap || {};
  // Sort
  const dir = apSort.dir;
  if (apSort.col === 'pts') {
    filtered.sort((a, b) => {
      const pidA = a.player_id || PLAYER_LOOKUP[a.name.toLowerCase()]?.player_id || '';
      const pidB = b.player_id || PLAYER_LOOKUP[b.name.toLowerCase()]?.player_id || '';
      const pa = (stats[pidA]?.pts_ppr ?? -1);
      const pb = (stats[pidB]?.pts_ppr ?? -1);
      return -dir * (pb - pa);
    });
  } else if (apSort.col === 'name') {
    filtered.sort((a, b) => dir * a.name.localeCompare(b.name));
  } else if (apSort.col === 'owner') {
    filtered.sort((a, b) => dir * (a.teamName||'').localeCompare(b.teamName||''));
  } else {
    filtered.sort((a, b) => -dir * (b.salary - a.salary));
  }

  const totalSal = filtered.filter(p => p.slot === 'Active').reduce((s, p) => s + p.salary, 0);
  const wl       = JSON.parse(localStorage.getItem('sb_cap_watchlist') || '{}');

  // Paginate: show AP_PAGE_SIZE at a time
  const totalFiltered = filtered.length;
  const totalPages = Math.ceil(totalFiltered / AP_PAGE_SIZE);
  if (apPage >= totalPages) apPage = Math.max(0, totalPages - 1);
  const pageStart = apPage * AP_PAGE_SIZE;
  const pageEnd   = Math.min(pageStart + AP_PAGE_SIZE, totalFiltered);
  const paginated = filtered.slice(pageStart, pageEnd);

  // Build rows — identical structure to FA tab, with owner/salary/badges added
  const rows = paginated.map(p => {
    const lk       = PLAYER_LOOKUP[p.name.toLowerCase()] || {};
    const pid      = p.player_id || lk.player_id || '';
    // For dynasty players, get NFL team from _playerById (built from Sleeper DB)
    const byIdEntry = pid ? (window._playerById||{})[pid] : null;
    const nflTeam  = lk.nfl_team || byIdEntry?.team || '—';
    const ho       = (holdouts[p.teamKey]||{})[p.name];
    const starred  = !!wl[p.name];
    const safeName = p.name.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

    // Stats line — same as FA tab
    const raw = pid ? (stats[pid] || {}) : {};
    const bits = [];
    if (raw.pass_yd) bits.push(Math.round(raw.pass_yd) + ' PaYd');
    if (raw.pass_td) bits.push(raw.pass_td + ' PaTD');
    if (raw.rush_yd) bits.push(Math.round(raw.rush_yd) + ' RuYd');
    if (raw.rush_td) bits.push(raw.rush_td + ' RuTD');
    if (raw.rec)     bits.push(raw.rec + ' Rec');
    if (raw.rec_yd)  bits.push(Math.round(raw.rec_yd) + ' ReYd');
    if (raw.rec_td)  bits.push(raw.rec_td + ' ReTD');
    const statLine = bits.length ? '<div style="font-size:10px;color:var(--text3);margin-top:2px;">' + bits.join(' · ') + '</div>' : '';
    const pts      = raw.pts_ppr != null ? raw.pts_ppr.toFixed(1) : '—';

    // Cap-specific badges
    const slotBadge = p.slot !== 'Active'
      ? '<span style="font-size:10px;background:' + (p.slot==='IR'?'rgba(255,77,106,.12)':'rgba(90,94,114,.2)') + ';color:' + (p.slot==='IR'?'var(--red)':'var(--text3)') + ';padding:1px 5px;border-radius:3px;margin-left:5px;">' + p.slot + '</span>' : '';
    const hoBadge  = ho ? '<span style="font-size:10px;color:var(--yellow);margin-left:4px;">🔥</span>' : '';
    const salClr   = p.slot === 'Taxi' ? 'var(--text3)' : p.slot === 'IR' ? 'var(--text2)' : 'var(--text)';

    return '<tr>' +
      '<td>' +
        '<div class="player-cell">' +
          '<div class="fa-mini-avatar">' +
            (pid ? '<img src="https://sleepercdn.com/content/nfl/players/thumb/' + pid + '.jpg" onerror="this.style.display=\'none\'" />' : '') +
            '<span style="display:none">' + (p.pos||'?') + '</span>' +
          '</div>' +
          '<div>' +
            '<div style="font-weight:500;"><span onclick="showPlayerCard(\'' + pid + '\',\'' + p.name.replace(/'/g,"&#39;") + '\')" style="cursor:pointer;" title="View player card">' + p.name + '</span>' + ageBadge(p.name) + slotBadge + hoBadge + '</div>' +
            '<div style="display:flex;gap:6px;margin-top:2px;"><span class="pos-badge pos-' + p.pos + '">' + (p.pos||'—') + '</span></div>' +
            statLine +
          '</div>' +
        '</div>' +
      '</td>' +
      '<td style="color:var(--text2);">' + nflTeam + '</td>' +
      '<td style="color:var(--text2);font-family:var(--font-mono);font-size:13px;">' + pts + '</td>' +
      '<td style="color:var(--text2);">' +
('<span onclick="' + (isSalaryLeague() ? 'openTeamPanel' : 'openTeamPanelFromKey') + '(\'' + p.teamKey + '\')" style="cursor:pointer;">' +
        (p.teamName || p.teamKey || '—') +
        ' <span style="color:var(--accent2);font-size:10px;">↗</span></span>') +
      '</td>' +
      (isSalaryLeague() ?
        '<td style="text-align:right;font-family:var(--font-mono);font-size:13px;color:' + salClr + ';">' +
          fmtM(p.salary) + (p.rawSal ? '<br/><span style="font-size:10px;color:var(--text3);">(' + fmtM(p.rawSal) + ')</span>' : '') +
        '</td>' : '') +

      '<td style="text-align:right;">' +
        '<button class="btn btn-sm" data-pname="' + safeName + '" onclick="capToggleWatch(this)" ' +
          'style="background:transparent;border:1px solid var(--border);font-size:13px;padding:4px 7px;" ' +
          'title="' + (starred?'Unwatch':'Watch') + '">' + (starred?'⭐':'☆') + '</button>' +
      '</td>' +
    '</tr>';
  }).join('');

  // Build shell once, then only update dynamic parts
  // Always rebuild shell so layout changes take effect on deploy
  const savedSearch = document.getElementById('ap-search-input')?.value || '';
  apBuildShell(el);
  if (savedSearch) document.getElementById('ap-search-input').value = savedSearch;

  // Pos chips
  document.getElementById('ap-chips').innerHTML = ['ALL','QB','RB','WR','TE'].map(pos =>
    '<div class="filter-chip' + (apPosFilter===pos?' active':'') + '" onclick="apSetPos(\'' + pos + '\')">' + (pos==='ALL'?'All':pos) + '</div>'
  ).join('');

  // Update pts column header with active year
  const ptsHeader = document.getElementById('ap-th-pts');
  if (ptsHeader) ptsHeader.innerHTML = apStatYear + ' Pts <span id="ap-sort-pts"></span>';
  // Update sort arrow indicators
  const sortSal   = document.getElementById('ap-sort-sal');
  const sortPts   = document.getElementById('ap-sort-pts');
  const sortName  = document.getElementById('ap-sort-name');
  const sortOwner = document.getElementById('ap-sort-owner');
  if (sortSal)   sortSal.textContent   = apSort.col === 'salary' ? (apSort.dir < 0 ? '▼' : '▲') : '';
  if (sortPts)   sortPts.textContent   = apSort.col === 'pts'    ? (apSort.dir < 0 ? '▼' : '▲') : '';
  if (sortName)  sortName.textContent  = apSort.col === 'name'   ? (apSort.dir < 0 ? '▼' : '▲') : '';
  if (sortOwner) sortOwner.textContent = apSort.col === 'owner'  ? (apSort.dir < 0 ? '▼' : '▲') : '';
  // Highlight active year button
  [2023,2024,2025].forEach(y => {
    const btn = document.getElementById('ap-yr-' + y);
    if (btn) btn.style.background = y === apStatYear ? 'var(--accent)' : 'var(--surface2)';
    if (btn) btn.style.color      = y === apStatYear ? '#fff' : 'var(--text2)';
  });
  document.getElementById('ap-title').textContent =
    (apPosFilter==='ALL' ? 'All Rostered Players' : apPosFilter + ' Players') + (apSearch ? ' · "' + apSearch + '"' : '');
  const countLabel = totalFiltered + ' players' + (apPosFilter!=='ALL' && !apSearch ? ' · ' + fmtM(totalSal) + ' total cap' : '');
  document.getElementById('ap-count').textContent = countLabel;
  document.getElementById('ap-rows').innerHTML = rows;

  // Pagination controls
  let pgEl = document.getElementById('ap-pagination');
  if (!pgEl) {
    pgEl = document.createElement('div');
    pgEl.id = 'ap-pagination';
    pgEl.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:12px;padding:12px 0;font-size:13px;';
    document.getElementById('ap-rows').insertAdjacentElement('afterend', pgEl);
  }
  if (totalPages > 1) {
    pgEl.innerHTML =
      `<button onclick="apPage=Math.max(0,apPage-1);renderAllPlayers()" style="padding:5px 14px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;font-family:var(--font-body);" ${apPage===0?'disabled':''}>← Prev</button>` +
      `<span style="color:var(--text3);">${pageStart+1}–${pageEnd} of ${totalFiltered}</span>` +
      `<button onclick="apPage=Math.min(totalPages-1,apPage+1);renderAllPlayers()" style="padding:5px 14px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;font-family:var(--font-body);" ${apPage>=totalPages-1?'disabled':''}>Next →</button>`;
    pgEl.style.display = 'flex';
  } else {
    pgEl.style.display = 'none';
  }
  document.getElementById('ap-empty').style.display = filtered.length ? 'none' : '';

  if (!apStatsMap) {
    loadApStats(apStatYear).then(data => {
      apStatsMap = data;
      if (tab === 'allplayers') apRenderRows();
    });
  }
}

function apSortBy(col) {
  if (apSort.col === col) apSort.dir *= -1;
  else { apSort.col = col; apSort.dir = col === 'salary' ? -1 : -1; }
  apRenderRows();
}
function apRenderRows() { renderAllPlayers(); }
function apSetPos(pos)  { apPosFilter = pos; renderAllPlayers(); }
function apSetPos(pos) { apPosFilter = pos; renderAllPlayers(); }

// Watchlist toggle now uses data-pname to avoid quote issues
function capToggleWatch(nameOrBtn) {
  const name = typeof nameOrBtn === 'string' ? nameOrBtn : nameOrBtn.getAttribute('data-pname');
  if (!name) return;
  const wl = JSON.parse(localStorage.getItem('sb_cap_watchlist')||'{}');
  if (wl[name]) delete wl[name]; else wl[name] = Date.now();
  localStorage.setItem('sb_cap_watchlist', JSON.stringify(wl));
  if (tab === 'allplayers') apRenderRows();
  if (tab === 'watchlist')  renderWatchlist();
}

// ── INLINE TEAM PANEL ────────────────────────────────────────
function openTeamPanelFromKey(key) {
  // For dynasty: find the appTeam and DATA entry by key
  const t = DATA[key];
  if (t) { openTeamPanelDynasty(key, t); return; }
  // Key may not match DATA exactly -- find by username
  const appTeam = (window._capTeams||[]).find(tm =>
    (tm.username||'').toLowerCase().replace(/ /g,'_') === key ||
    (tm.display_name||'').toLowerCase().replace(/ /g,'_') === key
  );
  if (appTeam) {
    const fakeT = { team_name: appTeam.display_name||appTeam.username||key, starters:[], ir:[], taxi:[] };
    openTeamPanelDynasty(key, fakeT);
  }
}

async function openTeamPanelDynasty(key, t) {
  const appTeam = (window._capTeams||[]).find(tm =>
    (tm.username||'').toLowerCase() === key ||
    (tm.display_name||'').toLowerCase() === (t.team_name||'').toLowerCase()
  );
  if (!appTeam) return;

  // Build _playerById from any available source (async -- fetches if needed)
  async function ensurePlayerById() {
    if (window._playerById && Object.keys(window._playerById).length > 100) return;
    window._playerById = {};

    function buildFrom(playersObj) {
      Object.entries(playersObj).forEach(([id, p]) => {
        if (p.first_name && p.last_name) {
          window._playerById[id] = {
            name: p.first_name + ' ' + p.last_name,
            pos:  (p.fantasy_positions||[])[0] || p.position || '—',
            team: p.team || '—',
            rank: p.rank || p.search_rank || 9999,
          };
        }
      });
    }

    // Source 1: App.state.players
    const appPlayers = window.App?.state?.players || {};
    if (Object.keys(appPlayers).length > 100) {
      buildFrom(appPlayers);
      console.log('[dynasty panel] _playerById from App.state:', Object.keys(window._playerById).length);
      return;
    }
    // Source 2: localStorage
    try {
      const cached = localStorage.getItem('sb_players');
      if (cached) {
        buildFrom(JSON.parse(cached));
        if (Object.keys(window._playerById).length > 100) {
          console.log('[dynasty panel] _playerById from localStorage:', Object.keys(window._playerById).length);
          return;
        }
      }
    } catch(e) {}
    // Source 3: Fetch directly from Sleeper
    try {
      console.log('[dynasty panel] fetching players from Sleeper...');
      const r = await fetch('https://api.sleeper.app/v1/players/nfl');
      if (r.ok) {
        const data = await r.json();
        buildFrom(data);
        try { localStorage.setItem('sb_players', JSON.stringify(data)); } catch(e) {}
        console.log('[dynasty panel] _playerById from Sleeper fetch:', Object.keys(window._playerById).length);
      }
    } catch(e) { console.warn('[dynasty panel] player fetch failed:', e); }
  }
  await ensurePlayerById();
  const byId     = window._playerById || {};
  console.log('[dynasty panel] byId size:', Object.keys(byId).length, 'sample id:', appTeam?.players?.[0], '-> ', byId[appTeam?.players?.[0]]?.name);
  const taxiSet  = new Set(appTeam.taxi    || []);
  const resSet   = new Set(appTeam.reserve || []);
  const allIds   = appTeam.players || [];
  const activeIds= allIds.filter(id => !taxiSet.has(id) && !resSet.has(id));
  const taxiIds  = allIds.filter(id => taxiSet.has(id));
  const irIds    = allIds.filter(id => resSet.has(id));

  function playerRow(id, dimmed) {
    const p    = byId[id] || {};
    const name = p.name || `Player ${id}`;
    const pos  = p.pos  || '—';
    const team = p.team || '—';
    const pc   = POS_COLORS[pos] || '#888';
    const photo= `<img src="https://sleepercdn.com/content/nfl/players/thumb/${id}.jpg"
      style="width:26px;height:26px;border-radius:50%;object-fit:cover;flex-shrink:0;"
      onerror="this.style.display='none'" />`;
    return `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;${dimmed?'opacity:.6;':''}">
      ${photo}
      <div style="flex:1;font-size:13px;"><span data-pid="${id}" data-pname="${name}" onclick="showPlayerCard(this.dataset.pid,this.dataset.pname)" style="cursor:pointer;">${name}</span>${ageBadge(name)}</div>
      <span style="font-size:10px;background:${pc}22;color:${pc};padding:1px 5px;border-radius:3px;">${pos}</span>
      <span style="font-size:10px;color:var(--text3);">${team}</span>
    </div>`;
  }

  const POS_ORDER = ['QB','RB','WR','TE','K','DEF','DL','LB','DB'];

  function section(label, ids, dimmed) {
    if (!ids.length) return '';
    // Group by position, sort each group by rank
    const groups = {};
    ids.forEach(id => {
      const p   = byId[id] || {};
      const pos = p.pos || 'OTH';
      if (!groups[pos]) groups[pos] = [];
      groups[pos].push(id);
    });
    // Sort ids within each group by rank
    Object.keys(groups).forEach(pos => {
      groups[pos].sort((a,b) => (byId[a]?.rank||9999) - (byId[b]?.rank||9999));
    });
    // Order positions
    const orderedPos = [
      ...POS_ORDER.filter(p => groups[p]),
      ...Object.keys(groups).filter(p => !POS_ORDER.includes(p)).sort()
    ];
    const rows = orderedPos.map(pos => {
      const posColor = POS_COLORS[pos] || '#888';
      const posHeader = `<div style="font-size:10px;font-weight:600;color:${posColor};
        padding:6px 0 2px;margin-top:4px;">${pos}</div>`;
      return posHeader + groups[pos].map(id => playerRow(id, dimmed)).join('');
    }).join('');
    return `<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;
      color:var(--text3);padding:10px 0 4px;border-top:1px solid var(--border);margin-top:6px;">
      ${label} (${ids.length})</div>${rows}`;
  }

  const rHTML = section('Active Roster', activeIds, false)
              + section('🚕 Taxi Squad', taxiIds, true)
              + section('🏥 IR', irIds, true);

  document.getElementById('team-panel-title').textContent = t.team_name;
  document.getElementById('team-panel-body').innerHTML = `
    <div style="display:flex;gap:16px;margin-bottom:18px;flex-wrap:wrap;">
      <div style="text-align:center;">
        <div style="font-family:var(--font-mono);font-size:18px;font-weight:600;">${activeIds.length}</div>
        <div style="font-size:10px;color:var(--text3);text-transform:uppercase;margin-top:2px;">Active</div>
      </div>
      ${taxiIds.length ? `<div style="text-align:center;">
        <div style="font-family:var(--font-mono);font-size:18px;font-weight:600;color:var(--text3);">${taxiIds.length}</div>
        <div style="font-size:10px;color:var(--text3);text-transform:uppercase;margin-top:2px;">Taxi</div>
      </div>` : ''}
      ${irIds.length ? `<div style="text-align:center;">
        <div style="font-family:var(--font-mono);font-size:18px;font-weight:600;color:var(--red);">${irIds.length}</div>
        <div style="font-size:10px;color:var(--red);text-transform:uppercase;margin-top:2px;">IR</div>
      </div>` : ''}
    </div>
    ${rHTML}`;
  document.getElementById('team-panel').style.display = '';
}

function openTeamPanel(key) {
  const t = DATA[key]; if (!t) return;

  // For non-salary leagues, show a player-list panel from Sleeper live data
  if (!isSalaryLeague()) {
    openTeamPanelDynasty(key, t);
    return;
  }

  const comm=isComm(), sp=t.cap_spent, av=CAP-sp, pct=(sp/CAP*100).toFixed(1), clr=capClr(sp);
  const maxSal=Math.max(...(t.starters||[]).map(p=>p.salary),1);
  const teamHO=holdouts[key]||{}, teamPromos=promos[key]||{};

  // Build Sleeper IR set for this team from live app state
  const appTeams   = window.App?.state?.teams || [];
  // Match by username key (DATA key = Sleeper username)
  const appTeam    = appTeams.find(tm => (tm.username||'').toLowerCase() === key.toLowerCase()
                                      || (tm.display_name||'').toLowerCase() === (t.team_name||'').toLowerCase());
  const sleeperReserveSet = new Set(appTeam?.reserve || []);
  const posTotals={QB:0,RB:0,WR:0,TE:0},posCounts={QB:0,RB:0,WR:0,TE:0};
  (t.starters||[]).forEach(p=>{if(posTotals[p.pos]!==undefined){posTotals[p.pos]+=p.salary;posCounts[p.pos]++;}});
  let rHTML='';
  POSITIONS.forEach(pos=>{
    const players=(t.starters||[]).filter(p=>p.pos===pos).sort((a,b)=>b.salary-a.salary);
    if(!players.length)return;
    const tot=players.reduce((s,p)=>s+p.salary,0);
    rHTML+=`<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--text3);padding:10px 0 4px;border-top:1px solid var(--border);margin-top:6px;">${pos} · ${fmtM(tot)}</div>`;
    rHTML+=players.map(p=>{
    const ho=teamHO[p.name];
    const lk=PLAYER_LOOKUP[p.name.toLowerCase()]||{};
    const pid=lk.player_id;
    const posClr=POS_COLORS[p.pos]||'#888';
    const photo=pid
      ?`<img src="https://sleepercdn.com/content/nfl/players/thumb/${pid}.jpg" style="width:26px;height:26px;border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.style.display='none'" />`
      :`<div style="width:26px;height:26px;border-radius:50%;background:${posClr}22;flex-shrink:0;"></div>`;
    const pid2 = PLAYER_LOOKUP[p.name.toLowerCase()]?.player_id;
    const onSleeperIR = pid2 && sleeperReserveSet.has(pid2);
    const irCapHit = onSleeperIR ? Math.round(p.salary * 0.75) : null;
    return`<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;gap:8px;${onSleeperIR?'opacity:.75;':''}">
      ${photo}
      <div style="flex:1;font-size:13px;"><span data-pname="${p.name}" data-pid="${PLAYER_LOOKUP[p.name.toLowerCase()]?.player_id||''}" onclick="showPlayerCard(this.dataset.pid,this.dataset.pname)" style="cursor:pointer;">${p.name}</span>${ageBadge(p.name)}${ho?'<span style="font-size:10px;color:var(--yellow);margin-left:4px;">🔥</span>':''}${onSleeperIR?'<span style="font-size:10px;color:var(--red);margin-left:4px;" title="On Sleeper IR — move to IR in Commish tab for 75% cap hit">🏥 IR*</span>':''}</div>
      ${panelShowSal ? `<div style="font-family:var(--font-mono);font-size:12px;flex-shrink:0;${onSleeperIR?'color:var(--red);':''}">
        ${onSleeperIR?`<span style="text-decoration:line-through;opacity:.5;">${fmtM(p.salary)}</span> ${fmtM(irCapHit)}`:fmtM(p.salary)}
      </div>` : ''}
    </div>`;
  }).join('');
  });
  // ── IR section ──────────────────────────────────────────────
  const irArr=(t.ir||[]).filter(p=>p.name);
  if(irArr.length){
    const irTotal=irArr.reduce((s,p)=>s+Math.round(p.salary*.75),0);
    rHTML+=`<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--red);padding:10px 0 4px;border-top:1px solid var(--border);margin-top:6px;">🏥 IR · 75% cap hit · ${fmtM(irTotal)}</div>`;
    rHTML+=irArr.sort((a,b)=>b.salary-a.salary).map(p=>{
      const capHit=Math.round(p.salary*.75);
      const lk=PLAYER_LOOKUP[p.name.toLowerCase()]||{};
      const pid=lk.player_id;
      const pc=POS_COLORS[p.pos]||'#888';
      const photo=pid
        ?`<img src="https://sleepercdn.com/content/nfl/players/thumb/${pid}.jpg" style="width:26px;height:26px;border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.style.display='none'" />`
        :`<div style="width:26px;height:26px;border-radius:50%;background:${pc}22;flex-shrink:0;"></div>`;
      return`<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;gap:8px;">
        ${photo}
        <div style="flex:1;font-size:13px;color:var(--text2);"><span data-pname="${p.name}" data-pid="${PLAYER_LOOKUP[p.name.toLowerCase()]?.player_id||''}" onclick="showPlayerCard(this.dataset.pid,this.dataset.pname)" style="cursor:pointer;">${p.name}</span>${ageBadge(p.name)}${p.pos&&p.pos!=='—'?`<span style="font-size:10px;background:${pc}22;color:${pc};padding:0 4px;border-radius:3px;margin-left:4px;">${p.pos}</span>`:''}
          <span style="font-size:10px;color:var(--text3);margin-left:4px;">(${fmtM(p.salary)} → 75%)</span></div>
        ${panelShowSal ? `<div style="font-family:var(--font-mono);font-size:12px;color:var(--red);flex-shrink:0;">${fmtM(capHit)}</div>` : ''}
      </div>`;
    }).join('');
  }

  // ── Sleeper IR warning -- starters on Sleeper IR not yet in Firebase ir[] ──
  const irPlayerIds = new Set((t.ir||[]).map(p => PLAYER_LOOKUP[p.name?.toLowerCase()]?.player_id).filter(Boolean));
  const unrecordedIR = (t.starters||[]).filter(p => {
    const pid2 = PLAYER_LOOKUP[p.name?.toLowerCase()]?.player_id;
    return pid2 && sleeperReserveSet.has(pid2) && !irPlayerIds.has(pid2);
  });
  if (unrecordedIR.length) {
    rHTML += `<div style="background:rgba(255,77,106,.08);border:1px solid rgba(255,77,106,.3);
      border-radius:6px;padding:8px 10px;margin-top:8px;font-size:12px;color:var(--red);">
      ⚠️ ${unrecordedIR.map(p=>p.name).join(', ')} ${unrecordedIR.length===1?'is':'are'} on Sleeper IR
      but still in active roster. Move to IR in the Commish tab to apply 75% cap hit.
    </div>`;
  }

  // ── Taxi section ─────────────────────────────────────────────
  const taxiArr=(t.taxi||[]).filter(p=>p.name);
  if(taxiArr.length){
    rHTML+=`<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--text3);padding:10px 0 4px;border-top:1px solid var(--border);margin-top:6px;">Taxi · no cap hit</div>`;
    rHTML+=taxiArr.sort((a,b)=>b.salary-a.salary).map(p=>{
    const promo=teamPromos[p.name];
    const pc=POS_COLORS[p.pos]||'var(--text3)';
    const lk=PLAYER_LOOKUP[p.name.toLowerCase()]||{};
    const yeStored=p.years_exp!=null?Number(p.years_exp):null;
    const yeLookup=lk.years_exp!=null?Number(lk.years_exp):null;
    const ye=yeStored??yeLookup;
    let gradBadge='';
    if(ye!=null){
      if(ye>=3) gradBadge='<span title="Year '+ye+' — must promote or release" style="font-size:12px;margin-left:4px;cursor:default;">🔴</span>';
      else if(ye===2) gradBadge='<span title="Year 2 — caution" style="font-size:12px;margin-left:4px;cursor:default;">⚠️</span>';
      else gradBadge='';
    }
    return`<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;gap:8px;">
      <div style="flex:1;font-size:13px;color:var(--text3);"><span data-pname="${p.name}" data-pid="${PLAYER_LOOKUP[p.name.toLowerCase()]?.player_id||''}" onclick="showPlayerCard(this.dataset.pid,this.dataset.pname)" style="cursor:pointer;">${p.name}</span>${ageBadge(p.name)}${gradBadge}${p.pos&&p.pos!=='—'?`<span style="font-size:10px;background:${pc}22;color:${pc};padding:0 4px;border-radius:3px;margin-left:4px;">${p.pos}</span>`:''}${promo?'<span style="font-size:10px;color:var(--green);margin-left:4px;">⬆️</span>':''}</div>
      ${panelShowSal ? `<div style="font-family:var(--font-mono);font-size:12px;color:var(--text3);flex-shrink:0;">${fmtM(p.salary)}</div>` : ''}
    </div>`;
  }).join('');
  }
  document.getElementById('team-panel-title').textContent=t.team_name;
  document.getElementById('team-panel-body').innerHTML=`
    <div style="display:flex;gap:16px;margin-bottom:18px;flex-wrap:wrap;">
      ${panelShowSal ? `<div style="text-align:center;"><div style="font-family:var(--font-mono);font-size:18px;font-weight:600;color:${clr};">${fmtM(sp)}</div><div style="font-size:10px;color:var(--text3);text-transform:uppercase;margin-top:2px;">Spent (${pct}%)</div></div>
      <div style="text-align:center;"><div style="font-family:var(--font-mono);font-size:18px;font-weight:600;color:var(--green);">${fmtM(av)}</div><div style="font-size:10px;color:var(--text3);text-transform:uppercase;margin-top:2px;">Available</div></div>` : ''}
      <div style="text-align:center;"><div style="font-family:var(--font-mono);font-size:18px;font-weight:600;">${(t.starters||[]).length}</div><div style="font-size:10px;color:var(--text3);text-transform:uppercase;margin-top:2px;">Active</div></div>
      ${(t.ir||[]).filter(p=>p.name).length ? `<div style="text-align:center;"><div style="font-family:var(--font-mono);font-size:18px;font-weight:600;color:var(--red);">${(t.ir||[]).filter(p=>p.name).length}</div><div style="font-size:10px;color:var(--red);text-transform:uppercase;margin-top:2px;">IR</div></div>` : ''}
    </div>
    ${panelShowSal ? `<div style="background:var(--surface3);border-radius:99px;height:5px;overflow:hidden;margin-bottom:4px;"><div style="height:100%;width:${pct}%;background:${clr};border-radius:99px;"></div></div>
    <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text3);margin-bottom:18px;">${fmtM(sp)} spent · cap ${fmtM(CAP)}</div>` : ''}
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;">
      ${POSITIONS.map(pos=>`<div style="flex:1;min-width:60px;background:${(POS_COLORS[pos]||'#888')}22;color:${POS_COLORS[pos]||'var(--text3)'};border-radius:6px;padding:6px 8px;text-align:center;"><div style="font-size:10px;margin-bottom:2px;">${pos}</div>${panelShowSal?`<div style="font-family:var(--font-mono);font-size:13px;font-weight:600;">${fmtM(posTotals[pos])}</div>`:''}<div style="font-size:10px;opacity:.7;">${posCounts[pos]}p</div></div>`).join('')}
    </div>
    ${rHTML}
    ${comm?`<div style="margin-top:18px;padding-top:14px;border-top:1px solid var(--border);"><button onclick="closeTeamPanel();setTab('commish');" style="width:100%;padding:9px;background:var(--accent);color:#fff;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:13px;font-family:var(--font-body);">⚙️ Open Commish Tab</button></div>`:''}`;
  document.getElementById('team-panel').style.display='';
}
function closeTeamPanel() { document.getElementById('team-panel').style.display='none'; }

// ── COMMISSIONER TAB ─────────────────────────────────────────
// ── COMPARE TAB ───────────────────────────────────────────────
function renderCompare() {
  const el = document.getElementById('tab-compare');
  const teams = Object.entries(DATA);
  const vals = {
    spent: teams.map(([,t])=>t.cap_spent),
    avail: teams.map(([,t])=>CAP-t.cap_spent),
    QB:    teams.map(([,t])=>posTotal(t,'QB')),
    RB:    teams.map(([,t])=>posTotal(t,'RB')),
    WR:    teams.map(([,t])=>posTotal(t,'WR')),
    TE:    teams.map(([,t])=>posTotal(t,'TE')),
  };
  function heat(val, arr, hex) {
    const mn=Math.min(...arr), mx=Math.max(...arr);
    const p = mx===mn ? 0 : (val-mn)/(mx-mn);
    return `<div style="position:absolute;inset:0;background:${hex};opacity:${(p*.28+.04).toFixed(2)};pointer-events:none;"></div>`;
  }
  const sorted = [...teams].sort((a,b)=>b[1].cap_spent-a[1].cap_spent);
  const rows = sorted.map(([key,t])=>{
    const sp=t.cap_spent, av=CAP-sp;
    const qb=posTotal(t,'QB'), rb=posTotal(t,'RB'), wr=posTotal(t,'WR'), te=posTotal(t,'TE');
    const most=sp===Math.max(...vals.spent), least=sp===Math.min(...vals.spent);
    return `<tr>
      <td style="padding:9px 14px;text-align:left;font-family:var(--font-body);">
        <div style="font-weight:600;font-size:13px;">${t.team_name}</div>
        <div style="font-size:10px;color:var(--text3);">${key}</div>
      </td>
      <td style="padding:9px 14px;text-align:right;font-family:var(--font-mono);font-size:13px;position:relative;${most?'color:var(--red);':least?'color:var(--green);':''}">
        ${heat(sp,vals.spent,'#ff4d6a')}${fmtM(sp)}<div style="font-size:10px;color:var(--text3);">${pctOf(sp)}</div>
      </td>
      <td style="padding:9px 14px;text-align:right;font-family:var(--font-mono);font-size:13px;color:var(--green);position:relative;">
        ${heat(av,vals.avail,'#18e07a')}${fmtM(av)}
      </td>
      <td style="padding:9px 14px;text-align:right;font-family:var(--font-mono);font-size:13px;color:#b89ffe;position:relative;">
        ${heat(qb,vals.QB,'#b89ffe')}${fmtM(qb)}
      </td>
      <td style="padding:9px 14px;text-align:right;font-family:var(--font-mono);font-size:13px;color:#18e07a;position:relative;">
        ${heat(rb,vals.RB,'#18e07a')}${fmtM(rb)}
      </td>
      <td style="padding:9px 14px;text-align:right;font-family:var(--font-mono);font-size:13px;color:#00d4ff;position:relative;">
        ${heat(wr,vals.WR,'#00d4ff')}${fmtM(wr)}
      </td>
      <td style="padding:9px 14px;text-align:right;font-family:var(--font-mono);font-size:13px;color:#ffc94d;position:relative;">
        ${heat(te,vals.TE,'#ffc94d')}${fmtM(te)}
      </td>
    </tr>`;
  }).join('');
  el.innerHTML = `<div style="padding:16px 0;">
    <p style="font-size:12px;color:var(--text3);margin-bottom:14px;">Sorted by cap spent. Shading = relative spend within each column.</p>
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;min-width:700px;">
        <thead><tr style="border-bottom:1px solid var(--border);background:var(--surface2);">
          <th style="font-size:10px;color:var(--text3);text-transform:uppercase;padding:8px 14px;text-align:left;font-weight:500;">Team</th>
          <th style="font-size:10px;color:var(--text3);text-transform:uppercase;padding:8px 14px;text-align:right;font-weight:500;">Cap Spent</th>
          <th style="font-size:10px;color:var(--green);text-transform:uppercase;padding:8px 14px;text-align:right;font-weight:500;">Available</th>
          <th style="font-size:10px;color:#b89ffe;text-transform:uppercase;padding:8px 14px;text-align:right;font-weight:500;">QB</th>
          <th style="font-size:10px;color:#18e07a;text-transform:uppercase;padding:8px 14px;text-align:right;font-weight:500;">RB</th>
          <th style="font-size:10px;color:#00d4ff;text-transform:uppercase;padding:8px 14px;text-align:right;font-weight:500;">WR</th>
          <th style="font-size:10px;color:#ffc94d;text-transform:uppercase;padding:8px 14px;text-align:right;font-weight:500;">TE</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>`;
}

// ── TOP PAID TAB ──────────────────────────────────────────────
function renderTopPaid() {
  const el = document.getElementById('tab-toppaid');
  const TOP_LIMITS = {QB:10, RB:10, WR:15, TE:5};
  let html = `<div style="padding:16px 0;display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;">`;
  POSITIONS.forEach(pos => {
    const clr = POS_COLORS[pos];
    const limit = TOP_LIMITS[pos] || 10;
    const all = [];
    Object.entries(DATA).forEach(([key,t]) => {
      (t.starters||[]).filter(p=>p.pos===pos).forEach(p => {
        all.push({name:p.name, salary:p.salary, team:t.team_name});
      });
    });
    all.sort((a,b)=>b.salary-a.salary);
    const top = all.slice(0, limit);
    const maxSal = top[0]?.salary || 1;
    const rows = top.map((p,i)=>`
      <div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid rgba(46,48,64,.4);">
        <span style="font-size:11px;color:var(--text3);font-family:var(--font-mono);min-width:18px;text-align:right;">${i+1}</span>
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"><span data-pname="${p.name}" data-pid="${PLAYER_LOOKUP[p.name.toLowerCase()]?.player_id||''}" onclick="showPlayerCard(this.dataset.pid,this.dataset.pname)" style="cursor:pointer;">${p.name}</span></div>
          <div style="height:3px;background:var(--surface3);border-radius:99px;margin-top:3px;overflow:hidden;">
            <div style="height:100%;width:${Math.round(p.salary/maxSal*100)}%;background:${clr};border-radius:99px;"></div>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-family:var(--font-mono);font-size:13px;">${fmtM(p.salary)}</div>
          <div style="font-size:10px;color:var(--text3);">${p.team}</div>
        </div>
      </div>`).join('');
    html += `<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;">
      <div style="padding:11px 16px;border-bottom:1px solid var(--border);background:var(--surface2);display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:14px;font-weight:600;color:${clr};">${pos}</span>
        <span style="font-size:12px;color:var(--text3);">Top ${limit}</span>
      </div>
      <div style="padding:0 16px 8px;">${rows}</div>
    </div>`;
  });
  html += '</div>';
  el.innerHTML = html;
}

// ── TAXI TAB ──────────────────────────────────────────────────
function renderTaxi() {
  const el = document.getElementById('tab-taxi');
  const comm = isComm();
  const allTeams = Object.entries(DATA).filter(([,t])=>(t.taxi||[]).filter(p=>p.name).length > 0);
  if (!allTeams.length) {
    el.innerHTML = '<div style="color:var(--text3);padding:40px;text-align:center;">No taxi players found.</div>';
    return;
  }
  el.innerHTML = `
    <p style="font-size:13px;color:var(--text3);margin-bottom:16px;padding-top:16px;">
      Taxi squad players don't count toward the cap.${comm ? ' ⚠️ = yr 2 (last year)  🔴 = yr 3+ (must promote or release).' : ''}
    </p>
    <div class="taxi-grid">${allTeams.map(([key,t]) => {
      const players = (t.taxi||[]).filter(p=>p.name).sort((a,b)=>b.salary-a.salary);
      const promoCount = players.filter(p=>(promos[key]||{})[p.name]).length;
      return `<div class="taxi-card">
        <div class="taxi-card-hdr">
          <span style="font-weight:600;">${t.team_name}</span>
          <span style="font-size:11px;color:var(--text3);">${promoCount}/${players.length} promoted</span>
        </div>
        ${players.map(p => {
          const promo = (promos[key]||{})[p.name];
          // years_exp: use stored value first, then PLAYER_LOOKUP from Sleeper
          const lk = PLAYER_LOOKUP[p.name.toLowerCase()] || {};
          const yeStored = p.years_exp != null ? Number(p.years_exp) : null;
          const yeLookup = lk.years_exp != null ? Number(lk.years_exp) : null;
          const ye = yeStored ?? yeLookup;  // prefer stored (manually set) over lookup
          const playerAge = lk.age != null ? Number(lk.age) : null;

          let gradBadge = '';
          if (ye != null) {
            if (ye >= 3)
              gradBadge = `<span title="Year ${ye} — must promote or release" style="font-size:13px;margin-left:4px;cursor:default;">🔴</span>`;
            else if (ye === 2)
              gradBadge = `<span title="Year 2 — last year on taxi" style="font-size:13px;margin-left:4px;cursor:default;">⚠️</span>`;
          } else if (playerAge != null && playerAge >= 24) {
            gradBadge = `<span title="Age ${playerAge} — check eligibility" style="font-size:13px;margin-left:4px;cursor:default;">⚠️</span>`;
          }
          return `<div class="taxi-row">
            <div class="taxi-info">
              <div class="taxi-pname">
                ${p.name}${ageBadge(p.name)}${promo ? '<span class="promoted-badge">⬆️ Promoted</span>' : ''}${gradBadge}
              </div>
              <div class="taxi-psal">${fmtM(p.salary)}</div>
              ${promo?.note ? `<div class="taxi-pnote">${promo.note}</div>` : ''}
            </div>
            <div style="display:flex;gap:4px;">
              ${comm && !promo ? `<button class="promo-btn" onclick="openPromoModal('${key}','${p.name.replace(/'/g,"\'")}')">⬆️ Promote</button>` : ''}
              ${comm && promo ? `<button class="undo-btn" onclick="undoPromo('${key}','${p.name.replace(/'/g,"\'")}')">↩ Undo</button>` : ''}
            </div>
          </div>`;
        }).join('')}
      </div>`;
    }).join('')}</div>`;
}


// ── WATCHLIST TAB ─────────────────────────────────────────────
function renderWatchlist() {
  const el = (document.getElementById('cap-tab-watchlist') || document.getElementById('tab-watchlist'));
  const wl = JSON.parse(localStorage.getItem('sb_cap_watchlist') || '{}');
  const ids = Object.keys(wl);
  if (!ids.length) {
    el.innerHTML = `<div style="padding:60px;text-align:center;color:var(--text3);">
      <div style="font-size:32px;margin-bottom:12px;">⭐</div>
      <div style="font-size:14px;">No players on your watchlist yet.</div>
      <div style="font-size:12px;margin-top:6px;">Star players in the All Players tab to track them here.</div>
    </div>`;
    return;
  }

  // Build flat list of all rostered players for lookup
  const allPlayers = {};
  Object.entries(DATA).forEach(([teamKey, t]) => {
    [...(t.starters||[]), ...(t.ir||[]), ...(t.taxi||[])].forEach(p => {
      if (p.name) allPlayers[p.name] = { ...p, teamKey, team_name: t.team_name };
    });
  });

  const rows = ids.map(name => {
    const p = allPlayers[name];
    if (!p) return '';
    const slot = (DATA[p.teamKey]?.starters||[]).find(s=>s.name===name) ? 'Active'
               : (DATA[p.teamKey]?.ir||[]).find(s=>s.name===name) ? 'IR' : 'Taxi';
    const slotClr = slot==='IR'?'var(--red)':slot==='Taxi'?'var(--text3)':'var(--text2)';
    const ho = (holdouts[p.teamKey]||{})[name];
    return `<tr>
      <td style="padding:9px 14px;font-size:13px;">
        ${name}${ageBadge(p.name)}${ho?'<span style="font-size:10px;color:var(--yellow);margin-left:5px;">🔥</span>':''}
      </td>
      <td style="padding:9px 6px;">${p.pos?`<span class="pos-badge pb-${p.pos}">${p.pos}</span>`:''}</td>
      <td style="padding:9px 14px;font-size:12px;color:var(--text2);">${p.team_name}</td>
      <td style="padding:9px 6px;font-size:11px;color:${slotClr};">${slot}</td>
      <td style="padding:9px 14px;text-align:right;font-family:var(--font-mono);font-size:13px;">${fmtM(p.salary)}</td>
      <td style="padding:9px 14px;text-align:right;">
        <button onclick="capRemoveWatch(${JSON.stringify(name)})" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:13px;">✕</button>
      </td>
    </tr>`;
  }).filter(Boolean).join('');

  el.innerHTML = `<div style="padding:16px 0;">
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;">
      <div style="padding:11px 16px;border-bottom:1px solid var(--border);background:var(--surface2);display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:14px;font-weight:600;">⭐ Watchlist — ${ids.length} players</span>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="border-bottom:1px solid var(--border);">
          <th style="font-size:10px;color:var(--text3);text-transform:uppercase;padding:7px 14px;text-align:left;font-weight:500;">Player</th>
          <th style="font-size:10px;color:var(--text3);text-transform:uppercase;padding:7px 6px;text-align:left;font-weight:500;">Pos</th>
          <th style="font-size:10px;color:var(--text3);text-transform:uppercase;padding:7px 14px;text-align:left;font-weight:500;">Team</th>
          <th style="font-size:10px;color:var(--text3);text-transform:uppercase;padding:7px 6px;text-align:left;font-weight:500;">Slot</th>
          <th style="font-size:10px;color:var(--text3);text-transform:uppercase;padding:7px 14px;text-align:right;font-weight:500;">Salary</th>
          <th></th>
        </tr></thead>
        <tbody>${rows || '<tr><td colspan="6" style="padding:20px;text-align:center;color:var(--text3);">No matching players found in rosters.</td></tr>'}</tbody>
      </table>
    </div>
  </div>`;
}

function capAddWatch(name) {
  const wl = JSON.parse(localStorage.getItem('sb_cap_watchlist') || '{}');
  wl[name] = Date.now();
  localStorage.setItem('sb_cap_watchlist', JSON.stringify(wl));
  renderTab(tab);
}
function capRemoveWatch(name) {
  const wl = JSON.parse(localStorage.getItem('sb_cap_watchlist') || '{}');
  delete wl[name];
  localStorage.setItem('sb_cap_watchlist', JSON.stringify(wl));
  renderTab(tab);
}


// ── ROOKIE DRAFT TAB ──────────────────────────────────────────
// Salary scale: R1 picks 1-6=$15M, 7-12=$10M | R2 1-6=$7.5M, 7-12=$5M
//               R3 1-6=$3M, 7-12=$2M | R4 any=$1M
const ROOKIE_SALARY_SCALE = {
  '1-1':15e6,'1-2':15e6,'1-3':15e6,'1-4':15e6,'1-5':15e6,'1-6':15e6,
  '1-7':10e6,'1-8':10e6,'1-9':10e6,'1-10':10e6,'1-11':10e6,'1-12':10e6,
  '2-1':7.5e6,'2-2':7.5e6,'2-3':7.5e6,'2-4':7.5e6,'2-5':7.5e6,'2-6':7.5e6,
  '2-7':5e6,'2-8':5e6,'2-9':5e6,'2-10':5e6,'2-11':5e6,'2-12':5e6,
  '3-1':3e6,'3-2':3e6,'3-3':3e6,'3-4':3e6,'3-5':3e6,'3-6':3e6,
  '3-7':2e6,'3-8':2e6,'3-9':2e6,'3-10':2e6,'3-11':2e6,'3-12':2e6,
};
function rookieSalary(round, pick) {
  if (round >= 4) return 1_000_000;
  return ROOKIE_SALARY_SCALE[`${round}-${pick}`] || 1_000_000;
}

// Cache for Sleeper rookie players (years_exp === 0 or 1 in current season)
let _rookiePlayers = null;

async function fetchRookiePlayers() {
  // Pull from the full player DB — filter to skill position players with years_exp 0
  // (Sleeper sets years_exp=0 for rookies entering their first season)
  if (_rookiePlayers) return _rookiePlayers;
  try {
    const cached = localStorage.getItem('sb_players');
    if (!cached) return [];
    const players = JSON.parse(cached);
    const SKILL = new Set(['QB','RB','WR','TE']);
    // Get all drafted pick IDs from Firebase to mark as taken
    let draftedNames = new Set();
    if (leagueId()) {
      const snap = await db.ref(`leagues/${leagueId()}/rookieDraft`).once('value');
      const board = snap.val() || {};
      Object.values(board).forEach(p => { if (p.player) draftedNames.add(p.player.toLowerCase()); });
    }
    // Also exclude already-rostered players from DATA
    const rostered = new Set();
    Object.values(DATA || {}).forEach(t => {
      [...(t.starters||[]), ...(t.ir||[]), ...(t.taxi||[])].forEach(p => {
        if (p.name) rostered.add(p.name.toLowerCase());
      });
    });

    _rookiePlayers = Object.entries(players)
      .filter(([,p]) => {
        if (!p.fantasy_positions?.some(pos => SKILL.has(pos))) return false;
        const yeRaw = p.years_exp;
        const ye = Number(yeRaw);
        // Confirmed rookies (years_exp === 0): always include — active or not
        // Sleeper only sets ye=0 for players actually drafted into the NFL this year
        if (yeRaw !== null && yeRaw !== undefined && ye === 0) return true;
        // Pre-draft / unsigned (years_exp null): include if active OR young (≤25) OR ranked
        if (yeRaw === null || yeRaw === undefined) {
          return p.active === true
              || (p.age != null && p.age <= 25)
              || (p.search_rank && p.search_rank <= 900);
        }
        return false;
      })
      .map(([id, p]) => ({
        id,
        name: `${p.first_name} ${p.last_name}`,
        pos: p.fantasy_positions?.[0] || '',
        nflTeam: (p.team && p.team !== 'FA') ? p.team : '—',
        adp: p.search_rank || 999,
        age: p.age != null ? p.age : null,
        active: p.active === true,
        rostered: rostered.has(`${p.first_name} ${p.last_name}`.toLowerCase()),
        drafted: draftedNames.has(`${p.first_name} ${p.last_name}`.toLowerCase()),
      }))
      .sort((a, b) => a.adp - b.adp);
    return _rookiePlayers;
  } catch(e) { return []; }
}

let _rookieDraftYear = null; // currently selected year

async function renderRookieDraft(selectedDraftId) {
  const el = document.getElementById('tab-rookiedraft');
  _rookiePlayers = null;
  el.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text3);"><div class="spinner"></div><div style="margin-top:12px;">Loading draft board…</div></div>`;

  let draftData = null, sleeperPicks = {};
  if (leagueId()) {
    try {
      const allDrafts = await fetch(`https://api.sleeper.app/v1/league/${leagueId()}/drafts`).then(r=>r.json());
      // Filter to rookie/non-startup drafts across all years
      const drafts = (allDrafts||[]).filter(d => d.type !== 'startup');

      // Build year selector if multiple drafts exist
      if (drafts.length > 1) {
        const sorted = [...drafts].sort((a,b) => (b.season||0) - (a.season||0));
        const yearBar = sorted.map(d =>
          `<button onclick="renderRookieDraft('${d.draft_id}')"
            style="padding:4px 10px;font-size:12px;background:${'${d.draft_id}'===selectedDraftId?'var(--accent)':'var(--surface2)'};
            border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;
            color:${'${d.draft_id}'===selectedDraftId?'#fff':'var(--text2)'};font-family:var(--font-body);">
            ${d.season||d.draft_id}
          </button>`
        ).join('');
        el.innerHTML = `<div style="display:flex;gap:6px;flex-wrap:wrap;padding:12px 0 4px;">${yearBar}</div>
          <div id="rookie-board-inner"><div class="spinner"></div></div>`;
      }

      if (drafts.length) {
        // Use selectedDraftId if provided, else most recent rookie/linear or last
        const rookie = (selectedDraftId && drafts.find(d => d.draft_id === selectedDraftId))
                    || drafts.find(d => d.type === 'rookie' || d.type === 'linear')
                    || drafts[drafts.length - 1];
        if (rookie) {
          draftData = rookie;
          const picks = await fetch(`https://api.sleeper.app/v1/draft/${rookie.draft_id}/picks`).then(r=>r.json());
          if (Array.isArray(picks)) {
            picks.forEach(pk => {
              const r = pk.round;
              const p = pk.draft_slot || pk.pick_no;
              const key = `${r}-${p}`;
              const fn = pk.metadata?.first_name || '';
              const ln = pk.metadata?.last_name  || '';
              const playerName = (fn || ln) ? `${fn} ${ln}`.trim() : null;
              if (playerName) sleeperPicks[key] = { player: playerName, sleeperPick: true };
            });
          }
          if (rookie.slot_to_roster_id) window._sleeperSlotToRoster = rookie.slot_to_roster_id;
        }
      }
    } catch(e) { console.warn('Draft fetch:', e); }
  }

  let savedBoard = {};
  try {
    if (leagueId()) {
      const snap = await db.ref(`leagues/${leagueId()}/rookieDraft`).once('value');
      savedBoard = snap.val() || {};
    }
  } catch(e) {}

  const board = { ...sleeperPicks, ...savedBoard };

  const rookies = await fetchRookiePlayers();

  const boardEl = document.getElementById('rookie-board-inner') || el;
  boardEl.innerHTML = buildRookieDraftUI(draftData, board, rookies);
}

function buildRookieDraftUI(draftData, board, rookies) {
  const comm = isComm();
  const ROUNDS = 4, PICKS_PER = 12;

  // Build a set of drafted player names for the available list
  const draftedNames = new Set(Object.values(board).map(p => (p.player||'').toLowerCase()));

  // ── Draft board grid ──────────────────────────────────────
  let gridHTML = '';
  for (let r = 1; r <= ROUNDS; r++) {
    const salLabel = isSalaryLeague() ? (r===1?'$15M / $10M' : r===2?'$7.5M / $5M' : r===3?'$3M / $2M' : '$1M') : '';
    gridHTML += `<div style="margin-bottom:24px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <span style="font-size:13px;font-weight:600;color:var(--text2);">Round ${r}</span>
        <span style="font-size:11px;color:var(--text3);">${salLabel}</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(195px,1fr));gap:8px;">`;
    for (let p = 1; p <= PICKS_PER; p++) {
      const key = `${r}-${p}`;
      const sal = rookieSalary(r, p);
      const pick = board[key] || {};
      const assigned = !!pick.player;
      const teamName = pick.teamKey ? (DATA[pick.teamKey]?.team_name || pick.teamKey) : (pick.team ? (DATA[pick.team]?.team_name || pick.team) : '');
      const fromSleeper = pick.sleeperPick && !savedBoard;

      gridHTML += `<div style="background:var(--surface);border:1px solid ${assigned?'var(--accent)':'var(--border)'};border-radius:var(--radius-sm);padding:10px 12px;min-height:80px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:11px;font-weight:600;color:var(--accent2);">Pick ${r}.${p < 10 ? '0'+p : p}</span>
          ${isSalaryLeague() ? '<span style="font-size:11px;color:var(--text3);font-family:var(--font-mono);">' + fmtM(sal) + '</span>' : ''}
        </div>
        ${assigned
          ? `<div style="font-size:13px;font-weight:500;line-height:1.3;">${pick.player}</div>
             ${teamName ? `<div style="font-size:11px;color:var(--accent2);margin-top:2px;">${teamName}</div>` : ''}
             ${fromSleeper ? `<div style="font-size:10px;color:var(--text3);margin-top:2px;">via Sleeper</div>` : ''}
             ${comm ? `<button onclick="rookieClearPick('${key}')" style="font-size:10px;padding:2px 8px;border:1px solid var(--border);border-radius:4px;background:none;color:var(--text3);cursor:pointer;margin-top:6px;font-family:var(--font-body);">✕ Clear</button>` : ''}`
          : comm
          ? `<div style="display:flex;flex-direction:column;gap:4px;">
               <select id="rdraft-player-${key}" onchange="(function(s){var m=document.getElementById('rdraft-manual-${key}');if(m)m.style.display=s.value==='__manual__'?'':'none';})(this)" style="padding:5px 8px;background:var(--surface2);border:1px solid var(--border);border-radius:4px;color:var(--text);font-size:12px;font-family:var(--font-body);outline:none;cursor:pointer;">
                 <option value="">— Select player —</option>
                 ${rookies.filter(rk => !draftedNames.has(rk.name.toLowerCase())).map(rk =>
                   `<option value="${rk.name}">${rk.name} · ${rk.pos} · ${rk.nflTeam} (ADP ${rk.adp})</option>`
                 ).join('')}
                 <option value="__manual__">✏️ Type manually…</option>
               </select>
               <input id="rdraft-manual-${key}" placeholder="Player name (manual)" style="display:none;padding:5px 8px;background:var(--surface2);border:1px solid var(--border);border-radius:4px;color:var(--text);font-size:12px;font-family:var(--font-body);outline:none;width:100%;" oninput="" />
               <select id="rdraft-team-${key}" style="padding:5px 8px;background:var(--surface2);border:1px solid var(--border);border-radius:4px;color:var(--text);font-size:12px;font-family:var(--font-body);outline:none;cursor:pointer;">
                 <option value="">— Owner —</option>
                 ${Object.entries(DATA).map(([k,t]) => `<option value="${k}">${t.team_name}</option>`).join('')}
               </select>
               <button onclick="rookieAssignPick('${key}',${sal})" style="padding:5px 8px;background:var(--accent);border:none;border-radius:4px;color:#fff;font-size:12px;cursor:pointer;font-family:var(--font-body);">Assign to Taxi</button>
             </div>
`
          : (() => {
          // Show current owner of this pick slot
          const slotToRoster = window._sleeperSlotToRoster || {};
          const rosterId = slotToRoster[String(p)];
          const ownerTeam = rosterId
            ? ((window._capTeams||[]).find(tm => String(tm.roster_id) === String(rosterId)))
            : null;
          const ownerName = ownerTeam ? (ownerTeam.display_name||ownerTeam.username||'') : '';
          return ownerName
            ? `<div style="font-size:11px;color:var(--accent2);margin-bottom:2px;">${ownerName}</div>
               <div style="font-size:12px;color:var(--text3);">Open</div>`
            : `<div style="font-size:12px;color:var(--text3);">Open</div>`;
        })()
        }
      </div>`;
    }
    gridHTML += '</div></div>';
  }

  // ── Available rookies by position ─────────────────────────
  const posGroups = { QB: [], RB: [], WR: [], TE: [] };
  rookies.forEach(rk => {
    if (posGroups[rk.pos]) posGroups[rk.pos].push(rk);
  });

  let availHTML = '';
  Object.entries(posGroups).forEach(([pos, players]) => {
    if (!players.length) return;
    const clr = { QB:'#b89ffe', RB:'#18e07a', WR:'#00d4ff', TE:'#ffc94d' }[pos] || 'var(--text2)';
    availHTML += `<div style="flex:1;min-width:200px;">
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:${clr};margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid var(--border);">${pos}</div>
      ${players.map(rk => {
        const taken = draftedNames.has(rk.name.toLowerCase()) || rk.rostered;
        return `<div style="display:flex;align-items:center;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(46,48,64,.3);opacity:${taken?'0.35':'1'};">
          <div>
            <span style="font-size:13px;${taken?'text-decoration:line-through;color:var(--text3);':''}">${rk.name}</span>
            <span style="font-size:11px;color:var(--text3);margin-left:5px;">${rk.nflTeam}</span>
            ${rk.age ? `<span style="font-size:10px;color:var(--text3);margin-left:4px;">${rk.age}yo</span>` : ''}
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-size:11px;color:var(--text3);font-family:var(--font-mono);">ADP ${rk.adp}</span>
            ${taken ? `<span style="font-size:10px;color:var(--text3);">drafted</span>` : ''}
          </div>
        </div>`;
      }).join('')}
    </div>`;
  });

  return `<div style="padding:16px 0;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
      <div>
        <div style="font-size:16px;font-weight:600;">🎓 Rookie Draft Board</div>
        <div style="font-size:12px;color:var(--text3);margin-top:2px;">
          ${draftData
            ? `Sleeper draft loaded — status: <strong>${draftData.status}</strong> · ${draftData.season || ''}`
            : 'Manual mode — assign picks using the dropdowns below'}
        </div>
      </div>
      <button onclick="renderRookieDraft()" style="padding:6px 14px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text2);font-size:12px;cursor:pointer;font-family:var(--font-body);">↻ Refresh</button>
    </div>

    <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 14px;margin-bottom:20px;font-size:12px;color:var(--text3);">
      Salaries: R1 picks 1-6 = $15M · 7-12 = $10M &nbsp;|&nbsp; R2 1-6 = $7.5M · 7-12 = $5M &nbsp;|&nbsp; R3 1-6 = $3M · 7-12 = $2M &nbsp;|&nbsp; R4 = $1M &nbsp;·&nbsp; All go to taxi squad
    </div>

    <div style="display:flex;gap:20px;flex-wrap:wrap;align-items:flex-start;">
      <div style="flex:2;min-width:300px;">
        <div style="font-size:13px;font-weight:600;margin-bottom:12px;color:var(--text2);">Draft Board</div>
        ${gridHTML}
      </div>
      <div style="flex:1;min-width:260px;">
        <div style="font-size:13px;font-weight:600;margin-bottom:12px;color:var(--text2);">Available Rookies</div>
        <div style="font-size:11px;color:var(--text3);margin-bottom:10px;">Top 500 ADP · struck through = drafted</div>
        <div style="display:flex;gap:16px;flex-wrap:wrap;">${availHTML}</div>
      </div>
    </div>
  </div>`;
}

async function rookieAssignPick(key, salary) {
  const sel    = document.getElementById(`rdraft-player-${key}`);
  const manual = document.getElementById(`rdraft-manual-${key}`);
  const teamSel = document.getElementById(`rdraft-team-${key}`);
  if (!sel || !teamSel) return;

  let pName = sel.value === '__manual__' ? (manual?.value||'').trim() : sel.value;
  const teamKey = teamSel.value;

  if (!pName)    { showToast('Select or enter a player name', 'error'); return; }
  if (!teamKey)  { showToast('Select an owner', 'error'); return; }

  if (!DATA[teamKey].taxi) DATA[teamKey].taxi = [];
  DATA[teamKey].taxi.push({ name: pName, salary, years_exp: 0 });
  await saveToFirebase();

  if (leagueId()) {
    await db.ref(`leagues/${leagueId()}/rookieDraft/${key}`).set({
      player: pName, team: teamKey, salary, assignedAt: Date.now()
    });
  }
  showToast(`${pName} → ${DATA[teamKey].team_name} taxi squad`, 'success');
  renderRookieDraft();
}

async function rookieClearPick(key) {
  if (!leagueId()) return;
  const snap = await db.ref(`leagues/${leagueId()}/rookieDraft/${key}`).once('value');
  const pick = snap.val();
  if (pick?.team && DATA[pick.team]) {
    // Remove from taxi squad too
    const taxi = DATA[pick.team].taxi || [];
    const idx = taxi.findIndex(p => p.name === pick.player);
    if (idx > -1) { taxi.splice(idx, 1); await saveToFirebase(); }
  }
  await db.ref(`leagues/${leagueId()}/rookieDraft/${key}`).remove();
  showToast('Pick cleared', 'info');
  renderRookieDraft();
}


// ── COMMISSIONER TAB ─────────────────────────────────────────


async function loadPasswordList() {
  const el = document.getElementById('pw-list');
  if (!el) return;
  try {
    // Read password status per user from global users/ path
    const userKeys = Object.keys(DATA);
    const pwChecks = await Promise.all(
      userKeys.map(u => db.ref(`users/${u}/password`).once('value').then(s => [u, !!s.val()]))
    );
    const stored = Object.fromEntries(pwChecks.map(([u, has]) => [u, has]));
    el.innerHTML = Object.keys(DATA).map(username => {
      const hasPass = stored[username] ? '🔒 Set' : '—';
      const passColor = stored[username] ? 'var(--green)' : 'var(--text3)';
      return `<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04);">
        <span style="font-size:13px;min-width:140px;font-weight:500;">${DATA[username]?.team_name || username}</span>
        <span style="font-size:11px;color:${passColor};min-width:50px;">${hasPass}</span>
        <input type="password" placeholder="New password (blank to remove)"
          id="pw-input-${username}"
          style="padding:5px 8px;background:var(--surface2);border:1px solid var(--border);border-radius:4px;color:var(--text);font-family:var(--font-body);font-size:12px;outline:none;width:200px;"/>
        <button onclick="commSavePassword('${username}')"
          style="padding:5px 12px;background:var(--accent);border:none;border-radius:4px;color:#fff;font-size:11px;cursor:pointer;font-family:var(--font-body);">Save</button>
      </div>`;
    }).join('');
  } catch(e) {
    el.innerHTML = '<div style="font-size:12px;color:var(--red);">Error loading passwords.</div>';
  }
}

async function commSavePassword(username) {
  const inp = document.getElementById(`pw-input-${username}`);
  const pw  = inp?.value || '';
  const ref = db.ref(`users/${username}/password`);
  if (!pw) {
    await ref.remove();
    showToast(`Password removed for ${username}`, 'info');
  } else {
    // Hash with SHA-256 via SubtleCrypto
    const enc  = new TextEncoder().encode(pw);
    const buf  = await crypto.subtle.digest('SHA-256', enc);
    const hash = Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
    await ref.set(hash);
    // Mark as must-change so user sets their own password on first login
    await db.ref(`users/${username}/passwordMustChange`).set(true);
    showToast(`Password set for ${username} — they will be prompted to change it on login`, 'success');
  }
  inp.value = '';
  loadPasswordList();
}

async function loadCoManagers() {
  const el = document.getElementById('co-manager-list');
  if (!el) return;
  try {
    const snap = await db.ref(`leagues/${leagueId()}/coManagers`).once('value');
    const map  = snap.val() || {};
    if (!Object.keys(map).length) {
      el.innerHTML = '<div style="font-size:12px;color:var(--text3);">No co-managers added yet.</div>';
      return;
    }
    el.innerHTML = Object.entries(map).map(([username, rosterId]) => {
      const team = DATA[username]?.team_name || Object.entries(DATA).find(([,t])=>t.roster_id==rosterId)?.[1]?.team_name || rosterId;
      return `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04);">
        <div>
          <span style="font-size:13px;font-weight:500;">${username}</span>
          <span style="font-size:11px;color:var(--text3);margin-left:8px;">→ ${team}</span>
        </div>
        <button onclick="commRemoveCoManager('${username}')"
          style="font-size:11px;padding:3px 9px;border:1px solid var(--border);border-radius:4px;background:none;color:var(--red);cursor:pointer;">Remove</button>
      </div>`;
    }).join('');
  } catch(e) {
    el.innerHTML = '<div style="font-size:12px;color:var(--red);">Error loading co-managers.</div>';
  }
}

async function commAddCoManager() {
  const teamKey = document.getElementById('cm-team-select')?.value;
  const username = (document.getElementById('cm-username-input')?.value || '').trim().toLowerCase();
  const statusEl = document.getElementById('cm-status');
  if (!teamKey || !username) { if(statusEl) statusEl.textContent = 'Select a team and enter a username.'; return; }
  try {
    // Verify Sleeper username exists
    const user = await Sleeper.fetchUser(username);
    if (!user?.user_id) throw new Error('User not found');
    const rosterId = DATA[teamKey] ? Object.keys(DATA).indexOf(teamKey) + 1 : null;
    await db.ref(`leagues/${leagueId()}/coManagers/${username}`).set(rosterId || teamKey);
    if(statusEl) statusEl.textContent = '✅ Added ' + username;
    document.getElementById('cm-username-input').value = '';
    loadCoManagers();
  } catch(e) {
    const statusEl = document.getElementById('cm-status');
    if(statusEl) statusEl.textContent = '❌ ' + (e.message || 'Failed');
  }
}

async function commRemoveCoManager(username) {
  await db.ref(`leagues/${leagueId()}/coManagers/${username}`).remove();
  loadCoManagers();
}

function renderCommish() {
  if (!isComm()) { document.getElementById('tab-commish').innerHTML='<div style="padding:40px;text-align:center;color:var(--text3);">Commissioner only.</div>'; return; }
  const el = document.getElementById('tab-commish');

  // ── Cap/Offseason settings ──────────────────────────────────
  const offBg   = offseasonMode ? 'var(--accent)' : 'var(--surface2)';
  const offClr  = offseasonMode ? '#fff' : 'var(--text2)';
  const offLabel = offseasonMode ? '☀️ Offseason ON' : '🏈 Regular Season';
  const cutCap  = Math.round(CAP * 0.70);
  let overCapWarnings = '';
  if (offseasonMode) {
    Object.entries(DATA).forEach(([key,t]) => {
      if (t.cap_spent > cutCap) {
        const over = fmtM(t.cap_spent - cutCap);
        overCapWarnings += `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 14px;border-bottom:1px solid var(--border);">
          <span style="font-size:13px;font-weight:500;">${t.team_name}</span>
          <span style="font-size:12px;color:var(--red);">Over by ${over} — must cut to ${fmtM(cutCap)}</span>
        </div>`;
      }
    });
    if (!overCapWarnings) overCapWarnings = '<div style="padding:12px 16px;font-size:13px;color:var(--green);">✅ All teams are under the 70% offseason cap.</div>';
  }

  // ── Roster ID mapping rows ──────────────────────────────────
  const savedMap = window._rosterIdMap || {};
  let mapRows = Object.keys(DATA).map(key => {
    const t = DATA[key];
    return `<tr>
      <td style="padding:8px 14px;">
        <div style="font-size:13px;font-weight:500;">${t.team_name}</div>
        <div style="font-size:11px;color:var(--text3);">${key}</div>
      </td>
      <td style="padding:8px 14px;" id="maprow-dispname-${key}" colspan="2">
        <span style="font-size:12px;color:var(--text3);">Loading Sleeper teams…</span>
      </td>
    </tr>`;
  }).join('');

  // ── Taxi rows ────────────────────────────────────────────────
  let taxiRows='';
  Object.entries(DATA).forEach(([key,t])=>{
    const taxiArr=(t.taxi||[]).filter(p=>p.name);
    if(!taxiArr.length)return;
    taxiRows+=`<tr><td colspan="5" style="background:var(--surface2);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--text3);padding:6px 14px;">${t.team_name}</td></tr>`;
    taxiArr.forEach((p)=>{
      const ti=(t.taxi||[]).findIndex(x=>x.name===p.name);
      const promo=(promos[key]||{})[p.name];
      taxiRows+=`<tr>
        <td style="padding:8px 14px;font-size:13px;">${p.name}</td>
        <td style="padding:8px 6px;">
          <select onchange="commSetTaxiPos('${key}',${ti},this.value)" style="background:var(--surface2);border:1px solid var(--border);border-radius:4px;color:var(--text);padding:3px 6px;font-size:12px;font-family:var(--font-body);">
            <option value="">—</option>
            ${['QB','RB','WR','TE'].map(pos=>`<option value="${pos}"${(p.pos||'')=== pos?' selected':''}>${pos}</option>`).join('')}
          </select>
        </td>
        <td style="padding:8px 6px;font-family:var(--font-mono);font-size:12px;color:var(--text3);">${fmtM(p.salary)}</td>
        <td style="padding:8px 6px;">${!promo
          ? `<button onclick="openPromoModal('${key}',${ti})" style="font-size:11px;padding:3px 9px;border:1px solid rgba(24,224,122,.3);border-radius:4px;background:none;color:var(--green);cursor:pointer;font-family:var(--font-body);">⬆️ Promote</button>`
          : `<span style="font-size:11px;color:var(--green);">⬆️ Promoted</span> <button onclick="undoPromo('${key}','${p.name.replace(/'/g,"\'")}'" style="font-size:11px;padding:3px 7px;border:1px solid var(--border);border-radius:4px;background:none;color:var(--text3);cursor:pointer;margin-left:4px;">↩</button>`
        }</td>
        <td style="padding:8px 14px;text-align:right;"><button onclick="openEdit('${key}','taxi',${ti})" style="font-size:12px;padding:3px 8px;border:1px solid var(--border);border-radius:4px;background:none;color:var(--text2);cursor:pointer;">✏️ Edit</button></td>
      </tr>`;
    });
  });

  // ── Starter rows ─────────────────────────────────────────────
  let starterRows='';
  Object.entries(DATA).forEach(([key,t])=>{
    const starters=t.starters||[];
    if(!starters.length)return;
    starterRows+=`<tr><td colspan="5" style="background:var(--surface2);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--text3);padding:6px 14px;">${t.team_name}</td></tr>`;
    const po=['QB','RB','WR','TE'];
    [...starters].sort((a,b)=>(po.indexOf(a.pos)-po.indexOf(b.pos))||b.salary-a.salary).forEach(p=>{
      const idx=t.starters.findIndex(s=>s.name===p.name&&s.pos===p.pos&&s.salary===p.salary);
      const ho=(holdouts[key]||{})[p.name];
      starterRows+=`<tr>
        <td style="padding:7px 14px;font-size:13px;">${p.name}${ho?'<span style="font-size:10px;color:var(--yellow);margin-left:5px;">🔥</span>':''}</td>
        <td style="padding:7px 6px;"><span style="background:${(POS_COLORS[p.pos]||'#888')}22;color:${POS_COLORS[p.pos]||'var(--text3)'};padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;">${p.pos}</span></td>
        <td style="padding:7px 6px;font-family:var(--font-mono);font-size:12px;">${fmtM(p.salary)}</td>
        <td style="padding:7px 6px;"><button onclick="toggleHoldout('${key}','${p.name.replace(/'/g,"\'")}'" style="font-size:12px;padding:3px 8px;border:1px solid ${ho?'rgba(255,201,77,.4)':'var(--border)'};border-radius:4px;background:none;color:${ho?'var(--yellow)':'var(--text3)'};cursor:pointer;">${ho?'🔥 Remove':'🏳 Flag'}</button></td>
        <td style="padding:7px 14px;text-align:right;"><button onclick="openEdit('${key}','starters',${idx})" style="font-size:12px;padding:3px 8px;border:1px solid var(--border);border-radius:4px;background:none;color:var(--text2);cursor:pointer;">✏️ Edit</button></td>
      </tr>`;
    });
  });

  el.innerHTML=`<div style="padding:16px 0;">

    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-bottom:24px;">
      <div style="padding:12px 16px;border-bottom:1px solid var(--border);background:var(--surface2);">
        <span style="font-size:14px;font-weight:600;">⚙️ League Settings</span>
      </div>
      <div style="padding:16px;display:flex;flex-direction:column;gap:14px;">
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
          <div style="font-size:13px;color:var(--text2);min-width:120px;">Salary Cap</div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="color:var(--text3);font-size:14px;">$</span>
            <input id="comm-cap-input" type="number" value="${CAP/1e6}" min="1" step="0.1"
              style="width:100px;padding:6px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font-mono);font-size:14px;outline:none;"/>
            <span style="font-size:13px;color:var(--text3);">million</span>
            <button onclick="commSaveCap()" style="padding:6px 14px;background:var(--accent);border:none;border-radius:var(--radius-sm);color:#fff;font-size:12px;cursor:pointer;font-family:var(--font-body);">Save</button>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
          <div style="font-size:13px;color:var(--text2);min-width:120px;">Mode</div>
          <button onclick="commToggleOffseason()" style="padding:7px 16px;background:${offBg};border:none;border-radius:var(--radius-sm);color:${offClr};font-size:13px;font-weight:500;cursor:pointer;font-family:var(--font-body);">${offLabel}</button>
          <span style="font-size:12px;color:var(--text3);">${offseasonMode ? 'Offseason: teams must cut below '+fmtM(cutCap)+' (70% of cap)' : 'Regular season mode'}</span>
        </div>
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
          <div style="font-size:13px;color:var(--text2);min-width:120px;">Max IR Slots</div>
          <div style="display:flex;align-items:center;gap:8px;">
            <input id="comm-max-ir" type="number" value="${MAX_IR}" min="0" max="20" step="1"
              style="width:70px;padding:6px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font-mono);font-size:14px;outline:none;"/>
            <button onclick="commSaveMaxIR()" style="padding:6px 14px;background:var(--accent);border:none;border-radius:var(--radius-sm);color:#fff;font-size:12px;cursor:pointer;font-family:var(--font-body);">Save</button>
            <span style="font-size:12px;color:var(--text3);">per team (currently ${MAX_IR})</span>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
          <div style="font-size:13px;color:var(--text2);min-width:120px;">Max Taxi Slots</div>
          <div style="display:flex;align-items:center;gap:8px;">
            <input id="comm-max-taxi" type="number" value="${MAX_TAXI}" min="0" max="20" step="1"
              style="width:70px;padding:6px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font-mono);font-size:14px;outline:none;"/>
            <button onclick="commSaveMaxTaxi()" style="padding:6px 14px;background:var(--accent);border:none;border-radius:var(--radius-sm);color:#fff;font-size:12px;cursor:pointer;font-family:var(--font-body);">Save</button>
            <span style="font-size:12px;color:var(--text3);">per team (currently ${MAX_TAXI})</span>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
          <div style="font-size:13px;color:var(--text2);min-width:120px;">Auction Opens</div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <input type="datetime-local" id="comm-auction-start"
              value="${window._auctionStartTime ? new Date(window._auctionStartTime).toISOString().slice(0,16) : ''}"
              style="padding:6px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font-body);font-size:13px;outline:none;"/>
            <button onclick="commSaveAuctionStart()" style="padding:6px 14px;background:var(--accent);border:none;border-radius:var(--radius-sm);color:#fff;font-size:12px;cursor:pointer;font-family:var(--font-body);">Save</button>
            <button onclick="commClearAuctionStart()" style="padding:6px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text2);font-size:12px;cursor:pointer;font-family:var(--font-body);">Clear</button>
            <span style="font-size:12px;color:var(--text3);">${window._auctionStartTime ? (Date.now() < window._auctionStartTime ? '🔒 Auctions locked until ' + new Date(window._auctionStartTime).toLocaleString() : '🟢 Auctions open') : '🟢 Open (no start time set)'}</span>
          </div>
        </div>
      </div>
      ${offseasonMode ? `<div style="border-top:1px solid var(--border);">
        <div style="padding:10px 16px;background:var(--surface2);font-size:12px;font-weight:600;color:var(--yellow);">⚠️ Teams over 70% offseason cap (${fmtM(cutCap)})</div>
        ${overCapWarnings}
      </div>` : ''}
    </div>

    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-bottom:24px;">
      <div style="padding:12px 16px;border-bottom:1px solid var(--border);background:var(--surface2);">
        <span style="font-size:14px;font-weight:600;">👥 Co-Managers</span>
        <div style="font-size:11px;color:var(--text3);margin-top:2px;">Add a Sleeper username who can manage a team (bid, nominate) as a co-manager</div>
      </div>
      <div style="padding:16px;display:flex;flex-direction:column;gap:10px;" id="co-manager-list">
        <div style="font-size:12px;color:var(--text3);">Loading…</div>
      </div>
      <div style="padding:0 16px 16px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
        <select id="cm-team-select" style="padding:7px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font-body);font-size:13px;outline:none;">
          <option value="">— Select team —</option>
          ${Object.entries(DATA).map(([k,t])=>`<option value="${k}">${t.team_name}</option>`).join('')}
        </select>
        <input id="cm-username-input" type="text" placeholder="sleeper_username"
          style="padding:7px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font-body);font-size:13px;outline:none;width:180px;"/>
        <button onclick="commAddCoManager()" style="padding:7px 14px;background:var(--accent);border:none;border-radius:var(--radius-sm);color:#fff;font-size:12px;cursor:pointer;font-family:var(--font-body);">Add</button>
        <span id="cm-status" style="font-size:12px;color:var(--green);"></span>
      </div>
    </div>

    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-bottom:24px;">
      <div style="padding:12px 16px;border-bottom:1px solid var(--border);background:var(--surface2);">
        <span style="font-size:14px;font-weight:600;">🔑 Team Passwords</span>
        <div style="font-size:11px;color:var(--text3);margin-top:2px;">Optionally require a password per team. Leave blank to remove.</div>
      </div>
      <div style="padding:16px;display:flex;flex-direction:column;gap:8px;" id="pw-list">
        <div style="font-size:12px;color:var(--text3);">Loading…</div>
      </div>
    </div>

    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-bottom:24px;">
      <div style="padding:12px 16px;border-bottom:1px solid var(--border);background:var(--surface2);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
        <div>
          <span style="font-size:14px;font-weight:600;">🔗 Roster ID Mapping</span>
          <div style="font-size:11px;color:var(--text3);margin-top:2px;">Link each username to their Sleeper roster ID so open spots sync to the auction page</div>
        </div>
        <button onclick="commSaveRosterMap()" style="padding:7px 14px;background:var(--accent);border:none;border-radius:var(--radius-sm);color:#fff;font-size:12px;cursor:pointer;font-family:var(--font-body);">💾 Save Mapping</button>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="border-bottom:1px solid var(--border);">
          <th style="font-size:10px;color:var(--text3);text-transform:uppercase;padding:7px 14px;text-align:left;font-weight:500;">Cap Username / Team</th>
          <th style="font-size:10px;color:var(--text3);text-transform:uppercase;padding:7px 14px;text-align:left;font-weight:500;" colspan="2">Sleeper Team (pick from dropdown)</th>
        </tr></thead>
        <tbody id="roster-map-tbody">${mapRows}</tbody>
      </table>
      <div id="map-status" style="padding:8px 16px;font-size:12px;color:var(--green);min-height:28px;"></div>
    </div>

    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-bottom:24px;">
      <div style="padding:12px 16px;border-bottom:1px solid var(--border);background:var(--surface2);display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:14px;font-weight:600;">🚕 Taxi Squad — Set Positions &amp; Promote</span>
        <span style="font-size:12px;color:var(--text3);">Positions save instantly to Firebase</span>
      </div>
      <table style="width:100%;border-collapse:collapse;"><thead><tr style="border-bottom:1px solid var(--border);">
        <th style="font-size:10px;color:var(--text3);text-transform:uppercase;padding:7px 14px;text-align:left;font-weight:500;">Player</th>
        <th style="font-size:10px;color:var(--text3);text-transform:uppercase;padding:7px 6px;text-align:left;font-weight:500;">Pos</th>
        <th style="font-size:10px;color:var(--text3);text-transform:uppercase;padding:7px 6px;text-align:left;font-weight:500;">Salary</th>
        <th style="font-size:10px;color:var(--text3);text-transform:uppercase;padding:7px 6px;text-align:left;font-weight:500;">Status</th>
        <th></th>
      </tr></thead><tbody>${taxiRows}</tbody></table>
    </div>

    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;">
      <div style="padding:12px 16px;border-bottom:1px solid var(--border);background:var(--surface2);display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:14px;font-weight:600;">🏈 Active Rosters — Edit &amp; Holdouts</span>
        <span style="font-size:12px;color:var(--text3);">Click ✏️ to edit salary/position/name</span>
      </div>
      <table style="width:100%;border-collapse:collapse;"><thead><tr style="border-bottom:1px solid var(--border);">
        <th style="font-size:10px;color:var(--text3);text-transform:uppercase;padding:7px 14px;text-align:left;font-weight:500;">Player</th>
        <th style="font-size:10px;color:var(--text3);text-transform:uppercase;padding:7px 6px;text-align:left;font-weight:500;">Pos</th>
        <th style="font-size:10px;color:var(--text3);text-transform:uppercase;padding:7px 6px;text-align:left;font-weight:500;">Salary</th>
        <th style="font-size:10px;color:var(--text3);text-transform:uppercase;padding:7px 6px;text-align:left;font-weight:500;">Holdout</th>
        <th></th>
      </tr></thead><tbody>${starterRows}</tbody></table>
    </div>

    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-top:24px;">
      <div style="padding:12px 16px;border-bottom:1px solid var(--border);background:var(--surface2);display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:14px;font-weight:600;">🔄 Process Trade</span>
        <span style="font-size:12px;color:var(--text3);">Move players between two teams</span>
      </div>
      <div style="padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:16px;" id="trade-panel">
        <div>
          <div style="font-size:12px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.4px;margin-bottom:8px;">Team A</div>
          <select id="trade-team-a" onchange="tradePopulatePlayers('a')" style="width:100%;padding:8px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font-body);font-size:13px;outline:none;margin-bottom:8px;">
            <option value="">— Select team —</option>
            ${Object.entries(DATA).map(([k,t])=>`<option value="${k}">${t.team_name}</option>`).join('')}
          </select>
          <select id="trade-players-a" multiple style="width:100%;height:140px;padding:6px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font-body);font-size:12px;outline:none;">
            <option disabled>Select team first</option>
          </select>
          <div style="font-size:11px;color:var(--text3);margin-top:4px;">Hold Ctrl/Cmd to select multiple</div>
        </div>
        <div>
          <div style="font-size:12px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.4px;margin-bottom:8px;">Team B</div>
          <select id="trade-team-b" onchange="tradePopulatePlayers('b')" style="width:100%;padding:8px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font-body);font-size:13px;outline:none;margin-bottom:8px;">
            <option value="">— Select team —</option>
            ${Object.entries(DATA).map(([k,t])=>`<option value="${k}">${t.team_name}</option>`).join('')}
          </select>
          <select id="trade-players-b" multiple style="width:100%;height:140px;padding:6px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font-body);font-size:12px;outline:none;">
            <option disabled>Select team first</option>
          </select>
          <div style="font-size:11px;color:var(--text3);margin-top:4px;">Hold Ctrl/Cmd to select multiple</div>
        </div>
      </div>
      <div style="padding:0 16px 16px;">
        <div id="trade-preview" style="font-size:12px;color:var(--text3);margin-bottom:10px;min-height:20px;"></div>
        <button onclick="processTrade()" style="padding:8px 20px;background:var(--accent);border:none;border-radius:var(--radius-sm);color:#fff;font-size:13px;font-weight:500;cursor:pointer;font-family:var(--font-body);">Execute Trade</button>
      </div>
    </div>

  </div>`;

  loadRosterIdMap();
  loadCoManagers();
  loadPasswordList();
  // Wire trade multi-select preview after render
  setTimeout(() => {
    ['a','b'].forEach(side => {
      document.getElementById(`trade-players-${side}`)?.addEventListener('change', tradeUpdatePreview);
    });
  }, 0);
}


// ── CAP & OFFSEASON SETTINGS ──────────────────────────────────
async function commSaveAuctionStart() {
  const inp = document.getElementById('comm-auction-start');
  if (!inp?.value) { alert('Pick a date/time first.'); return; }
  const ts = new Date(inp.value).getTime();
  if (isNaN(ts)) { alert('Invalid date.'); return; }
  window._auctionStartTime = ts;
  await db.ref(`leagues/${leagueId()}/settings/auctionStartTime`).set(ts);
  renderTab('commish');
}

async function commClearAuctionStart() {
  window._auctionStartTime = null;
  await db.ref(`leagues/${leagueId()}/settings/auctionStartTime`).remove();
  renderTab('commish');
}

async function commSaveMaxIR() {
  const inp = document.getElementById('comm-max-ir');
  const val = parseInt(inp?.value);
  if (isNaN(val) || val < 0) { showToast('Enter a valid IR limit (0 or more).', 'error'); return; }
  MAX_IR = val;
  await db.ref(`leagues/${leagueId()}/settings/maxIR`).set(val);
  showToast(`Max IR slots set to ${val}`, 'success');
  renderTab('commish');
}

async function commSaveMaxTaxi() {
  const inp = document.getElementById('comm-max-taxi');
  const val = parseInt(inp?.value);
  if (isNaN(val) || val < 0) { showToast('Enter a valid Taxi limit (0 or more).', 'error'); return; }
  MAX_TAXI = val;
  await db.ref(`leagues/${leagueId()}/settings/maxTaxi`).set(val);
  showToast(`Max Taxi slots set to ${val}`, 'success');
  renderTab('commish');
}

async function commSaveCap() {
  const inp = document.getElementById('comm-cap-input');
  const val = parseFloat(inp?.value);
  if (!val || val <= 0) { showToast('Enter a valid cap value','error'); return; }
  CAP = Math.round(val * 1_000_000);
  if (leagueId()) await db.ref(`leagues/${leagueId()}/settings/cap`).set(CAP);
  showToast(`Cap set to ${fmtM(CAP)}`,'success');
  renderTab('commish');
  renderTab('overview');
}

async function commToggleOffseason() {
  offseasonMode = !offseasonMode;
  if (leagueId()) await db.ref(`leagues/${leagueId()}/settings/offseason`).set(offseasonMode);
  showToast(offseasonMode ? '☀️ Offseason mode ON' : '🏈 Regular season mode','info');
  renderTab('commish');
  renderTab('overview');
}

// ── ROSTER ID MAPPING ─────────────────────────────────────────
async function loadRosterIdMap() {
  if (!leagueId()) return;
  const statusEl = document.getElementById('map-status');
  const tbody = document.getElementById('roster-map-tbody');
  if (!tbody) return;
  if (statusEl) statusEl.textContent = 'Loading Sleeper rosters…';
  try {
    const [rosters, users] = await Promise.all([
      fetch(`https://api.sleeper.app/v1/league/${leagueId()}/rosters`).then(r=>r.json()),
      fetch(`https://api.sleeper.app/v1/league/${leagueId()}/users`).then(r=>r.json()),
    ]);
    // user_id → display_name
    const userMap = {};
    (users||[]).forEach(u => { userMap[u.user_id] = u.display_name || u.username || u.user_id; });
    // Load existing saved mapping: teamKey → roster_id
    const snap = await db.ref(`leagues/${leagueId()}/usernameToRosterId`).once('value');
    const existing = snap.val() || {};
    window._rosterIdMap = existing;
    // Invert: roster_id → teamKey
    const ridToTeam = {};
    Object.entries(existing).forEach(([k,v]) => ridToTeam[String(v)] = k);

    // Rebuild tbody rows - one row per Sleeper roster
    tbody.innerHTML = '';
    rosters.sort((a,b) => a.roster_id - b.roster_id).forEach(r => {
      const sleeperName = userMap[r.owner_id] || `Roster ${r.roster_id}`;
      const currentTeam = ridToTeam[String(r.roster_id)] || '';
      const opts = `<option value="">— not mapped —</option>` +
        Object.keys(DATA||{}).map(key =>
          `<option value="${key}"${currentTeam===key?' selected':''}>${DATA[key]?.team_name||key} (${key})</option>`
        ).join('');
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--border)';
      tr.innerHTML = `
        <td style="padding:9px 14px;font-size:13px;">
          <div style="font-weight:500;">${sleeperName}</div>
          <div style="font-size:11px;color:var(--text3);">Sleeper roster #${r.roster_id}</div>
        </td>
        <td style="padding:9px 14px;" colspan="2">
          <select data-roster-id="${r.roster_id}"
            style="width:100%;padding:6px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font-body);font-size:13px;outline:none;">
            ${opts}
          </select>
        </td>`;
      tbody.appendChild(tr);
    });
    if (statusEl) statusEl.textContent = `Loaded ${rosters.length} Sleeper rosters`;
  } catch(e) {
    console.warn('loadRosterIdMap:', e);
    if (statusEl) statusEl.textContent = 'Failed to load Sleeper rosters';
  }
}

async function commSaveRosterMap() {
  const tbody = document.querySelector('#roster-map-tbody');
  if (!tbody) return;
  const mapping = {}; // teamKey → roster_id
  tbody.querySelectorAll('select[data-roster-id]').forEach(sel => {
    const rid = parseInt(sel.dataset.rosterId);
    const teamKey = sel.value;
    if (teamKey && rid) mapping[teamKey] = rid;
  });
  window._rosterIdMap = mapping;
  if (leagueId()) {
    await db.ref(`leagues/${leagueId()}/usernameToRosterId`).set(mapping);
    showToast('Roster ID mapping saved ✅','success');
    document.getElementById('map-status').textContent = 'Saved ' + Object.keys(mapping).length + ' mappings';
  }
}

// ── TRADE PROCESSOR ───────────────────────────────────────────
function tradePopulatePlayers(side) {
  const teamSel = document.getElementById(`trade-team-${side}`);
  const listSel = document.getElementById(`trade-players-${side}`);
  if (!teamSel || !listSel) return;
  const teamKey = teamSel.value;
  listSel.innerHTML = '';
  if (!teamKey || !DATA[teamKey]) {
    listSel.innerHTML = '<option disabled>Select team first</option>';
    tradeUpdatePreview();
    return;
  }
  const t = DATA[teamKey];
  const po = ['QB','RB','WR','TE'];
  const all = [
    ...(t.starters||[]).map(p => ({...p, slot:'Active'})),
    ...(t.ir||[]).map(p => ({...p, slot:'IR'})),
    ...(t.taxi||[]).filter(p=>p.name).map(p => ({...p, slot:'Taxi'})),
  ].filter(p => p.name);
  all.sort((a,b) => {
    const pi = po.indexOf(a.pos), qi = po.indexOf(b.pos);
    return pi !== qi ? (pi < 0 ? 1 : qi < 0 ? -1 : pi - qi) : b.salary - a.salary;
  });
  all.forEach(p => {
    const opt = document.createElement('option');
    opt.value = `${p.name}|||${p.slot}`;
    opt.textContent = `${p.name} (${p.pos||p.slot}) — ${fmtM(p.salary)} [${p.slot}]`;
    listSel.appendChild(opt);
  });
  tradeUpdatePreview();
}

function tradeUpdatePreview() {
  const preview = document.getElementById('trade-preview');
  if (!preview) return;
  const ta = document.getElementById('trade-team-a')?.value;
  const tb = document.getElementById('trade-team-b')?.value;
  const selA = [...(document.getElementById('trade-players-a')?.selectedOptions||[])].map(o=>o.value.split('|||')[0]);
  const selB = [...(document.getElementById('trade-players-b')?.selectedOptions||[])].map(o=>o.value.split('|||')[0]);
  if (!ta || !tb || (!selA.length && !selB.length)) { preview.textContent = ''; return; }
  const nameA = DATA[ta]?.team_name||ta, nameB = DATA[tb]?.team_name||tb;
  const parts = [];
  if (selA.length) parts.push(`${nameA} sends: ${selA.join(', ')}`);
  if (selB.length) parts.push(`${nameB} sends: ${selB.join(', ')}`);
  preview.textContent = parts.join(' ↔ ');
}

async function processTrade() {
  const ta = document.getElementById('trade-team-a')?.value;
  const tb = document.getElementById('trade-team-b')?.value;
  if (!ta || !tb)   { showToast('Select both teams','error'); return; }
  if (ta === tb)    { showToast('Teams must be different','error'); return; }
  const selA = [...(document.getElementById('trade-players-a')?.selectedOptions||[])].map(o=>o.value.split('|||'));
  const selB = [...(document.getElementById('trade-players-b')?.selectedOptions||[])].map(o=>o.value.split('|||'));
  if (!selA.length && !selB.length) { showToast('Select at least one player','error'); return; }

  function movePlayer(fromKey, toKey, playerName, slot) {
    const from = DATA[fromKey], to = DATA[toKey];
    const arr = slot==='IR' ? 'ir' : slot==='Taxi' ? 'taxi' : 'starters';
    const idx = (from[arr]||[]).findIndex(p => p.name === playerName);
    if (idx === -1) return false;
    const [player] = from[arr].splice(idx, 1);
    if (!to[arr]) to[arr] = [];
    to[arr].push(player);
    return true;
  }

  selA.forEach(([name, slot]) => movePlayer(ta, tb, name, slot));
  selB.forEach(([name, slot]) => movePlayer(tb, ta, name, slot));

  [ta, tb].forEach(key => {
    DATA[key].cap_spent = (DATA[key].starters||[]).reduce((s,p)=>s+p.salary,0)
                        + (DATA[key].ir||[]).reduce((s,p)=>s+Math.round(p.salary*.75),0);
  });

  await saveToFirebase();

  const warnings = [ta,tb].filter(k => DATA[k].cap_spent > CAP)
    .map(k => `${DATA[k].team_name} over cap by ${fmtM(DATA[k].cap_spent-CAP)}`);
  if (warnings.length) showToast('Trade done ⚠️ ' + warnings.join(', '),'warn');
  else showToast(`Trade: ${DATA[ta].team_name} ↔ ${DATA[tb].team_name}`,'success');

  renderCommish();
  renderTab('overview');
}


// ── HOLDOUT ───────────────────────────────────────────────────
async function toggleHoldout(teamKey, playerName) {
  if(!leagueId()) return;
  const safe=playerName.replace(/[.#$\/\[\]]/g,'_');
  const existing=(holdouts[teamKey]||{})[playerName];
  if(existing){
    if(!holdouts[teamKey]) holdouts[teamKey]={};
    delete holdouts[teamKey][playerName];
    await db.ref(`leagues/${leagueId()}/holdouts/${teamKey}/${safe}`).remove();
    showToast('Holdout flag removed','info');
  } else {
    const note=prompt(`Holdout note for ${playerName} (optional):`)||'';
    if(!holdouts[teamKey]) holdouts[teamKey]={};
    const data={note,year:new Date().getFullYear(),flaggedAt:Date.now()};
    holdouts[teamKey][playerName]=data;
    await db.ref(`leagues/${leagueId()}/holdouts/${teamKey}/${safe}`).set(data);
    showToast(`${playerName} flagged as holdout 🔥`,'warn');
  }
  renderTab(tab);
}

// ── PROMO ─────────────────────────────────────────────────────
async function openPromoModal(teamKey, playerName) {
  _promoTarget={teamKey,playerName};
  const note=prompt(`Promotion note for ${playerName} (optional):`);
  if(note===null){_promoTarget=null;return;}
  const safe=playerName.replace(/[.#$\/\[\]]/g,'_');
  if(!promos[teamKey]) promos[teamKey]={};
  const data={note:note||'',promoted:true,promotedAt:Date.now()};
  promos[teamKey][playerName]=data;
  await db.ref(`leagues/${leagueId()}/taxiPromos/${teamKey}/${safe}`).set(data);
  showToast(`${playerName} marked as promoted ⬆️`,'success');
  _promoTarget=null;
  renderTab(tab);
}
async function undoPromo(teamKey, playerName) {
  if(!leagueId()) return;
  const safe=playerName.replace(/[.#$\/\[\]]/g,'_');
  if(promos[teamKey]) delete promos[teamKey][playerName];
  await db.ref(`leagues/${leagueId()}/taxiPromos/${teamKey}/${safe}`).remove();
  showToast('Promotion undone','info');
  renderTab(tab);
}

// ── TOAST ─────────────────────────────────────────────────────
function showToast(msg,type='info'){
  let c=document.getElementById('tc');
  if(!c){c=document.createElement('div');c.id='tc';c.style.cssText='position:fixed;bottom:20px;right:16px;display:flex;flex-direction:column;gap:8px;z-index:9999;';document.body.appendChild(c);}
  const colors={success:'var(--green)',warn:'var(--yellow)',error:'var(--red)',info:'var(--accent)'};
  const el=document.createElement('div');
  el.style.cssText=`background:var(--surface2);border:1px solid var(--border2);border-left:3px solid ${colors[type]||colors.info};border-radius:var(--radius-sm);padding:10px 16px;font-size:13px;max-width:280px;box-shadow:0 4px 20px rgba(0,0,0,.4);animation:slideIn .2s ease;`;
  el.textContent=msg;c.appendChild(el);setTimeout(()=>el.remove(),3200);
}

// ── EDITOR MODAL ──────────────────────────────────────────────
function openEdit(teamKey,slot,idx){
  const t=DATA[teamKey];
  const p=slot==='ir'?t.ir[idx]:slot==='taxi'?t.taxi[idx]:t.starters[idx];
  if(!p) return;
  editCtx={teamKey,slot,idx,isNew:false};
  document.getElementById('modal-title').textContent='Edit Player';
  document.getElementById('modal-name').value=p.name;
  document.getElementById('modal-salary').value=p.salary;
  document.getElementById('modal-slot').value=slot;
  document.getElementById('modal-delete-btn').style.display='';
  document.getElementById('modal-err').textContent='';
  const pf=document.getElementById('modal-pos-field');
  if(slot==='starters'){pf.style.display='';document.getElementById('modal-pos').value=p.pos||'WR';}
  else pf.style.display='none';
  // Years exp field for taxi players
  const yeRow=document.getElementById('modal-yeexp-row');
  const yeSel=document.getElementById('modal-yeexp');
  if(yeRow && yeSel){
    yeRow.style.display=slot==='taxi'?'':'none';
    yeSel.value=p.years_exp!=null?String(p.years_exp):'';
  }
  document.getElementById('edit-modal').style.display='flex';
}
function openAdd(teamKey,slot,defaultPos){
  // Enforce IR/Taxi slot limits
  const t = DATA[teamKey];
  if (t && slot === 'ir') {
    const current = (t.ir||[]).filter(p=>p.name).length;
    if (current >= MAX_IR) {
      showToast(`IR is full (${current}/${MAX_IR} slots used). Adjust the limit in League Settings if needed.`, 'error');
      return;
    }
  }
  if (t && slot === 'taxi') {
    const current = (t.taxi||[]).filter(p=>p.name).length;
    if (current >= MAX_TAXI) {
      showToast(`Taxi squad is full (${current}/${MAX_TAXI} slots used). Adjust the limit in League Settings if needed.`, 'error');
      return;
    }
  }
  editCtx={teamKey,slot,idx:-1,isNew:true};
  document.getElementById('modal-title').textContent='Add Player';
  document.getElementById('modal-name').value='';
  document.getElementById('modal-salary').value='';
  document.getElementById('modal-slot').value=slot;
  document.getElementById('modal-delete-btn').style.display='none';
  document.getElementById('modal-err').textContent='';
  const pf=document.getElementById('modal-pos-field');
  pf.style.display='';
  document.getElementById('modal-pos').value=defaultPos||'WR';
  // Years exp field
  const yeRow=document.getElementById('modal-yeexp-row');
  const yeSel=document.getElementById('modal-yeexp');
  if(yeRow && yeSel){yeRow.style.display=slot==='taxi'?'':'none';yeSel.value='';}
  document.getElementById('edit-modal').style.display='flex';
}
function closeModal(){document.getElementById('edit-modal').style.display='none';editCtx=null;}
async function savePlayer(){
  if(!editCtx) return;
  const name=document.getElementById('modal-name').value.trim();
  const salary=parseInt(document.getElementById('modal-salary').value);
  const slot=document.getElementById('modal-slot').value;
  const pos=document.getElementById('modal-pos').value;
  const yeVal=document.getElementById('modal-yeexp')?.value;
  const errEl=document.getElementById('modal-err');
  if(!name){errEl.textContent='Player name required.';return;}
  if(!salary||salary<0){errEl.textContent='Enter a valid salary.';return;}
  const{teamKey,idx,isNew}=editCtx;
  const t=DATA[teamKey];
  if(!isNew){
    const os=editCtx.slot;
    if(os==='starters')t.starters.splice(idx,1);
    else if(os==='ir')t.ir.splice(idx,1);
    else if(os==='taxi')t.taxi.splice(idx,1);
  }
  let player=slot==='starters'?{pos,name,salary}:{name,salary};
  // Add years_exp for taxi players
  if(slot==='taxi' && yeVal!==''){
    player.years_exp=parseInt(yeVal);
  }
  if(slot==='starters')t.starters.push(player);
  else if(slot==='ir'){if(!t.ir)t.ir=[];t.ir.push(player);}
  else if(slot==='taxi'){if(!t.taxi)t.taxi=[];t.taxi.push(player);}
  closeModal();
  await saveToFirebase();
}
async function deletePlayer(){
  if(!editCtx||editCtx.isNew) return;
  const{teamKey,slot,idx}=editCtx;
  const t=DATA[teamKey];
  if(slot==='starters')t.starters.splice(idx,1);
  else if(slot==='ir')t.ir.splice(idx,1);
  else if(slot==='taxi')t.taxi.splice(idx,1);
  closeModal();
  await saveToFirebase();
}

// Works whether loaded as standalone page or injected into SPA
function capInit() {
  const modal = document.getElementById('edit-modal');
  if (modal) modal.addEventListener('click', e => {});

  // Immediately populate DATA from Sleeper teams so the view shows
  // something even before Firebase responds
  const earlyTeams = window._capTeams || [];
  if (earlyTeams.length > 0 && !DATA) {
    DATA = {};
    earlyTeams.forEach(t => {
      const key = (t.username || t.display_name || `team_${t.roster_id}`).toLowerCase().replace(/ /g,'_');
      DATA[key] = {
        team_name: t.display_name || t.username || `Team ${t.roster_id}`,
        cap_spent: 0, starters: [], ir: [], taxi: [],
      };
    });
  }

  subscribeRosters();
}

if (document.getElementById('edit-modal')) {
  // Standalone rosters.html — DOM already ready
  capInit();
} else {
  // SPA injection — wait for the roster view HTML to be in the DOM
  // index.html calls capInit() after injecting buildRosterHTML()
  window._capInitPending = true;
}

// ── PLAYER CARD ───────────────────────────────────────────────
let _pcYear      = 2025;
let _pcPlayerId  = null;
let _pcWeekCache = {};  // year -> weekly data

function fmtHeight(inches) {
  if (!inches) return null;
  const ft = Math.floor(inches/12), ins = inches%12;
  return `${ft}'${ins}"`;
}

async function showPlayerCard(playerId, playerName) {
  if (!playerId && !playerName) return;
  const modal = document.getElementById('player-card-modal');
  if (!modal) return;
  modal.style.display = 'flex';
  _pcWeekCache = {};

  // Resolve player data
  const byId = window._playerById || {};
  let pData  = playerId ? byId[playerId] : null;
  if (!pData && playerName) {
    const lk = PLAYER_LOOKUP[(playerName||'').toLowerCase()] || {};
    playerId = lk.player_id || playerId;
    pData    = playerId ? byId[playerId] : null;
  }
  _pcPlayerId = playerId || null;
  
  const name    = pData?.name  || playerName || 'Unknown';
  const pos     = pData?.pos   || '—';
  const nflTeam = pData?.team  || '—';
  const pc      = POS_COLORS[pos] || '#888';

  // Header
  document.getElementById('pc-name').textContent = name;
  document.getElementById('pc-team').textContent = nflTeam;

  // Photo
  const photoEl = document.getElementById('pc-photo');
  if (_pcPlayerId) {
    photoEl.src = `https://sleepercdn.com/content/nfl/players/${_pcPlayerId}.jpg`;
    photoEl.style.display = '';
  } else {
    photoEl.style.display = 'none';
  }

  // Position badge
  const posEl = document.getElementById('pc-pos');
  posEl.textContent      = pos;
  posEl.style.background = pc + '22';
  posEl.style.color      = pc;

  // Bio details
  const bioItems = [];
  if (pData?.age)        bioItems.push(`Age ${pData.age}`);
  if (pData?.height)     bioItems.push(fmtHeight(pData.height));
  if (pData?.weight)     bioItems.push(`${pData.weight} lbs`);
  if (pData?.college)    bioItems.push(pData.college);
  if (pData?.years_exp != null) bioItems.push(`Yr ${pData.years_exp + 1}`);
  if (pData?.birth_country && pData.birth_country !== 'USA') bioItems.push(pData.birth_country);
  if (pData?.status && pData.status !== 'Active') bioItems.push(`⚠️ ${pData.status}`);
  if (pData?.injury_status) bioItems.push(`🏥 ${pData.injury_status}`);
  if (pData?.rank && pData.rank < 9999) bioItems.push(`Rank #${pData.rank}`);
  document.getElementById('pc-age').textContent = bioItems.slice(0, 4).join(' · ');
  document.getElementById('pc-exp').textContent = bioItems.slice(4).join(' · ');

  // Owner
  let ownerLabel = '';
  if (window._capTeams) {
    const capT = window._capTeams.find(tm => (tm.players||[]).includes(_pcPlayerId));
    if (capT) ownerLabel = capT.display_name || capT.username || '';
  }
  if (!ownerLabel && DATA) {
    for (const [key, t] of Object.entries(DATA)) {
      const all = [...(t.starters||[]),...(t.ir||[]),...(t.taxi||[])];
      if (all.some(p => p.name === name)) { ownerLabel = t.team_name || key; break; }
    }
  }
  document.getElementById('pc-owner').textContent = ownerLabel ? `📋 ${ownerLabel}` : '';

  // Year tabs
  const years   = [2022, 2023, 2024, 2025];
  const tabsEl  = document.getElementById('pc-year-tabs');
  tabsEl.innerHTML = years.map(y =>
    `<button onclick="pcSetYear(${y})" id="pc-yr-${y}"
      style="padding:6px 14px;font-size:12px;font-family:var(--font-body);
      background:${y===_pcYear?'var(--accent)':'var(--surface2)'};
      color:${y===_pcYear?'#fff':'var(--text2)'};
      border:1px solid var(--border);border-radius:var(--radius-sm) var(--radius-sm) 0 0;
      cursor:pointer;margin-right:2px;">${y}</button>`
  ).join('');

  await pcLoadYear(_pcYear);
}

function pcSetYear(y) {
  _pcYear = y;
  [2022,2023,2024,2025].forEach(yr => {
    const btn = document.getElementById(`pc-yr-${yr}`);
    if (btn) {
      btn.style.background = yr===y ? 'var(--accent)' : 'var(--surface2)';
      btn.style.color      = yr===y ? '#fff' : 'var(--text2)';
    }
  });
  pcLoadYear(y);
}

async function pcLoadYear(year) {
  
  if (!_pcPlayerId) { pcShowNoStats(); return; }
  const sumEl = document.getElementById('pc-season-summary');
  const logEl = document.getElementById('pc-game-log');
  sumEl.innerHTML = '<div style="color:var(--text3);font-size:12px;padding:8px;">Loading…</div>';
  logEl.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3);">Loading…</div>';

  try {
    // Step 1: Get season totals from bulk stats (most reliable)
    const bulkKey = 'sb_stats_' + year;
    let bulkData = null;
    try { bulkData = JSON.parse(localStorage.getItem(bulkKey) || 'null'); } catch(e) {}
    if (!bulkData) {
      
      const br = await fetch(`https://api.sleeper.app/v1/stats/nfl/regular/${year}?season_type=regular&position[]=QB&position[]=RB&position[]=WR&position[]=TE&position[]=K`);
      if (br.ok) {
        bulkData = await br.json();
        try { localStorage.setItem(bulkKey, JSON.stringify(bulkData)); } catch(e) {}
      }
    }

    const seasonStats = bulkData?.[_pcPlayerId] || null;
    
    // Step 2: Get weekly breakdown from per-player endpoint
    let weeklyArr = _pcWeekCache[year] || null;
    // Check sessionStorage cache first
    const _ssKey = `pc_w_${_pcPlayerId}_${year}`;
    if (!weeklyArr) {
      try { weeklyArr = JSON.parse(sessionStorage.getItem(_ssKey)||'null'); } catch(e) {}
    }
    if (!weeklyArr) {
      // Fetch weekly breakdown from bulk per-week endpoints (18 parallel)
      
      try {
        const weekResults = await Promise.all(
          Array.from({length:18},(_,i)=>i+1).map(w =>
            fetch(`https://api.sleeper.app/v1/stats/nfl/regular/${year}/${w}?season_type=regular`)
              .then(r => r.ok ? r.json() : null)
              .then(data => (data && data[_pcPlayerId] && data[_pcPlayerId].pts_ppr != null)
                ? { week: w, ...data[_pcPlayerId] } : null)
              .catch(() => null)
          )
        );
        weeklyArr = weekResults.filter(Boolean);
        
        if (weeklyArr.length) {
          _pcWeekCache[year] = weeklyArr;
          try { sessionStorage.setItem(_ssKey, JSON.stringify(weeklyArr)); } catch(e) {}
        } else {
          weeklyArr = null;
        }
      } catch(e) { console.warn('[pc] bulk weekly error:', e.message); weeklyArr = null; }
    }

    // If no weekly from per-player, compute from bulk weekly endpoint
    if (!weeklyArr?.length && bulkData) {
      // Build weekly from individual week fetches is too slow -- show season total only
      weeklyArr = [];
    }

    if (!seasonStats && !weeklyArr?.length) {
      pcShowNoStats(sumEl, logEl);
      return;
    }

    // Season summary
    const st   = seasonStats || {};
    const gp   = st.gp || weeklyArr?.length || 1;
    const total = st.pts_ppr || weeklyArr?.reduce((s,w) => s+(w.pts_ppr||0), 0) || 0;
    const avg  = total ? (total / gp).toFixed(1) : null;

    const summaryItems = [
      ['Total Pts', total ? total.toFixed(1) : null],
      ['Avg/Gm',    avg],
      ['GP',        gp || null],
      st.pass_yd  ? ['Pass Yd', Math.round(st.pass_yd)]  : null,
      st.pass_td  ? ['Pass TD', st.pass_td]               : null,
      st.rush_yd  ? ['Rush Yd', Math.round(st.rush_yd)]   : null,
      st.rush_td  ? ['Rush TD', st.rush_td]               : null,
      st.rec      ? ['Rec',     st.rec]                   : null,
      st.rec_yd   ? ['Rec Yd',  Math.round(st.rec_yd)]    : null,
      st.rec_td   ? ['Rec TD',  st.rec_td]                : null,
    ].filter(Boolean).filter(([,v]) => v !== null && v !== undefined && v !== 0);

    sumEl.innerHTML = summaryItems.length
      ? summaryItems.map(([l,v]) =>
          `<div style="text-align:center;background:var(--surface2);border-radius:6px;padding:8px 10px;min-width:48px;">
            <div style="font-family:var(--font-mono);font-size:15px;font-weight:600;">${v}</div>
            <div style="font-size:10px;color:var(--text3);margin-top:2px;">${l}</div>
          </div>`).join('')
      : '<div style="color:var(--text3);font-size:12px;padding:8px;">No stats found.</div>';

    // Game log
    if (!weeklyArr?.length) {
      logEl.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3);">Weekly breakdown not available — season totals shown above.</div>';
      return;
    }

    const weeks = [...weeklyArr].sort((a,b) => (a.week||0)-(b.week||0));
    const rows  = weeks.map(w => {
      const pts   = w.pts_ppr != null ? w.pts_ppr.toFixed(1) : '—';
      const color = w.pts_ppr == null ? 'var(--text3)' : w.pts_ppr >= 20 ? 'var(--green)' : w.pts_ppr >= 10 ? 'var(--text)' : 'var(--red)';
      const bits  = [];
      if (w.pass_yd)  bits.push(Math.round(w.pass_yd)+'Pa');
      if (w.pass_td)  bits.push(w.pass_td+'PTD');
      if (w.rush_att) bits.push(w.rush_att+' car');
      if (w.rush_yd)  bits.push(Math.round(w.rush_yd)+'Ru');
      if (w.rush_td)  bits.push(w.rush_td+'RTD');
      if (w.rec)      bits.push(w.rec+'/'+Math.round(w.rec_yd||0)+'Re');
      if (w.rec_td)   bits.push(w.rec_td+'ReTD');
      if (w.pass_int) bits.push(w.pass_int+'INT');
      return `<tr style="border-bottom:1px solid var(--border)">
        <td style="padding:5px 8px;font-size:12px;color:var(--text3);">Wk ${w.week}</td>
        <td style="padding:5px 8px;font-family:var(--font-mono);font-size:13px;font-weight:600;color:${color};">${pts}</td>
        <td style="padding:5px 8px;font-size:11px;color:var(--text2);">${bits.join(' · ') || '—'}</td>
      </tr>`;
    }).join('');

    logEl.innerHTML = `<table style="width:100%;border-collapse:collapse;">
      <thead><tr style="background:var(--surface2);">
        <th style="text-align:left;font-size:11px;color:var(--text3);padding:5px 8px;font-weight:600;">Week</th>
        <th style="text-align:left;font-size:11px;color:var(--text3);padding:5px 8px;font-weight:600;">Pts PPR</th>
        <th style="text-align:left;font-size:11px;color:var(--text3);padding:5px 8px;font-weight:600;">Stats</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;

  } catch(e) {
    console.warn('pcLoadYear error:', e);
    sumEl.innerHTML = '';
    logEl.innerHTML = `<div style="text-align:center;padding:20px;color:var(--red);">
      Could not load ${year} stats.<br><small style="opacity:.6;">${e.message}</small></div>`;
  }
}



function pcShowNoStats(sumEl, logEl) {
  if (sumEl) sumEl.innerHTML = '';
  if (logEl) logEl.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3);">No stats available for this season.</div>';
}

function calcAge(name) {
  const lk = PLAYER_LOOKUP[(name||'').toLowerCase()] || {};
  if (!lk.birth_date) return null;
  const [y,m,d] = lk.birth_date.split('-').map(Number);
  const today = new Date();
  let age = today.getFullYear() - y;
  if (today.getMonth()+1 < m || (today.getMonth()+1===m && today.getDate()<d)) age--;
  return age;
}




