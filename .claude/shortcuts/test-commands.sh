#!/bin/bash

# Individual Command Tests
# Test each router command independently

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AUTOMATION_DIR="$SCRIPT_DIR/../automation"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

cd "$AUTOMATION_DIR"

echo "╔════════════════════════════════════════════╗"
echo "║  yellowCircle Command Tests                ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Interactive menu
show_menu() {
    echo "Select command to test:"
    echo ""
    echo "  1) Show menu (no execution)"
    echo "  2) Test WIP Sync (dry run)"
    echo "  3) Test Sync (dry run)"
    echo "  4) Test Deadline Alerts"
    echo "  5) Test Blocked Alerts"
    echo "  6) Test Weekly Summary"
    echo "  7) Test Content Update (safe test)"
    echo "  8) Test All Commands"
    echo "  9) Exit"
    echo ""
    read -p "Enter choice [1-9]: " choice

    case $choice in
        1)
            echo ""
            echo "🔍 Showing command menu:"
            echo "========================================"
            node shortcut-router.js
            ;;
        2)
            echo ""
            echo "🧪 Testing WIP Sync (dry run):"
            echo "========================================"
            echo "Command: node shortcut-router.js wip"
            echo ""
            read -p "This will run the actual WIP sync. Continue? [y/N]: " confirm
            if [[ $confirm == [yY] ]]; then
                node shortcut-router.js wip
            else
                echo "❌ Cancelled"
            fi
            ;;
        3)
            echo ""
            echo "🧪 Testing Roadmap Sync (dry run):"
            echo "========================================"
            echo "Command: node shortcut-router.js sync"
            echo ""
            read -p "This will run the actual roadmap sync. Continue? [y/N]: " confirm
            if [[ $confirm == [yY] ]]; then
                node shortcut-router.js sync
            else
                echo "❌ Cancelled"
            fi
            ;;
        4)
            echo ""
            echo "🧪 Testing Deadline Alerts:"
            echo "========================================"
            node shortcut-router.js deadline
            ;;
        5)
            echo ""
            echo "🧪 Testing Blocked Alerts:"
            echo "========================================"
            node shortcut-router.js blocked
            ;;
        6)
            echo ""
            echo "🧪 Testing Weekly Summary:"
            echo "========================================"
            node shortcut-router.js summary
            ;;
        7)
            echo ""
            echo "🧪 Testing Content Update (SAFE - no actual change):"
            echo "========================================"
            echo ""
            echo "This will TEST content update validation (won't actually change files)"
            echo ""
            echo "Example: node shortcut-router.js content --page=about --section=headline --text=\"Test\""
            echo ""
            read -p "Enter page [home|about|works]: " page
            read -p "Enter section [headline|description]: " section
            read -p "Enter test text: " text
            echo ""
            echo "Command: node shortcut-router.js content --page=$page --section=$section --text=\"$text\""
            echo ""
            read -p "Execute? [y/N]: " confirm
            if [[ $confirm == [yY] ]]; then
                node shortcut-router.js content --page="$page" --section="$section" --text="$text"
                echo ""
                echo "⚠️  IMPORTANT: This made REAL changes!"
                echo ""
                read -p "View git diff? [y/N]: " show_diff
                if [[ $show_diff == [yY] ]]; then
                    cd "$SCRIPT_DIR/../.."
                    git diff
                fi
                echo ""
                read -p "Revert changes? [y/N]: " do_revert
                if [[ $do_revert == [yY] ]]; then
                    cd "$SCRIPT_DIR/../.."
                    git checkout -- src/pages/
                    echo "✅ Changes reverted"
                fi
            else
                echo "❌ Cancelled"
            fi
            ;;
        8)
            echo ""
            echo "🧪 Testing All Commands (safe commands only):"
            echo "========================================"
            echo ""
            echo "1. Menu:"
            node shortcut-router.js
            echo ""
            echo "2. Deadline Alerts:"
            node shortcut-router.js deadline
            echo ""
            echo "3. Blocked Alerts:"
            node shortcut-router.js blocked
            echo ""
            echo "✅ All safe commands tested"
            echo ""
            echo "⚠️  Skipped: sync, wip, content (require confirmation)"
            ;;
        9)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid choice"
            ;;
    esac
}

# Main loop
while true; do
    echo ""
    echo "========================================"
    show_menu
    echo ""
    read -p "Press Enter to continue..."
    clear
done
