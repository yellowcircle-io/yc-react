#!/bin/bash
#
# yellowCircle Unified Command Script
# Works from BOTH Apple Shortcuts (SSH) AND Slack (/sleepless yc ...)
#
# Usage:
#   ./yc-command.sh <command> [args...]
#
# Commands:
#   NOTIFICATIONS:
#     notify <message>                    - Send Slack notification
#     notify <title> <url> <folder>       - Send link archived notification
#     status <type> <message>             - Send status (success/warning/error/info)
#
#   GIT/HISTORY:
#     rollback                            - Rollback last global component change
#     restore                             - Restore global config (uncommitted only)
#     history                             - Show recent global config changes
#     last-change                         - Show last change to global config
#
#   SYNC:
#     sync                                - Sync roadmap to Notion
#     wip                                 - Run daily WIP sync
#
#   ALERTS:
#     deadline                            - Check deadline alerts
#     blocked                             - Check blocked tasks
#
#   GLOBAL COMPONENTS:
#     global <action>                     - Edit global components
#     edit-header <args>                  - Edit header content
#     edit-footer <args>                  - Edit footer content
#     edit-theme <args>                   - Edit theme
#
#   SYSTEM:
#     menu                                - Show available commands
#     help                                - Show this help
#

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
AUTOMATION_DIR="$PROJECT_DIR/.claude/automation"

# Load environment
if [ -f "$PROJECT_DIR/.env" ]; then
  export $(grep -v '^#' "$PROJECT_DIR/.env" | xargs)
fi

# Colors for terminal output (disabled in non-interactive mode)
if [ -t 1 ]; then
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  RED='\033[0;31m'
  BLUE='\033[0;34m'
  NC='\033[0m'
else
  GREEN=''
  YELLOW=''
  RED=''
  BLUE=''
  NC=''
fi

# Helper functions
print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_info() { echo -e "${BLUE}ℹ${NC} $1"; }

# Show help/menu
show_help() {
  echo ""
  echo "📱 yellowCircle Command System"
  echo "=============================="
  echo ""
  echo "NOTIFICATIONS:"
  echo "  notify <message>              Send Slack notification"
  echo "  notify <title> <url> <folder> Send link archived notification"
  echo "  status <type> <message>       Send status (success/warning/error/info)"
  echo ""
  echo "GIT/HISTORY:"
  echo "  rollback                      Rollback last global component change"
  echo "  restore                       Restore global config (uncommitted)"
  echo "  history                       Show recent global config changes"
  echo "  last-change                   Show last change to global config"
  echo ""
  echo "SYNC:"
  echo "  sync                          Sync roadmap to Notion"
  echo "  wip                           Run daily WIP sync"
  echo ""
  echo "ALERTS:"
  echo "  deadline                      Check deadline alerts"
  echo "  blocked                       Check blocked tasks"
  echo ""
  echo "GLOBAL COMPONENTS:"
  echo "  global --action=list          View current config"
  echo "  edit-header <args>            Edit header content"
  echo "  edit-footer <args>            Edit footer content"
  echo "  edit-theme <args>             Edit theme colors"
  echo ""
  echo "Examples:"
  echo "  ./yc-command.sh notify \"Build complete\""
  echo "  ./yc-command.sh status success \"Deployment finished\""
  echo "  ./yc-command.sh history"
  echo "  ./yc-command.sh rollback"
  echo ""
}

# Main command handler
COMMAND="$1"
shift

case "$COMMAND" in
  # ========== NOTIFICATIONS ==========
  notify)
    if [ $# -eq 1 ]; then
      "$SCRIPT_DIR/slack-notify.sh" "$1"
    elif [ $# -eq 3 ]; then
      "$SCRIPT_DIR/slack-notify.sh" "$1" "$2" "$3"
    else
      print_error "Usage: notify <message> OR notify <title> <url> <folder>"
      exit 1
    fi
    ;;

  status)
    if [ $# -lt 2 ]; then
      print_error "Usage: status <type> <message>"
      print_info "Types: success, warning, error, info"
      exit 1
    fi
    "$SCRIPT_DIR/slack-status.sh" "$1" "$2"
    ;;

  # ========== GIT/HISTORY ==========
  rollback)
    cd "$PROJECT_DIR"
    git revert HEAD --no-edit
    print_success "Rolled back last change"
    # Send notification
    "$SCRIPT_DIR/slack-status.sh" warning "Rollback executed via yc-command"
    ;;

  restore)
    cd "$PROJECT_DIR"
    git restore src/config/globalContent.js
    print_success "Restored global config from last commit"
    ;;

  history)
    cd "$PROJECT_DIR"
    git log --oneline -10 src/config/globalContent.js
    ;;

  last-change)
    cd "$PROJECT_DIR"
    git log -1 --stat src/config/globalContent.js
    ;;

  # ========== SYNC ==========
  sync)
    cd "$AUTOMATION_DIR"
    npm run sync
    ;;

  wip)
    cd "$AUTOMATION_DIR"
    npm run wip:sync
    ;;

  # ========== ALERTS ==========
  deadline)
    cd "$AUTOMATION_DIR"
    npm run alerts:deadline
    ;;

  blocked)
    cd "$AUTOMATION_DIR"
    npm run alerts:blocked
    ;;

  # ========== GLOBAL COMPONENTS ==========
  global)
    cd "$AUTOMATION_DIR"
    if [ $# -eq 0 ]; then
      node global-manager.js --action=list
    else
      node global-manager.js "$@"
    fi
    ;;

  edit-header)
    cd "$AUTOMATION_DIR"
    node global-manager.js --component=header "$@"
    ;;

  edit-footer)
    cd "$AUTOMATION_DIR"
    node global-manager.js --component=footer "$@"
    ;;

  edit-theme)
    cd "$AUTOMATION_DIR"
    node global-manager.js --component=theme "$@"
    ;;

  # ========== SYSTEM ==========
  menu|help|--help|-h|"")
    show_help
    ;;

  *)
    # Try shortcut-router.js for unknown commands
    cd "$AUTOMATION_DIR"
    if [ -f "shortcut-router.js" ]; then
      node shortcut-router.js "$COMMAND" "$@"
    else
      print_error "Unknown command: $COMMAND"
      show_help
      exit 1
    fi
    ;;
esac
