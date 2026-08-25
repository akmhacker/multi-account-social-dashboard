const STORAGE_KEY = 'multi_account_dashboard_v1';
const EXT_ID_KEY = 'extension_id';

// Default placeholder – replace after loading unpacked extension
let EXTENSION_ID = localStorage.getItem(EXT_ID_KEY) || '';

const platforms = {
  whatsapp: { name: 'WhatsApp', url: 'https://web.whatsapp.com', color: '#25D366' },
  facebook: { name: 'Facebook', url: 'https://www.facebook.com', color: '#1877F2' },
  instagram: { name: 'Instagram', url: 'https://www.instagram.com', color: '#E4405F' },
  twitter: { name: 'X / Twitter', url: 'https://x.com', color: '#1DA1F2' },
  discord: { name: 'Discord', url: 'https://discord.com/app', color: '#5865F2' },
  telegram: { name: 'Telegram', url: 'https://web.telegram.org', color: '#0088cc' },
  google: { name: 'Google Messages', url: 'https://messages.google.com', color: '#34A853' }
};

let accounts = [];

function loadAccounts() {
  try {
    accounts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    accounts = [];
  }
}

function saveAccounts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  render();
}

function uid() {
  return 'acc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function sendToExtension(message) {
  return new Promise((resolve) => {
    if (!EXTENSION_ID || !chrome?.runtime?.sendMessage) {
      resolve({ status: 'ERROR', error: 'Extension not available' });
      return;
    }
    chrome.runtime.sendMessage(EXTENSION_ID, message, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ status: 'ERROR', error: chrome.runtime.lastError.message });
      } else {
        resolve(response || { status: 'SUCCESS' });
      }
    });
  });
}

async function checkExtension() {
  const statusEl = document.getElementById('extension-status');
  const installPrompt = document.getElementById('install-prompt');
  const dashboard = document.getElementById('dashboard');

  if (!EXTENSION_ID) {
    statusEl.textContent = 'Extension ID not set';
    statusEl.className = 'status missing';
    installPrompt.classList.remove('hidden');
    dashboard.classList.add('hidden');
    return false;
  }

  const res = await sendToExtension({ action: 'PING' });
  if (res.status === 'SUCCESS') {
    statusEl.textContent = 'Extension connected';
    statusEl.className = 'status connected';
    installPrompt.classList.add('hidden');
    dashboard.classList.remove('hidden');
    return true;
  } else {
    statusEl.textContent = 'Extension not found or ID incorrect';
    statusEl.className = 'status missing';
    installPrompt.classList.remove('hidden');
    dashboard.classList.add('hidden');
    return false;
  }
}

function render() {
  const grid = document.getElementById('accounts-grid');
  const empty = document.getElementById('empty-state');
  grid.innerHTML = '';

  if (accounts.length === 0) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  accounts.forEach((acc, index) => {
    const p = platforms[acc.platform] || { name: acc.platform, color: '#888' };
    const card = document.createElement('div');
    card.className = 'account-card';
    card.draggable = true;
    card.dataset.id = acc.id;
    card.innerHTML = `
      <div class="platform-badge" style="color:${p.color}">${p.name}</div>
      <div class="account-name">${escapeHtml(acc.name)}</div>
      <div class="card-actions">
        <button class="switch-btn primary" data-id="${acc.id}">Switch</button>
        <button class="remove-btn danger" data-id="${acc.id}">Remove</button>
      </div>
    `;
    grid.appendChild(card);
  });

  // Drag-reorder
  let dragSrc = null;
  grid.querySelectorAll('.account-card').forEach(card => {
    card.addEventListener('dragstart', e => {
      dragSrc = card;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
    card.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });
    card.addEventListener('drop', e => {
      e.preventDefault();
      if (dragSrc && dragSrc !== card) {
        const fromId = dragSrc.dataset.id;
        const toId = card.dataset.id;
        const fromIdx = accounts.findIndex(a => a.id === fromId);
        const toIdx = accounts.findIndex(a => a.id === toId);
        if (fromIdx > -1 && toIdx > -1) {
          const [moved] = accounts.splice(fromIdx, 1);
          accounts.splice(toIdx, 0, moved);
          saveAccounts();
        }
      }
    });
  });
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

document.getElementById('save-ext-id').addEventListener('click', () => {
  const id = document.getElementById('ext-id-input').value.trim();
  if (id.length === 32) {
    localStorage.setItem(EXT_ID_KEY, id);
    EXTENSION_ID = id;
    checkExtension();
  } else {
    alert('Extension ID should be 32 characters.');
  }
});

document.getElementById('btn-add').addEventListener('click', () => {
  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('account-name').value = '';
  document.getElementById('account-name').focus();
});

document.getElementById('modal-cancel').addEventListener('click', () => {
  document.getElementById('modal').classList.add('hidden');
});

document.getElementById('modal-save').addEventListener('click', async () => {
  const platform = document.getElementById('platform').value;
  const name = document.getElementById('account-name').value.trim() || platforms[platform].name;
  const id = uid();

  accounts.push({ id, platform, name, created: Date.now() });
  saveAccounts();

  document.getElementById('modal').classList.add('hidden');

  const res = await sendToExtension({
    action: 'ADD_ACCOUNT',
    platform,
    accountId: id,
    accountName: name
  });
  if (res.status !== 'SUCCESS') {
    console.warn('Extension ADD response:', res);
  }
});

document.getElementById('accounts-grid').addEventListener('click', async (e) => {
  const switchBtn = e.target.closest('.switch-btn');
  const removeBtn = e.target.closest('.remove-btn');

  if (switchBtn) {
    const id = switchBtn.dataset.id;
    const acc = accounts.find(a => a.id === id);
    if (!acc) return;
    const res = await sendToExtension({
      action: 'SWITCH_ACCOUNT',
      platform: acc.platform,
      accountId: acc.id,
      accountName: acc.name
    });
    if (res.status !== 'SUCCESS') {
      alert('Could not switch: ' + (res.error || 'Unknown error'));
    }
  }

  if (removeBtn) {
    const id = removeBtn.dataset.id;
    if (!confirm('Remove this account from the dashboard? (Does not log out the session)')) return;
    accounts = accounts.filter(a => a.id !== id);
    saveAccounts();
    sendToExtension({ action: 'REMOVE_ACCOUNT', accountId: id });
  }
});

document.getElementById('btn-export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ accounts, exported: new Date().toISOString() }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'multi-account-export.json';
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('btn-clear').addEventListener('click', () => {
  if (!confirm('Delete ALL local account data from this browser? This cannot be undone.')) return;
  accounts = [];
  localStorage.removeItem(STORAGE_KEY);
  render();
  sendToExtension({ action: 'CLEAR_ALL' });
});

document.getElementById('privacy-link').addEventListener('click', (e) => {
  e.preventDefault();
  alert('See privacy-policy.md in the project docs. Zero data leaves your browser.');
});

// Init
loadAccounts();
render();
checkExtension();
