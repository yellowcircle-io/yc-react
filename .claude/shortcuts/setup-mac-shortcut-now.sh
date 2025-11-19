#!/bin/bash

# Interactive Setup for yellowCircle 5-Action Shortcut
# Opens Shortcuts app and guides you through creation

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

clear

echo "╔══════════════════════════════════════════════════════╗"
echo "║  yellowCircle 5-Action Shortcut - Interactive Setup ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo -e "${CYAN}This will guide you through creating the shortcut in Shortcuts app${NC}"
echo ""

# Open Shortcuts app
echo -e "${BLUE}Step 1: Opening Shortcuts app...${NC}"
open -a "Shortcuts"
sleep 2

echo ""
echo -e "${GREEN}✅ Shortcuts app opened${NC}"
echo ""
echo "═══════════════════════════════════════════════════════"
echo ""
echo -e "${YELLOW}📝 FOLLOW THESE STEPS IN SHORTCUTS APP:${NC}"
echo ""

# Step 1
echo -e "${CYAN}STEP 1: Create New Shortcut${NC}"
echo "  1. Click the + button (top right)"
echo "  2. Click 'Add Action'"
echo ""
read -p "Press Enter when ready for Step 2..."
clear

# Step 2
echo ""
echo -e "${CYAN}STEP 2: Name Your Shortcut${NC}"
echo "  1. At the top, click 'Shortcut Name'"
echo "  2. Type: yellowCircle Command"
echo "  3. Press Enter"
echo ""
read -p "Press Enter when ready for Step 3..."
clear

# Step 3
echo ""
echo -e "${CYAN}STEP 3: Add Choose from Menu Action${NC}"
echo "  1. In the search box, type: Choose from Menu"
echo "  2. Double-click 'Choose from Menu' to add it"
echo "  3. Click 'Prompt' and change to: Select Command"
echo "  4. You'll see 'One' and 'Two' menu items"
echo ""
read -p "Press Enter when ready for Step 4..."
clear

# Step 4
echo ""
echo -e "${CYAN}STEP 4: Create 5 Menu Items${NC}"
echo "  Rename and add menu items:"
echo ""
echo "  1. Click 'One' → Rename to: Sync Roadmap"
echo "  2. Click 'Two' → Rename to: WIP Sync"
echo "  3. Click '+ Add Menu Item' → Name: Update Content"
echo "  4. Click '+ Add Menu Item' → Name: Check Deadlines"
echo "  5. Click '+ Add Menu Item' → Name: Weekly Summary"
echo ""
echo -e "${GREEN}You should now have 5 menu items!${NC}"
echo ""
read -p "Press Enter when ready for Step 5..."
clear

# Step 5
echo ""
echo -e "${CYAN}STEP 5: Add SSH Action for 'Sync Roadmap'${NC}"
echo ""
echo "  1. Under 'Sync Roadmap', click the search bar"
echo "  2. Type: Run Script Over SSH"
echo "  3. Double-click to add it"
echo "  4. Configure:"
echo -e "     Host: ${YELLOW}Christophers-Mac-mini.local${NC}"
echo "     Port: 22"
echo -e "     User: ${YELLOW}christopherwilliamson${NC}"
echo "     Password: [enter your Mac password - saves to keychain]"
echo ""
echo "  5. In the Script box, paste:"
echo ""
echo -e "${GREEN}cd ~/Library/CloudStorage/Dropbox/CC\\ Projects/yellowcircle/yellow-circle/.claude/automation && node shortcut-router.js sync${NC}"
echo ""
echo "  (Copy this to clipboard now if needed)"
echo ""
read -p "Press Enter when ready for Step 6..."

# Copy to clipboard
echo "cd ~/Library/CloudStorage/Dropbox/CC\\ Projects/yellowcircle/yellow-circle/.claude/automation && node shortcut-router.js sync" | pbcopy
echo ""
echo -e "${GREEN}✅ Script copied to clipboard!${NC}"
echo "  Just paste (Cmd+V) in Shortcuts app"
echo ""
sleep 2
clear

# Step 6
echo ""
echo -e "${CYAN}STEP 6: Add SSH Action for 'WIP Sync'${NC}"
echo ""
echo "  1. Under 'WIP Sync', add 'Run Script Over SSH'"
echo "  2. Same settings as before (host, user, password)"
echo "  3. Script:"
echo ""
echo -e "${GREEN}cd ~/Library/CloudStorage/Dropbox/CC\\ Projects/yellowcircle/yellow-circle/.claude/automation && node shortcut-router.js wip${NC}"
echo ""
read -p "Press Enter to copy to clipboard..."

echo "cd ~/Library/CloudStorage/Dropbox/CC\\ Projects/yellowcircle/yellow-circle/.claude/automation && node shortcut-router.js wip" | pbcopy
echo ""
echo -e "${GREEN}✅ Copied! Paste in Shortcuts app${NC}"
echo ""
read -p "Press Enter when ready for Step 7..."
clear

# Step 7
echo ""
echo -e "${CYAN}STEP 7: Add SSH Action for 'Update Content'${NC}"
echo ""
echo "  Script:"
echo ""
echo -e "${GREEN}cd ~/Library/CloudStorage/Dropbox/CC\\ Projects/yellowcircle/yellow-circle/.claude/automation && node shortcut-router.js content --page=about --section=headline --text=\"From iPhone\"${NC}"
echo ""
read -p "Press Enter to copy to clipboard..."

echo "cd ~/Library/CloudStorage/Dropbox/CC\\ Projects/yellowcircle/yellow-circle/.claude/automation && node shortcut-router.js content --page=about --section=headline --text=\"From iPhone\"" | pbcopy
echo ""
echo -e "${GREEN}✅ Copied! Paste in Shortcuts app${NC}"
echo ""
read -p "Press Enter when ready for Step 8..."
clear

# Step 8
echo ""
echo -e "${CYAN}STEP 8: Add SSH Action for 'Check Deadlines'${NC}"
echo ""
echo "  Script:"
echo ""
echo -e "${GREEN}cd ~/Library/CloudStorage/Dropbox/CC\\ Projects/yellowcircle/yellow-circle/.claude/automation && node shortcut-router.js deadline${NC}"
echo ""
read -p "Press Enter to copy to clipboard..."

echo "cd ~/Library/CloudStorage/Dropbox/CC\\ Projects/yellowcircle/yellow-circle/.claude/automation && node shortcut-router.js deadline" | pbcopy
echo ""
echo -e "${GREEN}✅ Copied! Paste in Shortcuts app${NC}"
echo ""
read -p "Press Enter when ready for Step 9..."
clear

# Step 9
echo ""
echo -e "${CYAN}STEP 9: Add SSH Action for 'Weekly Summary'${NC}"
echo ""
echo "  Script:"
echo ""
echo -e "${GREEN}cd ~/Library/CloudStorage/Dropbox/CC\\ Projects/yellowcircle/yellow-circle/.claude/automation && node shortcut-router.js summary${NC}"
echo ""
read -p "Press Enter to copy to clipboard..."

echo "cd ~/Library/CloudStorage/Dropbox/CC\\ Projects/yellowcircle/yellow-circle/.claude/automation && node shortcut-router.js summary" | pbcopy
echo ""
echo -e "${GREEN}✅ Copied! Paste in Shortcuts app${NC}"
echo ""
read -p "Press Enter when ready for Step 10..."
clear

# Step 10
echo ""
echo -e "${CYAN}STEP 10: Add to Siri${NC}"
echo ""
echo "  1. Click the ⓘ (info) button on your shortcut"
echo "  2. Click 'Add to Siri'"
echo "  3. Record phrase: 'yellowCircle command'"
echo "  4. Click 'Done'"
echo ""
read -p "Press Enter when ready for Step 11..."
clear

# Step 11
echo ""
echo -e "${CYAN}STEP 11: Test on Mac${NC}"
echo ""
echo "  1. Click your shortcut to run it"
echo "  2. Choose 'Check Deadlines' (safe to test)"
echo "  3. Verify SSH connects and executes"
echo ""
read -p "Press Enter when test is complete..."
clear

# Step 12
echo ""
echo -e "${CYAN}STEP 12: iCloud Sync to iPhone${NC}"
echo ""
echo -e "${YELLOW}⏱️  Waiting 30 seconds for iCloud sync...${NC}"
echo ""

for i in {30..1}; do
    echo -ne "  $i seconds remaining...\r"
    sleep 1
done

echo ""
echo -e "${GREEN}✅ iCloud sync complete!${NC}"
echo ""
read -p "Press Enter for final step..."
clear

# Final
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✅ Setup Complete!                                   ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Your yellowCircle shortcut is ready!${NC}"
echo ""
echo "📱 On Mac:"
echo "  - Run shortcut from Shortcuts app"
echo "  - Or use Siri: 'yellowCircle command'"
echo ""
echo "📱 On iPhone:"
echo "  1. Open Shortcuts app"
echo "  2. Pull to refresh if needed"
echo "  3. Find 'yellowCircle Command'"
echo "  4. Tap to run"
echo "  5. Or use Siri: 'Hey Siri, yellowCircle command'"
echo ""
echo "🧪 Test Commands:"
echo "  ✅ Check Deadlines (safe)"
echo "  ✅ Weekly Summary (safe)"
echo "  ⚠️  Sync Roadmap (modifies Notion)"
echo "  ⚠️  WIP Sync (modifies Notion)"
echo "  ⚠️  Update Content (modifies website)"
echo ""
echo "📚 Documentation:"
echo "  - Full guide: .claude/shortcuts/TOMORROW_QUICK_START.md"
echo "  - Testing: .claude/shortcuts/TESTING_CHECKLIST.md"
echo ""
echo -e "${CYAN}Verify shortcut is created:${NC}"
echo ""

# Verify
if shortcuts list | grep -i "yellowcircle" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Shortcut found in Mac Shortcuts!${NC}"
    echo ""
    shortcuts list | grep -i "yellowcircle"
else
    echo -e "${YELLOW}⚠️  Shortcut not found yet${NC}"
    echo "   It may take a moment to appear in CLI"
fi

echo ""
echo "🎉 Ready to use!"
echo ""
