/**
 * Link Archiver Browser Extension - Background Service Worker
 *
 * Handles background tasks, context menus, and keyboard shortcuts.
 *
 * @created 2026-01-17
 * @author Sleepless Agent
 */

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-to-link-archiver',
    title: 'Save to Link Archiver',
    contexts: ['page', 'link']
  });

  chrome.contextMenus.create({
    id: 'save-selection-to-link-archiver',
    title: 'Save Link to Archiver',
    contexts: ['selection']
  });

  console.log('Link Archiver extension installed');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'save-to-link-archiver') {
    const url = info.linkUrl || info.pageUrl;
    const title = info.linkUrl ? 'Linked Page' : tab.title;

    await saveLink(url, title, tab.id);
  } else if (info.menuItemId === 'save-selection-to-link-archiver') {
    // Try to extract URL from selection
    const selection = info.selectionText;
    const urlMatch = selection.match(/https?:\/\/[^\s]+/);

    if (urlMatch) {
      await saveLink(urlMatch[0], 'Selected Link', tab.id);
    } else {
      // Save current page with selection as note
      await saveLink(tab.url, tab.title, tab.id, selection);
    }
  }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'save-link') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      await saveLink(tab.url, tab.title, tab.id);
    }
  }
});

// Save link function
async function saveLink(url, title, tabId, note = null) {
  try {
    // Get auth token
    const stored = await chrome.storage.local.get(['authToken', 'userId']);

    if (!stored.authToken || !stored.userId) {
      // Show notification to sign in
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Link Archiver',
        message: 'Please sign in to save links. Click the extension icon.'
      });
      return;
    }

    // Try to get page data from content script
    let pageData = { title, url };
    try {
      const response = await chrome.tabs.sendMessage(tabId, { action: 'getPageData' });
      if (response) {
        pageData = { ...pageData, ...response };
      }
    } catch (e) {
      console.log('Could not get page data from content script');
    }

    // Call API
    const apiUrl = 'https://us-central1-yellowcircle-app.cloudfunctions.net';
    const response = await fetch(`${apiUrl}/linkArchiver-saveLink`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${stored.authToken}`
      },
      body: JSON.stringify({
        url,
        title: pageData.title,
        excerpt: pageData.excerpt || note || '',
        content: pageData.content || '',
        image: pageData.image || null,
        tags: [],
        folderId: null
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save link');
    }

    // Show success notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Link Saved!',
      message: `"${title}" has been saved to Link Archiver.`
    });
  } catch (err) {
    console.error('Error saving link:', err);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Error',
      message: 'Failed to save link. Please try again.'
    });
  }
}

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'saveLink') {
    saveLink(message.url, message.title, sender.tab?.id)
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Keep channel open for async response
  }

  if (message.action === 'setAuth') {
    chrome.storage.local.set({
      authToken: message.token,
      userId: message.userId
    }).then(() => sendResponse({ success: true }));
    return true;
  }

  if (message.action === 'clearAuth') {
    chrome.storage.local.remove(['authToken', 'userId'])
      .then(() => sendResponse({ success: true }));
    return true;
  }
});
