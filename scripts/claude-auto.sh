#!/bin/bash

# Claude Code Automation Script for yellowCircle
# Usage: ./scripts/claude-auto.sh "task description"
# Created: December 18, 2025
# Updated: January 8, 2026 - Added circuit breaker, heartbeats, task coordination

set -e

# =============================================================================
# Configuration
# =============================================================================
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$PROJECT_DIR/logs/claude-auto"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Shared context paths (synced via Dropbox)
SHARED_CONTEXT="$PROJECT_DIR/.claude/shared-context"
CIRCUIT_BREAKER="$SHARED_CONTEXT/circuit-breaker.json"
HEARTBEAT_FILE="$SHARED_CONTEXT/agent-heartbeats.json"
ACTIVE_TASKS="$SHARED_CONTEXT/active-tasks.json"

# Agent identification
AGENT_ID="${HOSTNAME:-$(hostname)}-$$-$TIMESTAMP"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"

# Ensure directories exist
mkdir -p "$LOG_DIR"

# =============================================================================
# Utility Functions
# =============================================================================

# Check if jq is available
has_jq() {
    command -v jq &>/dev/null
}

# Get current UTC timestamp in ISO format
utc_timestamp() {
    date -u +%Y-%m-%dT%H:%M:%SZ
}

# Post to Slack (if webhook configured)
slack_notify() {
    local message="$1"
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -s -X POST "$SLACK_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"$message\"}" \
            >/dev/null 2>&1 || true
    fi
}

# =============================================================================
# Circuit Breaker Functions
# =============================================================================

# Check if circuit breaker is open (should block execution)
check_circuit_breaker() {
    if ! has_jq; then
        echo "[WARN] jq not installed, skipping circuit breaker check"
        return 0
    fi

    if [ ! -f "$CIRCUIT_BREAKER" ]; then
        echo "[WARN] Circuit breaker file not found, proceeding anyway"
        return 0
    fi

    local circuit_open
    circuit_open=$(jq -r '.circuit_open // false' "$CIRCUIT_BREAKER" 2>/dev/null || echo "false")

    if [ "$circuit_open" == "true" ]; then
        local opened_at
        local reason
        opened_at=$(jq -r '.circuit_opened_at // "unknown"' "$CIRCUIT_BREAKER")
        reason=$(jq -r '.circuit_opened_reason // "threshold exceeded"' "$CIRCUIT_BREAKER")

        echo ""
        echo "========================================"
        echo "CIRCUIT BREAKER OPEN"
        echo "========================================"
        echo "Opened at: $opened_at"
        echo "Reason: $reason"
        echo ""
        echo "To reset, run:"
        echo "  ./scripts/reset-circuit-breaker.sh"
        echo "========================================"

        slack_notify "Agent $AGENT_ID blocked - circuit breaker is OPEN ($reason)"
        exit 1
    fi

    return 0
}

# Record a failure and potentially trip the circuit breaker
record_failure() {
    local failure_type="$1"
    local details="${2:-}"

    if ! has_jq; then
        echo "[WARN] jq not installed, skipping failure recording"
        return 0
    fi

    if [ ! -f "$CIRCUIT_BREAKER" ]; then
        echo "[WARN] Circuit breaker file not found"
        return 0
    fi

    local now
    now=$(utc_timestamp)

    # Read current values
    local count
    local threshold
    count=$(jq -r ".failure_counts.${failure_type} // 0" "$CIRCUIT_BREAKER")
    threshold=$(jq -r ".thresholds.${failure_type} // 999" "$CIRCUIT_BREAKER")

    # Increment count
    count=$((count + 1))

    # Update file
    jq --arg type "$failure_type" \
       --argjson count "$count" \
       --arg now "$now" \
       --arg details "$details" \
       '
       .failure_counts[$type] = $count |
       .last_updated = $now |
       .last_failure = {
         "type": $type,
         "time": $now,
         "details": $details,
         "agent": env.AGENT_ID
       }
       ' "$CIRCUIT_BREAKER" > "$CIRCUIT_BREAKER.tmp" 2>/dev/null

    mv "$CIRCUIT_BREAKER.tmp" "$CIRCUIT_BREAKER" 2>/dev/null || true

    echo "[INFO] Recorded $failure_type failure ($count/$threshold)"

    # Check if we should trip the breaker
    if [ "$count" -ge "$threshold" ]; then
        local reason="$failure_type count ($count) exceeded threshold ($threshold)"

        jq --arg now "$now" \
           --arg reason "$reason" \
           '
           .circuit_open = true |
           .circuit_opened_at = $now |
           .circuit_opened_reason = $reason
           ' "$CIRCUIT_BREAKER" > "$CIRCUIT_BREAKER.tmp" 2>/dev/null

        mv "$CIRCUIT_BREAKER.tmp" "$CIRCUIT_BREAKER" 2>/dev/null || true

        echo ""
        echo "========================================"
        echo "CIRCUIT BREAKER TRIPPED"
        echo "========================================"
        echo "Reason: $reason"
        echo "Time: $now"
        echo "========================================"

        slack_notify "CIRCUIT BREAKER TRIPPED: $reason"
    fi
}

# =============================================================================
# Heartbeat Functions
# =============================================================================

# Update agent heartbeat
update_heartbeat() {
    local status="${1:-running}"

    if ! has_jq; then
        return 0
    fi

    if [ ! -f "$HEARTBEAT_FILE" ]; then
        return 0
    fi

    local now
    now=$(utc_timestamp)

    jq --arg agent "$AGENT_ID" \
       --arg now "$now" \
       --arg status "$status" \
       --arg hostname "${HOSTNAME:-$(hostname)}" \
       --argjson pid "$$" \
       --arg task "${TASK:-}" \
       '
       .agents[$agent] = {
         "last_seen": $now,
         "status": $status,
         "hostname": $hostname,
         "pid": $pid,
         "task": $task
       }
       ' "$HEARTBEAT_FILE" > "$HEARTBEAT_FILE.tmp" 2>/dev/null

    mv "$HEARTBEAT_FILE.tmp" "$HEARTBEAT_FILE" 2>/dev/null || true
}

# Remove agent from heartbeat (on clean exit)
remove_heartbeat() {
    if ! has_jq; then
        return 0
    fi

    if [ ! -f "$HEARTBEAT_FILE" ]; then
        return 0
    fi

    jq --arg agent "$AGENT_ID" 'del(.agents[$agent])' "$HEARTBEAT_FILE" > "$HEARTBEAT_FILE.tmp" 2>/dev/null
    mv "$HEARTBEAT_FILE.tmp" "$HEARTBEAT_FILE" 2>/dev/null || true
}

# =============================================================================
# Task Coordination Functions
# =============================================================================

# Generate a task hash for deduplication
task_hash() {
    echo "$1" | md5sum | cut -d' ' -f1 2>/dev/null || echo "$1" | md5 2>/dev/null || echo "no-hash"
}

# Check if task is already being worked on
check_task_available() {
    local task_id="$1"

    if ! has_jq; then
        return 0  # Allow if we can't check
    fi

    if [ ! -f "$ACTIVE_TASKS" ]; then
        return 0
    fi

    local existing
    existing=$(jq -r ".tasks.\"$task_id\" // null" "$ACTIVE_TASKS" 2>/dev/null)

    if [ "$existing" != "null" ] && [ -n "$existing" ]; then
        local locked_by
        local locked_at
        locked_by=$(echo "$existing" | jq -r '.agent // "unknown"')
        locked_at=$(echo "$existing" | jq -r '.started_at // "unknown"')

        echo "[WARN] Task already in progress by $locked_by since $locked_at"
        return 1
    fi

    return 0
}

# Claim a task
claim_task() {
    local task_id="$1"
    local task_desc="$2"

    if ! has_jq; then
        return 0
    fi

    if [ ! -f "$ACTIVE_TASKS" ]; then
        return 0
    fi

    local now
    now=$(utc_timestamp)

    jq --arg task_id "$task_id" \
       --arg agent "$AGENT_ID" \
       --arg now "$now" \
       --arg desc "$task_desc" \
       '
       .tasks[$task_id] = {
         "agent": $agent,
         "started_at": $now,
         "description": $desc
       }
       ' "$ACTIVE_TASKS" > "$ACTIVE_TASKS.tmp" 2>/dev/null

    mv "$ACTIVE_TASKS.tmp" "$ACTIVE_TASKS" 2>/dev/null || true
}

# Release a task (mark as completed or failed)
release_task() {
    local task_id="$1"
    local status="$2"  # "completed" or "failed"

    if ! has_jq; then
        return 0
    fi

    if [ ! -f "$ACTIVE_TASKS" ]; then
        return 0
    fi

    local now
    now=$(utc_timestamp)

    # Get task info before removing
    local task_info
    task_info=$(jq -r ".tasks.\"$task_id\" // {}" "$ACTIVE_TASKS" 2>/dev/null)

    # Remove from active, add to completed history
    jq --arg task_id "$task_id" \
       --arg now "$now" \
       --arg status "$status" \
       --argjson max_history 50 \
       '
       .tasks |= del(.[$task_id]) |
       .completed_tasks = ([{
         "task_id": $task_id,
         "completed_at": $now,
         "status": $status
       }] + (.completed_tasks // []))[:$max_history]
       ' "$ACTIVE_TASKS" > "$ACTIVE_TASKS.tmp" 2>/dev/null

    mv "$ACTIVE_TASKS.tmp" "$ACTIVE_TASKS" 2>/dev/null || true
}

# =============================================================================
# Main Script
# =============================================================================

# Check if task was provided
if [ -z "$1" ]; then
    echo "Usage: ./scripts/claude-auto.sh \"task description\""
    echo ""
    echo "Examples:"
    echo "  ./scripts/claude-auto.sh \"Fix ESLint errors in functions/index.js\""
    echo "  ./scripts/claude-auto.sh \"Review ContactDashboardPage.jsx for performance issues\""
    echo "  ./scripts/claude-auto.sh \"Update all dependencies to latest versions\""
    echo ""
    echo "Environment variables:"
    echo "  SLACK_WEBHOOK - Slack webhook URL for notifications"
    exit 1
fi

TASK="$1"
TASK_ID=$(task_hash "$TASK")
LOG_FILE="$LOG_DIR/$TIMESTAMP.log"

echo "========================================"
echo "Claude Code Automation"
echo "========================================"
echo "Agent ID: $AGENT_ID"
echo "Task: $TASK"
echo "Task ID: $TASK_ID"
echo "Time: $(date)"
echo "Log: $LOG_FILE"
echo "========================================"

# Step 1: Check circuit breaker
echo ""
echo "[1/4] Checking circuit breaker..."
check_circuit_breaker

# Step 2: Check if task is already being worked on
echo "[2/4] Checking task availability..."
if ! check_task_available "$TASK_ID"; then
    echo "[SKIP] Task is already being processed by another agent"
    exit 0
fi

# Step 3: Claim the task
echo "[3/4] Claiming task..."
claim_task "$TASK_ID" "$TASK"

# Step 4: Update heartbeat
echo "[4/4] Registering agent..."
update_heartbeat "starting"

# Set up cleanup on exit
cleanup() {
    local exit_code=$?
    echo ""
    echo "[CLEANUP] Releasing task and updating heartbeat..."

    if [ $exit_code -eq 0 ]; then
        release_task "$TASK_ID" "completed"
        update_heartbeat "completed"
    else
        release_task "$TASK_ID" "failed"
        update_heartbeat "failed"
        record_failure "task_failed" "Exit code: $exit_code, Task: $TASK"
    fi

    # Remove agent from heartbeats on clean exit
    remove_heartbeat
}
trap cleanup EXIT

# Change to project directory
cd "$PROJECT_DIR"

# Update heartbeat to running
update_heartbeat "running"

echo ""
echo "========================================"
echo "Starting Claude Code..."
echo "========================================"

# Run Claude Code in headless mode
claude -p "$TASK" \
    --dangerously-skip-permissions \
    --output-format stream-json \
    --verbose \
    2>&1 | tee "$LOG_FILE"

EXIT_CODE=${PIPESTATUS[0]}

echo ""
echo "========================================"
echo "Task completed at $(date)"
echo "Exit code: $EXIT_CODE"
echo "Log saved to: $LOG_FILE"
echo "========================================"

# Record specific failure types based on log content
if [ $EXIT_CODE -ne 0 ]; then
    if grep -q "build failed\|Build failed\|npm ERR!" "$LOG_FILE" 2>/dev/null; then
        record_failure "build_failed" "Build error in task"
    elif grep -q "commit.*failed\|git commit.*error" "$LOG_FILE" 2>/dev/null; then
        record_failure "commit_failed" "Commit error in task"
    elif grep -q "deploy.*failed\|firebase deploy.*error" "$LOG_FILE" 2>/dev/null; then
        record_failure "deployment_failed" "Deployment error in task"
    elif grep -q "auth.*error\|Authentication.*failed\|credentials" "$LOG_FILE" 2>/dev/null; then
        record_failure "auth_failed" "Auth error in task"
    fi
fi

exit $EXIT_CODE
