/**
 * yellowCircle Link Saver - Background Service Worker
 *
 * Handles context menu integration and keyboard shortcuts.
 */

const API_BASE = 'https://us-central1-yellowcircle-app.cloudfunctions.net';

/**
 * Create context menu on install
 */
chrome.runtime.onInstalled.addListener(() => {
  // Context menu for page
  chrome.contextMenus.create({
    id: 'save-page',
    title: 'Save to yellowCircle',
    contexts: ['page']
  });

  // Context menu for links
  chrome.contextMenus.create({
    id: 'save-link',
    title: 'Save link to yellowCircle',
    contexts: ['link']
  });

  // Context menu for selection (extract links)
  chrome.contextMenus.create({
    id: 'save-selection',
    title: 'Save selected links to yellowCircle',
    contexts: ['selection']
  });
});

/**
 * Handle context menu clicks
 */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const { ycToken } = await chrome.storage.sync.get('ycToken');

  if (!ycToken) {
    // Open popup to set up token
    chrome.action.openPopup();
    return;
  }

  let urlToSave = null;
  let title = null;

  switch (info.menuItemId) {
    case 'save-page':
      urlToSave = tab.url;
      title = tab.title;
      break;

    case 'save-link':
      urlToSave = info.linkUrl;
      break;

    case 'save-selection':
      // Extract URLs from selection
      const urls = extractUrlsFromText(info.selectionText);
      if (urls.length > 0) {
        // Save all URLs
        for (const url of urls) {
          await saveLink(ycToken, url);
        }
        showNotification('Links saved!', `Saved ${urls.length} link(s) to yellowCircle`);
        return;
      } else {
        showNotification('No links found', 'No URLs found in selection');
        return;
      }
  }

  if (urlToSave) {
    const result = await saveLink(ycToken, urlToSave, title);
    if (result.success) {
      showNotification('Link saved!', truncateUrl(urlToSave));
    } else {
      showNotification('Save failed', result.error || 'Unknown error');
    }
  }
});

/**
 * Handle keyboard shortcuts
 */
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'quick-save') {
    const { ycToken } = await chrome.storage.sync.get('ycToken');

    if (!ycToken) {
      chrome.action.openPopup();
      return;
    }

    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return;

    const result = await saveLink(ycToken, tab.url, tab.title);
    if (result.success) {
      showNotification('Link saved!', truncateUrl(tab.url));
    } else {
      showNotification('Save failed', result.error || 'Unknown error');
    }
  }
});

/**
 * Save a link to yellowCircle
 */
async function saveLink(token, url, title = null) {
  try {
    const params = new URLSearchParams({
      token,
      url
    });

    if (title) {
      params.append('title', title);
    }

    const response = await fetch(`${API_BASE}/linkArchiverQuickSave?${params.toString()}`);
    return await response.json();
  } catch (err) {
    return { success: false, error: 'Network error' };
  }
}

/**
 * Extract URLs from text
 */
function extractUrlsFromText(text) {
  if (!text) return [];
  const urlRegex = /https?:\/\/[^\s<>"')\]]+/gi;
  const matches = text.match(urlRegex) || [];
  // Clean trailing punctuation
  const cleaned = matches.map(url => url.replace(/[.,;:!?)}\]]+$/, ''));
  return [...new Set(cleaned)];
}

/**
 * Truncate URL for display
 */
function truncateUrl(url) {
  try {
    const hostname = new URL(url).hostname;
    return hostname.length > 30 ? hostname.substring(0, 27) + '...' : hostname;
  } catch {
    return url.substring(0, 30) + '...';
  }
}

/**
 * Show notification
 */
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title,
    message
  });
}
