#!/bin/bash

echo "🚀 yellowCircle Automation Setup"
echo "================================"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed"
    echo "   Install Node.js from: https://nodejs.org"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo "✅ npm found: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Error installing dependencies"
    exit 1
fi

echo ""
echo "✅ Dependencies installed"
echo ""

# Check for .env file
if [ ! -f .env ]; then
    echo "⚠️  No .env file found"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Copy .env.example to .env:"
    echo "      cp .env.example .env"
    echo ""
    echo "   2. Edit .env with your Notion API credentials:"
    echo "      nano .env"
    echo ""
    echo "   3. Follow README.md for Notion setup instructions"
    echo ""
else
    echo "✅ .env file found"
    echo ""

    # Check if env vars are set
    source .env

    if [ -z "$NOTION_API_KEY" ] || [ "$NOTION_API_KEY" == "secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxx" ]; then
        echo "⚠️  NOTION_API_KEY not configured in .env"
        echo "   Update .env with your Notion API key"
        echo ""
    else
        echo "✅ NOTION_API_KEY configured"
    fi

    if [ -z "$NOTION_ROADMAP_DB_ID" ] || [ "$NOTION_ROADMAP_DB_ID" == "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" ]; then
        echo "⚠️  NOTION_ROADMAP_DB_ID not configured in .env"
        echo "   Update .env with your Notion database ID"
        echo ""
    else
        echo "✅ NOTION_ROADMAP_DB_ID configured"
    fi

    if [ ! -z "$NOTION_API_KEY" ] && [ "$NOTION_API_KEY" != "secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxx" ] && [ ! -z "$NOTION_ROADMAP_DB_ID" ] && [ "$NOTION_ROADMAP_DB_ID" != "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" ]; then
        echo ""
        echo "🎉 Setup complete!"
        echo ""
        echo "📋 Next steps:"
        echo "   1. Test connection (dry run):"
        echo "      npm run sync:dry-run"
        echo ""
        echo "   2. Run actual sync:"
        echo "      npm run sync"
        echo ""
    fi
fi

echo "📖 For full setup instructions, see README.md"
