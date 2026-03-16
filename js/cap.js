
const CAP         = 301_200_000;
const COMM        = 'mraladdin23';
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
let holdouts = {};
let promos   = {};
let _promoTarget = null;

function rosterRef() { return db.ref(FB_PATH()); }

function subscribeRosters() {
  if (!leagueId()) { initWithFallback(); return; }
  const lid = leagueId();
  db.ref(`leagues/${lid}/holdouts`).once('value').then(s=>{holdouts=s.val()||{};if(DATA)renderTab(tab);}).catch(()=>{});
  db.ref(`leagues/${lid}/taxiPromos`).once('value').then(s=>{promos=s.val()||{};if(DATA)renderTab(tab);}).catch(()=>{});
  rosterRef().on('value', snap => {
    const fbData = snap.val();
    if (fbData && Object.keys(fbData).length > 0) {
      DATA = fbData;
      document.getElementById('last-upd').textContent = 'Live data';
    } else {
      DATA = JSON.parse(JSON.stringify(FALLBACK));
      document.getElementById('last-upd').textContent = 'Built-in data';
    }
    document.getElementById('loading').style.display = 'none';
    document.getElementById('app').style.display = '';
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
    // Keep auction page open-spot counts in sync
    syncRosterSizes();
  });
}

function initWithFallback() {
  DATA = JSON.parse(JSON.stringify(FALLBACK));
  document.getElementById('last-upd').textContent = 'Built-in data';
  document.getElementById('loading').style.display = 'none';
  document.getElementById('app').style.display = '';
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

const fmtM    = n => n>=1e6?'$'+(n/1e6).toFixed(1)+'M':n>=1e3?'$'+(n/1e3).toFixed(0)+'K':'$'+n;
const pctOf   = n => ((n/CAP)*100).toFixed(1)+'%';
const capClr  = s => s/CAP>.72?'var(--red)':s/CAP>.58?'var(--yellow)':'var(--green)';
const posTotal= (t,pos) => t.starters.filter(p=>p.pos===pos).reduce((a,p)=>a+p.salary,0);
const badge   = pos => `<span class="pos-badge pb-${pos}">${pos}</span>`;

// ── Tab switcher ──────────────────────────────────────────────
function setTab(t) {
  tab = t;
  ['overview','allplayers','compare','toppaid','taxi','commish'].forEach(n => {
    document.getElementById('tab-'+n).style.display = n===t?'':'none';
  });
  document.querySelectorAll('.nav-tab').forEach(b =>
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
  else if (t==='commish')    renderCommish();
}

// ── OVERVIEW ─────────────────────────────────────────────────
function renderOverview() {
  const el = document.getElementById('tab-overview');
  const teams = Object.values(DATA);
  const spentArr = teams.map(t=>t.cap_spent), availArr = teams.map(t=>CAP-t.cap_spent);
  const avg = Math.round(spentArr.reduce((a,b)=>a+b)/teams.length);

  const summary = [
    ['Salary Cap',     fmtM(CAP),                  '$1 = $100,000',       'var(--accent2)'],
    ['Avg Cap Spent',  fmtM(avg),                  pctOf(avg)+' of cap',  'var(--yellow)'],
    ['Most Spent',     fmtM(Math.max(...spentArr)), '',                    'var(--red)'],
    ['Least Spent',    fmtM(Math.min(...spentArr)), '',                    'var(--green)'],
    ['Most Available', fmtM(Math.max(...availArr)), '',                    'var(--green)'],
    ['Least Available',fmtM(Math.min(...availArr)), '',                    'var(--red)'],
  ].map(([l,v,s,c]) => `<div class="sum-card">
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
    return `<div class="ov-card" onclick="openTeamPanel('${key}')" style="cursor:pointer;">
      <div class="ov-header">
        <div><div class="ov-name">${t.team_name}</div><div class="ov-user">${key}</div></div>
        <div style="text-align:right;">
          <div style="font-family:var(--font-mono);font-size:13px;font-weight:600;color:${clr};">${pctOf(sp)}</div>
          <div style="font-size:10px;color:var(--text3);">cap used</div>
        </div>
      </div>
      <div class="cap-bar"><div class="cap-bar-fill" style="width:${(sp/CAP*100).toFixed(1)}%;background:${clr};"></div></div>
      <div class="ov-money">
        <span><strong style="color:${clr};">${fmtM(sp)}</strong> spent</span>
        <span><strong style="color:var(--green);">${fmtM(av)}</strong> avail</span>
      </div>
      <div class="pos-grid">${POSITIONS.map(pos=>{
        const tot=posTotal(t,pos),cnt=t.starters.filter(p=>p.pos===pos).length;
        const c=cnt===0?'var(--red)':cnt===1?'var(--yellow)':POS_COLORS[pos];
        return `<div class="pos-blk"><div class="pos-lbl" style="color:${c};">${pos}</div><div class="pos-val" style="color:${c};">${fmtM(tot)}</div></div>`;
      }).join('')}</div>
      ${scarBadges?`<div style="margin-bottom:8px;">${scarBadges}</div>`:''}
      <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.4px;margin-bottom:5px;">Top Salaries</div>
      ${top3.map(p=>`<div class="top-player">
        <div class="tp-left">${badge(p.pos)}<span class="tp-name">${p.name}</span></div>
        <span class="tp-sal">${fmtM(p.salary)}</span>
      </div>`).join('')}
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
        const hoBadge=ho?`<span class="holdout-badge">🔥${ho.note?' '+ho.note:''}</span>`:'';
        const hoBtn=comm?`<button class="act-btn" onclick="toggleHoldout('${key}','${p.name.replace(/'/g,"\\'")}')" title="${ho?'Remove holdout':'Flag holdout'}">${ho?'🔥':'🏳'}</button>`:'';
        const editBtn=comm?`<td class="act-cell">${hoBtn}<button class="act-btn" onclick="openEdit('${key}','starters',${p._idx})">✏️</button></td>`:'';
        return `<tr class="pr">
          <td>${p.name}${hoBadge}</td>
          <td>${badge(p.pos)}</td>
          <td class="sal-cell"><div>${fmtM(p.salary)}</div>
            <div class="sal-bar"><div class="sal-bar-fill" style="width:${bw}%;background:${POS_COLORS[p.pos]||'var(--text3)'};"></div></div>
          </td>${editBtn}</tr>`;
      }).join('');
    });

    const irArr=t.ir||[];
    if(irArr.length){
      const ab=comm?`<button class="add-slot-btn" onclick="openAdd('${key}','ir','')">+IR</button>`:'';
      rows+=`<tr class="sec-row"><td colspan="${comm?3:2}">IR <span style="opacity:.55;font-size:10px;">75% cap</span></td><td class="sec-add">${ab}</td></tr>`;
      rows+=irArr.map((p,i)=>{
        const eb=comm?`<td class="act-cell"><button class="act-btn" onclick="openEdit('${key}','ir',${i})">✏️</button></td>`:'';
        return `<tr class="pr"><td>${p.name}<span class="ir-note">IR</span></td><td>${badge('IR')}</td><td class="sal-cell">${fmtM(Math.round(p.salary*.75))}</td>${eb}</tr>`;
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
let apSearch = '';

function renderAllPlayers() {
  const el = document.getElementById('tab-allplayers');
  let players = [];
  Object.entries(DATA).forEach(([key, t]) => {
    (t.starters||[]).forEach(p => players.push({name:p.name,pos:p.pos,salary:p.salary,slot:'Active',teamName:t.team_name,teamKey:key}));
    (t.ir||[]).forEach(p => { if(p.name) players.push({name:p.name,pos:p.pos||'—',salary:Math.round(p.salary*.75),rawSal:p.salary,slot:'IR',teamName:t.team_name,teamKey:key}); });
    (t.taxi||[]).forEach(p => { if(p.name) players.push({name:p.name,pos:p.pos||'—',salary:p.salary,slot:'Taxi',teamName:t.team_name,teamKey:key}); });
  });
  let filtered = apPosFilter==='ALL' ? players : players.filter(p=>p.pos===apPosFilter);
  if (apSearch) filtered = filtered.filter(p=>p.name.toLowerCase().includes(apSearch));
  filtered.sort((a,b)=>b.salary-a.salary);
  const totalSal = filtered.filter(p=>p.slot==='Active').reduce((s,p)=>s+p.salary,0);
  const chips = ['ALL','QB','RB','WR','TE'].map(p=>`<button class="ap-chip${apPosFilter===p?' active':''}" onclick="apSetPos('${p}')">${p==='ALL'?'All':p}</button>`).join('');
  const rows = filtered.map((p,i)=>{
    const posClr=POS_COLORS[p.pos]||'var(--text3)';
    const slotBadge=p.slot==='IR'?`<span style="font-size:10px;background:rgba(255,77,106,.15);color:var(--red);padding:1px 5px;border-radius:3px;margin-left:5px;">IR</span>`:p.slot==='Taxi'?`<span style="font-size:10px;background:rgba(90,94,114,.25);color:var(--text3);padding:1px 5px;border-radius:3px;margin-left:5px;">Taxi</span>`:'';
    const ho=(holdouts[p.teamKey]||{})[p.name];
    const hoBadge=ho?`<span style="font-size:10px;background:rgba(255,201,77,.15);color:var(--yellow);border-radius:3px;padding:1px 5px;margin-left:5px;">🔥</span>`:'';
    return `<tr>
      <td style="font-size:13px;padding:8px 14px;"><span style="font-size:11px;color:var(--text3);font-family:var(--font-mono);margin-right:6px;min-width:24px;display:inline-block;text-align:right;">${i+1}</span>${p.name}${hoBadge}${slotBadge}</td>
      <td style="padding:8px 6px;">${p.pos&&p.pos!=='—'?`<span class="pos-badge" style="background:${posClr}22;color:${posClr};">${p.pos}</span>`:'<span style="color:var(--text3);font-size:11px;">—</span>'}</td>
      <td style="padding:8px 14px;"><span onclick="openTeamPanel('${p.teamKey}')" style="color:var(--text2);cursor:pointer;font-size:12px;">${p.teamName} <span style="color:var(--accent2);font-size:10px;">↗</span></span></td>
      <td style="text-align:right;font-family:var(--font-mono);font-size:13px;padding:8px 16px;color:${p.slot==='Taxi'?'var(--text3)':p.slot==='IR'?'var(--text2)':'var(--text)'};">${fmtM(p.salary)}${p.rawSal?`<span style="color:var(--text3);font-size:10px;margin-left:4px;">(${fmtM(p.rawSal)})</span>`:''}</td>
    </tr>`;
  }).join('');
  el.innerHTML = `<div style="padding:16px 0 8px;">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:0 4px 12px;">
      <div style="display:flex;gap:6px;">${chips}</div>
      <div style="flex:1;min-width:180px;display:flex;align-items:center;gap:8px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:7px 12px;">
        <span style="color:var(--text3);">🔍</span>
        <input id="ap-search-input" type="text" placeholder="Search players…" value="${apSearch.replace(/"/g,'&quot;')}"
          style="background:none;border:none;outline:none;color:var(--text);font-size:13px;font-family:var(--font-body);width:100%;"
          oninput="apSearch=this.value.toLowerCase().trim();renderAllPlayers();document.getElementById('ap-search-input').focus();" />
      </div>
    </div>
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;">
      <div style="padding:11px 16px;border-bottom:1px solid var(--border);background:var(--surface2);display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:14px;font-weight:600;">${apPosFilter==='ALL'?'All Rostered Players':apPosFilter+' Players'}${apSearch?' · "'+apSearch+'"':''}</span>
        <span style="font-size:12px;color:var(--text3);">${filtered.length} players${apPosFilter!=='ALL'&&!apSearch?' · '+fmtM(totalSal)+' total cap':''}</span>
      </div>
      ${filtered.length?`<table style="width:100%;border-collapse:collapse;"><thead><tr style="border-bottom:1px solid var(--border);">
        <th style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;padding:7px 14px;text-align:left;font-weight:500;">Player</th>
        <th style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;padding:7px 6px;text-align:left;font-weight:500;">Pos</th>
        <th style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;padding:7px 14px;text-align:left;font-weight:500;">Owner</th>
        <th style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;padding:7px 16px;text-align:right;font-weight:500;">Salary ▼</th>
      </tr></thead><tbody>${rows}</tbody></table>`:`<div style="padding:40px;text-align:center;color:var(--text3);">No players found matching "${apSearch}"</div>`}
    </div>
  </div>`;
}
function apSetPos(pos) { apPosFilter = pos; renderAllPlayers(); }

// ── INLINE TEAM PANEL ────────────────────────────────────────
function openTeamPanel(key) {
  const t = DATA[key]; if (!t) return;
  const comm=isComm(), sp=t.cap_spent, av=CAP-sp, pct=(sp/CAP*100).toFixed(1), clr=capClr(sp);
  const maxSal=Math.max(...(t.starters||[]).map(p=>p.salary),1);
  const teamHO=holdouts[key]||{}, teamPromos=promos[key]||{};
  const posTotals={QB:0,RB:0,WR:0,TE:0},posCounts={QB:0,RB:0,WR:0,TE:0};
  (t.starters||[]).forEach(p=>{if(posTotals[p.pos]!==undefined){posTotals[p.pos]+=p.salary;posCounts[p.pos]++;}});
  let rHTML='';
  POSITIONS.forEach(pos=>{
    const players=(t.starters||[]).filter(p=>p.pos===pos).sort((a,b)=>b.salary-a.salary);
    if(!players.length)return;
    const tot=players.reduce((s,p)=>s+p.salary,0);
    rHTML+=`<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--text3);padding:10px 0 4px;border-top:1px solid var(--border);margin-top:6px;">${pos} · ${fmtM(tot)}</div>`;
    rHTML+=players.map(p=>{const ho=teamHO[p.name];const bw=Math.round(p.salary/maxSal*100);return`<div style="display:flex;align-items:center;justify-content:space-between;padding:5px 0;"><div style="font-size:13px;">${p.name}${ho?'<span style="font-size:10px;color:var(--yellow);margin-left:5px;">🔥</span>':''}</div><div style="font-family:var(--font-mono);font-size:12px;">${fmtM(p.salary)}</div></div>`;}).join('');
  });
  const taxiArr=(t.taxi||[]).filter(p=>p.name);
  if(taxiArr.length){
    rHTML+=`<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--text3);padding:10px 0 4px;border-top:1px solid var(--border);margin-top:6px;">Taxi · no cap hit</div>`;
    rHTML+=taxiArr.sort((a,b)=>b.salary-a.salary).map(p=>{const promo=teamPromos[p.name];const pc=POS_COLORS[p.pos]||'';return`<div style="display:flex;align-items:center;justify-content:space-between;padding:5px 0;"><div style="font-size:13px;color:var(--text3);">${p.name}${p.pos&&p.pos!=='—'?`<span style="font-size:10px;background:${pc}22;color:${pc||'var(--text3)'};padding:1px 5px;border-radius:3px;margin-left:5px;">${p.pos}</span>`:''}${promo?'<span style="font-size:10px;color:var(--green);margin-left:5px;">⬆️</span>':''}</div><div style="font-family:var(--font-mono);font-size:12px;color:var(--text3);">${fmtM(p.salary)}</div></div>`;}).join('');
  }
  document.getElementById('team-panel-title').textContent=t.team_name;
  document.getElementById('team-panel-body').innerHTML=`
    <div style="display:flex;gap:16px;margin-bottom:18px;flex-wrap:wrap;">
      <div style="text-align:center;"><div style="font-family:var(--font-mono);font-size:18px;font-weight:600;color:${clr};">${fmtM(sp)}</div><div style="font-size:10px;color:var(--text3);text-transform:uppercase;margin-top:2px;">Spent (${pct}%)</div></div>
      <div style="text-align:center;"><div style="font-family:var(--font-mono);font-size:18px;font-weight:600;color:var(--green);">${fmtM(av)}</div><div style="font-size:10px;color:var(--text3);text-transform:uppercase;margin-top:2px;">Available</div></div>
      <div style="text-align:center;"><div style="font-family:var(--font-mono);font-size:18px;font-weight:600;">${(t.starters||[]).length}</div><div style="font-size:10px;color:var(--text3);text-transform:uppercase;margin-top:2px;">Active</div></div>
    </div>
    <div style="background:var(--surface3);border-radius:99px;height:5px;overflow:hidden;margin-bottom:4px;"><div style="height:100%;width:${pct}%;background:${clr};border-radius:99px;"></div></div>
    <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text3);margin-bottom:18px;">${fmtM(sp)} spent · cap ${fmtM(CAP)}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;">
      ${POSITIONS.map(pos=>`<div style="flex:1;min-width:60px;background:${(POS_COLORS[pos]||'#888')}22;color:${POS_COLORS[pos]||'var(--text3)'};border-radius:6px;padding:6px 8px;text-align:center;"><div style="font-size:10px;margin-bottom:2px;">${pos}</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:600;">${fmtM(posTotals[pos])}</div><div style="font-size:10px;opacity:.7;">${posCounts[pos]}p</div></div>`).join('')}
    </div>
    ${rHTML}
    ${comm?`<div style="margin-top:18px;padding-top:14px;border-top:1px solid var(--border);"><button onclick="closeTeamPanel();setTab('commish');" style="width:100%;padding:9px;background:var(--accent);color:#fff;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:13px;font-family:var(--font-body);">⚙️ Open Commish Tab</button></div>`:''}`;
  document.getElementById('team-panel').style.display='';
}
function closeTeamPanel() { document.getElementById('team-panel').style.display='none'; }

// ── COMMISSIONER TAB ─────────────────────────────────────────
function renderCommish() {
  if (!isComm()) { document.getElementById('tab-commish').innerHTML='<div style="padding:40px;text-align:center;color:var(--text3);">Commissioner only.</div>'; return; }
  const el = document.getElementById('tab-commish');
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
        <td style="padding:8px 6px;">${!promo?`<button onclick="commPromote('${key}',${ti})" style="font-size:11px;padding:3px 9px;border:1px solid rgba(24,224,122,.3);border-radius:4px;background:none;color:var(--green);cursor:pointer;font-family:var(--font-body);">⬆️ Promote</button>`:`<span style="font-size:11px;color:var(--green);">⬆️ Promoted</span> <button onclick="commUndoPromo('${key}','${p.name.replace(/'/g,"\\'")}'" style="font-size:11px;padding:3px 7px;border:1px solid var(--border);border-radius:4px;background:none;color:var(--text3);cursor:pointer;margin-left:4px;">↩</button>`}</td>
        <td style="padding:8px 14px;text-align:right;"><button onclick="openEdit('${key}','taxi',${ti})" style="font-size:12px;padding:3px 8px;border:1px solid var(--border);border-radius:4px;background:none;color:var(--text2);cursor:pointer;">✏️ Edit</button></td>
      </tr>`;
    });
  });
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
        <td style="padding:7px 6px;"><button onclick="toggleHoldout('${key}','${p.name.replace(/'/g,"\\'")}')" style="font-size:12px;padding:3px 8px;border:1px solid ${ho?'rgba(255,201,77,.4)':'var(--border)'};border-radius:4px;background:none;color:${ho?'var(--yellow)':'var(--text3)'};cursor:pointer;">${ho?'🔥 Remove':'🏳 Flag'}</button></td>
        <td style="padding:7px 14px;text-align:right;"><button onclick="openEdit('${key}','starters',${idx})" style="font-size:12px;padding:3px 8px;border:1px solid var(--border);border-radius:4px;background:none;color:var(--text2);cursor:pointer;">✏️ Edit</button></td>
      </tr>`;
    });
  });
  el.innerHTML=`<div style="padding:16px 0;">
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
  </div>`;
}
async function commSetTaxiPos(teamKey,idx,pos){
  if(!DATA[teamKey]?.taxi?.[idx])return;
  DATA[teamKey].taxi[idx].pos=pos||undefined;
  await saveToFirebase();
  showToast('Position updated to '+(pos||'—'),'success');
}
async function commPromote(teamKey,idx){
  const p=DATA[teamKey]?.taxi?.[idx]; if(!p)return;
  const note=prompt(`Promotion note for ${p.name} (optional):`); if(note===null)return;
  const safe=p.name.replace(/[.#$\/\[\]]/g,'_');
  if(!promos[teamKey])promos[teamKey]={};
  const data={note:note||'',promoted:true,promotedAt:Date.now()};
  promos[teamKey][p.name]=data;
  if(leagueId())await db.ref(`leagues/${leagueId()}/taxiPromos/${teamKey}/${safe}`).set(data);
  showToast(p.name+' promoted ⬆️','success');
  renderCommish();
}
async function commUndoPromo(teamKey,playerName){
  const safe=playerName.replace(/[.#$\/\[\]]/g,'_');
  if(promos[teamKey])delete promos[teamKey][playerName];
  if(leagueId())await db.ref(`leagues/${leagueId()}/taxiPromos/${teamKey}/${safe}`).remove();
  showToast('Promotion undone','info');
  renderCommish();
}

// ── COMPARE ──────────────────────────────────────────────────
function renderCompare() {
  const el = document.getElementById('tab-compare');
  const teams = Object.entries(DATA);
  const vals = {
    spent: teams.map(([,t])=>t.cap_spent),
    avail: teams.map(([,t])=>CAP-t.cap_spent),
    QB: teams.map(([,t])=>posTotal(t,'QB')),
    RB: teams.map(([,t])=>posTotal(t,'RB')),
    WR: teams.map(([,t])=>posTotal(t,'WR')),
    TE: teams.map(([,t])=>posTotal(t,'TE')),
  };
  function heat(val,arr,hex){const mn=Math.min(...arr),mx=Math.max(...arr),p=mx===mn?0:(val-mn)/(mx-mn);return `<div class="heat" style="background:${hex};opacity:${(p*.28+.04).toFixed(2)};"></div>`;}
  const sorted=[...teams].sort((a,b)=>b[1].cap_spent-a[1].cap_spent);
  const rows=sorted.map(([key,t])=>{
    const sp=t.cap_spent,av=CAP-sp,qb=posTotal(t,'QB'),rb=posTotal(t,'RB'),wr=posTotal(t,'WR'),te=posTotal(t,'TE');
    return `<tr>
      <td><div class="cmp-name"><a href="team.html?team=${key}" style="text-decoration:none;color:inherit;">${t.team_name}</a></div><div class="cmp-user">${key}</div></td>
      <td class="${sp===Math.max(...vals.spent)?'worst':sp===Math.min(...vals.spent)?'best':''}">${heat(sp,vals.spent,'#ff4d6a')}${fmtM(sp)}<div style="font-size:10px;color:var(--text3);">${pctOf(sp)}</div></td>
      <td style="color:var(--green);">${heat(av,vals.avail,'#18e07a')}${fmtM(av)}</td>
      <td class="qb-h">${heat(qb,vals.QB,'#b89ffe')}${fmtM(qb)}</td>
      <td class="rb-h">${heat(rb,vals.RB,'#18e07a')}${fmtM(rb)}</td>
      <td class="wr-h">${heat(wr,vals.WR,'#00d4ff')}${fmtM(wr)}</td>
      <td class="te-h">${heat(te,vals.TE,'#ffc94d')}${fmtM(te)}</td>
    </tr>`;
  }).join('');
  el.innerHTML=`<p style="font-size:12px;color:var(--text3);margin-bottom:14px;">Sorted by cap spent. Shading = relative spend per column.</p>
    <div class="cmp-wrap"><table class="cmp-table">
      <thead><tr><th style="text-align:left;">Team</th><th>Cap Spent</th><th style="color:var(--green);">Available</th>
      <th class="qb-h">QB</th><th class="rb-h">RB</th><th class="wr-h">WR</th><th class="te-h">TE</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}

// ── TOP PAID ─────────────────────────────────────────────────
function renderTopPaid() {
  const el = document.getElementById('tab-toppaid');
  function topByPos(pos,limit){
    const all=[];
    Object.entries(DATA).forEach(([key,t])=>{t.starters.filter(p=>p.pos===pos).forEach(p=>all.push({...p,team_name:t.team_name}));});
    return all.sort((a,b)=>b.salary-a.salary).slice(0,limit);
  }
  const sections=[{pos:'QB',limit:10,label:'Top 10 QBs'},{pos:'RB',limit:10,label:'Top 10 RBs'},{pos:'WR',limit:15,label:'Top 15 WRs'},{pos:'TE',limit:5,label:'Top 5 TEs'}];
  el.innerHTML=`<div class="top-paid-grid">${sections.map(({pos,limit,label})=>{
    const players=topByPos(pos,limit);
    const maxSal=players[0]?.salary||1;
    const color=POS_COLORS[pos];
    return `<div class="tp-section">
      <div class="tp-section-header"><div class="tp-section-title" style="color:${color};">${label}</div><div class="tp-section-sub">by salary</div></div>
      ${players.map((p,i)=>{
        const cls=i===0?'tp-rank-1':i===1?'tp-rank-2':i===2?'tp-rank-3':'';
        return `<div class="tp-row">
          <div class="tp-rank ${cls}">${i+1}</div>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <span class="tp-player-name">${p.name}</span>
              <span class="tp-salary" style="color:${color};">${fmtM(p.salary)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:3px;">
              <div style="flex:1;"><div class="tp-sal-bar-bg"><div class="tp-sal-bar-fill" style="width:${Math.round(p.salary/maxSal*100)}%;background:${color};"></div></div></div>
              <span class="tp-team-lbl">${p.team_name}</span>
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  }).join('')}</div>`;
}

// ── TAXI TRACKER ──────────────────────────────────────────────
function renderTaxi() {
  const el = document.getElementById('tab-taxi');
  const comm = isComm();
  const allTeams = Object.entries(DATA).filter(([,t])=>(t.taxi||[]).filter(p=>p.name).length>0);
  if(!allTeams.length){el.innerHTML='<div style="color:var(--text3);padding:40px;text-align:center;">No taxi players found.</div>';return;}
  el.innerHTML=`<p style="font-size:13px;color:var(--text3);margin-bottom:16px;">Taxi squad players don't count toward the cap.${comm?' Commissioner can mark players as promoted.':''}</p>
    <div class="taxi-grid">${allTeams.map(([key,t])=>{
      const players=(t.taxi||[]).filter(p=>p.name).sort((a,b)=>b.salary-a.salary);
      const promoCount=players.filter(p=>(promos[key]||{})[p.name]).length;
      return `<div class="taxi-card">
        <div class="taxi-card-hdr">
          <a href="team.html?team=${key}" style="text-decoration:none;color:inherit;">${t.team_name}</a>
          <span style="font-size:11px;color:var(--text3);">${promoCount}/${players.length} promoted</span>
        </div>
        ${players.map(p=>{
          const promo=(promos[key]||{})[p.name];
          return `<div class="taxi-row">
            <div class="taxi-info">
              <div class="taxi-pname">${p.name}${promo?'<span class="promoted-badge">⬆️ Promoted</span>':''}</div>
              <div class="taxi-psal">${fmtM(p.salary)}</div>
              ${promo?.note?`<div class="taxi-pnote">${promo.note}</div>`:''}
            </div>
            <div style="display:flex;gap:4px;">
              ${comm&&!promo?`<button class="promo-btn" onclick="openPromoModal('${key}','${p.name.replace(/'/g,"\\'")}')">⬆️ Promote</button>`:''}
              ${comm&&promo?`<button class="undo-btn" onclick="undoPromo('${key}','${p.name.replace(/'/g,"\\'")}')">↩ Undo</button>`:''}
            </div>
          </div>`;
        }).join('')}
      </div>`;
    }).join('')}</div>`;
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
  document.getElementById('edit-modal').style.display='flex';
}
function openAdd(teamKey,slot,defaultPos){
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
  document.getElementById('edit-modal').style.display='flex';
}
function closeModal(){document.getElementById('edit-modal').style.display='none';editCtx=null;}
async function savePlayer(){
  if(!editCtx) return;
  const name=document.getElementById('modal-name').value.trim();
  const salary=parseInt(document.getElementById('modal-salary').value);
  const slot=document.getElementById('modal-slot').value;
  const pos=document.getElementById('modal-pos').value;
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
  const player=slot==='starters'?{pos,name,salary}:{name,salary};
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

document.getElementById('edit-modal').addEventListener('click',e=>{
  });


subscribeRosters();
