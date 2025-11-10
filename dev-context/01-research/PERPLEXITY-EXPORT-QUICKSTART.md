# Perplexity Export - Quick Start Guide

## TL;DR - Execute Now

```bash
cd /Users/christophercooper/Dropbox/CC\ Projects/yellowcircle/yellow-circle
./dev-context/05-tasks/export-perplexity.sh your.email@example.com
```

**That's it.** Browser opens → enter email → enter auth code → automatic export.

---

## What This Does

✅ **Fully automated bulk export** of all Perplexity conversations
✅ **Outputs to**: `dev-context/01-research/perplexity-exports/`
✅ **Format**: Both JSON and Markdown files
✅ **Resumable**: Can interrupt and restart without re-downloading
✅ **Safe**: No credentials stored, email authentication only

---

## Solution: perplexport

**Tool**: [perplexport](https://github.com/leonid-shevtsov/perplexport) by Leonid Shevtsov
**Technology**: TypeScript + Puppeteer
**Status**: Active (2025), MIT licensed
**Reliability**: Community-tested, proven to work

---

## Two Ways to Run

### Option 1: Using the Script (Recommended)
```bash
./dev-context/05-tasks/export-perplexity.sh your.email@example.com
```

### Option 2: Direct Command
```bash
npx perplexport \
  -e your.email@example.com \
  -o dev-context/01-research/perplexity-exports \
  -d dev-context/01-research/perplexity-done.json
```

---

## What Happens

1. **Launch**: Puppeteer opens Chrome browser
2. **Navigate**: Goes to Perplexity login
3. **Authenticate**: You enter email, then auth code from your email
4. **Discover**: Finds all conversations in your library
5. **Extract**: Downloads each conversation (JSON + Markdown)
6. **Track**: Records progress in `perplexity-done.json`
7. **Complete**: All files saved to output directory

**Time**: ~5-10 minutes depending on conversation count

---

## Output Structure

```
dev-context/01-research/
├── perplexity-exports/
│   ├── conversation-1.json
│   ├── conversation-1.md
│   ├── conversation-2.json
│   ├── conversation-2.md
│   └── ...
└── perplexity-done.json  (progress tracker)
```

### JSON Format
Complete conversation data with all metadata, citations, timestamps.

### Markdown Format
Human-readable conversation with:
- Title and date
- User questions
- Assistant responses
- Citations with links
- Clean formatting

---

## If Interrupted

**Just re-run the same command.** The `perplexity-done.json` file tracks completed exports, so it will skip already-downloaded conversations and continue where it left off.

---

## Troubleshooting

### Browser doesn't launch
```bash
npx puppeteer browsers install chrome
```

### Can't find email auth code
- Check spam/junk folder
- Wait 1-2 minutes for delivery
- Request new code if needed

### Rate limited by Perplexity
- Script includes 3-second delays between requests
- If blocked, wait 30 minutes and re-run
- Progress is saved, won't re-download completed ones

---

## Why This Solution

| Feature | Console Script | perplexport |
|---------|---------------|-------------|
| **Works?** | ❌ No | ✅ Yes |
| **Automated?** | ❌ No | ✅ 95% |
| **Bulk export?** | ❌ No | ✅ Yes |
| **Resumable?** | ❌ No | ✅ Yes |
| **Maintained?** | ❌ No | ✅ Yes |

The original console script cannot work because:
1. Page navigation kills console execution
2. No export buttons in Perplexity UI to click
3. No way to persist state across pages

perplexport solves this with:
1. Puppeteer manages browser sessions
2. Direct data extraction from DOM/APIs
3. Progress tracking with resume capability

---

## Next Steps After Export

1. **Verify**: Check file count in output directory
2. **Review**: Open a few `.md` files to confirm quality
3. **Process**: Use for whatever purpose you need
4. **Backup**: Files are yours - copy/version control as needed
5. **Schedule**: Can set up cron job for regular backups

---

## Advanced Usage

### Export to custom location
```bash
npx perplexport -e your@email.com -o ~/Documents/perplexity-backup
```

### Custom progress file
```bash
npx perplexity -e your@email.com -d ~/custom-done.json
```

### Clone for modification
```bash
git clone https://github.com/leonid-shevtsov/perplexport.git
cd perplexport
yarn install
yarn start -e your@email.com
```

---

## Full Documentation

- **Detailed analysis**: `perplexity-programmatic-export-solution.md`
- **GitHub repo**: https://github.com/leonid-shevtsov/perplexport
- **Puppeteer docs**: https://pptr.dev/

---

## Support

**Tool issues**: Open issue on [perplexport GitHub](https://github.com/leonid-shevtsov/perplexport/issues)
**Perplexity issues**: Contact [Perplexity support](https://www.perplexity.ai/help-center)
**Node.js issues**: Install from [nodejs.org](https://nodejs.org/)

---

**Ready? Run this:**

```bash
./dev-context/05-tasks/export-perplexity.sh your.email@example.com
```
