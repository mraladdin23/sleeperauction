// leaguegroups.js — League ordering, personal labels, and commissioner groups

// ─────────────────────────────────────────────────────────────
// DRAG-TO-REORDER
// ─────────────────────────────────────────────────────────────
function getLeagueOrder() {
  try { return JSON.parse(localStorage.getItem('sb_league_order') || '[]'); } catch(e) { return []; }
}
function saveLeagueOrder(ids) {
  localStorage.setItem('sb_league_order', JSON.stringify(ids));
}
function applyLeagueOrder(leagues) {
  const order = getLeagueOrder();
  if (!order.length) return leagues;
  const ranked = {};
  order.forEach((id, i) => { ranked[id] = i; });
  return [...leagues].sort((a, b) => (ranked[a.id] ?? 9999) - (ranked[b.id] ?? 9999));
}
function onLeagueDragStart(e, id) {
  e.dataTransfer.setData('text/plain', id);
  e.dataTransfer.effectAllowed = 'move';
  e.currentTarget.style.opacity = '0.5';
}
function onLeagueDragEnd(e) { e.currentTarget.style.opacity = ''; }
function onLeagueDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  e.currentTarget.style.borderTop = '2px solid var(--accent)';
}
function onLeagueDragLeave(e) { e.currentTarget.style.borderTop = ''; }
function onLeagueDrop(e, targetId) {
  e.preventDefault();
  e.currentTarget.style.borderTop = '';
  const draggedId = e.dataTransfer.getData('text/plain');
  if (!draggedId || draggedId === targetId) return;
  const el = document.getElementById('picker-leagues');
  const cards = [...el.querySelectorAll('[data-league-id]')];
  const ids = cards.map(c => c.dataset.leagueId);
  const fromIdx = ids.indexOf(draggedId);
  const toIdx   = ids.indexOf(targetId);
  if (fromIdx < 0 || toIdx < 0) return;
  ids.splice(fromIdx, 1);
  ids.splice(toIdx, 0, draggedId);
  saveLeagueOrder(ids);
  const fromEl = cards[fromIdx], toEl = cards[toIdx];
  if (fromIdx < toIdx) el.insertBefore(fromEl, toEl.nextSibling);
  else                  el.insertBefore(fromEl, toEl);
}

// ─────────────────────────────────────────────────────────────
// PERSONAL LABELS  (localStorage, fully private, display-only)
// ─────────────────────────────────────────────────────────────
const LABEL_PRESETS = ['Dynasty','Redraft','Best Ball','Salary Cap','Tournament','Keeper','IDP','Superflex'];
const LABEL_COLORS  = ['#3b82f6','#22c55e','#e88c30','#a855f7','#ef4444','#06b6d4','#f59e0b','#ec4899'];

function getPersonalLabels() {
  try { return JSON.parse(localStorage.getItem('sb_league_labels') || '{}'); } catch(e) { return {}; }
}
function savePersonalLabels(labels) {
  localStorage.setItem('sb_league_labels', JSON.stringify(labels));
}
// Returns { leagueId: { name, color } } for badge display on cards
function getLeagueLabelMap() {
  const labels = getPersonalLabels();
  const map = {};
  Object.values(labels).forEach(l => {
    (l.leagueIds || []).forEach(id => { map[id] = { name: l.name, color: l.color }; });
  });
  return map;
}

// ─────────────────────────────────────────────────────────────
// COMMISSIONER GROUPS  (Firebase, shared, broadcast-capable)
// ─────────────────────────────────────────────────────────────
async function loadCommGroups() {
  try {
    const snap = await db.ref('leagues/_commGroups').once('value');
    return snap.val() || {};
  } catch(e) { return {}; }
}
async function saveCommGroup(groupId, data) {
  await db.ref(`leagues/_commGroups/${groupId}`).set(data);
}
async function deleteCommGroup(groupId) {
  await db.ref(`leagues/_commGroups/${groupId}`).remove();
}

// ─────────────────────────────────────────────────────────────
// MAIN MODAL — two tabs
// ─────────────────────────────────────────────────────────────
function showGroupManager(leagues) {
  let modal = document.getElementById('group-manager-modal');
  if (modal) modal.remove();
  modal = document.createElement('div');
  modal.id = 'group-manager-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding:24px 16px;overflow-y:auto;';
  modal.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);width:100%;max-width:560px;">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border);">
        <div style="font-size:16px;font-weight:700;">🗂 League Groups</div>
        <button onclick="document.getElementById('group-manager-modal').remove()" style="background:none;border:none;color:var(--text3);font-size:22px;cursor:pointer;">✕</button>
      </div>
      <div style="display:flex;border-bottom:1px solid var(--border);">
        <button id="gmtab-labels" onclick="switchGMTab('labels')"
          style="flex:1;padding:10px;font-size:13px;font-family:var(--font-body);background:var(--accent);color:#fff;border:none;cursor:pointer;">
          🏷 My Labels
        </button>
        <button id="gmtab-comm" onclick="switchGMTab('comm')"
          style="flex:1;padding:10px;font-size:13px;font-family:var(--font-body);background:var(--surface2);color:var(--text2);border:none;border-left:1px solid var(--border);cursor:pointer;">
          📣 Commissioner Groups
        </button>
      </div>
      <div id="gm-tab-labels" style="padding:16px;"></div>
      <div id="gm-tab-comm"   style="padding:16px;display:none;"></div>
    </div>`;
  document.body.appendChild(modal);
  renderLabelsTab(leagues);
  renderCommTab(leagues);
}

function switchGMTab(tab) {
  ['labels','comm'].forEach(t => {
    document.getElementById(`gm-tab-${t}`).style.display   = t===tab ? '' : 'none';
    const btn = document.getElementById(`gmtab-${t}`);
    btn.style.background = t===tab ? 'var(--accent)' : 'var(--surface2)';
    btn.style.color       = t===tab ? '#fff' : 'var(--text2)';
  });
}

// ── Personal Labels tab ──────────────────────────────────────
function renderLabelsTab(leagues) {
  const el = document.getElementById('gm-tab-labels');
  if (!el) return;
  const labels = getPersonalLabels();
  const entries = Object.entries(labels);

  el.innerHTML = `
    <div style="font-size:12px;color:var(--text3);margin-bottom:12px;">
      Labels are private to you — they appear as colored chips on your league cards and help you organise your view.
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;">
      ${LABEL_PRESETS.map((p,i) => `
        <button onclick="addPresetLabel('${p}',${i},${JSON.stringify(leagues).replace(/"/g,'&quot;')})"
          style="padding:4px 10px;font-size:11px;font-family:var(--font-body);
          background:${LABEL_COLORS[i%LABEL_COLORS.length]}22;
          color:${LABEL_COLORS[i%LABEL_COLORS.length]};
          border:1px solid ${LABEL_COLORS[i%LABEL_COLORS.length]}55;
          border-radius:99px;cursor:pointer;">+ ${p}</button>`).join('')}
    </div>
    ${entries.length ? `
    <div style="display:flex;flex-direction:column;gap:8px;">
      ${entries.map(([lid, l]) => `
        <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:10px 12px;border-left:3px solid ${l.color};">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span style="font-size:13px;font-weight:600;color:${l.color};">${l.name}</span>
            <button onclick="editLabelLeagues('${lid}',${JSON.stringify(leagues).replace(/"/g,'&quot;')})"
              style="font-size:11px;padding:2px 8px;background:none;border:1px solid var(--border);border-radius:4px;color:var(--text3);cursor:pointer;">Edit</button>
            <button onclick="deletePersonalLabel('${lid}',${JSON.stringify(leagues).replace(/"/g,'&quot;')})"
              style="margin-left:auto;background:none;border:none;color:var(--text3);cursor:pointer;font-size:12px;">🗑</button>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:4px;">
            ${(l.leagueIds||[]).map(id => {
              const lg = leagues.find(x=>x.id===id);
              return lg ? `<span style="font-size:11px;padding:2px 8px;background:${l.color}18;color:${l.color};border:1px solid ${l.color}44;border-radius:99px;">${lg.name}</span>` : '';
            }).join('')}
          </div>
        </div>`).join('')}
    </div>` : `<div style="color:var(--text3);font-size:13px;padding:8px 0;">No labels yet. Pick a preset above or create a custom one.</div>`}
    <div style="margin-top:14px;">
      <button onclick="createCustomLabel(${JSON.stringify(leagues).replace(/"/g,'&quot;')})"
        style="padding:6px 14px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text2);font-family:var(--font-body);font-size:12px;cursor:pointer;">
        + Custom Label
      </button>
    </div>`;
}

function addPresetLabel(name, colorIdx, leagues) {
  const color = LABEL_COLORS[colorIdx % LABEL_COLORS.length];
  openLeagueSelector(name, color, null, leagues, (selectedIds) => {
    if (!selectedIds.length) return;
    const labels = getPersonalLabels();
    const lid = 'lbl_' + Date.now();
    labels[lid] = { name, color, leagueIds: selectedIds };
    savePersonalLabels(labels);
    renderLabelsTab(leagues);
  });
}

function createCustomLabel(leagues) {
  const name = prompt('Label name:');
  if (!name?.trim()) return;
  const color = LABEL_COLORS[Math.floor(Math.random() * LABEL_COLORS.length)];
  openLeagueSelector(name.trim(), color, null, leagues, (selectedIds) => {
    if (!selectedIds.length) return;
    const labels = getPersonalLabels();
    labels['lbl_' + Date.now()] = { name: name.trim(), color, leagueIds: selectedIds };
    savePersonalLabels(labels);
    renderLabelsTab(leagues);
  });
}

function editLabelLeagues(labelId, leagues) {
  const labels = getPersonalLabels();
  const label  = labels[labelId];
  if (!label) return;
  openLeagueSelector(label.name, label.color, label.leagueIds, leagues, (selectedIds) => {
    labels[labelId].leagueIds = selectedIds;
    savePersonalLabels(labels);
    renderLabelsTab(leagues);
  });
}

function deletePersonalLabel(labelId, leagues) {
  const labels = getPersonalLabels();
  delete labels[labelId];
  savePersonalLabels(labels);
  renderLabelsTab(leagues);
}

// ── Commissioner Groups tab ──────────────────────────────────
async function renderCommTab(leagues) {
  const el = document.getElementById('gm-tab-comm');
  if (!el) return;
  const username   = (localStorage.getItem('sb_username') || '').toLowerCase();
  const allGroups  = await loadCommGroups();
  const myGroups   = Object.entries(allGroups).filter(([,g]) => g.commUsername?.toLowerCase() === username);
  const otherGroups= Object.entries(allGroups).filter(([,g]) => g.commUsername?.toLowerCase() !== username);

  el.innerHTML = `
    <div style="font-size:12px;color:var(--text3);margin-bottom:12px;">
      Commissioner groups are shared with all league members and support broadcast messaging.
      Only commissioners of those leagues can create or manage groups.
    </div>
    ${myGroups.length || true ? `
    <button id="create-comm-group-btn" onclick="createCommGroup(${JSON.stringify(leagues).replace(/"/g,'&quot;')})"
      style="padding:6px 14px;background:var(--accent);color:#fff;border:none;border-radius:var(--radius-sm);font-family:var(--font-body);font-size:12px;font-weight:600;cursor:pointer;margin-bottom:14px;">
      + New Commissioner Group
    </button>` : ''}

    ${myGroups.length ? `
    <div style="font-size:12px;font-weight:600;color:var(--text2);margin-bottom:8px;">My Groups</div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
      ${myGroups.map(([gid, g]) => `
        <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:12px 14px;border-left:3px solid ${g.color||'var(--accent)'};">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span style="font-size:13px;font-weight:600;">${g.name}</span>
            <button onclick="deleteCommGroup('${gid}').then(()=>renderCommTab(${JSON.stringify(leagues).replace(/"/g,'&quot;')}))"
              style="margin-left:auto;background:none;border:none;color:var(--text3);cursor:pointer;font-size:12px;">🗑</button>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px;">
            ${(g.leagueIds||[]).map(id => {
              const lg = leagues.find(x=>x.id===id);
              return lg ? `<span style="font-size:11px;padding:2px 8px;background:${g.color||'var(--accent)'}18;color:${g.color||'var(--accent)'};border:1px solid ${g.color||'var(--accent)'}44;border-radius:99px;">${lg.name}</span>` : '';
            }).join('')}
          </div>
          <button onclick="showGroupBroadcast('${gid}','${g.name.replace(/'/g,"\\'")}',${JSON.stringify(g.leagueIds||[]).replace(/"/g,'&quot;')})"
            style="padding:5px 14px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text2);cursor:pointer;font-family:var(--font-body);font-size:12px;">
            📣 Broadcast Message
          </button>
        </div>`).join('')}
    </div>` : ''}

    ${otherGroups.length ? `
    <div style="font-size:12px;font-weight:600;color:var(--text2);margin-bottom:8px;">Groups You're In</div>
    <div style="display:flex;flex-direction:column;gap:8px;">
      ${otherGroups.map(([gid, g]) => `
        <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:10px 12px;border-left:3px solid ${g.color||'var(--accent)'};">
          <div style="font-size:13px;font-weight:600;margin-bottom:4px;">${g.name}</div>
          <div style="font-size:11px;color:var(--text3);">Created by ${g.commUsername}</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;">
            ${(g.leagueIds||[]).map(id => {
              const lg = leagues.find(x=>x.id===id);
              return lg ? `<span style="font-size:11px;padding:2px 8px;background:var(--surface);border:1px solid var(--border);border-radius:99px;color:var(--text2);">${lg.name}</span>` : '';
            }).join('')}
          </div>
        </div>`).join('')}
    </div>` : (!myGroups.length ? `<div style="color:var(--text3);font-size:13px;padding:8px 0;">No commissioner groups yet.</div>` : '')}`;
}

async function createCommGroup(leagues) {
  const username = (localStorage.getItem('sb_username') || '').toLowerCase();
  const userJson = localStorage.getItem('sb_user');
  const userId   = userJson ? JSON.parse(userJson)?.user_id : null;

  if (!userId) {
    alert('Could not verify your identity. Please log out and back in.');
    return;
  }

  // Show loading state
  const btn = document.getElementById('create-comm-group-btn');
  if (btn) { btn.textContent = 'Checking…'; btn.disabled = true; }

  // Verify via Sleeper API only — addedBy is NOT sufficient since non-commissioners can add leagues
  let commLeagues = [];
  const candidates = leagues.filter(l => !l.unregistered && !l.isRenewal);

  await Promise.all(candidates.map(async l => {
    try {
      const cacheKey = `sb_iscomm_${l.id}`;
      const cached = sessionStorage.getItem(cacheKey);
      let isComm;
      if (cached !== null) {
        isComm = cached === '1';
      } else {
        const info = await fetch(`https://api.sleeper.app/v1/league/${l.id}`).then(r=>r.json());
        isComm = String(info.commissioner_id) === String(userId) ||
                 (info.commissioner_ids || []).map(String).includes(String(userId));
        sessionStorage.setItem(cacheKey, isComm ? '1' : '0');
      }
      if (isComm) commLeagues.push(l);
    } catch(e) {} // skip leagues we can't verify
  }));

  if (btn) { btn.textContent = '+ New Commissioner Group'; btn.disabled = false; }

  if (!commLeagues.length) {
    alert('You are not the commissioner of any registered leagues.\n\nCommissioner groups require Sleeper commissioner status — being a league member or having added the league is not enough.');
    return;
  }

  const name = prompt(`Create a commissioner group\n(You are commissioner of ${commLeagues.length} league${commLeagues.length > 1 ? 's' : ''})\n\nGroup name:`);
  if (!name?.trim()) return;
  const color = LABEL_COLORS[Math.floor(Math.random() * LABEL_COLORS.length)];

  openLeagueSelector(name.trim(), color, null, commLeagues, async (selectedIds) => {
    if (!selectedIds.length) return;
    const gid = 'cg_' + Date.now();
    await saveCommGroup(gid, {
      name:         name.trim(),
      color,
      leagueIds:    selectedIds,
      commUsername: username,
      createdAt:    Date.now(),
    });
    renderCommTab(leagues);
  });
}

// ── Shared league selector dialog ───────────────────────────
function openLeagueSelector(title, color, existingIds, leagues, callback) {
  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;';
  div.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);width:420px;max-width:100%;padding:20px;">
      <div style="font-size:14px;font-weight:600;margin-bottom:4px;color:${color};">📋 ${title}</div>
      <div style="font-size:12px;color:var(--text3);margin-bottom:12px;">Select leagues to include:</div>
      <div style="max-height:260px;overflow-y:auto;margin-bottom:16px;">
        ${leagues.filter(l=>!l.unregistered && !l.isRenewal).map(l => `
          <label style="display:flex;align-items:center;gap:10px;padding:7px 4px;cursor:pointer;border-bottom:1px solid var(--border);">
            <input type="checkbox" value="${l.id}" ${(existingIds||[]).includes(l.id)?'checked':''} style="cursor:pointer;flex-shrink:0;" />
            <span style="font-size:13px;">${l.name}</span>
            <span style="font-size:11px;color:var(--text3);margin-left:auto;">${l.season||''}</span>
          </label>`).join('')}
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button onclick="this.closest('div[style*=inset]').remove()"
          style="padding:7px 14px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text2);cursor:pointer;font-family:var(--font-body);">Cancel</button>
        <button id="lsel-save"
          style="padding:7px 16px;background:var(--accent);color:#fff;border:none;border-radius:var(--radius-sm);cursor:pointer;font-family:var(--font-body);font-weight:600;">Save</button>
      </div>
    </div>`;
  document.body.appendChild(div);
  div.querySelector('#lsel-save').onclick = () => {
    const checked = [...div.querySelectorAll('input:checked')].map(cb => cb.value);
    div.remove();
    callback(checked);
  };
}

// ── Broadcast ────────────────────────────────────────────────
async function showGroupBroadcast(groupId, groupName, leagueIds) {
  const msg = prompt(`Broadcast to all chats in "${groupName}":\n\nThis posts as your username in each league.`);
  if (!msg?.trim()) return;
  const username = localStorage.getItem('sb_username') || 'Commissioner';
  let sent = 0;
  await Promise.all(leagueIds.map(async lid => {
    try {
      await db.ref(`leagues/${lid}/chat`).push({ user: username, text: msg.trim(), ts: Date.now(), type: 'text' });
      sent++;
    } catch(e) {}
  }));
  alert(`✅ Message sent to ${sent} of ${leagueIds.length} leagues.`);
}

// Expose everything
window.applyLeagueOrder     = applyLeagueOrder;
window.getLeagueLabelMap    = getLeagueLabelMap;
window.onLeagueDragStart    = onLeagueDragStart;
window.onLeagueDragEnd      = onLeagueDragEnd;
window.onLeagueDragOver     = onLeagueDragOver;
window.onLeagueDragLeave    = onLeagueDragLeave;
window.onLeagueDrop         = onLeagueDrop;
window.showGroupManager     = showGroupManager;
window.showGroupBroadcast   = showGroupBroadcast;
window.deleteCommGroup      = deleteCommGroup;
window.deletePersonalLabel  = deletePersonalLabel;
window.addPresetLabel       = addPresetLabel;
window.createCustomLabel    = createCustomLabel;
window.editLabelLeagues     = editLabelLeagues;
window.renderLabelsTab      = renderLabelsTab;
window.renderCommTab        = renderCommTab;
window.createCommGroup      = createCommGroup;
window.switchGMTab          = switchGMTab;
