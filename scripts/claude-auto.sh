#!/bin/bash

# Claude Code Automation Script for yellowCircle
# Usage: ./scripts/claude-auto.sh "task description"
# Created: December 18, 2025

set -e

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$PROJECT_DIR/logs/claude-auto"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Check if task was provided
if [ -z "$1" ]; then
    echo "Usage: ./scripts/claude-auto.sh \"task description\""
    echo ""
    echo "Examples:"
    echo "  ./scripts/claude-auto.sh \"Fix ESLint errors in functions/index.js\""
    echo "  ./scripts/claude-auto.sh \"Review ContactDashboardPage.jsx for performance issues\""
    echo "  ./scripts/claude-auto.sh \"Update all dependencies to latest versions\""
    exit 1
fi

TASK="$1"
LOG_FILE="$LOG_DIR/$TIMESTAMP.log"

echo "========================================"
echo "Claude Code Automation"
echo "========================================"
echo "Task: $TASK"
echo "Time: $(date)"
echo "Log:  $LOG_FILE"
echo "========================================"

# Change to project directory
cd "$PROJECT_DIR"

# Run Claude Code in headless mode
echo "Starting Claude Code..."
claude -p "$TASK" \
    --dangerously-skip-permissions \
    --output-format stream-json \
    2>&1 | tee "$LOG_FILE"

EXIT_CODE=${PIPESTATUS[0]}

echo ""
echo "========================================"
echo "Task completed at $(date)"
echo "Exit code: $EXIT_CODE"
echo "Log saved to: $LOG_FILE"
echo "========================================"

exit $EXIT_CODE
