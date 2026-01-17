/**
 * Link Archiver Browser Extension - Content Script
 *
 * Extracts page metadata and content for saving.
 *
 * @created 2026-01-17
 * @author Sleepless Agent
 */

// Extract page data
function getPageData() {
  const data = {
    url: window.location.href,
    title: document.title,
    excerpt: '',
    content: '',
    image: null,
    author: null,
    publishedAt: null
  };

  // Get meta description
  const metaDesc = document.querySelector('meta[name="description"]')
    || document.querySelector('meta[property="og:description"]');
  if (metaDesc) {
    data.excerpt = metaDesc.content;
  }

  // Get OG image
  const ogImage = document.querySelector('meta[property="og:image"]')
    || document.querySelector('meta[name="twitter:image"]');
  if (ogImage) {
    data.image = ogImage.content;
  }

  // Get author
  const author = document.querySelector('meta[name="author"]')
    || document.querySelector('meta[property="article:author"]');
  if (author) {
    data.author = author.content;
  }

  // Get published date
  const published = document.querySelector('meta[property="article:published_time"]')
    || document.querySelector('meta[name="date"]')
    || document.querySelector('time[datetime]');
  if (published) {
    data.publishedAt = published.content || published.getAttribute('datetime');
  }

  // Extract main content
  // Try common article selectors
  const contentSelectors = [
    'article',
    '[role="main"]',
    '.post-content',
    '.article-content',
    '.entry-content',
    '.content',
    'main',
    '#content'
  ];

  for (const selector of contentSelectors) {
    const el = document.querySelector(selector);
    if (el) {
      // Get text content, cleaned up
      data.content = cleanText(el.innerText);
      break;
    }
  }

  // Fallback: get body text (limited)
  if (!data.content) {
    const body = document.body;
    if (body) {
      data.content = cleanText(body.innerText).slice(0, 5000);
    }
  }

  // If no excerpt, create from content
  if (!data.excerpt && data.content) {
    data.excerpt = data.content.slice(0, 200) + '...';
  }

  return data;
}

// Clean text content
function cleanText(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 50000); // Limit content size
}

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getPageData') {
    sendResponse(getPageData());
  }
  return true;
});

// Also listen for keyboard shortcut
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + Shift + S
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
    e.preventDefault();
    chrome.runtime.sendMessage({
      action: 'saveLink',
      url: window.location.href,
      title: document.title
    });
  }
});

console.log('Link Archiver content script loaded');
