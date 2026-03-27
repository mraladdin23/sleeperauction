// chat.js — League Chat with smack talk, GIFs, and matchup trash talk

let chatUnsubscribe = null;
let chatLeagueId    = null;

function initChatView() {
  const badge = document.getElementById('chat-unread-badge');
  if (badge) badge.style.display = 'none';
  const container = document.getElementById('view-chat');
  if (!container) return;

  const lid = localStorage.getItem('sb_leagueId');
  if (!lid) { container.innerHTML = '<div style="padding:32px;color:var(--text3);">No league selected.</div>'; return; }

  if (chatLeagueId === lid && container.querySelector('.chat-wrap')) return; // already init'd
  chatLeagueId = lid;

  container.innerHTML = `
    <div class="chat-wrap" style="display:flex;flex-direction:column;height:calc(100vh - 100px);max-width:800px;margin:0 auto;padding:16px;">

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
      <div id="chat-messages" style="flex:1;min-height:0;overflow-y:auto;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px;margin-bottom:12px;">
        <div style="text-align:center;color:var(--text3);font-size:12px;padding:20px;">Loading messages…</div>
      </div>

      <!-- Toolbar + Input -->
      <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;border-top:1px solid var(--border);padding-top:8px;">
        <div style="position:relative;">
          <button onclick="toggleSmackMenu()" id="smack-btn" title="Smack Talk" style="padding:7px 10px;font-size:14px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;">🔥</button>
          <div id="smack-menu" style="display:none;position:absolute;bottom:calc(100%+4px);left:0;width:280px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);box-shadow:0 8px 24px rgba(0,0,0,.4);z-index:1000;max-height:240px;overflow-y:auto;">
            ${SMACK_LINES.map((l,i)=>`<div onclick="selectSmack(${i})" style="padding:8px 12px;font-size:12px;cursor:pointer;border-bottom:1px solid var(--border);color:var(--text);" onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background=''">$$\{l\}</div>`).join('')}
          </div>
        </div>
        <button onclick="openGifSearch()" title="Send GIF" style="padding:7px 10px;font-size:14px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;">🎬</button>
                <div style="position:relative;">
          <button onclick="toggleEmojiPicker()" title="Emoji" style="padding:7px 10px;font-size:14px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;">😊</button>
          <div id="emoji-picker" style="display:none;position:absolute;bottom:calc(100%+4px);left:0;width:260px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);box-shadow:0 8px 24px rgba(0,0,0,.4);z-index:1000;padding:8px;">
            <div style="display:flex;flex-wrap:wrap;gap:2px;">
              ${['🏈','🏆','🔥','💪','😂','😤','💀','🎉','👀','😮','🤣','😭','💯','🤡','👑','⚡','🎯','🗑️','💰','🤑','😈','🙌','👏','🫡','😎','🥶','🤠','🧠','😅','🫠'].map(e=>`<span onclick="insertEmoji('${e}')" style="font-size:20px;cursor:pointer;padding:3px;border-radius:4px;display:inline-block;" onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background=''">${e}</span>`).join('')}
            </div>
          </div>
        </div>
      </div>
      <div style="display:flex;gap:8px;align-items:flex-end;">
        <textarea id="chat-input" placeholder="Message…"
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
  const isBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;

  // Use DOM to avoid innerHTML stacking issues
  while (el.firstChild) el.removeChild(el.firstChild);

  if (!msgs.length) {
    const empty = document.createElement('div');
    empty.style.cssText = 'text-align:center;color:var(--text3);font-size:13px;padding:32px;';
    empty.textContent = 'No messages yet. Say something! 👋';
    el.appendChild(empty);
    return;
  }

  const frag = document.createDocumentFragment();
  for (const m of msgs) {
    const isMine = (m.user || '').toLowerCase() === me.toLowerCase();
    const ts = m.ts ? new Date(m.ts).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}) : '';

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;flex-direction:column;align-items:' + (isMine?'flex-end':'flex-start') + ';gap:2px;margin-bottom:8px;';

    if (!isMine) {
      const user = document.createElement('div');
      user.style.cssText = 'font-size:11px;color:var(--text3);margin-left:4px;';
      user.textContent = m.user || '';
      row.appendChild(user);
    }

    const bubble = document.createElement('div');
    bubble.style.cssText = 'max-width:75%;padding:' + (m.type==='gif'?'0':'8px 12px') + ';' +
      'border-radius:' + (isMine?'16px 16px 4px 16px':'16px 16px 16px 4px') + ';' +
      'background:' + (m.type==='gif'?'transparent':isMine?'var(--accent)':'var(--surface2)') + ';' +
      'color:' + (isMine?'#fff':'var(--text)') + ';position:relative;';

    if (m.type === 'gif') {
      const img = document.createElement('img');
      img.src = m.text || '';
      img.style.cssText = 'max-width:220px;border-radius:8px;display:block;';
      img.loading = 'lazy';
      bubble.appendChild(img);
      // Delete button for own GIFs
      if (isMine) {
        const del = document.createElement('button');
        del.style.cssText = 'position:absolute;top:-6px;right:-6px;background:var(--surface2);border:1px solid var(--border);border-radius:99px;color:var(--text3);font-size:9px;cursor:pointer;padding:1px 4px;opacity:0;transition:opacity .15s;';
        del.textContent = '✕';
        del.onclick = () => deleteChatMsg(m.id);
        bubble.appendChild(del);
        bubble.addEventListener('mouseenter', () => del.style.opacity='1');
        bubble.addEventListener('mouseleave', () => del.style.opacity='0');
      }
    } else {
      const txt = document.createElement('div');
      txt.style.cssText = 'font-size:13px;line-height:1.5;word-break:break-word;';
      txt.textContent = m.text || '';
      bubble.appendChild(txt);
      if (isMine) {
        const del = document.createElement('button');
        del.style.cssText = 'position:absolute;top:-6px;right:-6px;background:var(--surface2);border:1px solid var(--border);border-radius:99px;color:var(--text3);font-size:9px;cursor:pointer;padding:1px 4px;opacity:0;transition:opacity .15s;';
        del.textContent = '✕';
        del.onclick = () => deleteChatMsg(m.id);
        bubble.appendChild(del);
        bubble.addEventListener('mouseenter', () => del.style.opacity='1');
        bubble.addEventListener('mouseleave', () => del.style.opacity='0');
      }
    }

    row.appendChild(bubble);

    const time = document.createElement('div');
    time.style.cssText = 'font-size:10px;color:var(--text3);margin:0 4px;';
    time.textContent = ts;
    row.appendChild(time);

    frag.appendChild(row);
  }
  el.appendChild(frag);
  if (isBottom) el.scrollTop = el.scrollHeight;

  // Update unread badge on chat tab
  const badge = document.getElementById('chat-unread-badge');
  const currentView = window.currentView || '';
  if (badge && currentView !== 'chat' && msgs.length) {
    badge.style.display = '';
    badge.textContent = '●';
  }
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

// GIF search via Giphy
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
    el.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text3);font-size:11px;padding:8px;">Searching…</div>';
    try {
      const resp = await fetch('https://g.tenor.com/v1/search?key=LIVDSRZULELA&contentfilter=low&media_filter=minimal&limit=12&q=' + encodeURIComponent(query));
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const data = await resp.json();
      const results = data.results || [];
      if (!results.length) {
        el.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text3);font-size:11px;padding:8px;">No GIFs found</div>';
        return;
      }
      el.innerHTML = results.map(g => {
        const fmt     = (g.media || [])[0] || {};
        const preview = (fmt.tinygif || fmt.nanogif || fmt.gif || {}).url || '';
        const full    = (fmt.gif || fmt.mediumgif || fmt.tinygif || {}).url || preview;
        if (!preview) return '';
        const safeUrl = encodeURIComponent(full);
        return `<img src="${preview}" data-gifurl="${safeUrl}"
          style="width:100%;height:80px;object-fit:cover;border-radius:4px;cursor:pointer;border:2px solid transparent;"
          onmouseover="this.style.borderColor='var(--accent)'"
          onmouseout="this.style.borderColor='transparent'"
          onclick="sendGif(decodeURIComponent(this.dataset.gifurl))" />`;
      }).join('');
    } catch(e) {
      console.warn('searchGifs error:', e);
      el.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text3);font-size:11px;padding:8px;">Could not load GIFs</div>';
    }
  }, 500);
}

async function sendGif(url) {
  const lid = chatLeagueId || localStorage.getItem('sb_leagueId');
  if (!url || !lid) return;
  const user = localStorage.getItem('sb_username') || 'Anonymous';
  const panel = document.getElementById('gif-panel');
  if (panel) panel.style.display = 'none';
  try {
    await db.ref(`leagues/${lid}/chat`).push({ user, text: url, ts: Date.now(), type: 'gif' });
  } catch(e) { console.warn('GIF send failed:', e); }
}

function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── CHAT SIDEBAR (persistent across all views) ─────────────────
let _sidebarOpen = false;
let _sidebarCollapsed = false;
let _sidebarSubbed = false;

function initChatSidebar(lid) {} // sidebar removed

function renderSidebarMessages(msgs) {} // sidebar removed

function toggleChatSidebar() {} // sidebar removed

function toggleChatDrawer() {} // sidebar removed

async function deleteChatMsg(msgId) {
  const lid = localStorage.getItem('sb_leagueId');
  if (!lid || !msgId) return;
  try {
    await db.ref(`leagues/${lid}/chat/${msgId}`).remove();
  } catch(e) { console.warn('Delete failed:', e); }
}

async function sendSidebarMessage() {} // sidebar removed

// ── SIDEBAR SMACK TALK ─────────────────────────────────────────
function toggleSidebarSmack() {} // sidebar removed

function selectSidebarSmack(idx) {} // sidebar removed

// ── SIDEBAR GIF SEARCH ─────────────────────────────────────────
function toggleSidebarGif() {} // sidebar removed

let _sidebarGifTimer = null;
function searchSidebarGifs(query) {} // sidebar removed

async function sendSidebarGif(url) {} // sidebar removed

// Expose for lazy loader
window._chatInit = initChatView;
window.initChatSidebar = initChatSidebar;
