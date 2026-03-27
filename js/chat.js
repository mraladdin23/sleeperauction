// chat.js — League Chat
console.log("[chat.js] loaded v5");
// chat.js — League Chat with smack talk, GIFs, and matchup trash talk

let chatUnsubscribe = null;
let chatLeagueId    = null;

function initChatView() {
  const badge = document.getElementById('chat-unread-badge');
  if (badge) badge.style.display = 'none';
  const container = document.getElementById('view-chat');
  if (!container) { console.warn('[chat] view-chat container not found'); return; }

  const lid = localStorage.getItem('sb_leagueId');
  if (!lid) { container.innerHTML = '<div style="padding:32px;color:var(--text3);">No league selected.</div>'; return; }

  // Always rebuild HTML to pick up any template changes
  // subscribeChat handles unsubscribing old listener before creating new one
  chatLeagueId = lid;

  try {
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
      <div id="chat-messages" style="flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:8px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px;margin-bottom:12px;">
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
        <button onclick="openPollCreator()" title="Create Poll" style="padding:7px 10px;font-size:14px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;">📊</button>
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

  } catch(e) { console.error("[chat] innerHTML error:", e); return; }
  subscribeChat(lid);
}

function subscribeChat(lid) {
  if (chatUnsubscribe) { chatUnsubscribe(); chatUnsubscribe = null; }
  const msgs = [];
  const ref = db.ref(`leagues/${lid}/chat`).limitToLast(100);

  const onAdded = ref.on('child_added', snap => {
    msgs.push({ id: snap.key, ...snap.val() });
    renderChatMessages(msgs);
  });

  const onRemoved = ref.on('child_removed', snap => {
    const idx = msgs.findIndex(m => m.id === snap.key);
    if (idx !== -1) msgs.splice(idx, 1);
    renderChatMessages(msgs);
  });

  chatUnsubscribe = () => { ref.off('child_added', onAdded); ref.off('child_removed', onRemoved); };
}

function renderChatMessages(msgs) {
  const el = document.getElementById('chat-messages');
  if (!el) return;
  const me = localStorage.getItem('sb_username') || '';
  const wasAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;

  el.innerHTML = '';

  if (!msgs.length) {
    el.innerHTML = '<div style="text-align:center;color:var(--text3);font-size:13px;padding:32px;">No messages yet. Say something! 👋</div>';
    return;
  }

  msgs.forEach(m => {
    const isMine = (m.user || '').toLowerCase() === me.toLowerCase();
    const ts = m.ts ? new Date(m.ts).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}) : '';

    const row = document.createElement('div');
    row.style.cssText =
      'display:flex;flex-direction:column;' +
      'align-items:' + (isMine ? 'flex-end' : 'flex-start') + ';' +
      'margin-bottom:10px;';

    // Sender name — always shown
    const name = document.createElement('div');
    name.style.cssText = 'font-size:11px;font-weight:600;color:var(--text3);margin-bottom:2px;' +
      (isMine ? 'text-align:right;' : '');
    name.textContent = m.user || '';
    row.appendChild(name);

    // Poll message type
    if (m.type === 'poll') {
      const card = renderPollBubble(m, me, isMine);
      row.appendChild(card);
    } else {
      // Regular bubble
      const bubble = document.createElement('div');
      bubble.style.cssText =
        'position:relative;max-width:280px;' +
        (m.type === 'gif' ? '' :
          'padding:8px 12px;' +
          'border-radius:' + (isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px') + ';' +
          'background:' + (isMine ? 'var(--accent)' : 'var(--surface2)') + ';' +
          'color:' + (isMine ? '#fff' : 'var(--text)') + ';' +
          'font-size:13px;line-height:1.5;word-break:break-word;');

      if (m.type === 'gif') {
        const img = document.createElement('img');
        img.src = m.text || '';
        img.style.cssText = 'max-width:200px;border-radius:8px;display:block;';
        img.loading = 'lazy';
        bubble.appendChild(img);
      } else {
        bubble.textContent = m.text || '';
      }

      if (isMine) {
        const del = document.createElement('button');
        del.style.cssText = 'position:absolute;top:-6px;right:-6px;background:var(--surface2);border:1px solid var(--border);border-radius:99px;color:var(--text3);font-size:9px;cursor:pointer;padding:1px 5px;opacity:0;transition:opacity .15s;';
        del.textContent = '✕';
        del.onclick = () => deleteChatMsg(m.id);
        bubble.addEventListener('mouseenter', () => del.style.opacity = '1');
        bubble.addEventListener('mouseleave', () => del.style.opacity = '0');
        bubble.appendChild(del);
      }

      row.appendChild(bubble);
    }

    // Timestamp
    const time = document.createElement('div');
    time.style.cssText = 'font-size:10px;color:var(--text3);margin-top:2px;';
    time.textContent = ts;
    row.appendChild(time);

    el.appendChild(row);
  });

  if (wasAtBottom) el.scrollTop = el.scrollHeight;

  const badge = document.getElementById('chat-unread-badge');
  if (badge && (window.currentView || '') !== 'chat' && msgs.length) {
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

function toggleEmojiPicker() {
  const ep = document.getElementById('emoji-picker');
  if (!ep) return;
  const isHidden = ep.style.display === 'none' || !ep.style.display;
  ep.style.display = isHidden ? '' : 'none';
  if (isHidden) {
    setTimeout(() => {
      document.addEventListener('click', function _close(e) {
        if (!ep.contains(e.target) && !e.target.closest('[onclick*="toggleEmojiPicker"]')) {
          ep.style.display = 'none';
        }
        document.removeEventListener('click', _close);
      });
    }, 50);
  }
}

function insertEmoji(emoji) {
  const input = document.getElementById('chat-input');
  if (!input) return;
  const s = input.selectionStart || 0;
  const e = input.selectionEnd || 0;
  input.value = input.value.slice(0, s) + emoji + input.value.slice(e);
  input.selectionStart = input.selectionEnd = s + emoji.length;
  input.focus();
  const ep = document.getElementById('emoji-picker');
  if (ep) ep.style.display = 'none';
}


// ── Poll feature ─────────────────────────────────────────────────

function renderPollBubble(m, me, isMine) {
  const votes  = m.votes || {};
  const opts   = m.options || [];
  const total  = Object.keys(votes).length;
  const myVote = votes[me] !== undefined ? votes[me] : -1;

  const card = document.createElement('div');
  card.style.cssText = 'background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:12px 14px;min-width:220px;max-width:300px;position:relative;';

  // Header
  const header = document.createElement('div');
  header.style.cssText = 'font-size:11px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;';
  header.textContent = '📊 Poll';
  card.appendChild(header);

  // Question
  const q = document.createElement('div');
  q.style.cssText = 'font-size:14px;font-weight:600;color:var(--text);margin-bottom:10px;';
  q.textContent = m.question || '';
  card.appendChild(q);

  // Options
  opts.forEach((opt, idx) => {
    const voters = Object.entries(votes).filter(([,v]) => v === idx);
    const pct = total > 0 ? Math.round(voters.length / total * 100) : 0;
    const voted = myVote === idx;

    const optRow = document.createElement('div');
    optRow.style.cssText = 'margin-bottom:6px;';

    // Bar + label button
    const btn = document.createElement('button');
    btn.style.cssText =
      'width:100%;text-align:left;padding:7px 10px;border-radius:8px;cursor:pointer;' +
      'font-family:var(--font-body);font-size:13px;position:relative;overflow:hidden;' +
      'border:1px solid ' + (voted ? 'var(--accent)' : 'var(--border)') + ';' +
      'background:' + (voted ? 'var(--accent)11' : 'var(--surface)') + ';' +
      'color:var(--text);';

    // Progress bar fill
    const fill = document.createElement('div');
    fill.style.cssText =
      'position:absolute;top:0;left:0;height:100%;' +
      'background:' + (voted ? 'var(--accent)33' : 'var(--surface2)') + ';' +
      'width:' + pct + '%;transition:width .3s;border-radius:8px;';
    btn.appendChild(fill);

    const label = document.createElement('span');
    label.style.cssText = 'position:relative;z-index:1;display:flex;justify-content:space-between;align-items:center;gap:8px;';
    label.innerHTML = '<span>' + opt + '</span><span style="font-size:11px;color:var(--text3);">' + pct + '% (' + voters.length + ')</span>';
    btn.appendChild(label);

    btn.onclick = () => castPollVote(m.id, idx, me);
    optRow.appendChild(btn);
    card.appendChild(optRow);
  });

  // Footer: total votes
  const footer = document.createElement('div');
  footer.style.cssText = 'font-size:11px;color:var(--text3);margin-top:6px;';
  footer.textContent = total + ' vote' + (total !== 1 ? 's' : '');
  card.appendChild(footer);

  // Delete (creator only)
  if (isMine) {
    const del = document.createElement('button');
    del.style.cssText = 'position:absolute;top:-6px;right:-6px;background:var(--surface2);border:1px solid var(--border);border-radius:99px;color:var(--text3);font-size:9px;cursor:pointer;padding:1px 5px;opacity:0;transition:opacity .15s;';
    del.textContent = '✕';
    del.onclick = () => deleteChatMsg(m.id);
    card.addEventListener('mouseenter', () => del.style.opacity = '1');
    card.addEventListener('mouseleave', () => del.style.opacity = '0');
    card.appendChild(del);
  }

  return card;
}

function castPollVote(msgId, optionIdx, username) {
  const lid = localStorage.getItem('sb_leagueId');
  if (!lid || !msgId) return;
  db.ref(`leagues/${lid}/chat/${msgId}/votes/${username}`).set(optionIdx)
    .catch(e => console.warn('Vote failed:', e));
}

function openPollCreator() {
  // Remove any existing poll creator
  document.getElementById('poll-creator')?.remove();

  const panel = document.createElement('div');
  panel.id = 'poll-creator';
  panel.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:2000;display:flex;align-items:center;justify-content:center;padding:16px;';

  panel.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:20px;width:100%;max-width:380px;box-shadow:0 16px 48px rgba(0,0,0,.5);">
      <div style="font-size:16px;font-weight:700;margin-bottom:14px;">📊 Create a Poll</div>
      <input id="poll-question" type="text" placeholder="Ask a question…"
        style="width:100%;box-sizing:border-box;padding:9px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font-body);font-size:13px;outline:none;margin-bottom:10px;"/>
      <div id="poll-options-list">
        <input class="poll-opt" type="text" placeholder="Option 1" style="width:100%;box-sizing:border-box;padding:8px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font-body);font-size:13px;outline:none;margin-bottom:6px;"/>
        <input class="poll-opt" type="text" placeholder="Option 2" style="width:100%;box-sizing:border-box;padding:8px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font-body);font-size:13px;outline:none;margin-bottom:6px;"/>
      </div>
      <button onclick="addPollOption()" style="font-size:12px;padding:5px 12px;background:none;border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text2);cursor:pointer;font-family:var(--font-body);margin-bottom:14px;">+ Add Option</button>
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button onclick="document.getElementById('poll-creator').remove()" style="padding:8px 16px;background:none;border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text2);cursor:pointer;font-family:var(--font-body);">Cancel</button>
        <button onclick="submitPoll()" style="padding:8px 16px;background:var(--accent);border:none;border-radius:var(--radius-sm);color:#fff;cursor:pointer;font-family:var(--font-body);font-weight:600;">Post Poll</button>
      </div>
    </div>`;

  document.body.appendChild(panel);
  document.getElementById('poll-question').focus();

  // Close on backdrop click
  panel.addEventListener('click', e => { if (e.target === panel) panel.remove(); });
}

function addPollOption() {
  const list = document.getElementById('poll-options-list');
  if (!list) return;
  const count = list.querySelectorAll('.poll-opt').length;
  if (count >= 4) return;
  const inp = document.createElement('input');
  inp.className = 'poll-opt';
  inp.type = 'text';
  inp.placeholder = 'Option ' + (count + 1);
  inp.style.cssText = 'width:100%;box-sizing:border-box;padding:8px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-family:var(--font-body);font-size:13px;outline:none;margin-bottom:6px;';
  list.appendChild(inp);
  inp.focus();
}

async function submitPoll() {
  const question = (document.getElementById('poll-question')?.value || '').trim();
  const optEls = document.querySelectorAll('.poll-opt');
  const options = Array.from(optEls).map(el => el.value.trim()).filter(Boolean);

  if (!question) { alert('Please enter a question.'); return; }
  if (options.length < 2) { alert('Please add at least 2 options.'); return; }

  const lid = localStorage.getItem('sb_leagueId');
  const user = localStorage.getItem('sb_username') || 'Anonymous';
  if (!lid) return;

  document.getElementById('poll-creator')?.remove();

  await db.ref(`leagues/${lid}/chat`).push({
    type: 'poll',
    user,
    question,
    options,
    votes: {},
    ts: Date.now(),
  });
}

window._chatInit          = initChatView;
window.openPollCreator   = openPollCreator;
window.addPollOption     = addPollOption;
window.submitPoll        = submitPoll;
window.castPollVote      = castPollVote;
window.toggleEmojiPicker = toggleEmojiPicker;
window.insertEmoji        = insertEmoji;
window.initChatSidebar = initChatSidebar;
