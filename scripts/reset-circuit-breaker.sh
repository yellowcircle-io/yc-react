#!/bin/bash

# Reset Circuit Breaker Script
# Usage: ./scripts/reset-circuit-breaker.sh [--force]
#
# Resets the circuit breaker to allow agents to resume work.
# Use --force to skip confirmation prompt.

set -e

# Get project directory (parent of scripts/)
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CIRCUIT_BREAKER="$PROJECT_DIR/.claude/shared-context/circuit-breaker.json"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "Circuit Breaker Reset Tool"
echo "========================================"

# Check if circuit breaker file exists
if [ ! -f "$CIRCUIT_BREAKER" ]; then
    echo -e "${RED}Error: Circuit breaker file not found at:${NC}"
    echo "  $CIRCUIT_BREAKER"
    exit 1
fi

# Check if jq is installed
if ! command -v jq &>/dev/null; then
    echo -e "${RED}Error: jq is required but not installed.${NC}"
    echo "Install with: brew install jq"
    exit 1
fi

# Show current state
echo ""
echo "Current circuit breaker state:"
echo "------------------------------"
jq '.' "$CIRCUIT_BREAKER"
echo ""

# Check if circuit is actually open
CIRCUIT_OPEN=$(jq -r '.circuit_open' "$CIRCUIT_BREAKER")
if [ "$CIRCUIT_OPEN" != "true" ]; then
    echo -e "${YELLOW}Circuit breaker is not currently open.${NC}"
    echo "Resetting failure counts anyway..."
fi

# Confirmation (unless --force)
if [ "$1" != "--force" ]; then
    read -p "Are you sure you want to reset the circuit breaker? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi
fi

# Perform reset using date command (compatible with all jq versions)
RESET_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)

jq --arg reset_time "$RESET_TIME" '
  .circuit_open = false |
  .circuit_opened_at = null |
  .circuit_opened_reason = null |
  .last_reset = $reset_time |
  .last_updated = $reset_time |
  .failure_counts = {
    "commit_failed": 0,
    "build_failed": 0,
    "deployment_failed": 0,
    "auth_failed": 0,
    "task_failed": 0
  }
' "$CIRCUIT_BREAKER" > "$CIRCUIT_BREAKER.tmp"

mv "$CIRCUIT_BREAKER.tmp" "$CIRCUIT_BREAKER"

echo -e "${GREEN}Circuit breaker reset successfully at $RESET_TIME${NC}"
echo ""

# Show new state
echo "New circuit breaker state:"
echo "--------------------------"
jq '.' "$CIRCUIT_BREAKER"

# Post to Slack if webhook is configured
if [ -n "$SLACK_WEBHOOK" ]; then
    curl -s -X POST "$SLACK_WEBHOOK" \
        -H "Content-Type: application/json" \
        -d "{\"text\":\"Circuit breaker manually reset at $RESET_TIME\"}" \
        >/dev/null 2>&1
    echo ""
    echo "Slack notification sent."
fi

echo ""
echo "========================================"
echo "Done. Agents can now resume work."
echo "========================================"
