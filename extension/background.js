const PLATFORM_URLS = {
  whatsapp: 'https://web.whatsapp.com',
  facebook: 'https://www.facebook.com',
  instagram: 'https://www.instagram.com',
  twitter: 'https://x.com',
  discord: 'https://discord.com/app',
  telegram: 'https://web.telegram.org/a/',
  google: 'https://messages.google.com'
};

// accountId → { tabId, windowId, platform, name, cookies? }
let accountMap = {};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['accountMap'], (data) => {
    accountMap = data.accountMap || {};
  });
});

chrome.storage.local.get(['accountMap'], (data) => {
  accountMap = data.accountMap || {};
});

function persist() {
  chrome.storage.local.set({ accountMap });
}

chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  handleMessage(request).then(sendResponse);
  return true; // async
});

async function handleMessage(request) {
  const { action, platform, accountId, accountName } = request;

  try {
    switch (action) {
      case 'PING':
        return { status: 'SUCCESS', version: '1.0.0' };

      case 'ADD_ACCOUNT':
        return await addAccount(platform, accountId, accountName);

      case 'SWITCH_ACCOUNT':
        return await switchAccount(platform, accountId, accountName);

      case 'REMOVE_ACCOUNT':
        delete accountMap[accountId];
        persist();
        return { status: 'SUCCESS' };

      case 'CLEAR_ALL':
        accountMap = {};
        persist();
        return { status: 'SUCCESS' };

      default:
        return { status: 'ERROR', error: 'Unknown action' };
    }
  } catch (err) {
    console.error(err);
    return { status: 'ERROR', error: err.message };
  }
}

async function addAccount(platform, accountId, accountName) {
  const url = PLATFORM_URLS[platform];
  if (!url) return { status: 'ERROR', error: 'Unknown platform' };

  // Open a fresh tab for login
  const tab = await chrome.tabs.create({ url, active: true });

  accountMap[accountId] = {
    tabId: tab.id,
    windowId: tab.windowId,
    platform,
    name: accountName,
    created: Date.now()
  };
  persist();

  return { status: 'SUCCESS', tabId: tab.id };
}

async function switchAccount(platform, accountId, accountName) {
  const url = PLATFORM_URLS[platform];
  if (!url) return { status: 'ERROR', error: 'Unknown platform' };

  let entry = accountMap[accountId];

  // Try to focus existing tab
  if (entry?.tabId) {
    try {
      const tab = await chrome.tabs.get(entry.tabId);
      if (tab) {
        await chrome.tabs.update(tab.id, { active: true });
        await chrome.windows.update(tab.windowId, { focused: true });
        return { status: 'SUCCESS', action: 'focused' };
      }
    } catch {
      // tab closed
    }
  }

  // Create new tab (or reopen)
  const tab = await chrome.tabs.create({ url, active: true });
  accountMap[accountId] = {
    tabId: tab.id,
    windowId: tab.windowId,
    platform,
    name: accountName || entry?.name,
    created: entry?.created || Date.now()
  };
  persist();

  return { status: 'SUCCESS', action: 'opened', tabId: tab.id };
}

// Optional: keep map in sync when tabs close
chrome.tabs.onRemoved.addListener((tabId) => {
  for (const [id, entry] of Object.entries(accountMap)) {
    if (entry.tabId === tabId) {
      entry.tabId = null;
      persist();
      break;
    }
  }
});
