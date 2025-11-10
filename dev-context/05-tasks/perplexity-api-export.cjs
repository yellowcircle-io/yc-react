#!/usr/bin/env node
/**
 * Perplexity API-Based Exporter
 *
 * This script uses Puppeteer to intercept Perplexity's internal API calls
 * and extracts conversation data directly from the JSON responses.
 *
 * More reliable than DOM scraping since it uses the actual data structure.
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

const CONFIG = {
  email: process.argv[2] || 'christopher@yellowcircle.io',
  outputDir: path.join(__dirname, '../../01-research/perplexity-exports'),
  doneFile: path.join(__dirname, '../../01-research/perplexity-done.json'),
  headless: false,
  loginTimeout: 300000, // 5 minutes for user to enter code
  conversationDelay: 2000 // 2 seconds between conversations
};

// Storage for intercepted data
const conversationData = new Map();
let threadsList = [];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function loadDoneFile() {
  try {
    const content = await fs.readFile(CONFIG.doneFile, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.log('No existing done file, starting fresh');
    return { processedUrls: [] };
  }
}

async function saveDoneFile(doneData) {
  await fs.writeFile(CONFIG.doneFile, JSON.stringify(doneData, null, 2));
}

async function saveConversation(url, data) {
  const urlParts = url.split('/');
  const id = urlParts[urlParts.length - 1].split('?')[0];
  const jsonPath = path.join(CONFIG.outputDir, `${id}.json`);
  const mdPath = path.join(CONFIG.outputDir, `${id}.md`);

  // Save JSON
  await fs.writeFile(jsonPath, JSON.stringify(data, null, 2));

  // Convert to Markdown
  const markdown = convertToMarkdown(data);
  await fs.writeFile(mdPath, markdown);

  console.log(`✅ Saved: ${id}`);
}

function convertToMarkdown(data) {
  let md = '';

  // Try to extract title and messages from various possible data structures
  const title = data.title || data.query || 'Untitled Conversation';
  md += `# ${title}\n\n`;

  if (data.created_at || data.createdAt) {
    md += `**Date:** ${data.created_at || data.createdAt}\n\n`;
  }

  md += `---\n\n`;

  // Handle different data structures
  const messages = data.messages || data.serpResults || data.threads || [];

  messages.forEach((msg, idx) => {
    const role = msg.role || msg.type || 'unknown';
    const content = msg.content || msg.text || msg.answer || '';

    if (role === 'user' || role === 'query') {
      md += `## 🙋 User\n\n${content}\n\n`;
    } else if (role === 'assistant' || role === 'answer') {
      md += `## 🤖 Assistant\n\n${content}\n\n`;

      // Add citations if available
      if (msg.citations || msg.sources) {
        md += `### Sources\n\n`;
        const sources = msg.citations || msg.sources || [];
        sources.forEach((cite, i) => {
          const title = cite.title || cite.name || `Source ${i + 1}`;
          const url = cite.url || cite.link || '';
          md += `- [${title}](${url})\n`;
        });
        md += `\n`;
      }
    }
  });

  return md;
}

async function setupRequestInterception(page) {
  await page.setRequestInterception(true);

  page.on('request', request => {
    request.continue();
  });

  page.on('response', async response => {
    const url = response.url();

    // Intercept API calls
    if (url.includes('/api/') || url.includes('perplexity.ai')) {
      try {
        const contentType = response.headers()['content-type'] || '';
        if (contentType.includes('application/json')) {
          const data = await response.json();

          // Store thread list if we find it
          if (url.includes('/library') || url.includes('/threads')) {
            if (Array.isArray(data)) {
              threadsList = data;
              console.log(`📋 Found ${data.length} threads in API response`);
            } else if (data.threads || data.items) {
              threadsList = data.threads || data.items;
              console.log(`📋 Found ${threadsList.length} threads in API response`);
            }
          }

          // Store conversation data if we find it
          if (url.includes('/search/') || url.includes('/thread/')) {
            const currentUrl = page.url();
            conversationData.set(currentUrl, data);
            console.log(`📦 Captured data for: ${currentUrl}`);
          }
        }
      } catch (e) {
        // Not JSON or couldn't parse, skip
      }
    }
  });
}

async function login(page) {
  console.log('🔐 Navigating to Perplexity...');
  await page.goto('https://www.perplexity.ai/');

  // Try to click cookie consent if it exists
  try {
    await page.waitForSelector('button:has-text("Accept")', { timeout: 3000 });
    await page.click('button:has-text("Accept")');
  } catch (e) {
    console.log('No cookie dialog, continuing...');
  }

  // Wait for email input
  try {
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', CONFIG.email);

    // Click continue
    await page.click('button:has-text("Continue")');
    await page.waitForNavigation({ timeout: 30000 });

    // Wait for code input
    await page.waitForSelector('input[placeholder*="Code"]', { timeout: 30000 });

    console.log('\n⏳ CHECK YOUR EMAIL and enter the authentication code in the browser window');
    console.log('   Waiting up to 5 minutes...\n');

    // Wait for successful login (check for library or main page elements)
    await page.waitForNavigation({ timeout: CONFIG.loginTimeout });

    console.log('✅ Successfully logged in!');
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    throw error;
  }
}

async function getConversationUrls(page) {
  console.log('📚 Navigating to library...');
  await page.goto('https://www.perplexity.ai/library', { waitUntil: 'networkidle2' });

  await sleep(3000); // Wait for API calls to complete

  // Try to get URLs from intercepted API data first
  if (threadsList.length > 0) {
    console.log(`📋 Using ${threadsList.length} threads from API`);
    return threadsList.map(t => ({
      url: t.url || `https://www.perplexity.ai/search/${t.id}`,
      title: t.title || t.query || 'Untitled',
      id: t.id
    }));
  }

  // Fallback: scrape from DOM
  console.log('🔍 Extracting conversation links from page...');
  const conversations = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href*="/search/"], a[href*="/thread/"]'));
    return links
      .filter(a => a.href)
      .map(a => ({
        url: a.href,
        title: a.textContent.trim() || 'Untitled',
        id: a.href.split('/').pop().split('?')[0]
      }));
  });

  // Remove duplicates
  const unique = Array.from(new Map(conversations.map(c => [c.url, c])).values());
  console.log(`📋 Found ${unique.length} unique conversations`);

  return unique;
}

async function exportConversation(page, conv, doneData) {
  console.log(`\n📥 Processing: ${conv.title}`);
  console.log(`   URL: ${conv.url}`);

  // Clear previous data
  conversationData.delete(conv.url);

  // Navigate to conversation
  await page.goto(conv.url, { waitUntil: 'networkidle2' });
  await sleep(2000); // Wait for API calls

  // Check if we captured API data
  if (conversationData.has(conv.url)) {
    const data = conversationData.get(conv.url);
    await saveConversation(conv.url, data);
    doneData.processedUrls.push(conv.url);
    await saveDoneFile(doneData);
    return true;
  }

  // Fallback: Try to extract from page
  console.log('   ⚠️ No API data captured, trying DOM extraction...');
  try {
    const pageData = await page.evaluate(() => {
      // Try to find conversation data in window object
      if (window.__NEXT_DATA__) {
        return window.__NEXT_DATA__.props?.pageProps;
      }

      // Fallback: scrape visible content
      const messages = [];
      document.querySelectorAll('.whitespace-pre-line, .prose').forEach(el => {
        messages.push({
          role: el.classList.contains('prose') ? 'assistant' : 'user',
          content: el.textContent.trim()
        });
      });

      return {
        title: document.title,
        messages: messages,
        url: window.location.href
      };
    });

    if (pageData && (pageData.messages?.length > 0 || pageData.thread)) {
      await saveConversation(conv.url, pageData);
      doneData.processedUrls.push(conv.url);
      await saveDoneFile(doneData);
      return true;
    }
  } catch (e) {
    console.error('   ❌ DOM extraction failed:', e.message);
  }

  console.log('   ⚠️  Skipping - no data could be extracted');
  return false;
}

async function main() {
  console.log('🚀 Perplexity API-Based Exporter');
  console.log('================================\n');
  console.log(`📧 Email: ${CONFIG.email}`);
  console.log(`📂 Output: ${CONFIG.outputDir}`);
  console.log(`📝 Progress: ${CONFIG.doneFile}\n`);

  // Ensure output directory exists
  await fs.mkdir(CONFIG.outputDir, { recursive: true });

  // Load progress
  const doneData = await loadDoneFile();
  console.log(`📊 Previously exported: ${doneData.processedUrls.length}\n`);

  // Launch browser
  const browser = await puppeteer.launch({
    headless: CONFIG.headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Setup API interception
  await setupRequestInterception(page);

  try {
    // Login
    await login(page);

    // Get all conversations
    const conversations = await getConversationUrls(page);

    // Filter out already processed
    const toProcess = conversations.filter(c => !doneData.processedUrls.includes(c.url));
    console.log(`\n📊 Total conversations: ${conversations.length}`);
    console.log(`✅ Already processed: ${doneData.processedUrls.length}`);
    console.log(`⏳ To process: ${toProcess.length}\n`);

    if (toProcess.length === 0) {
      console.log('🎉 All conversations already exported!');
      await browser.close();
      return;
    }

    // Export each conversation
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < toProcess.length; i++) {
      const conv = toProcess[i];
      console.log(`\n[${i + 1}/${toProcess.length}]`);

      try {
        const success = await exportConversation(page, conv, doneData);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        failCount++;
      }

      // Rate limiting
      if (i < toProcess.length - 1) {
        await sleep(CONFIG.conversationDelay);
      }
    }

    console.log('\n\n🎉 Export Complete!');
    console.log('================================');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📂 Output: ${CONFIG.outputDir}`);

  } catch (error) {
    console.error('\n💥 Fatal error:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { main };
