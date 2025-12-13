# SSH Shortcuts for Article Generation

Quick commands for creating articles via SSH from iPhone or any terminal.

## Prerequisites

1. SSH access to Mac Mini/MacBook
2. Node.js installed on target machine
3. Project cloned to target machine

## Quick Reference

### Create Article from Clipboard (Mac)

```bash
# On Mac - paste clipboard content as article
pbpaste | ssh mac-mini "cd ~/Dropbox/CC\ Projects/yellowcircle/yellow-circle && node scripts/article-generator/generate.js --input - --output firestore"
```

### Create Article from File

```bash
# Send local file to remote and generate
cat article.md | ssh mac-mini "cd ~/Dropbox/CC\ Projects/yellowcircle/yellow-circle && node scripts/article-generator/generate.js --input - --output firestore"
```

### Dry Run (Preview Only)

```bash
pbpaste | ssh mac-mini "cd ~/Dropbox/CC\ Projects/yellowcircle/yellow-circle && node scripts/article-generator/generate.js --input - --dry-run"
```

### With AI Enhancement

```bash
pbpaste | ssh mac-mini "cd ~/Dropbox/CC\ Projects/yellowcircle/yellow-circle && node scripts/article-generator/generate.js --input - --enhance --output firestore"
```

---

## iPhone Shortcuts Setup

### Shortcut 1: Quick Article (Clipboard)

**Name:** "Create Article"

**Actions:**
1. Get Clipboard
2. Run Script over SSH:
   ```
   Host: [your-mac-ip]
   User: [your-username]
   Script:
   cd ~/Dropbox/CC\ Projects/yellowcircle/yellow-circle
   echo '[clipboard]' | node scripts/article-generator/generate.js --input - --output firestore
   ```
3. Show Result

### Shortcut 2: Article from Notes

**Name:** "Publish Note as Article"

**Actions:**
1. Get Contents of Note (Ask Each Time)
2. Run Script over SSH:
   ```
   cd ~/Dropbox/CC\ Projects/yellowcircle/yellow-circle
   echo '[note-content]' | node scripts/article-generator/generate.js --input - --output firestore
   ```
3. Show Result

### Shortcut 3: Preview Article

**Name:** "Preview Article"

**Actions:**
1. Get Clipboard
2. Run Script over SSH:
   ```
   cd ~/Dropbox/CC\ Projects/yellowcircle/yellow-circle
   echo '[clipboard]' | node scripts/article-generator/generate.js --input - --dry-run
   ```
3. Show Result (block preview)

---

## One-Liner SSH Commands

### Basic Commands

```bash
# Alias for convenience (add to ~/.zshrc or ~/.bashrc)
alias yc-article='ssh mac-mini "cd ~/Dropbox/CC\ Projects/yellowcircle/yellow-circle && node scripts/article-generator/generate.js"'

# Then use:
cat article.md | yc-article --input - --output firestore
```

### Create Draft Article

```bash
ssh mac-mini 'cd ~/Dropbox/CC\ Projects/yellowcircle/yellow-circle && cat << "EOF" | node scripts/article-generator/generate.js --input - --output firestore
---
title: My New Article
subtitle: A quick thought
category: own-your-story
---

# My New Article

Opening paragraph here.

## 01. First Section

Content of first section.
EOF'
```

### Create from Perplexity Research

```bash
# Step 1: Query Perplexity (manual or via API)
# Step 2: Copy response to clipboard
# Step 3: Generate article

pbpaste | ssh mac-mini 'cd ~/Dropbox/CC\ Projects/yellowcircle/yellow-circle && node scripts/article-generator/generate.js --input - --enhance --output firestore'
```

---

## Full iPhone Shortcut (Copy-Paste Ready)

### "yellowCircle Article"

```
Name: yellowCircle Article
Icon: 📝 (yellow)

Actions:

1. Menu
   - "From Clipboard"
   - "From Notes"
   - "Preview Only"

2. If "From Clipboard":
   - Get Clipboard
   - Set Variable: content

3. If "From Notes":
   - Get Contents of Note
   - Set Variable: content

4. If "Preview Only":
   - Get Clipboard
   - Set Variable: content
   - Set Variable: dryrun = "--dry-run"

5. Run Script over SSH:
   Host: [MAC_IP]
   User: [USERNAME]
   Authentication: SSH Key
   Script:
   cd "~/Library/CloudStorage/Dropbox/CC Projects/yellowcircle/yellow-circle"
   echo '[content]' | node scripts/article-generator/generate.js --input - [dryrun] --output firestore

6. Show Result
```

---

## Troubleshooting

### "Permission denied"

```bash
# Ensure SSH key is set up
ssh-copy-id mac-mini

# Or use password auth
ssh -o PreferredAuthentications=password mac-mini
```

### "Node not found"

```bash
# Full path to node
/usr/local/bin/node scripts/article-generator/generate.js ...

# Or source profile first
source ~/.zshrc && node scripts/article-generator/generate.js ...
```

### "Firebase error"

```bash
# Login to Firebase first (one time)
ssh mac-mini "cd ~/Dropbox/CC\ Projects/yellowcircle/yellow-circle && firebase login"
```

### Path Issues

```bash
# Use escaped spaces for Dropbox path
cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle

# Or quoted path
cd "~/Library/CloudStorage/Dropbox/CC Projects/yellowcircle/yellow-circle"
```

---

## Environment Variables

Set these on the target machine for AI enhancement:

```bash
# Add to ~/.zshrc or ~/.bashrc on Mac Mini
export GROQ_API_KEY="gsk_..."
export OPENAI_API_KEY="sk_..."
export PERPLEXITY_API_KEY="pplx-..."
```

---

## Quick Test

Test the setup with this command:

```bash
ssh mac-mini 'cd ~/Library/CloudStorage/Dropbox/CC\ Projects/yellowcircle/yellow-circle && echo "---
title: Test Article
category: own-your-story
---
# Test Article
This is a test." | node scripts/article-generator/generate.js --input - --dry-run'
```

Expected output:
```
📖 Parsing content...

📝 Article Parser Results
========================

Title: Test Article
Slug: test-article
Category: own-your-story
Blocks: 2

Block 1: hero
  title: Test Article
...
```
