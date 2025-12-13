/**
 * n8n Webhook Handler for Article Generation
 *
 * This can be deployed as a Firebase Function or standalone Express endpoint
 * to receive article content from n8n workflows.
 *
 * Endpoint: POST /api/articles/generate
 *
 * n8n Workflow Setup:
 * 1. Webhook Node → receives trigger
 * 2. HTTP Request to Perplexity (optional research)
 * 3. Code Node → formats content
 * 4. HTTP Request → this endpoint
 */

const admin = require('firebase-admin');

// Initialize Firebase if needed
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ============================================================
// Block Type Mappings
// ============================================================

const BLOCK_TYPES = {
  HERO: 'hero',
  LEAD_PARAGRAPH: 'lead-paragraph',
  PARAGRAPH: 'paragraph',
  SECTION_HEADER: 'section-header',
  STAT_GRID: 'stat-grid',
  BULLET_LIST: 'bullet-list',
  QUOTE: 'quote',
  PERSONA_CARD: 'persona-card',
  NUMBERED_LIST: 'numbered-list',
  ACTION_GRID: 'action-grid',
  CALLOUT_BOX: 'callout-box',
  CTA_SECTION: 'cta-section',
  SOURCES: 'sources'
};

// ============================================================
// Markdown Parser (simplified version for webhook)
// ============================================================

function parseMarkdownToBlocks(content, metadata = {}) {
  const blocks = [];
  const lines = content.split('\n');

  let currentSection = null;
  let buffer = [];
  let isFirstParagraph = true;

  // Add hero block
  if (metadata.title) {
    blocks.push({
      type: BLOCK_TYPES.HERO,
      title: metadata.title,
      subtitle: metadata.subtitle || '',
      seriesLabel: metadata.seriesLabel || '',
      readingTime: metadata.readingTime || 10,
      date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      author: metadata.author || 'yellowCircle'
    });
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines but flush buffer
    if (!trimmed) {
      if (buffer.length > 0) {
        const text = buffer.join(' ').trim();
        if (text) {
          if (isFirstParagraph) {
            blocks.push(createLeadParagraph(text));
            isFirstParagraph = false;
          } else {
            blocks.push({ type: BLOCK_TYPES.PARAGRAPH, content: text, muted: false });
          }
        }
        buffer = [];
      }
      continue;
    }

    // Section headers (## 01. Title)
    const sectionMatch = trimmed.match(/^##\s*(\d{1,2})[\.\)]\s*(.+)$/);
    if (sectionMatch) {
      flushBuffer();
      blocks.push({
        type: BLOCK_TYPES.SECTION_HEADER,
        number: sectionMatch[1].padStart(2, '0'),
        title: sectionMatch[2].trim()
      });
      continue;
    }

    // Quotes
    if (trimmed.startsWith('>')) {
      const quoteText = trimmed.slice(1).trim();
      // Look for attribution
      const attrMatch = quoteText.match(/(.+?)\s*[—–-]\s*(.+)$/);
      if (attrMatch) {
        blocks.push({
          type: BLOCK_TYPES.QUOTE,
          content: attrMatch[1].trim(),
          author: attrMatch[2].trim()
        });
      } else {
        blocks.push({
          type: BLOCK_TYPES.QUOTE,
          content: quoteText,
          author: ''
        });
      }
      continue;
    }

    // Bullet lists
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const items = [trimmed.slice(2)];
      while (i + 1 < lines.length && (lines[i + 1].trim().startsWith('- ') || lines[i + 1].trim().startsWith('* '))) {
        i++;
        items.push(lines[i].trim().slice(2));
      }
      blocks.push({
        type: BLOCK_TYPES.BULLET_LIST,
        items
      });
      continue;
    }

    // Regular text
    buffer.push(trimmed);
  }

  // Flush remaining buffer
  if (buffer.length > 0) {
    const text = buffer.join(' ').trim();
    if (text) {
      blocks.push({ type: BLOCK_TYPES.PARAGRAPH, content: text, muted: false });
    }
  }

  function flushBuffer() {
    if (buffer.length > 0) {
      const text = buffer.join(' ').trim();
      if (text) {
        blocks.push({ type: BLOCK_TYPES.PARAGRAPH, content: text, muted: false });
      }
      buffer = [];
    }
  }

  return blocks;
}

function createLeadParagraph(text) {
  const colonIndex = text.indexOf(':');
  if (colonIndex !== -1 && colonIndex < 50) {
    return {
      type: BLOCK_TYPES.LEAD_PARAGRAPH,
      highlight: text.slice(0, colonIndex + 1),
      content: text.slice(colonIndex + 1).trim()
    };
  }
  return {
    type: BLOCK_TYPES.LEAD_PARAGRAPH,
    highlight: '',
    content: text
  };
}

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

// ============================================================
// Webhook Handler
// ============================================================

/**
 * Handle article generation webhook
 *
 * Expected payload:
 * {
 *   content: "# Title\n\nMarkdown content...",
 *   format: "markdown" | "blocks",
 *   metadata: {
 *     title: "Article Title",
 *     subtitle: "Subtitle",
 *     category: "own-your-story",
 *     tags: ["tag1", "tag2"]
 *   },
 *   status: "draft" | "published",
 *   webhook_secret: "your-secret" // optional auth
 * }
 */
async function handleArticleWebhook(req, res) {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      content,
      format = 'markdown',
      metadata = {},
      status = 'draft',
      webhook_secret
    } = req.body;

    // Optional: Verify webhook secret
    const expectedSecret = process.env.ARTICLE_WEBHOOK_SECRET;
    if (expectedSecret && webhook_secret !== expectedSecret) {
      return res.status(401).json({ error: 'Invalid webhook secret' });
    }

    if (!content) {
      return res.status(400).json({ error: 'content is required' });
    }

    // Parse content to blocks
    let blocks;
    if (format === 'blocks') {
      // Content is already block array
      blocks = Array.isArray(content) ? content : JSON.parse(content);
    } else {
      // Parse markdown to blocks
      blocks = parseMarkdownToBlocks(content, metadata);
    }

    // Build article document
    const title = metadata.title || extractTitleFromBlocks(blocks) || 'Untitled Article';
    const article = {
      title,
      slug: metadata.slug || generateSlug(title),
      excerpt: metadata.subtitle || metadata.excerpt || '',
      category: metadata.category || 'own-your-story',
      tags: metadata.tags || [],
      author: metadata.author || 'yellowCircle',
      readingTime: Math.max(1, Math.ceil(blocks.length * 1.5)),
      status,
      contentSource: 'blocks',
      blocks,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Save to Firestore
    const docRef = await db.collection('articles').add(article);

    // Return success response
    return res.status(201).json({
      success: true,
      article: {
        id: docRef.id,
        slug: article.slug,
        title: article.title,
        status: article.status,
        blockCount: blocks.length,
        previewUrl: `https://yellowcircle.io/thoughts/${article.slug}`,
        editUrl: `https://yellowcircle.io/admin/blocks/${docRef.id}`
      }
    });

  } catch (error) {
    console.error('Article webhook error:', error);
    return res.status(500).json({
      error: 'Failed to create article',
      message: error.message
    });
  }
}

function extractTitleFromBlocks(blocks) {
  const heroBlock = blocks.find(b => b.type === 'hero');
  return heroBlock?.title || null;
}

// ============================================================
// Export for Firebase Functions
// ============================================================

module.exports = {
  handleArticleWebhook,
  parseMarkdownToBlocks,
  generateSlug,
  BLOCK_TYPES
};

// ============================================================
// n8n Workflow Example (JSON)
// ============================================================

/*
Example n8n workflow JSON to import:

{
  "name": "Article Generator",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "article-trigger",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Format Content",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "const input = $input.first().json;\nreturn [{\n  json: {\n    content: input.content,\n    format: 'markdown',\n    metadata: {\n      title: input.title,\n      subtitle: input.subtitle,\n      category: input.category || 'own-your-story',\n      tags: input.tags || []\n    },\n    status: 'draft'\n  }\n}];"
      }
    },
    {
      "name": "Create Article",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://us-central1-yellowcircle-app.cloudfunctions.net/articleWebhook",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {"name": "content", "value": "={{ $json.content }}"},
            {"name": "format", "value": "={{ $json.format }}"},
            {"name": "metadata", "value": "={{ $json.metadata }}"},
            {"name": "status", "value": "={{ $json.status }}"}
          ]
        }
      }
    }
  ]
}
*/
