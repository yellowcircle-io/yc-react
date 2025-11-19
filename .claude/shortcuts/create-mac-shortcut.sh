#!/bin/bash

# Create Mac Shortcut for yellowCircle Commands
# This script creates a proper Mac shortcut using shortcuts-js and signs it

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/generated"

echo "╔════════════════════════════════════════════╗"
echo "║  Creating Mac yellowCircle Shortcut        ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Generate the shortcut
echo "📱 Generating shortcut..."
cd "$SCRIPT_DIR"
npm run generate

# Sign the main shortcut
echo ""
echo "✍️  Signing shortcut..."
cd "$OUTPUT_DIR"

if [ -f "yellowcircle-command-generated.shortcut" ]; then
    shortcuts sign \
        -i "yellowcircle-command-generated.shortcut" \
        -o "yellowcircle-command-signed.shortcut" \
        -m anyone

    echo "✅ Signed: yellowcircle-command-signed.shortcut"
else
    echo "❌ Error: yellowcircle-command-generated.shortcut not found"
    exit 1
fi

# Import the shortcut
echo ""
echo "📲 Importing to Mac Shortcuts app..."

# Get absolute path
SHORTCUT_PATH="$(pwd)/yellowcircle-command-signed.shortcut"

# Import via URL scheme
open "shortcuts://import-shortcut/?url=file://$SHORTCUT_PATH&name=yellowCircle%20Command&silent=false"

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║  Shortcut Created!                         ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "✅ Shortcut imported to Mac Shortcuts app"
echo "✅ Will auto-sync to iPhone via iCloud (10-30 sec)"
echo ""
echo "📱 To use:"
echo "   1. Open Shortcuts app on Mac"
echo "   2. Find 'yellowCircle Command' shortcut"
echo "   3. Wait 30 seconds for iCloud sync"
echo "   4. Check iPhone Shortcuts app"
echo ""
echo "🗣️  To add Siri:"
echo "   1. Right-click shortcut → Details"
echo "   2. Click 'Add to Siri'"
echo "   3. Record phrase: 'yellowCircle command'"
echo ""

# Test the shortcut
echo "🧪 Testing shortcut..."
echo ""
shortcuts list | grep -i "yellowcircle" || echo "⚠️  Shortcut not yet visible (may take a moment)"

echo ""
echo "✅ Setup complete!"
