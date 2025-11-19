# Quick Start - Database Already Created

You've already created the Notion database. Here's how to get it syncing:

## Step 1: Get Your Database ID

1. Open your "yellowCircle Roadmap" database in Notion
2. Look at the URL in your browser:
   ```
   https://www.notion.so/workspace/abc123def456?v=xyz
                                   ^^^^^^^^^^^^
                                   This is your database ID
   ```
3. Copy everything between the last `/` and the `?v=`

**Example:**
- URL: `https://www.notion.so/myworkspace/1234567890abcdef?v=gallery`
- Database ID: `1234567890abcdef`

## Step 2: Get Your API Key

You should have this from creating the integration. If not:
1. Go to https://www.notion.so/my-integrations
2. Find "yellowCircle Automation" integration
3. Copy the "Internal Integration Token"

## Step 3: Share Database with Integration

**IMPORTANT:** The integration needs permission to access the database.

1. Open your "yellowCircle Roadmap" database in Notion
2. Click the `•••` menu (top right)
3. Click "Add connections"
4. Search for "yellowCircle Automation"
5. Click to add the integration

## Step 4: Configure .env

Tell me your:
- **API Key** (I'll add it to .env)
- **Database ID** (I'll add it to .env)

Or you can do it manually:
```bash
cd .claude/automation
cp .env.example .env
nano .env
```

Paste:
```
NOTION_API_KEY=your_api_key_here
NOTION_ROADMAP_DB_ID=your_database_id_here
```

## Step 5: Run Setup & Sync

```bash
cd .claude/automation
./setup.sh
npm run sync
```

---

**Ready? Share your API key and Database ID and I'll configure it for you.**
