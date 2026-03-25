// rules.js — League Rulebook / By-Laws

let rulesLoaded = false;

function initRulesView() {
  const container = document.getElementById('view-rules');
  if (!container) return;
  const lid = localStorage.getItem('sb_leagueId');
  if (!lid) { container.innerHTML = '<div style="padding:32px;color:var(--text3);">No league selected.</div>'; return; }

  container.innerHTML = `
    <div style="max-width:800px;margin:0 auto;padding:16px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px;">
        <div style="font-size:20px;font-weight:700;">📋 League Rules</div>
        <div id="rules-comm-controls" style="display:none;gap:8px;display:flex;">
          <button onclick="openRulesEditor()" style="padding:6px 14px;font-size:12px;background:var(--accent);color:#fff;border:none;border-radius:var(--radius-sm);cursor:pointer;font-family:var(--font-body);font-weight:600;">✏️ Edit Rules</button>
          <label style="padding:6px 14px;font-size:12px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;font-family:var(--font-body);color:var(--text2);">
            📄 Upload File
            <input type="file" accept=".txt,.md" style="display:none;" onchange="uploadRulesFile(this)" />
          </label>
          <button onclick="importFromGoogleDocs()" style="padding:6px 14px;font-size:12px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;font-family:var(--font-body);color:var(--text2);">🔗 Google Doc</button>
        </div>
      </div>
      <div id="rules-content" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:24px;min-height:300px;">
        <div style="text-align:center;color:var(--text3);padding:40px 0;">Loading rules…</div>
      </div>
    </div>

    <!-- Editor modal -->
    <div id="rules-editor-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;align-items:center;justify-content:center;padding:16px;">
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);width:700px;max-width:100%;max-height:90vh;overflow:hidden;display:flex;flex-direction:column;">
        <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
          <div style="font-size:16px;font-weight:600;">Edit League Rules</div>
          <button onclick="closeRulesEditor()" style="background:none;border:none;color:var(--text3);font-size:20px;cursor:pointer;">✕</button>
        </div>
        <div style="padding:12px 16px;border-bottom:1px solid var(--border);font-size:12px;color:var(--text3);">
          Supports Markdown: **bold**, *italic*, ## headings, - lists, > quotes
        </div>
        <textarea id="rules-editor-input" style="flex:1;padding:16px;background:var(--surface);border:none;color:var(--text);font-family:var(--font-body);font-size:13px;outline:none;resize:none;min-height:400px;line-height:1.6;" placeholder="# League Rules&#10;&#10;## Draft&#10;- Snake draft, 15 rounds&#10;&#10;## Scoring&#10;- PPR format..."></textarea>
        <div style="padding:12px 16px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:8px;">
          <button onclick="closeRulesEditor()" style="padding:8px 16px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text2);cursor:pointer;font-family:var(--font-body);">Cancel</button>
          <button onclick="saveRules()" style="padding:8px 20px;background:var(--accent);color:#fff;border:none;border-radius:var(--radius-sm);cursor:pointer;font-family:var(--font-body);font-weight:600;">💾 Save</button>
        </div>
      </div>
    </div>`;

  loadRules(lid);
}

async function loadRules(lid) {
  const el = document.getElementById('rules-content');
  if (!el) return;
  try {
    const snap = await db.ref(`leagues/${lid}/rules`).once('value');
    const text = snap.val();
    if (text) {
      el.innerHTML = renderMarkdown(text);
    } else {
      el.innerHTML = `
        <div style="text-align:center;padding:40px 0;color:var(--text3);">
          <div style="font-size:32px;margin-bottom:12px;">📋</div>
          <div style="font-size:15px;font-weight:600;margin-bottom:6px;">No rules posted yet</div>
          <div style="font-size:13px;">The commissioner can add league rules and by-laws here.</div>
        </div>`;
    }
  } catch(e) {
    el.innerHTML = '<div style="color:var(--red);padding:20px;">Could not load rules.</div>';
  }

  // Show edit controls for commissioners
  const commUsername = localStorage.getItem('sb_commUsername') || '';
  const myUsername   = localStorage.getItem('sb_username') || '';
  const isComm = myUsername.toLowerCase() === commUsername.toLowerCase() ||
                 window.App?.state?.isCommissioner;
  const commCtrl = document.getElementById('rules-comm-controls');
  if (commCtrl && isComm) commCtrl.style.display = 'flex';
}

function openRulesEditor() {
  const modal = document.getElementById('rules-editor-modal');
  if (!modal) return;
  // Load current content into editor
  const el = document.getElementById('rules-content');
  const lid = localStorage.getItem('sb_leagueId');
  db.ref(`leagues/${lid}/rules`).once('value').then(snap => {
    const input = document.getElementById('rules-editor-input');
    if (input) input.value = snap.val() || '';
    modal.style.display = 'flex';
  });
}

function closeRulesEditor() {
  const modal = document.getElementById('rules-editor-modal');
  if (modal) modal.style.display = 'none';
}

async function saveRules() {
  const lid   = localStorage.getItem('sb_leagueId');
  const input = document.getElementById('rules-editor-input');
  const text  = input?.value || '';
  try {
    await db.ref(`leagues/${lid}/rules`).set(text);
    closeRulesEditor();
    loadRules(lid);
  } catch(e) { alert('Could not save rules: ' + e.message); }
}

async function uploadRulesFile(input) {
  const file = input.files[0];
  if (!file) return;
  const text = await file.text();
  const editorInput = document.getElementById('rules-editor-input');
  if (editorInput) {
    editorInput.value = text;
    openRulesEditor();
  }
  input.value = '';
}

async function importFromGoogleDocs() {
  const url = prompt(
    'Paste your Google Doc link:\n\n' +
    'Make sure the doc is set to "Anyone with the link can view"\n' +
    'then paste the share URL here:'
  );
  if (!url) return;

  // Extract document ID from various Google Docs URL formats
  const match = url.match(/\/d\/([a-zA-Z0-9_-]{25,})/);
  if (!match) {
    alert('Could not find a Google Doc ID in that URL. Make sure you paste the full Google Docs link.');
    return;
  }
  const docId = match[1];

  // Show loading
  const el = document.getElementById('rules-content');
  if (el) el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3);">Importing from Google Docs…</div>';

  try {
    // Fetch as plain text via export endpoint
    const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
    const r = await fetch(exportUrl);
    if (!r.ok) throw new Error(`Could not fetch doc (status ${r.status}). Make sure sharing is set to "Anyone with the link".`);
    const text = await r.text();

    // Show in editor for review before saving
    const editorInput = document.getElementById('rules-editor-input');
    if (editorInput) {
      editorInput.value = text.trim();
      openRulesEditor();
    }
  } catch(e) {
    if (el) loadRules(localStorage.getItem('sb_leagueId'));
    alert('Import failed: ' + e.message + '\n\nMake sure:\n1. The doc is shared as "Anyone with the link can view"\n2. The URL is a Google Docs link');
  }
}

// Simple markdown renderer
function renderMarkdown(text) {
  return text
    .split('\n')
    .map(line => {
      // Headings
      if (line.startsWith('### ')) return `<h3 style="font-size:15px;font-weight:700;margin:16px 0 6px;color:var(--text);">${esc(line.slice(4))}</h3>`;
      if (line.startsWith('## '))  return `<h2 style="font-size:18px;font-weight:700;margin:24px 0 8px;color:var(--text);border-bottom:1px solid var(--border);padding-bottom:6px;">${esc(line.slice(3))}</h2>`;
      if (line.startsWith('# '))   return `<h1 style="font-size:22px;font-weight:700;margin:0 0 16px;color:var(--text);">${esc(line.slice(2))}</h1>`;
      // Blockquote
      if (line.startsWith('> '))   return `<blockquote style="border-left:3px solid var(--accent);margin:8px 0;padding:6px 12px;background:var(--surface2);color:var(--text2);border-radius:0 6px 6px 0;">${esc(line.slice(2))}</blockquote>`;
      // List items
      if (line.startsWith('- ') || line.startsWith('* ')) return `<li style="margin:4px 0 4px 20px;color:var(--text);">${inlineFormat(esc(line.slice(2)))}</li>`;
      if (/^\d+\. /.test(line))    return `<li style="margin:4px 0 4px 20px;color:var(--text);">${inlineFormat(esc(line.replace(/^\d+\. /,'')))}</li>`;
      // Horizontal rule
      if (line.match(/^---+$/))    return '<hr style="border:none;border-top:1px solid var(--border);margin:16px 0;">';
      // Empty line
      if (!line.trim())             return '<div style="height:8px;"></div>';
      // Normal paragraph
      return `<p style="margin:0 0 6px;color:var(--text);line-height:1.7;">${inlineFormat(esc(line))}</p>`;
    })
    .join('');
}

function inlineFormat(s) {
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:var(--surface2);padding:1px 5px;border-radius:3px;font-family:var(--font-mono);font-size:12px;">$1</code>');
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Expose for lazy loader
window._rulesInit = initRulesView;
