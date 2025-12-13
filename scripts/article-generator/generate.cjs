#!/usr/bin/env node
/**
 * Article Generator CLI
 *
 * Converts markdown/text/JSON to yellowCircle block-based articles
 *
 * Usage:
 *   node generate.js --input article.md --output firestore
 *   cat article.md | node generate.js --input - --output console
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// Configuration
// ============================================================

const VALID_CATEGORIES = [
  'own-your-story',
  'gtm-strategy',
  'marketing-ops',
  'data-analytics',
  'leadership',
  'case-study'
];

const DEFAULT_CONFIG = {
  output: 'console',
  status: 'draft',
  enhance: false,
  model: 'groq',
  dryRun: false
};

// ============================================================
// Markdown Parser
// ============================================================

function parseMarkdown(content) {
  const blocks = [];
  const lines = content.split('\n');

  // Extract YAML frontmatter
  const metadata = extractFrontmatter(content);
  let bodyContent = content;

  if (content.startsWith('---')) {
    const endIndex = content.indexOf('---', 3);
    if (endIndex !== -1) {
      bodyContent = content.slice(endIndex + 3).trim();
    }
  }

  // Parse body into blocks
  const bodyLines = bodyContent.split('\n');
  let currentSection = null;
  let buffer = [];
  let isFirstParagraph = true;
  let inList = false;
  let listItems = [];
  let inTable = false;
  let tableRows = [];
  let inQuote = false;
  let quoteLines = [];

  for (let i = 0; i < bodyLines.length; i++) {
    const line = bodyLines[i];
    const trimmedLine = line.trim();

    // Skip empty lines (but process buffered content)
    if (trimmedLine === '') {
      if (buffer.length > 0) {
        const paragraphText = buffer.join(' ').trim();
        if (paragraphText) {
          if (isFirstParagraph && metadata.title) {
            // First paragraph after title is lead paragraph
            blocks.push(createLeadParagraph(paragraphText));
            isFirstParagraph = false;
          } else {
            blocks.push(createParagraph(paragraphText));
          }
        }
        buffer = [];
      }
      if (inList && listItems.length > 0) {
        blocks.push(createBulletList(listItems));
        listItems = [];
        inList = false;
      }
      if (inTable && tableRows.length > 0) {
        blocks.push(createStatGrid(tableRows));
        tableRows = [];
        inTable = false;
      }
      if (inQuote && quoteLines.length > 0) {
        blocks.push(createQuote(quoteLines));
        quoteLines = [];
        inQuote = false;
      }
      continue;
    }

    // H1 - Hero block (title from frontmatter takes precedence)
    if (trimmedLine.startsWith('# ') && !trimmedLine.startsWith('## ')) {
      if (!metadata.title) {
        metadata.title = trimmedLine.slice(2).trim();
      }
      // Add hero block
      blocks.push({
        type: 'hero',
        title: metadata.title,
        subtitle: metadata.subtitle || '',
        seriesLabel: metadata.seriesLabel || '',
        readingTime: metadata.readingTime || 10,
        date: metadata.date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        author: metadata.author || 'yellowCircle'
      });
      continue;
    }

    // H2 with number - Section header
    const sectionMatch = trimmedLine.match(/^##\s*(\d{1,2})[\.\)]\s*(.+)$/);
    if (sectionMatch) {
      // Flush buffer first
      if (buffer.length > 0) {
        blocks.push(createParagraph(buffer.join(' ').trim()));
        buffer = [];
      }

      blocks.push({
        type: 'section-header',
        number: sectionMatch[1].padStart(2, '0'),
        title: sectionMatch[2].trim()
      });
      continue;
    }

    // H2 without number - Check for special sections
    if (trimmedLine.startsWith('## ')) {
      const sectionTitle = trimmedLine.slice(3).trim().toLowerCase();

      // Flush buffer
      if (buffer.length > 0) {
        blocks.push(createParagraph(buffer.join(' ').trim()));
        buffer = [];
      }

      if (sectionTitle.includes('call to action') || sectionTitle === 'cta') {
        currentSection = 'cta';
        continue;
      }
      if (sectionTitle === 'sources' || sectionTitle === 'references') {
        currentSection = 'sources';
        continue;
      }

      // Regular section header (auto-number)
      const existingSections = blocks.filter(b => b.type === 'section-header').length;
      blocks.push({
        type: 'section-header',
        number: String(existingSections + 1).padStart(2, '0'),
        title: trimmedLine.slice(3).trim()
      });
      continue;
    }

    // H3 - Check for persona or stats
    if (trimmedLine.startsWith('### ')) {
      const h3Title = trimmedLine.slice(4).trim();

      if (h3Title.toLowerCase().startsWith('persona:')) {
        currentSection = 'persona';
        const personaName = h3Title.slice(8).trim();
        // Look ahead for persona details
        const persona = parsePersonaSection(bodyLines, i + 1);
        persona.name = personaName;
        blocks.push({
          type: 'persona-card',
          ...persona
        });
        // Skip parsed lines
        i += persona._linesConsumed || 0;
        continue;
      }

      if (h3Title.toLowerCase() === 'stats' || h3Title.toLowerCase() === 'statistics') {
        currentSection = 'stats';
        continue;
      }
    }

    // Quote blocks
    if (trimmedLine.startsWith('>')) {
      inQuote = true;
      quoteLines.push(trimmedLine.slice(1).trim());
      continue;
    }

    // Bullet lists - check if in sources section first
    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      if (currentSection === 'sources') {
        // Handle sources section bullets
        if (!blocks.find(b => b.type === 'sources')) {
          blocks.push({
            type: 'sources',
            sources: []
          });
        }
        blocks.find(b => b.type === 'sources').sources.push(trimmedLine.slice(2).trim());
        continue;
      }
      inList = true;
      listItems.push(trimmedLine.slice(2).trim());
      continue;
    }

    // Numbered lists with descriptions (1. Title: Description)
    const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+?):\s*(.+)$/);
    if (numberedMatch) {
      if (!blocks.find(b => b.type === 'numbered-list' && b._building)) {
        blocks.push({
          type: 'numbered-list',
          highlighted: true,
          items: [],
          _building: true
        });
      }
      const currentList = blocks.find(b => b.type === 'numbered-list' && b._building);
      currentList.items.push({
        title: numberedMatch[2].trim(),
        description: numberedMatch[3].trim()
      });
      continue;
    }

    // Tables (stat grid)
    if (trimmedLine.startsWith('|')) {
      inTable = true;
      // Skip header separator row
      if (trimmedLine.includes('---')) continue;

      const cells = trimmedLine.split('|').map(c => c.trim()).filter(c => c);
      if (cells.length >= 2) {
        tableRows.push({
          value: cells[0],
          label: cells[1],
          source: cells[2] || ''
        });
      }
      continue;
    }

    // CTA section buttons [Text](url)
    if (currentSection === 'cta') {
      const buttonMatch = trimmedLine.match(/^\[(.+?)\]\((.+?)\)$/);
      if (buttonMatch) {
        if (!blocks.find(b => b.type === 'cta-section')) {
          blocks.push({
            type: 'cta-section',
            prompt: '',
            buttons: []
          });
        }
        const cta = blocks.find(b => b.type === 'cta-section');
        cta.buttons.push({
          label: buttonMatch[1],
          link: buttonMatch[2],
          primary: cta.buttons.length === 0
        });
        continue;
      }
      // CTA prompt text
      if (trimmedLine && !trimmedLine.startsWith('[')) {
        const cta = blocks.find(b => b.type === 'cta-section');
        if (cta) {
          cta.prompt = trimmedLine;
        } else {
          blocks.push({
            type: 'cta-section',
            prompt: trimmedLine,
            buttons: []
          });
        }
        continue;
      }
    }

    // Sources section
    if (currentSection === 'sources') {
      if (trimmedLine.startsWith('- ')) {
        if (!blocks.find(b => b.type === 'sources')) {
          blocks.push({
            type: 'sources',
            sources: []
          });
        }
        blocks.find(b => b.type === 'sources').sources.push(trimmedLine.slice(2).trim());
        continue;
      }
    }

    // Regular paragraph text
    buffer.push(trimmedLine);
  }

  // Flush remaining buffer
  if (buffer.length > 0) {
    blocks.push(createParagraph(buffer.join(' ').trim()));
  }
  if (inList && listItems.length > 0) {
    blocks.push(createBulletList(listItems));
  }
  if (inQuote && quoteLines.length > 0) {
    blocks.push(createQuote(quoteLines));
  }

  // Clean up building flags
  blocks.forEach(b => delete b._building);

  // Ensure hero block exists
  if (!blocks.find(b => b.type === 'hero') && metadata.title) {
    blocks.unshift({
      type: 'hero',
      title: metadata.title,
      subtitle: metadata.subtitle || '',
      seriesLabel: metadata.seriesLabel || '',
      readingTime: metadata.readingTime || 10,
      date: metadata.date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      author: metadata.author || 'yellowCircle'
    });
  }

  return {
    metadata,
    blocks: blocks.filter(b => b !== null)
  };
}

function extractFrontmatter(content) {
  const metadata = {};

  if (!content.startsWith('---')) return metadata;

  const endIndex = content.indexOf('---', 3);
  if (endIndex === -1) return metadata;

  const frontmatter = content.slice(3, endIndex).trim();
  const lines = frontmatter.split('\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    // Parse arrays [item1, item2]
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(v => v.trim());
    }

    metadata[key] = value;
  }

  return metadata;
}

function createLeadParagraph(text) {
  // Try to extract highlight (first sentence or phrase before colon)
  const colonIndex = text.indexOf(':');
  if (colonIndex !== -1 && colonIndex < 50) {
    return {
      type: 'lead-paragraph',
      highlight: text.slice(0, colonIndex + 1),
      content: text.slice(colonIndex + 1).trim()
    };
  }

  // First sentence as highlight
  const sentenceEnd = text.search(/[.!?]/);
  if (sentenceEnd !== -1 && sentenceEnd < 100) {
    return {
      type: 'lead-paragraph',
      highlight: text.slice(0, sentenceEnd + 1),
      content: text.slice(sentenceEnd + 1).trim()
    };
  }

  return {
    type: 'lead-paragraph',
    highlight: '',
    content: text
  };
}

function createParagraph(text) {
  return {
    type: 'paragraph',
    content: text,
    muted: false
  };
}

function createBulletList(items) {
  return {
    type: 'bullet-list',
    items: items
  };
}

function createQuote(lines) {
  const fullText = lines.join(' ');

  // Check for attribution (— or - at end)
  const attrMatch = fullText.match(/(.+?)\s*[—–-]\s*(.+)$/);
  if (attrMatch) {
    return {
      type: 'quote',
      content: attrMatch[1].trim(),
      author: attrMatch[2].trim()
    };
  }

  return {
    type: 'quote',
    content: fullText,
    author: ''
  };
}

function createStatGrid(rows) {
  return {
    type: 'stat-grid',
    stats: rows.map(r => ({
      value: r.value,
      label: r.label,
      source: r.source
    }))
  };
}

function parsePersonaSection(lines, startIndex) {
  const persona = {
    role: '',
    description: '',
    cost: '',
    _linesConsumed: 0
  };

  let i = startIndex;
  while (i < lines.length) {
    const line = lines[i].trim();

    // Stop at next section
    if (line.startsWith('#')) break;
    if (line === '') {
      i++;
      continue;
    }

    if (line.startsWith('**Role:**')) {
      persona.role = line.slice(9).trim().replace(/\*\*/g, '');
    } else if (line.startsWith('**Cost:**')) {
      persona.cost = line.slice(9).trim().replace(/\*\*/g, '');
    } else if (!persona.description) {
      persona.description = line;
    }

    persona._linesConsumed++;
    i++;
  }

  return persona;
}

// ============================================================
// Slug Generator
// ============================================================

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

// ============================================================
// Output Handlers
// ============================================================

function outputConsole(article) {
  console.log('\n📝 Article Parser Results');
  console.log('========================\n');
  console.log(`Title: ${article.title}`);
  console.log(`Slug: ${article.slug}`);
  console.log(`Category: ${article.category}`);
  console.log(`Tags: ${article.tags?.join(', ') || 'none'}`);
  console.log(`Blocks: ${article.blocks.length}\n`);

  article.blocks.forEach((block, i) => {
    console.log(`Block ${i + 1}: ${block.type}`);
    Object.keys(block).forEach(key => {
      if (key === 'type') return;
      const value = block[key];
      const display = typeof value === 'object' ? JSON.stringify(value).slice(0, 60) + '...' : String(value).slice(0, 60);
      console.log(`  ${key}: ${display}`);
    });
    console.log('');
  });
}

function outputJSON(article, outputPath) {
  const json = JSON.stringify(article, null, 2);
  if (outputPath) {
    fs.writeFileSync(outputPath, json);
    console.log(`\n✅ Article saved to ${outputPath}`);
  } else {
    console.log(json);
  }
}

async function outputFirestore(article) {
  // Dynamic import for ES modules compatibility
  const admin = require('firebase-admin');

  // Initialize Firebase if not already
  if (!admin.apps.length) {
    // Try to use service account or default credentials
    try {
      const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');
      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      } else {
        admin.initializeApp({
          credential: admin.credential.applicationDefault()
        });
      }
    } catch (error) {
      console.error('Firebase initialization failed:', error.message);
      console.log('\nTo save to Firestore, either:');
      console.log('1. Run: firebase login');
      console.log('2. Or place firebase-service-account.json in project root');
      process.exit(1);
    }
  }

  const db = admin.firestore();

  // Create article document
  const articleData = {
    ...article,
    contentSource: 'blocks',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  const docRef = await db.collection('articles').add(articleData);

  console.log(`\n✅ Article saved to Firestore`);
  console.log(`   ID: ${docRef.id}`);
  console.log(`   Slug: ${article.slug}`);
  console.log(`   Status: ${article.status}`);
  console.log(`   Blocks: ${article.blocks.length}`);
  console.log(`\n   Preview: https://yellowcircle.io/thoughts/${article.slug}`);
  console.log(`   Edit: https://yellowcircle.io/admin/blocks/${docRef.id}`);

  return docRef.id;
}

// ============================================================
// AI Enhancement (Optional)
// ============================================================

async function enhanceWithAI(article, model = 'groq') {
  const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.log('⚠️  No API key found for AI enhancement, skipping...');
    return article;
  }

  console.log(`🤖 Enhancing content with ${model}...`);

  // Enhancement logic would go here
  // For now, return article unchanged
  return article;
}

// ============================================================
// Main CLI
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--input' || arg === '-i') {
      config.input = args[++i];
    } else if (arg === '--output' || arg === '-o') {
      config.output = args[++i];
    } else if (arg === '--enhance') {
      config.enhance = true;
    } else if (arg === '--model') {
      config.model = args[++i];
    } else if (arg === '--dry-run') {
      config.dryRun = true;
      config.output = 'console';
    } else if (arg === '--slug') {
      config.slug = args[++i];
    } else if (arg === '--status') {
      config.status = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Article Generator CLI

Usage: node generate.js [options]

Options:
  --input, -i      Input file path (md, json, txt) or - for stdin
  --output, -o     Output: firestore | json | console (default: console)
  --enhance        Use AI to expand/improve content
  --model          AI model: groq | gpt-4 | perplexity (default: groq)
  --dry-run        Preview blocks without saving
  --slug           Custom URL slug
  --status         Article status: draft | published (default: draft)
  --help, -h       Show this help

Examples:
  node generate.js --input article.md --output firestore
  cat article.md | node generate.js --input - --dry-run
  node generate.js --input article.md --enhance --output firestore
`);
      process.exit(0);
    }
  }

  // Read input
  let content;

  if (!config.input) {
    console.error('Error: --input required');
    process.exit(1);
  }

  if (config.input === '-') {
    // Read from stdin
    content = '';
    for await (const chunk of process.stdin) {
      content += chunk;
    }
  } else {
    if (!fs.existsSync(config.input)) {
      console.error(`Error: File not found: ${config.input}`);
      process.exit(1);
    }
    content = fs.readFileSync(config.input, 'utf-8');
  }

  // Parse content
  console.log('📖 Parsing content...');
  const { metadata, blocks } = parseMarkdown(content);

  // Build article object
  const article = {
    title: metadata.title || 'Untitled Article',
    slug: config.slug || metadata.slug || generateSlug(metadata.title || 'untitled'),
    excerpt: metadata.subtitle || metadata.excerpt || '',
    category: metadata.category || 'own-your-story',
    tags: metadata.tags || [],
    author: metadata.author || 'yellowCircle',
    readingTime: Math.max(1, Math.ceil(blocks.length * 1.5)),
    status: config.status,
    contentSource: 'blocks',
    blocks
  };

  // Validate
  if (!VALID_CATEGORIES.includes(article.category)) {
    console.warn(`⚠️  Unknown category: ${article.category}`);
    console.warn(`   Valid categories: ${VALID_CATEGORIES.join(', ')}`);
  }

  // Enhance with AI if requested
  let finalArticle = article;
  if (config.enhance) {
    finalArticle = await enhanceWithAI(article, config.model);
  }

  // Output
  switch (config.output) {
    case 'console':
      outputConsole(finalArticle);
      break;
    case 'json':
      outputJSON(finalArticle, config.input !== '-' ? config.input.replace(/\.(md|txt)$/, '.json') : null);
      break;
    case 'firestore':
      if (config.dryRun) {
        outputConsole(finalArticle);
      } else {
        await outputFirestore(finalArticle);
      }
      break;
    default:
      console.error(`Unknown output: ${config.output}`);
      process.exit(1);
  }
}

// Run
main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
