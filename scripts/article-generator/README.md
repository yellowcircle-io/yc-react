# Article Generator Framework

Programmatic article creation for the yellowCircle Block CMS.

## Overview

This framework enables article creation via:
1. **CLI Script** - Direct Node.js execution
2. **n8n Webhook** - HTTP endpoint for automation
3. **SSH Shortcuts** - iPhone/mobile execution
4. **AI Enhancement** - Perplexity/GPT content enrichment

## Quick Start

```bash
# From project root
cd scripts/article-generator

# Generate article from markdown (dry run first)
node generate.cjs --input article.md --dry-run

# Generate article and save to Firestore
node generate.cjs --input article.md --output firestore

# Generate with AI enhancement
node generate.cjs --input article.md --enhance --output firestore

# Pipe from stdin
cat article.md | node generate.cjs --input - --output firestore
```

## Input Formats

### 1. Markdown Format (Recommended)

```markdown
---
title: Your Article Title
subtitle: The subtitle or tagline
category: own-your-story
tags: [gtm, strategy, operations]
author: yellowCircle
---

# Section Title

Opening paragraph with **bold** and *italic* text.

## 01. First Section Header

Regular paragraph content here.

> "This is a quote"
> — Attribution Name

- Bullet point one
- Bullet point two
- Bullet point three

1. Numbered item with title: Description here
2. Another numbered item: More description

### Stats

| Value | Label | Source |
|-------|-------|--------|
| 68% | of MarTech unused | Gartner 2024 |
| $30B | wasted annually | Zylo Report |

### Persona: Alex

**Role:** Marketing Operations Manager

Description of this persona and their situation.

**Cost:** The impact they experience.

---

## Call to Action

Ready to take action?

[Primary Button](/assessment)
[Secondary Button](/services)

## Sources

- Source 1, Year
- Source 2, Year
```

### 2. JSON Format

```json
{
  "title": "Article Title",
  "subtitle": "Subtitle",
  "category": "own-your-story",
  "tags": ["gtm", "strategy"],
  "sections": [
    {
      "type": "intro",
      "highlight": "Opening hook:",
      "content": "Main paragraph text"
    },
    {
      "type": "section",
      "number": "01",
      "title": "Section Title",
      "content": "Section content..."
    }
  ]
}
```

### 3. Plain Text Format

```
TITLE: Your Article Title
SUBTITLE: The subtitle
CATEGORY: own-your-story
TAGS: gtm, strategy, operations

---

SECTION: 01. First Section Header

Your content here. Paragraphs separated by blank lines.

QUOTE: "The quoted text" — Attribution

STATS:
- 68%: of MarTech unused (Gartner 2024)
- $30B: wasted annually (Zylo Report)

BULLETS:
- First point
- Second point

CTA: Ready to act?
PRIMARY: Take Assessment | /assessment
SECONDARY: View Services | /services
```

## CLI Options

```bash
node generate.js [options]

Options:
  --input, -i      Input file path (md, json, or txt)
  --output, -o     Output destination: firestore | json | console
  --enhance        Use AI to expand/improve content
  --model          AI model: perplexity | gpt-4 | groq (default: groq)
  --dry-run        Preview blocks without saving
  --slug           Custom URL slug (auto-generated if omitted)
  --status         Article status: draft | published (default: draft)
```

## Integration Methods

### n8n Webhook Integration

1. Create webhook node in n8n
2. Configure endpoint: `POST /api/articles/generate`
3. Send payload:

```json
{
  "content": "# Article Title\n\nContent here...",
  "format": "markdown",
  "enhance": true,
  "status": "draft"
}
```

### SSH Shortcut (iPhone)

```bash
# Quick article from clipboard
pbpaste | ssh user@mac "cd /path/to/yellow-circle && node scripts/article-generator/generate.js --input - --output firestore"

# From file on device
cat article.md | ssh user@mac "cd /path/to/yellow-circle && node scripts/article-generator/generate.js --input - --output firestore --enhance"
```

### Perplexity Research → Article

1. Query Perplexity for research
2. Export response as markdown
3. Pipe to generator with enhancement

```bash
# Perplexity CLI (if available)
perplexity "Research GTM strategy failures 2024" --output research.md
node generate.js --input research.md --enhance --output firestore
```

## Block Mapping Rules

| Markdown Pattern | Block Type |
|-----------------|------------|
| YAML frontmatter | Article metadata |
| `# Title` (h1) | `hero` block |
| `## NN. Title` | `section-header` block |
| First paragraph after h1 | `lead-paragraph` block |
| Regular paragraph | `paragraph` block |
| `> quote` with `— author` | `quote` block |
| `- item` list | `bullet-list` block |
| `1. title: desc` | `numbered-list` block |
| Table with Value/Label/Source | `stat-grid` block |
| `### Persona: Name` section | `persona-card` block |
| `### Stats` section | `stat-grid` block |
| `## Call to Action` | `cta-section` block |
| `## Sources` | `sources` block |
| `[Button Text](url)` in CTA | CTA buttons |

## AI Enhancement Options

### Content Expansion
- Expands bullet points into full paragraphs
- Adds supporting data and statistics
- Generates relevant quotes

### Research Integration
- Queries Perplexity for current data
- Validates statistics with sources
- Suggests additional sections

### Voice Alignment
- Applies yellowCircle brand voice
- Maintains confrontational/honest tone
- Ensures consistent terminology

## Environment Variables

```bash
# .env file in scripts/article-generator/
GROQ_API_KEY=gsk_...           # Free AI enhancement
OPENAI_API_KEY=sk-...          # GPT-4 enhancement
PERPLEXITY_API_KEY=pplx-...    # Research queries

# Firebase (uses project config)
# No additional config needed if running from project root
```

## Output Examples

### Console Output (--dry-run)

```
📝 Article Parser Results
========================

Title: Why Your GTM Sucks
Slug: why-your-gtm-sucks
Category: own-your-story
Blocks: 15

Block 1: hero
  title: Why Your GTM Sucks
  subtitle: The Human Cost of Operations Theater

Block 2: lead-paragraph
  highlight: Let's be direct:
  content: Your go-to-market operations are likely failing...

Block 3: section-header
  number: 01
  title: The Numbers Don't Lie

...
```

### Firestore Output

```
✅ Article saved to Firestore
   ID: abc123xyz
   Slug: why-your-gtm-sucks
   Status: draft
   Blocks: 15

   Preview: https://yellowcircle.io/thoughts/why-your-gtm-sucks
   Edit: https://yellowcircle.io/admin/blocks/abc123xyz
```

## Troubleshooting

### Common Issues

**"Invalid markdown format"**
- Ensure YAML frontmatter has `---` delimiters
- Check for proper heading hierarchy

**"AI enhancement failed"**
- Verify API key in .env
- Check rate limits
- Try `--model groq` (free tier)

**"Firebase permission denied"**
- Run `firebase login` first
- Ensure admin access to project

### Validation Errors

The generator validates:
- Required fields (title, category)
- Valid category IDs
- Block structure integrity
- Slug uniqueness

## File Reference

```
scripts/article-generator/
├── README.md                  # This file
├── generate.cjs               # Main CLI script (CommonJS)
├── n8n-webhook-handler.cjs    # n8n/Firebase webhook handler
├── ssh-shortcuts.md           # iPhone SSH command reference
├── templates/
│   └── thought-leadership.md  # Article template
└── .env.example               # Environment template
```
