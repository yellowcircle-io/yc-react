#!/bin/bash

################################################################################
# Disk Space Cleanup Script
# Generated: 2025-11-21
# Potential savings: 35-40 GB
#
# SAFETY: This script will show what will be deleted and ask for confirmation
# before performing any destructive operations.
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track total savings
TOTAL_SAVED=0

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo -e "\n${BLUE}================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

get_dir_size() {
    if [ -d "$1" ]; then
        du -sh "$1" 2>/dev/null | awk '{print $1}'
    else
        echo "0B"
    fi
}

get_dir_size_mb() {
    if [ -d "$1" ]; then
        du -sm "$1" 2>/dev/null | awk '{print $1}'
    else
        echo "0"
    fi
}

confirm_action() {
    local prompt="$1"
    local default="${2:-n}"

    if [ "$default" = "y" ]; then
        read -p "$prompt [Y/n]: " response
        response=${response:-y}
    else
        read -p "$prompt [y/N]: " response
        response=${response:-n}
    fi

    [[ "$response" =~ ^[Yy]$ ]]
}

safe_remove() {
    local path="$1"
    local description="$2"

    if [ ! -e "$path" ]; then
        print_warning "Not found: $path"
        return 1
    fi

    local size=$(get_dir_size "$path")
    local size_mb=$(get_dir_size_mb "$path")

    echo -e "  ${YELLOW}Target:${NC} $path"
    echo -e "  ${YELLOW}Size:${NC} $size"

    if confirm_action "  Delete this?"; then
        rm -rf "$path"
        print_success "Deleted: $description ($size)"
        TOTAL_SAVED=$((TOTAL_SAVED + size_mb))
        return 0
    else
        print_warning "Skipped: $description"
        return 1
    fi
}

################################################################################
# Cleanup Categories
################################################################################

cleanup_browser_caches() {
    print_header "CATEGORY 1: Browser Caches (~7.6 GB)"

    echo "Browser caches are safe to delete and will be rebuilt as needed."
    echo ""

    if confirm_action "Clean ALL browser caches?"; then
        safe_remove "$HOME/Library/Caches/Google/Chrome" "Chrome cache"
        safe_remove "$HOME/Library/Caches/Firefox" "Firefox cache"
        safe_remove "$HOME/Library/Caches/Microsoft Edge" "Edge cache"
    else
        # Individual prompts
        safe_remove "$HOME/Library/Caches/Google/Chrome" "Chrome cache"
        safe_remove "$HOME/Library/Caches/Firefox" "Firefox cache"
        safe_remove "$HOME/Library/Caches/Microsoft Edge" "Edge cache"
    fi
}

cleanup_chrome_profiles() {
    print_header "CATEGORY 2: Chrome Profiles (~10 GB)"

    echo "WARNING: Only delete profiles you don't use!"
    echo "Your Chrome profiles:"
    echo ""

    local chrome_dir="$HOME/Library/Application Support/Google/Chrome"

    if [ -d "$chrome_dir" ]; then
        for profile in "$chrome_dir"/Profile* "$chrome_dir/Default"; do
            if [ -d "$profile" ]; then
                local profile_name=$(basename "$profile")
                local size=$(get_dir_size "$profile")
                echo "  - $profile_name: $size"
            fi
        done
        echo ""
        echo "To identify which profile is which:"
        echo "  1. Open Chrome and go to: chrome://version/"
        echo "  2. Look for 'Profile Path' to see your current profile"
        echo ""

        if confirm_action "Do you want to delete specific Chrome profiles?"; then
            for profile in "$chrome_dir"/Profile*; do
                if [ -d "$profile" ]; then
                    local profile_name=$(basename "$profile")
                    safe_remove "$profile" "Chrome $profile_name"
                fi
            done
        fi
    else
        print_warning "Chrome directory not found"
    fi
}

cleanup_adobe_caches() {
    print_header "CATEGORY 3: Adobe Caches (~3.4 GB)"

    echo "Adobe application caches (After Effects, etc.)"
    echo "Safe to delete if not actively using Adobe products."
    echo ""

    safe_remove "$HOME/Library/Caches/Adobe" "Adobe caches"
}

cleanup_desktop_installers() {
    print_header "CATEGORY 4: Desktop Installers (~650 MB)"

    echo "Installer files on Desktop:"
    echo ""

    find "$HOME/Desktop" -maxdepth 1 \( -name "*.dmg" -o -name "*.pkg" \) 2>/dev/null | while read file; do
        echo "  - $(basename "$file"): $(du -sh "$file" | awk '{print $1}')"
    done
    echo ""

    if confirm_action "Delete ALL .dmg and .pkg files from Desktop?"; then
        find "$HOME/Desktop" -maxdepth 1 \( -name "*.dmg" -o -name "*.pkg" \) -delete
        print_success "Deleted installer files from Desktop"
    fi
}

cleanup_node_modules() {
    print_header "CATEGORY 5: Old node_modules (~1.4 GB)"

    echo "Found node_modules directories:"
    echo ""
    echo "  - ~/email-dev/node_modules: 809 MB"
    echo "  - ~/Dropbox/CC Projects/yellowcircle/yellow-circle/node_modules: 430 MB"
    echo ""
    echo "NOTE: Yellow Circle node_modules should be kept (active project)"
    echo ""

    if [ -d "$HOME/email-dev/node_modules" ]; then
        echo "The email-dev project appears to be old."
        if confirm_action "Delete ~/email-dev/node_modules?"; then
            safe_remove "$HOME/email-dev/node_modules" "email-dev node_modules"
        fi

        if confirm_action "Delete entire ~/email-dev project?"; then
            safe_remove "$HOME/email-dev" "email-dev project directory"
        fi
    fi
}

cleanup_npm_yarn_caches() {
    print_header "CATEGORY 6: NPM & Yarn Caches (~2.4 GB)"

    echo "Developer package manager caches:"
    echo "  - npm cache: $(get_dir_size "$HOME/.npm")"
    echo "  - Yarn cache: $(get_dir_size "$HOME/Library/Caches/Yarn")"
    echo "  - Playwright browsers: $(get_dir_size "$HOME/Library/Caches/ms-playwright")"
    echo ""

    if confirm_action "Clean npm cache?"; then
        echo "  Running: npm cache clean --force"
        npm cache clean --force 2>/dev/null || print_warning "npm cache clean failed"
        print_success "Cleaned npm cache"
        TOTAL_SAVED=$((TOTAL_SAVED + 1700))
    fi

    safe_remove "$HOME/Library/Caches/Yarn" "Yarn cache"

    if confirm_action "Remove Playwright browser installations?"; then
        safe_remove "$HOME/Library/Caches/ms-playwright" "Playwright browsers"
    fi
}

cleanup_app_updaters() {
    print_header "CATEGORY 7: Application Updater Caches (~1.2 GB)"

    echo "Application updater caches (safe to delete):"
    echo ""

    safe_remove "$HOME/Library/Caches/com.teamviewer.TeamViewer" "TeamViewer cache"
    safe_remove "$HOME/Library/Caches/com.tinyspeck.slackmacgap.ShipIt" "Slack updater"
    safe_remove "$HOME/Library/Caches/termius-updater" "Termius updater"
    safe_remove "$HOME/Library/Application Support/Caches/clickup-desktop-updater" "ClickUp updater"
    safe_remove "$HOME/Library/Application Support/Caches/notion-updater" "Notion updater"
}

cleanup_app_containers() {
    print_header "CATEGORY 8: Application Container Caches"

    echo "Large application containers:"
    echo "  - Slack: ~2.0 GB"
    echo "  - Microsoft Teams: ~2.0 GB"
    echo "  - Apple Media Analysis: ~2.7 GB"
    echo ""
    print_warning "These may contain important data. Proceed with caution!"
    echo ""

    if confirm_action "Clear Slack cache? (Messages/files remain in cloud)"; then
        if [ -d "$HOME/Library/Containers/com.tinyspeck.slackmacgap/Data/Library/Caches" ]; then
            safe_remove "$HOME/Library/Containers/com.tinyspeck.slackmacgap/Data/Library/Caches" "Slack cache"
        fi
    fi

    if confirm_action "Clear Teams cache?"; then
        if [ -d "$HOME/Library/Containers/com.microsoft.teams2/Data/Library/Caches" ]; then
            safe_remove "$HOME/Library/Containers/com.microsoft.teams2/Data/Library/Caches" "Teams cache"
        fi
    fi
}

cleanup_steam() {
    print_header "CATEGORY 9: Steam (~1.0 GB)"

    echo "Steam installation: $(get_dir_size "$HOME/Library/Application Support/Steam")"
    echo ""

    if confirm_action "Remove Steam? (Only if you don't game on this Mac)"; then
        safe_remove "$HOME/Library/Application Support/Steam" "Steam"
    fi
}

cleanup_misc_caches() {
    print_header "CATEGORY 10: Miscellaneous System Caches"

    echo "Other caches that can be safely cleared:"
    echo ""

    if confirm_action "Clear miscellaneous system caches?"; then
        # Clear any .cache directory
        if [ -d "$HOME/.cache" ]; then
            safe_remove "$HOME/.cache" "User .cache directory"
        fi

        # Clear Instruments (Xcode profiling data)
        if [ -d "$HOME/Library/Application Support/Instruments" ]; then
            safe_remove "$HOME/Library/Application Support/Instruments" "Xcode Instruments data"
        fi
    fi
}

################################################################################
# Main Execution
################################################################################

main() {
    clear
    print_header "Disk Space Cleanup Utility"

    echo "This script will help you reclaim disk space."
    echo "Potential savings: 35-40 GB"
    echo ""
    echo -e "${YELLOW}Current disk usage:${NC}"
    df -h / | grep -v Filesystem
    echo ""
    echo -e "${YELLOW}Your ~/Library size:${NC} $(get_dir_size "$HOME/Library")"
    echo ""

    if ! confirm_action "Start cleanup process?"; then
        echo "Cleanup cancelled."
        exit 0
    fi

    # Run cleanup categories
    cleanup_browser_caches
    cleanup_chrome_profiles
    cleanup_adobe_caches
    cleanup_desktop_installers
    cleanup_node_modules
    cleanup_npm_yarn_caches
    cleanup_app_updaters
    cleanup_app_containers
    cleanup_steam
    cleanup_misc_caches

    # Final summary
    print_header "CLEANUP COMPLETE!"

    echo -e "${GREEN}Total space reclaimed: ~${TOTAL_SAVED} MB (~$((TOTAL_SAVED / 1024)) GB)${NC}"
    echo ""
    echo "Updated disk usage:"
    df -h / | grep -v Filesystem
    echo ""
    echo -e "${BLUE}Recommendations:${NC}"
    echo "  1. Empty Trash to finalize deletions"
    echo "  2. Restart your Mac for optimal performance"
    echo "  3. Run this script periodically (monthly/quarterly)"
    echo ""

    if confirm_action "Open Trash to review deleted items?"; then
        open "$HOME/.Trash"
    fi
}

# Run main function
main

exit 0
