#!/bin/bash
# Multi-Environment Sync Verification Script
# Last Updated: November 9, 2025

echo "🔍 Verifying Multi-Environment Sync Status..."
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Detect current machine
if [[ "$HOME" == *"christophercooper_1"* ]]; then
    MACHINE="Mac Mini"
elif [[ "$HOME" == *"christophercooper"* ]]; then
    MACHINE="MacBook Air"
else
    MACHINE="Unknown Machine"
fi

echo -e "${GREEN}Current Machine:${NC} $MACHINE"
echo ""

# Check Git Status
echo "📦 Git Status:"
echo "=============="
GIT_STATUS=$(git status --porcelain)
if [ -z "$GIT_STATUS" ]; then
    echo -e "${GREEN}✓ Working directory clean${NC}"
else
    echo -e "${YELLOW}⚠ Uncommitted changes:${NC}"
    git status -s
fi
echo ""

# Check if behind remote
echo "🌐 GitHub Sync Status:"
echo "====================="
git fetch origin main 2>/dev/null
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u})
BASE=$(git merge-base @ @{u})

if [ "$LOCAL" = "$REMOTE" ]; then
    echo -e "${GREEN}✓ Up to date with origin/main${NC}"
elif [ "$LOCAL" = "$BASE" ]; then
    echo -e "${YELLOW}⚠ Behind remote - run 'git pull'${NC}"
elif [ "$REMOTE" = "$BASE" ]; then
    echo -e "${YELLOW}⚠ Ahead of remote - run 'git push'${NC}"
else
    echo -e "${RED}✗ Diverged from remote - may need to rebase${NC}"
fi

# Show last commit
LAST_COMMIT=$(git log -1 --format="%h - %s (%ar)")
echo -e "Last commit: ${GREEN}$LAST_COMMIT${NC}"
echo ""

# Check critical files exist
echo "📄 Critical Files Check:"
echo "======================="

FILES=(
    ".claude/shared-context/WIP_CURRENT_CRITICAL.md"
    "dev-context/ROADMAP_CHECKLIST_NOV8_2025.md"
    "dev-context/PROJECT_ROADMAP_NOV2025.md"
    ".claude/MULTI_ENVIRONMENT_SYNC_GUIDE.md"
    "CLAUDE.md"
)

for FILE in "${FILES[@]}"; do
    if [ -f "$FILE" ]; then
        # Get last modified time
        if [[ "$OSTYPE" == "darwin"* ]]; then
            MODIFIED=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$FILE")
        else
            MODIFIED=$(stat -c "%y" "$FILE" | cut -d'.' -f1)
        fi
        echo -e "${GREEN}✓${NC} $FILE (modified: $MODIFIED)"
    else
        echo -e "${RED}✗${NC} $FILE ${RED}[MISSING]${NC}"
    fi
done
echo ""

# Check Dropbox sync (Mac only)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "☁️  Dropbox Sync Status:"
    echo "======================="

    # Check for official Dropbox path from config
    OFFICIAL_DROPBOX=""
    if [ -f "$HOME/.dropbox/info.json" ]; then
        OFFICIAL_DROPBOX=$(python3 -c "import json; print(json.load(open('$HOME/.dropbox/info.json'))['personal']['path'])" 2>/dev/null)
        if [ -n "$OFFICIAL_DROPBOX" ]; then
            echo -e "${GREEN}✓ Official Dropbox path: $OFFICIAL_DROPBOX${NC}"
        fi
    fi

    # Check if current directory is in official Dropbox path
    if [ -n "$OFFICIAL_DROPBOX" ] && [[ "$PWD" == "$OFFICIAL_DROPBOX"* ]]; then
        echo -e "${GREEN}✓ Project is in official Dropbox folder${NC}"

        # Check for .dropbox.cache to verify sync is active
        if [ -d "$OFFICIAL_DROPBOX/.dropbox.cache" ]; then
            echo -e "${GREEN}✓ Dropbox sync is active${NC}"
        else
            echo -e "${YELLOW}⚠ Dropbox sync status unclear${NC}"
        fi
    elif [[ "$PWD" == *"Dropbox"* ]]; then
        echo -e "${RED}✗ WARNING: Project is in Dropbox folder but NOT the official path!${NC}"
        echo -e "${RED}  Current: $PWD${NC}"
        echo -e "${RED}  Official: $OFFICIAL_DROPBOX${NC}"
        echo -e "${YELLOW}  ⚠ Files may not be syncing! Use official path.${NC}"
    else
        echo -e "${YELLOW}⚠ Project is NOT in Dropbox folder${NC}"
    fi

    # Detect multiple Dropbox locations
    if [ -d "$HOME/Dropbox" ] && [ -d "$HOME/Library/CloudStorage/Dropbox" ]; then
        echo -e "${YELLOW}⚠ Multiple Dropbox folders detected:${NC}"
        echo -e "  1. $HOME/Dropbox"
        echo -e "  2. $HOME/Library/CloudStorage/Dropbox"
        if [ -n "$OFFICIAL_DROPBOX" ]; then
            echo -e "${YELLOW}  → Use official path: $OFFICIAL_DROPBOX${NC}"
        fi
    fi
    echo ""
fi

# Check instance log exists for current machine
echo "📋 Instance Log Check:"
echo "====================="
if [ "$MACHINE" = "Mac Mini" ]; then
    LOG_FILE=".claude/INSTANCE_LOG_MacMini.md"
elif [ "$MACHINE" = "MacBook Air" ]; then
    LOG_FILE=".claude/INSTANCE_LOG_MacBookAir.md"
else
    LOG_FILE=""
fi

if [ -n "$LOG_FILE" ] && [ -f "$LOG_FILE" ]; then
    echo -e "${GREEN}✓${NC} Instance log exists: $LOG_FILE"
    # Show last 3 lines of log
    echo "Last update:"
    tail -3 "$LOG_FILE" | sed 's/^/  /'
else
    echo -e "${YELLOW}⚠${NC} No instance log found for $MACHINE"
fi
echo ""

# Quick status summary
echo "📊 Quick Status Summary:"
echo "======================="
echo -e "Machine: ${GREEN}$MACHINE${NC}"
echo -e "Repository: ${GREEN}$(basename $(git rev-parse --show-toplevel))${NC}"
echo -e "Branch: ${GREEN}$(git branch --show-current)${NC}"
echo -e "Commit: ${GREEN}$(git rev-parse --short HEAD)${NC}"
echo ""

# Recommendations
echo "💡 Recommendations:"
echo "=================="

if [ -n "$GIT_STATUS" ]; then
    echo "• Commit and push changes: git add . && git commit -m \"Update\" && git push"
fi

if [ "$LOCAL" != "$REMOTE" ]; then
    if [ "$LOCAL" = "$BASE" ]; then
        echo "• Pull latest changes: git pull"
    elif [ "$REMOTE" = "$BASE" ]; then
        echo "• Push local changes: git push"
    fi
fi

echo "• Update WIP status: vim .claude/shared-context/WIP_CURRENT_CRITICAL.md"
echo "• Check roadmap: cat dev-context/ROADMAP_CHECKLIST_NOV8_2025.md"
echo ""

echo -e "${GREEN}✓ Sync verification complete!${NC}"
