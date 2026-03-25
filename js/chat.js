// chat.js — League Chat with smack talk, GIFs, and matchup trash talk

let chatUnsubscribe = null;
let chatLeagueId    = null;

function initChatView() {
  const container = document.getElementById('view-chat');
  if (!container) return;

  const lid = localStorage.getItem('sb_leagueId');
  if (!lid) { container.innerHTML = '<div style="padding:32px;color:var(--text3);">No league selected.</div>'; return; }

  if (chatLeagueId === lid && container.querySelector('.chat-wrap')) return; // already init'd
  chatLeagueId = lid;

  container.innerHTML = `
    <div class="chat-wrap" style="display:flex;flex-direction:column;height:calc(100vh - 120px);max-width:800px;margin:0 auto;padding:16px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
        <div style="font-size:20px;font-weight:700;">💬 League Chat</div>
        <div style="display:flex;gap:6px;">
          <div style="position:relative;display:inline-block;">
            <button onclick="toggleSmackMenu()" id="smack-btn" style="padding:6px 12px;font-size:12px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text2);cursor:pointer;font-family:var(--font-body);">🔥 Smack Talk ▾</button>
            <div id="smack-menu" style="display:none;position:absolute;top:calc(100%+4px);left:0;width:280px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);box-shadow:0 8px 24px rgba(0,0,0,.4);z-index:1000;max-height:300px;overflow-y:auto;">
              ${SMACK_LINES.map((l,i)=>`<div onclick="selectSmack(${i})" style="padding:8px 12px;font-size:12px;cursor:pointer;border-bottom:1px solid var(--border);color:var(--text);" onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background=''">${l}</div>`).join('')}
            </div>
          </div>
          <button onclick="openGifSearch()" style="padding:6px 12px;font-size:12px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text2);cursor:pointer;font-family:var(--font-body);">🎬 GIF</button>
        </div>
      </div>

      <!-- GIF search panel -->
      <div id="gif-panel" style="display:none;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:12px;margin-bottom:8px;">
        <div style="display:flex;gap:8px;margin-bottom:8px;">
          <input id="gif-search-input" type="text" placeholder="Search GIFs (e.g. touchdown, trash talk)…"
            style="flex:1;padding:7px 10px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font-body);font-size:13px;outline:none;"
            oninput="searchGifs(this.value)" />
          <button onclick="document.getElementById('gif-panel').style.display='none'" style="padding:6px 10px;background:none;border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text3);cursor:pointer;">✕</button>
        </div>
        <div id="gif-results" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-height:200px;overflow-y:auto;"></div>
      </div>

      <!-- Messages -->
      <div id="chat-messages" style="flex:1;overflow-y:auto;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px;margin-bottom:12px;display:flex;flex-direction:column;gap:8px;">
        <div style="text-align:center;color:var(--text3);font-size:12px;padding:20px;">Loading messages…</div>
      </div>

      <!-- Input -->
      <div style="display:flex;gap:8px;align-items:flex-end;">
        <textarea id="chat-input" placeholder="Send a message… (Enter to send, Shift+Enter for new line)"
          style="flex:1;padding:10px 12px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);color:var(--text);font-family:var(--font-body);font-size:13px;outline:none;resize:none;min-height:44px;max-height:120px;overflow-y:auto;line-height:1.4;"
          rows="1"
          onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendChatMessage();}"
          oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px'"></textarea>
        <button onclick="sendChatMessage()" style="padding:10px 18px;background:var(--accent);color:#fff;border:none;border-radius:var(--radius);cursor:pointer;font-family:var(--font-body);font-size:13px;font-weight:600;flex-shrink:0;">Send</button>
      </div>
    </div>`;

  subscribeChat(lid);
}

function subscribeChat(lid) {
  if (chatUnsubscribe) { chatUnsubscribe(); chatUnsubscribe = null; }
  const ref = db.ref(`leagues/${lid}/chat`).orderByChild('ts').limitToLast(100);
  ref.on('value', snap => {
    const msgs = [];
    snap.forEach(child => msgs.push({ id: child.key, ...child.val() }));
    renderChatMessages(msgs);
  });
  chatUnsubscribe = () => ref.off();
}

function renderChatMessages(msgs) {
  const el = document.getElementById('chat-messages');
  if (!el) return;
  const me = localStorage.getItem('sb_username') || '';
  const isBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;

  if (!msgs.length) {
    el.innerHTML = '<div style="text-align:center;color:var(--text3);font-size:13px;padding:32px;">No messages yet. Say something! 👋</div>';
    return;
  }

  el.innerHTML = msgs.map(m => {
    const isMine  = m.user?.toLowerCase() === me.toLowerCase();
    const isGif   = m.type === 'gif';
    const ts      = m.ts ? new Date(m.ts).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}) : '';
    const align   = isMine ? 'flex-end' : 'flex-start';
    const bg      = isMine ? 'var(--accent)' : 'var(--surface2)';
    const color   = isMine ? '#fff' : 'var(--text)';
    const content = isGif
      ? `<img src="${m.text}" style="max-width:220px;border-radius:8px;display:block;" loading="lazy" />`
      : `<div style="font-size:13px;line-height:1.5;word-break:break-word;">${escapeHtml(m.text)}</div>`;
    return `
      <div style="display:flex;flex-direction:column;align-items:${align};gap:2px;">
        ${!isMine ? `<div style="font-size:11px;color:var(--text3);margin-left:4px;">${escapeHtml(m.user||'')}</div>` : ''}
        <div style="max-width:75%;background:${isGif?'transparent':bg};color:${color};padding:${isGif?'0':'8px 12px'};border-radius:${isMine?'16px 16px 4px 16px':'16px 16px 16px 4px'};">
          ${content}
        </div>
        <div style="font-size:10px;color:var(--text3);margin:0 4px;">${ts}</div>
      </div>`;
  }).join('');

  if (isBottom) el.scrollTop = el.scrollHeight;
}

async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const text  = (input?.value || '').trim();
  if (!text || !chatLeagueId) return;
  const user  = localStorage.getItem('sb_username') || 'Anonymous';
  input.value = '';
  input.style.height = '44px';
  try {
    await db.ref(`leagues/${chatLeagueId}/chat`).push({ user, text, ts: Date.now(), type: 'text' });
  } catch(e) { console.warn('Chat send failed:', e); }
}

// Smack talk generator
const SMACK_LINES = [
  "Your team is so bad, even the bye weeks are an improvement.",
  "I've seen better rosters on a participation trophy.",
  "Your draft strategy was bold. Boldly wrong.",
  "I'm not saying you're the worst manager in the league, but the standings are.",
  "Your team has more injuries than a demolition derby.",
  "I've seen more upside in a flat line.",
  "Bold move starting that guy. Bold. Wrong. But bold.",
  "Your waiver wire pickups belong in the trash wire.",
  "Even your kicker is on the injury report.",
  "You're one bad week away from a last-place trophy.",
  "I'd say good luck this week but I don't want to lie.",
  "Your team looks like it was drafted on a dartboard. Blindfolded.",
];

function toggleSmackMenu() {
  const menu = document.getElementById('smack-menu');
  if (!menu) return;
  if (menu.style.display === 'none') {
    menu.innerHTML = SMACK_LINES.map((l,i)=>
      `<div onclick="selectSmack(${i})" style="padding:8px 12px;font-size:12px;cursor:pointer;border-bottom:1px solid var(--border);color:var(--text);" onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background=''">${l}</div>`
    ).join('');
    menu.style.display = '';
    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', function closeSmack(e) {
        if (!document.getElementById('smack-btn')?.contains(e.target)) {
          menu.style.display = 'none';
          document.removeEventListener('click', closeSmack);
        }
      });
    }, 0);
  } else {
    menu.style.display = 'none';
  }
}

function selectSmack(idx) {
  const line  = SMACK_LINES[idx];
  const input = document.getElementById('chat-input');
  if (input) { input.value = line; input.focus(); input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 120) + 'px'; }
  const menu = document.getElementById('smack-menu');
  if (menu) menu.style.display = 'none';
}

function insertSmackTalk() {
  const line  = SMACK_LINES[Math.floor(Math.random() * SMACK_LINES.length)];
  const input = document.getElementById('chat-input');
  if (input) { input.value = line; input.focus(); }
}

// GIF search via Tenor
let _gifTimer = null;
function openGifSearch() {
  const panel = document.getElementById('gif-panel');
  if (!panel) return;
  panel.style.display = panel.style.display === 'none' ? '' : 'none';
  if (panel.style.display === '') {
    document.getElementById('gif-search-input')?.focus();
    searchGifs('fantasy football trash talk');
  }
}

function searchGifs(query) {
  clearTimeout(_gifTimer);
  if (!query.trim()) return;
  _gifTimer = setTimeout(async () => {
    const el = document.getElementById('gif-results');
    if (!el) return;
    el.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text3);font-size:12px;padding:12px;">Searching…</div>';
    try {
      // Use Giphy public beta key
      const r = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(query)}&limit=12&rating=pg-13`);
      const data = await r.json();
      const results = data.data || [];
      if (!results.length) { el.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text3);font-size:12px;padding:12px;">No GIFs found</div>'; return; }
      el.innerHTML = results.map(g => {
        const preview = g.images?.fixed_height_small?.url || g.images?.downsized_small?.url || '';
        const full    = g.images?.downsized?.url || preview;
        if (!preview) return '';
        const safeFull = full.split('?')[0];
        return `<img src="${preview}" style="width:100%;height:80px;object-fit:cover;border-radius:6px;cursor:pointer;border:2px solid transparent;"
          onclick="sendGif(this.dataset.full)"
          data-full="${safeFull}"
          onmouseover="this.style.borderColor='var(--accent)'"
          onmouseout="this.style.borderColor='transparent'" loading="lazy" />`;
      }).join('');
    } catch(e) {
      el.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text3);font-size:12px;padding:12px;">Could not load GIFs</div>';
    }
  }, 400);
}

async function sendGif(url) {
  if (!url || !chatLeagueId) return;
  const user = localStorage.getItem('sb_username') || 'Anonymous';
  document.getElementById('gif-panel').style.display = 'none';
  try {
    await db.ref(`leagues/${chatLeagueId}/chat`).push({ user, text: url, ts: Date.now(), type: 'gif' });
  } catch(e) { console.warn('GIF send failed:', e); }
}

function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── CHAT SIDEBAR (persistent across all views) ─────────────────
let _sidebarOpen = false;
let _sidebarCollapsed = false;
let _sidebarSubbed = false;

function initChatSidebar(lid) {
  const sidebar = document.getElementById('chat-sidebar');
  if (!sidebar || _sidebarSubbed) return;
  sidebar.style.display = 'flex';
  document.body.classList.add('chat-open');
  _sidebarSubbed = true;

  // Subscribe to messages
  const ref = db.ref(`leagues/${lid}/chat`).orderByChild('ts').limitToLast(50);
  ref.on('value', snap => {
    const msgs = [];
    snap.forEach(child => msgs.push({ id: child.key, ...child.val() }));
    renderSidebarMessages(msgs);
  });

  // Mobile: show as collapsed initially
  if (window.innerWidth < 900) {
    sidebar.classList.add('collapsed');
    _sidebarCollapsed = true;
  }
}

function renderSidebarMessages(msgs) {
  const el = document.getElementById('chat-sidebar-messages');
  if (!el) return;
  const me = localStorage.getItem('sb_username') || '';
  const isBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;

  el.innerHTML = msgs.map(m => {
    const isMine = m.user?.toLowerCase() === me.toLowerCase();
    const cls    = isMine ? 'sidebar-msg sidebar-msg-mine' : 'sidebar-msg sidebar-msg-other';
    const bubble = m.type === 'gif'
      ? `<img src="${m.text}" style="max-width:140px;border-radius:8px;" loading="lazy" />`
      : `<div class="sidebar-msg-bubble">${m.text?.replace(/</g,'&lt;').replace(/>/g,'&gt;')||''}</div>`;
    return `<div class="${cls}">
      ${!isMine ? `<div class="sidebar-msg-user">${m.user||''}</div>` : ''}
      ${bubble}
    </div>`;
  }).join('');

  if (isBottom) el.scrollTop = el.scrollHeight;

  // Unread badge
  if (_sidebarCollapsed && msgs.length) {
    const badge = document.getElementById('chat-unread-badge');
    if (badge) { badge.style.display = ''; badge.textContent = '●'; }
  }
}

function toggleChatSidebar() {
  const sidebar = document.getElementById('chat-sidebar');
  if (!sidebar) return;
  _sidebarCollapsed = !_sidebarCollapsed;
  sidebar.classList.toggle('collapsed', _sidebarCollapsed);
  document.getElementById('chat-sidebar-toggle-icon').textContent = _sidebarCollapsed ? '▲' : '▼';
  if (!_sidebarCollapsed) {
    const badge = document.getElementById('chat-unread-badge');
    if (badge) badge.style.display = 'none';
    setTimeout(() => {
      const el = document.getElementById('chat-sidebar-messages');
      if (el) el.scrollTop = el.scrollHeight;
    }, 100);
  }
}

function toggleChatDrawer() {
  const sidebar = document.getElementById('chat-sidebar');
  if (!sidebar) return;
  if (window.innerWidth < 900) {
    if (sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
      sidebar.classList.add('collapsed');
      _sidebarCollapsed = true;
    } else {
      sidebar.classList.add('open');
      sidebar.classList.remove('collapsed');
      _sidebarCollapsed = false;
      const badge = document.getElementById('chat-unread-badge');
      if (badge) badge.style.display = 'none';
      setTimeout(() => {
        const el = document.getElementById('chat-sidebar-messages');
        if (el) el.scrollTop = el.scrollHeight;
      }, 100);
    }
  }
}

async function sendSidebarMessage() {
  const input = document.getElementById('chat-sidebar-input');
  const text  = (input?.value || '').trim();
  if (!text) return;
  const lid  = localStorage.getItem('sb_leagueId');
  const user = localStorage.getItem('sb_username') || 'Anonymous';
  input.value = '';
  try {
    await db.ref(`leagues/${lid}/chat`).push({ user, text, ts: Date.now(), type: 'text' });
  } catch(e) { console.warn('Sidebar send failed:', e); }
}

// Expose for lazy loader
window._chatInit = initChatView;
window.initChatSidebar = initChatSidebar;
