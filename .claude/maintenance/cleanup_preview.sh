#!/bin/bash

################################################################################
# Disk Space Cleanup Preview (DRY RUN)
# Generated: 2025-11-21
#
# This script shows what WOULD be deleted without actually deleting anything.
# Use this to review before running the actual cleanup script.
################################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

TOTAL_POTENTIAL=0

print_header() {
    echo -e "\n${BLUE}================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================${NC}\n"
}

get_size_mb() {
    if [ -e "$1" ]; then
        du -sm "$1" 2>/dev/null | awk '{print $1}'
    else
        echo "0"
    fi
}

get_size_human() {
    if [ -e "$1" ]; then
        du -sh "$1" 2>/dev/null | awk '{print $1}'
    else
        echo "N/A"
    fi
}

preview_item() {
    local path="$1"
    local description="$2"

    if [ -e "$path" ]; then
        local size=$(get_size_human "$path")
        local size_mb=$(get_size_mb "$path")
        TOTAL_POTENTIAL=$((TOTAL_POTENTIAL + size_mb))
        echo -e "  ${GREEN}✓${NC} $description"
        echo -e "    ${YELLOW}Path:${NC} $path"
        echo -e "    ${YELLOW}Size:${NC} $size"
        echo ""
    else
        echo -e "  ${RED}✗${NC} $description (not found)"
        echo ""
    fi
}

clear
print_header "Disk Space Cleanup Preview (DRY RUN)"

echo "Current disk usage:"
df -h / | grep -v Filesystem
echo ""
echo "~/Library size: $(get_size_human "$HOME/Library")"
echo ""

print_header "BROWSER CACHES (~7.6 GB)"
preview_item "$HOME/Library/Caches/Google/Chrome" "Chrome cache"
preview_item "$HOME/Library/Caches/Firefox" "Firefox cache"
preview_item "$HOME/Library/Caches/Microsoft Edge" "Edge cache"

print_header "CHROME PROFILES (~10 GB)"
echo "Chrome profiles that could be removed:"
for profile in "$HOME/Library/Application Support/Google/Chrome"/Profile* "$HOME/Library/Application Support/Google/Chrome/Default"; do
    if [ -d "$profile" ]; then
        profile_name=$(basename "$profile")
        size=$(get_size_human "$profile")
        size_mb=$(get_size_mb "$profile")
        if [ "$profile_name" != "Default" ]; then
            echo -e "  ${YELLOW}•${NC} $profile_name: $size"
        fi
    fi
done
echo ""
echo "NOTE: The cleanup script will let you choose which profiles to delete."
echo ""

print_header "ADOBE CACHES (~3.4 GB)"
preview_item "$HOME/Library/Caches/Adobe" "Adobe application caches"

print_header "DESKTOP INSTALLERS (~650 MB)"
echo "Installer files on Desktop:"
found_files=false
for file in "$HOME/Desktop"/*.dmg "$HOME/Desktop"/*.pkg; do
    if [ -f "$file" ]; then
        found_files=true
        filename=$(basename "$file")
        size=$(get_size_human "$file")
        echo -e "  ${YELLOW}•${NC} $filename: $size"
    fi
done
if [ "$found_files" = false ]; then
    echo -e "  ${GREEN}None found${NC}"
fi
echo ""

print_header "NODE_MODULES DIRECTORIES (~1.4 GB)"
preview_item "$HOME/email-dev/node_modules" "email-dev node_modules (809 MB)"
echo "NOTE: Yellow Circle node_modules will NOT be deleted (active project)"
echo ""

print_header "NPM & YARN CACHES (~2.4 GB)"
preview_item "$HOME/.npm" "npm cache"
preview_item "$HOME/Library/Caches/Yarn" "Yarn cache"
preview_item "$HOME/Library/Caches/ms-playwright" "Playwright browsers"

print_header "APPLICATION UPDATER CACHES (~1.2 GB)"
preview_item "$HOME/Library/Caches/com.teamviewer.TeamViewer" "TeamViewer cache"
preview_item "$HOME/Library/Caches/com.tinyspeck.slackmacgap.ShipIt" "Slack updater"
preview_item "$HOME/Library/Caches/termius-updater" "Termius updater"
preview_item "$HOME/Library/Application Support/Caches/clickup-desktop-updater" "ClickUp updater"
preview_item "$HOME/Library/Application Support/Caches/notion-updater" "Notion updater"

print_header "APPLICATION CONTAINERS (Selective)"
echo "These contain potentially important data - cleanup script will ask:"
echo ""
preview_item "$HOME/Library/Containers/com.tinyspeck.slackmacgap/Data/Library/Caches" "Slack cache"
preview_item "$HOME/Library/Containers/com.microsoft.teams2/Data/Library/Caches" "Teams cache"

print_header "STEAM (~1.0 GB)"
preview_item "$HOME/Library/Application Support/Steam" "Steam installation"

print_header "MISCELLANEOUS CACHES"
preview_item "$HOME/.cache" "User .cache directory"
preview_item "$HOME/Library/Application Support/Instruments" "Xcode Instruments data"

print_header "SUMMARY"
echo -e "${GREEN}Total potential space to reclaim: ~${TOTAL_POTENTIAL} MB (~$((TOTAL_POTENTIAL / 1024)) GB)${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Review this list carefully"
echo "  2. Run the actual cleanup script: ./cleanup_disk_space.sh"
echo "  3. The cleanup script will ask for confirmation before deleting each category"
echo ""
echo -e "${YELLOW}Safe to run:${NC} ./cleanup_disk_space.sh"
echo ""
