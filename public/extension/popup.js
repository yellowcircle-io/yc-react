/**
 * Link Archiver Browser Extension - Popup Script
 *
 * Handles the popup UI for saving links to yellowCircle.
 *
 * @created 2026-01-17
 * @author Sleepless Agent
 */

// Configuration
const API_BASE_URLS = [
  'https://us-central1-yellowcircle-app.cloudfunctions.net',
  'http://localhost:5001/yellowcircle-app/us-central1' // Development
];

const APP_URLS = [
  'https://yellowcircle.io',
  'https://yellowcircle-app.web.app',
  'http://localhost:5173'
];

// State
let currentTab = null;
let tags = [];
let folders = [];
let _authToken = null; // Reserved for future use

// DOM Elements
const statusEl = document.getElementById('status');
const authSection = document.getElementById('auth-section');
const saveSection = document.getElementById('save-section');
const pageTitleEl = document.getElementById('page-title');
const pageUrlEl = document.getElementById('page-url');
const tagsContainer = document.getElementById('tags-container');
const tagInput = document.getElementById('tag-input');
const folderSelect = document.getElementById('folder-select');
const saveBtn = document.getElementById('save-btn');
const viewBtn = document.getElementById('view-btn');
const signinBtn = document.getElementById('signin-btn');

// Initialize popup
async function init() {
  // Get current tab info
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;

  pageTitleEl.textContent = tab.title || 'Untitled';
  pageUrlEl.textContent = tab.url;

  // Check authentication
  const stored = await chrome.storage.local.get(['authToken', 'userId']);
  if (stored.authToken && stored.userId) {
    _authToken = stored.authToken;
    showSaveSection();
    loadFolders();
  } else {
    showAuthSection();
  }
}

// Show/hide sections
function showAuthSection() {
  authSection.style.display = 'block';
  saveSection.style.display = 'none';
}

function showSaveSection() {
  authSection.style.display = 'none';
  saveSection.style.display = 'block';
}

// Status messages
function showStatus(message, type = 'loading') {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
}

function _hideStatus() {
  statusEl.className = 'status';
}

// Tags handling
function addTag(tagName) {
  const normalizedTag = tagName.trim().toLowerCase();
  if (!normalizedTag || tags.includes(normalizedTag)) return;

  tags.push(normalizedTag);
  renderTags();
}

function removeTag(tagName) {
  tags = tags.filter(t => t !== tagName);
  renderTags();
}

function renderTags() {
  // Clear existing tags
  const existingTags = tagsContainer.querySelectorAll('.tag');
  existingTags.forEach(tag => tag.remove());

  // Add tags before input
  tags.forEach(tag => {
    const tagEl = document.createElement('span');
    tagEl.className = 'tag';
    tagEl.innerHTML = `
      ${tag}
      <span class="tag-remove" data-tag="${tag}">&times;</span>
    `;
    tagsContainer.insertBefore(tagEl, tagInput);
  });
}

// Load user's folders
async function loadFolders() {
  try {
    const stored = await chrome.storage.local.get(['userId']);
    if (!stored.userId) return;

    // Note: In production, this would call the API
    // For now, we'll load from storage
    const folderData = await chrome.storage.local.get(['folders']);
    if (folderData.folders) {
      folders = folderData.folders;
      folders.forEach(folder => {
        const option = document.createElement('option');
        option.value = folder.id;
        option.textContent = folder.name;
        folderSelect.appendChild(option);
      });
    }
  } catch (err) {
    console.error('Error loading folders:', err);
  }
}

// Save link
async function saveLink() {
  if (!currentTab) return;

  showStatus('Saving link...', 'loading');
  saveBtn.disabled = true;

  try {
    const stored = await chrome.storage.local.get(['authToken', 'userId']);

    // Get page content from content script
    let pageData = { title: currentTab.title, url: currentTab.url };
    try {
      const response = await chrome.tabs.sendMessage(currentTab.id, { action: 'getPageData' });
      if (response) {
        pageData = { ...pageData, ...response };
      }
    } catch (_e) {
      console.log('Could not get page data from content script');
    }

    // Call API to save link
    const apiUrl = API_BASE_URLS[0]; // Use production URL
    const response = await fetch(`${apiUrl}/linkArchiver-saveLink`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${stored.authToken}`
      },
      body: JSON.stringify({
        url: currentTab.url,
        title: pageData.title,
        excerpt: pageData.excerpt || '',
        content: pageData.content || '',
        image: pageData.image || null,
        tags: tags,
        folderId: folderSelect.value || null
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save link');
    }

    const _result = await response.json(); // Response data available for future use
    showStatus('Link saved!', 'success');

    // Close popup after short delay
    setTimeout(() => window.close(), 1500);
  } catch (err) {
    console.error('Error saving link:', err);
    showStatus('Error: ' + err.message, 'error');
    saveBtn.disabled = false;
  }
}

// Event listeners
tagInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    addTag(tagInput.value);
    tagInput.value = '';
  } else if (e.key === 'Backspace' && !tagInput.value && tags.length > 0) {
    removeTag(tags[tags.length - 1]);
  }
});

tagsContainer.addEventListener('click', (e) => {
  if (e.target.classList.contains('tag-remove')) {
    removeTag(e.target.dataset.tag);
  }
});

saveBtn.addEventListener('click', saveLink);

viewBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://yellowcircle.io/admin/links' });
});

signinBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://yellowcircle.io/login?redirect=/admin/links' });
});

// Initialize
init();
