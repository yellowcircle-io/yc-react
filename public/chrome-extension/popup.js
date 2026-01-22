/**
 * yellowCircle Link Saver - Popup Script
 *
 * Handles the extension popup UI and link saving functionality.
 */

const API_BASE = 'https://us-central1-yellowcircle-app.cloudfunctions.net';

// DOM Elements
const setupView = document.getElementById('setup-view');
const saveView = document.getElementById('save-view');
const tokenInput = document.getElementById('token-input');
const saveTokenBtn = document.getElementById('save-token-btn');
const saveLinkBtn = document.getElementById('save-link-btn');
const tagsInput = document.getElementById('tags-input');
const pageTitle = document.getElementById('page-title');
const pageUrl = document.getElementById('page-url');
const pageFavicon = document.getElementById('page-favicon');
const saveStatus = document.getElementById('save-status');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettings = document.getElementById('close-settings');
const disconnectBtn = document.getElementById('disconnect-btn');
const currentToken = document.getElementById('current-token');

// State
let currentTab = null;

/**
 * Initialize the popup
 */
async function init() {
  // Get current tab info
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;

  // Update page info
  if (tab) {
    pageTitle.textContent = tab.title || 'Untitled';
    pageUrl.textContent = new URL(tab.url).hostname;

    // Set favicon
    if (tab.favIconUrl) {
      pageFavicon.style.backgroundImage = `url(${tab.favIconUrl})`;
    }
  }

  // Check for stored token
  const { ycToken } = await chrome.storage.sync.get('ycToken');

  if (ycToken) {
    showSaveView(ycToken);
  } else {
    showSetupView();
  }

  // Event listeners
  saveTokenBtn.addEventListener('click', handleSaveToken);
  saveLinkBtn.addEventListener('click', handleSaveLink);
  settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
  closeSettings.addEventListener('click', () => settingsModal.classList.add('hidden'));
  disconnectBtn.addEventListener('click', handleDisconnect);

  // Enter key handlers
  tokenInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSaveToken();
  });

  tagsInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSaveLink();
  });
}

/**
 * Show setup view (no token)
 */
function showSetupView() {
  setupView.classList.remove('hidden');
  saveView.classList.add('hidden');
  tokenInput.focus();
}

/**
 * Show save view (has token)
 */
function showSaveView(token) {
  setupView.classList.add('hidden');
  saveView.classList.remove('hidden');

  // Update settings display
  const maskedToken = token.substring(0, 6) + '****';
  currentToken.textContent = maskedToken;

  // Focus tags input
  tagsInput.focus();
}

/**
 * Handle token save
 */
async function handleSaveToken() {
  const token = tokenInput.value.trim();

  if (!token) {
    showError('Please enter your API token');
    return;
  }

  if (!token.startsWith('yc_')) {
    showError('Invalid token format. Should start with yc_');
    return;
  }

  // Validate token with API
  saveTokenBtn.disabled = true;
  saveTokenBtn.textContent = 'Validating...';

  try {
    const response = await fetch(`${API_BASE}/linkArchiverValidateToken?token=${encodeURIComponent(token)}`);
    const data = await response.json();

    if (response.ok && data.valid) {
      // Save token
      await chrome.storage.sync.set({ ycToken: token });
      showSaveView(token);
    } else {
      showError(data.error || 'Invalid token');
    }
  } catch (err) {
    showError('Connection error. Please try again.');
  } finally {
    saveTokenBtn.disabled = false;
    saveTokenBtn.textContent = 'Connect Account';
  }
}

/**
 * Handle link save
 */
async function handleSaveLink() {
  if (!currentTab?.url) {
    showError('No page to save');
    return;
  }

  const { ycToken } = await chrome.storage.sync.get('ycToken');
  if (!ycToken) {
    showSetupView();
    return;
  }

  // Update button state
  const btnText = saveLinkBtn.querySelector('.btn-text');
  const btnLoading = saveLinkBtn.querySelector('.btn-loading');
  btnText.classList.add('hidden');
  btnLoading.classList.remove('hidden');
  saveLinkBtn.disabled = true;

  try {
    // Build URL with params
    const params = new URLSearchParams({
      token: ycToken,
      url: currentTab.url
    });

    // Add title if available
    if (currentTab.title) {
      params.append('title', currentTab.title);
    }

    // Add tags if provided
    const tags = tagsInput.value.trim();
    if (tags) {
      params.append('tags', tags);
    }

    const response = await fetch(`${API_BASE}/linkArchiverQuickSave?${params.toString()}`);
    const data = await response.json();

    if (response.ok && data.success) {
      showSuccess('Link saved!');

      // Close popup after brief delay
      setTimeout(() => window.close(), 1500);
    } else {
      showError(data.error || 'Failed to save link');
    }
  } catch (err) {
    showError('Connection error. Please try again.');
  } finally {
    btnText.classList.remove('hidden');
    btnLoading.classList.add('hidden');
    saveLinkBtn.disabled = false;
  }
}

/**
 * Handle disconnect (remove token)
 */
async function handleDisconnect() {
  await chrome.storage.sync.remove('ycToken');
  settingsModal.classList.add('hidden');
  showSetupView();
}

/**
 * Show success message
 */
function showSuccess(message) {
  saveStatus.textContent = message;
  saveStatus.className = 'status success';
  saveStatus.classList.remove('hidden');
}

/**
 * Show error message
 */
function showError(message) {
  saveStatus.textContent = message;
  saveStatus.className = 'status error';
  saveStatus.classList.remove('hidden');

  // Hide after 3 seconds
  setTimeout(() => {
    saveStatus.classList.add('hidden');
  }, 3000);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
