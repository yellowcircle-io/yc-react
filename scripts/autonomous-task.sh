#!/bin/bash
# Autonomous Task Runner with Slack Updates & Git Rollback
# Usage: ./scripts/autonomous-task.sh "task description" [--no-rollback]
#
# Features:
# - Creates git checkpoint before starting
# - Sends Slack updates (start, progress, complete/error)
# - Enables rollback on failure
# - Logs all output

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

TASK="$1"
NO_ROLLBACK="${2:-}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_DIR="$PROJECT_DIR/logs/autonomous"
LOG_FILE="$LOG_DIR/$TIMESTAMP.log"
TASK_DIR="$PROJECT_DIR/.claude/autonomous-tasks"

# Load environment
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Ensure directories exist
mkdir -p "$LOG_DIR"
mkdir -p "$TASK_DIR"

# Function to send Slack notification
slack_notify() {
    local message="$1"
    local emoji="${2:-:robot_face:}"

    if [ -n "$SLACK_BOT_TOKEN" ]; then
        curl -s -X POST "https://slack.com/api/chat.postMessage" \
            -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{
                \"channel\": \"${SLACK_CHANNEL:-general}\",
                \"text\": \"$emoji *Claude Agent* [$(date '+%H:%M')]\\n$message\"
            }" > /dev/null 2>&1
    fi
    echo "[$(date '+%H:%M:%S')] $message" >> "$LOG_FILE"
}

# Function to create git checkpoint
create_checkpoint() {
    local checkpoint_name="checkpoint-$TIMESTAMP"
    git stash push -m "$checkpoint_name" --include-untracked 2>/dev/null || true
    CHECKPOINT_COMMIT=$(git rev-parse HEAD)
    echo "$CHECKPOINT_COMMIT" > "$TASK_DIR/.last_checkpoint"
    echo "$checkpoint_name"
}

# Function to rollback
rollback() {
    if [ -f "$TASK_DIR/.last_checkpoint" ]; then
        local checkpoint=$(cat "$TASK_DIR/.last_checkpoint")
        slack_notify "🔄 Rolling back to checkpoint: $checkpoint" ":rewind:"
        git reset --hard "$checkpoint"
        git stash pop 2>/dev/null || true
        rm "$TASK_DIR/.last_checkpoint"
    fi
}

# Check if task provided
if [ -z "$TASK" ]; then
    echo "Usage: ./scripts/autonomous-task.sh \"task description\" [--no-rollback]"
    echo ""
    echo "Examples:"
    echo "  ./scripts/autonomous-task.sh \"Research Cloudinary API for photo editing\""
    echo "  ./scripts/autonomous-task.sh \"Generate sample campaign creatives\" --no-rollback"
    exit 1
fi

echo "========================================"
echo "Autonomous Task Runner"
echo "========================================"
echo "Task: $TASK"
echo "Time: $(date)"
echo "Log:  $LOG_FILE"
echo "========================================"

# Create checkpoint (unless --no-rollback)
if [ "$NO_ROLLBACK" != "--no-rollback" ]; then
    CHECKPOINT=$(create_checkpoint)
    echo "Checkpoint: $CHECKPOINT"
fi

# Send start notification
slack_notify "🚀 *Starting Task*\n\`\`\`$TASK\`\`\`" ":rocket:"

# Run Claude Code
echo "Starting Claude Code..."
set +e  # Don't exit on error

claude -p "$TASK" \
    --dangerously-skip-permissions \
    --output-format stream-json \
    2>&1 | tee -a "$LOG_FILE"

EXIT_CODE=${PIPESTATUS[0]}
set -e

# Handle result
if [ $EXIT_CODE -eq 0 ]; then
    slack_notify "✅ *Task Completed*\n\`\`\`$TASK\`\`\`\nLog: $LOG_FILE" ":white_check_mark:"

    # Clean up checkpoint on success
    rm -f "$TASK_DIR/.last_checkpoint"
else
    slack_notify "❌ *Task Failed* (exit code: $EXIT_CODE)\n\`\`\`$TASK\`\`\`\nLog: $LOG_FILE" ":x:"

    # Offer rollback
    if [ "$NO_ROLLBACK" != "--no-rollback" ] && [ -f "$TASK_DIR/.last_checkpoint" ]; then
        slack_notify "⚠️ Rollback available. Run: \`git reset --hard $(cat $TASK_DIR/.last_checkpoint)\`" ":warning:"
    fi
fi

echo ""
echo "========================================"
echo "Task completed at $(date)"
echo "Exit code: $EXIT_CODE"
echo "Log saved to: $LOG_FILE"
echo "========================================"

exit $EXIT_CODE
