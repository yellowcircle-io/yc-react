#!/bin/bash
# ==============================================================================
# UnityNOTES Staging Deployment Script
# ==============================================================================
# Builds the production bundle, deploys to Firebase preview channel, and
# notifies the team via Slack with comprehensive deployment information.
#
# Usage:
#   ./scripts/deploy-unitynotes.sh [--skip-build] [--skip-slack]
#
# Requirements:
#   - Firebase CLI installed and authenticated (firebase login)
#   - Node.js and npm installed
#   - SLACK_BOT_TOKEN set in .env file
#
# Features:
#   ✓ Builds production bundle with npm run build
#   ✓ Deploys to Firebase hosting channel "unitynotes-test" (reusable)
#   ✓ 3-day expiration to minimize costs
#   ✓ Extracts staging URL automatically
#   ✓ Posts formatted Slack notification to C09UQGASA2C
#   ✓ Mentions user @U3JP2J8NS
#   ✓ Includes git changes, test platforms, and revert instructions
#   ✓ Comprehensive error handling
#
# ==============================================================================

set -e  # Exit on any error
set -o pipefail  # Catch errors in pipes

# ==============================================================================
# CONFIGURATION
# ==============================================================================

# Project paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Firebase settings
FIREBASE_CHANNEL="unitynotes-test"
CHANNEL_EXPIRY="3d"

# Slack settings
SLACK_CHANNEL_ID="C09UQGASA2C"
SLACK_USER_MENTION="<@U3JP2J8NS>"

# Component paths for change tracking
COMPONENT_PATTERNS=(
    "src/components/unity*"
    "src/pages/*[Uu]nity*"
    "src/pages/*[Nn]ote*"
)

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Command line flags
SKIP_BUILD=false
SKIP_SLACK=false

# ==============================================================================
# UTILITY FUNCTIONS
# ==============================================================================

print_header() {
    echo ""
    echo -e "${BLUE}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}${BOLD}  $1${NC}"
    echo -e "${BLUE}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_step() {
    echo -e "${YELLOW}${BOLD}[$1/$2]${NC} $3"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1" >&2
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

# ==============================================================================
# CHANGE TRACKING FUNCTIONS
# ==============================================================================

get_last_commit_info() {
    local commit_msg=$(git log -1 --pretty=format:"%s" 2>/dev/null || echo "Unknown")
    local commit_hash=$(git log -1 --pretty=format:"%h" 2>/dev/null || echo "Unknown")
    local commit_author=$(git log -1 --pretty=format:"%an" 2>/dev/null || echo "Unknown")

    echo "[$commit_hash] $commit_msg - $commit_author"
}

get_unitynotes_changes() {
    # Get UnityNOTES-related changes from recent commits (last 10)
    local changes=$(git log -10 --oneline --no-merges 2>/dev/null | grep -iE "unity|note" | head -5 || echo "")

    if [ -z "$changes" ]; then
        # Fall back to last commit if no Unity-specific changes found
        local last_commit=$(git log -1 --oneline 2>/dev/null || echo "")
        if [ -n "$last_commit" ]; then
            echo "$last_commit"
        else
            echo "Manual deployment - no git history available"
        fi
    else
        echo "$changes"
    fi
}

get_changed_files() {
    # Get files changed in last commit that match Unity patterns
    local files=""
    for pattern in "${COMPONENT_PATTERNS[@]}"; do
        local matched=$(git diff --name-only HEAD~1 HEAD 2>/dev/null | grep -E "$(echo $pattern | sed 's/\*/.*/')" || echo "")
        if [ -n "$matched" ]; then
            files="$files$matched"$'\n'
        fi
    done

    if [ -z "$files" ]; then
        echo "No UnityNOTES-specific files detected"
    else
        echo "$files" | sort -u | sed '/^$/d'
    fi
}

get_git_branch_info() {
    local branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
    local commit=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    echo "Branch: $branch | Commit: $commit"
}

# ==============================================================================
# VALIDATION FUNCTIONS
# ==============================================================================

check_prerequisites() {
    print_step "1" "6" "Checking prerequisites..."

    # Check if we're in the right directory
    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        print_error "package.json not found in $PROJECT_ROOT"
        print_info "Please run this script from the yellow-circle project directory"
        exit 1
    fi

    # Check Firebase CLI
    if ! command -v firebase &> /dev/null; then
        print_error "Firebase CLI not found"
        print_info "Install with: npm install -g firebase-tools"
        exit 1
    fi

    # Check Firebase authentication
    if ! firebase login:list &> /dev/null; then
        print_error "Firebase CLI not authenticated"
        print_info "Run: firebase login"
        exit 1
    fi

    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm not found"
        exit 1
    fi

    # Check git
    if ! command -v git &> /dev/null; then
        print_warning "git not found - change tracking will be limited"
    fi

    # Check jq for Slack API response parsing
    if ! command -v jq &> /dev/null; then
        print_warning "jq not found - Slack notification may have limited error handling"
        print_info "Install with: brew install jq"
    fi

    print_success "All prerequisites met"
    echo ""
}

load_environment() {
    if [ -f "$PROJECT_ROOT/.env" ]; then
        # Load SLACK_BOT_TOKEN from .env
        export $(grep -v '^#' "$PROJECT_ROOT/.env" | grep 'SLACK_BOT_TOKEN' | xargs) 2>/dev/null || true
    fi

    if [ -z "$SLACK_BOT_TOKEN" ] && [ "$SKIP_SLACK" = false ]; then
        print_warning "SLACK_BOT_TOKEN not found in .env"
        print_info "Slack notifications will be skipped"
        SKIP_SLACK=true
    fi
}

# ==============================================================================
# BUILD & DEPLOY FUNCTIONS
# ==============================================================================

build_project() {
    if [ "$SKIP_BUILD" = true ]; then
        print_step "2" "6" "Skipping build (--skip-build flag)"

        # Verify dist exists
        if [ ! -d "$PROJECT_ROOT/dist" ]; then
            print_error "dist/ directory not found and --skip-build was specified"
            print_info "Run without --skip-build or manually run: npm run build"
            exit 1
        fi

        print_success "Using existing build in dist/"
        echo ""
        return 0
    fi

    print_step "2" "6" "Building production bundle..."

    cd "$PROJECT_ROOT"

    # Clean previous build (optional)
    if [ -d "dist" ]; then
        print_info "Removing previous build..."
        rm -rf dist
    fi

    # Run build
    if npm run build; then
        print_success "Build completed successfully"

        # Verify build output
        if [ ! -d "dist" ]; then
            print_error "Build succeeded but dist/ directory not found"
            exit 1
        fi

        local dist_size=$(du -sh dist | cut -f1)
        print_info "Build size: $dist_size"
        echo ""
    else
        print_error "Build failed!"
        print_info "Check the build output above for errors"
        exit 1
    fi
}

deploy_to_firebase() {
    print_step "3" "6" "Deploying to Firebase hosting channel '$FIREBASE_CHANNEL'..."

    cd "$PROJECT_ROOT"

    # Deploy and capture output
    local deploy_output
    if deploy_output=$(firebase hosting:channel:deploy "$FIREBASE_CHANNEL" --expires "$CHANNEL_EXPIRY" 2>&1); then
        print_success "Deployment successful"

        # Extract staging URL from Firebase output
        # Try multiple patterns to capture the URL
        STAGING_URL=$(echo "$deploy_output" | grep -oE "https://[a-zA-Z0-9\-]+--${FIREBASE_CHANNEL}-[a-z0-9]+\.web\.app" | head -1)

        if [ -z "$STAGING_URL" ]; then
            # Try alternative pattern
            STAGING_URL=$(echo "$deploy_output" | grep -oE "https://[^\s]+" | grep "$FIREBASE_CHANNEL" | head -1)
        fi

        if [ -z "$STAGING_URL" ]; then
            print_warning "Could not extract staging URL automatically"
            print_info "Check Firebase console at: https://console.firebase.google.com"
            STAGING_URL="[Check Firebase Console for URL]"
        else
            print_success "Staging URL: $STAGING_URL"
        fi

        print_info "Channel expires in: $CHANNEL_EXPIRY"
        echo ""
    else
        print_error "Deployment failed!"
        echo ""
        echo "$deploy_output"
        exit 1
    fi
}

# ==============================================================================
# SLACK NOTIFICATION FUNCTIONS
# ==============================================================================

send_slack_notification() {
    if [ "$SKIP_SLACK" = true ]; then
        print_step "4" "6" "Skipping Slack notification (--skip-slack flag or missing token)"
        echo ""
        return 0
    fi

    print_step "4" "6" "Sending Slack notification..."

    # Gather deployment metadata
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S %Z')
    local changes=$(get_unitynotes_changes)
    local git_info=$(get_git_branch_info)
    local changed_files=$(get_changed_files)

    # Format changes for Slack (convert to bullet points)
    local slack_changes=$(echo "$changes" | sed 's/^[a-f0-9]* /• /' | sed 's/^/• /' | head -7)

    # Format changed files for Slack
    local slack_files=$(echo "$changed_files" | sed 's/^/• /' | head -10)
    if [ -z "$slack_files" ]; then
        slack_files="• No specific files tracked"
    fi

    # Construct revert command
    local revert_cmd="git checkout HEAD~1 -- ${COMPONENT_PATTERNS[0]}"

    # Build Slack message
    local slack_message="🧪 *UnityNOTES Staging Ready* ${SLACK_USER_MENTION}

🔗 *Staging URL:*
${STAGING_URL}

📝 *Recent Changes:*
${slack_changes}

📂 *Modified Files:*
${slack_files}

🔧 *Git Info:*
\`${git_info}\`

📱 *Test Platforms:*
• iOS Safari
• Chrome Mobile
• Desktop browsers (Chrome, Firefox, Safari)

↩️ *Revert Command (if needed):*
\`\`\`
${revert_cmd}
npm run build && firebase deploy --only hosting
\`\`\`

⏰ *Expires:* ${CHANNEL_EXPIRY} from now
🕐 *Deployed:* ${timestamp}"

    # Send to Slack API
    local response
    if command -v jq &> /dev/null; then
        response=$(curl -s -X POST "https://slack.com/api/chat.postMessage" \
            -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
            -H "Content-Type: application/json; charset=utf-8" \
            -d "{
                \"channel\": \"$SLACK_CHANNEL_ID\",
                \"text\": $(echo "$slack_message" | jq -Rs .),
                \"unfurl_links\": false,
                \"unfurl_media\": false
            }")

        local slack_ok=$(echo "$response" | jq -r '.ok' 2>/dev/null || echo "false")

        if [ "$slack_ok" = "true" ]; then
            print_success "Slack notification sent to channel $SLACK_CHANNEL_ID"
        else
            local slack_error=$(echo "$response" | jq -r '.error' 2>/dev/null || echo "unknown error")
            print_error "Slack notification failed: $slack_error"
            print_info "Deployment was successful but notification failed"
        fi
    else
        # Fallback without jq
        response=$(curl -s -X POST "https://slack.com/api/chat.postMessage" \
            -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{\"channel\":\"$SLACK_CHANNEL_ID\",\"text\":$(printf '%s' "$slack_message" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))'),\"unfurl_links\":false}")

        if echo "$response" | grep -q '"ok":true'; then
            print_success "Slack notification sent to channel $SLACK_CHANNEL_ID"
        else
            print_error "Slack notification may have failed"
            print_info "Deployment was successful but notification status unclear"
        fi
    fi

    echo ""
}

# ==============================================================================
# SUMMARY & CLEANUP FUNCTIONS
# ==============================================================================

print_summary() {
    print_step "5" "6" "Deployment Summary"
    echo ""

    echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}${BOLD}         Deployment Completed Successfully!          ${NC}"
    echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  ${BLUE}${BOLD}Staging URL:${NC}  $STAGING_URL"
    echo -e "  ${BLUE}${BOLD}Channel:${NC}      $FIREBASE_CHANNEL"
    echo -e "  ${BLUE}${BOLD}Expires:${NC}      $CHANNEL_EXPIRY from now"

    if [ "$SKIP_SLACK" = false ]; then
        echo -e "  ${BLUE}${BOLD}Slack:${NC}        Notification sent to channel $SLACK_CHANNEL_ID"
    else
        echo -e "  ${BLUE}${BOLD}Slack:${NC}        Skipped"
    fi

    echo ""
    echo -e "${YELLOW}${BOLD}Next Steps:${NC}"
    echo -e "  ${YELLOW}1.${NC} Open staging URL and test UnityNOTES functionality"
    echo -e "  ${YELLOW}2.${NC} Test on mobile devices (iOS Safari, Chrome Mobile)"
    echo -e "  ${YELLOW}3.${NC} Verify all features work as expected"
    echo -e "  ${YELLOW}4.${NC} Deploy to production when ready: ${CYAN}firebase deploy --only hosting${NC}"
    echo ""
    echo -e "${YELLOW}${BOLD}Useful Commands:${NC}"
    echo -e "  ${CYAN}firebase hosting:channel:list${NC}        - List all channels"
    echo -e "  ${CYAN}firebase hosting:channel:delete $FIREBASE_CHANNEL${NC}  - Delete this channel"
    echo -e "  ${CYAN}./scripts/revert-unitynotes.sh${NC}       - Revert changes and redeploy"
    echo ""
}

# ==============================================================================
# MAIN DEPLOYMENT FLOW
# ==============================================================================

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --skip-slack)
                SKIP_SLACK=true
                shift
                ;;
            -h|--help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Deploy UnityNOTES to Firebase staging channel with Slack notification"
                echo ""
                echo "Options:"
                echo "  --skip-build    Skip npm build (use existing dist/)"
                echo "  --skip-slack    Skip Slack notification"
                echo "  -h, --help      Show this help message"
                echo ""
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
}

main() {
    # Parse command line arguments
    parse_arguments "$@"

    # Print header
    print_header "UnityNOTES Staging Deployment"

    # Change to project root
    cd "$PROJECT_ROOT"

    # Step 1: Check prerequisites
    check_prerequisites

    # Load environment variables
    load_environment

    # Step 2: Build
    build_project

    # Step 3: Deploy
    deploy_to_firebase

    # Step 4: Notify Slack
    send_slack_notification

    # Step 5: Print summary
    print_summary

    # Success!
    exit 0
}

# ==============================================================================
# ENTRY POINT
# ==============================================================================

# Trap errors and provide helpful message
trap 'print_error "Deployment failed at line $LINENO. Exit code: $?"; exit 1' ERR

# Run main function with all arguments
main "$@"
