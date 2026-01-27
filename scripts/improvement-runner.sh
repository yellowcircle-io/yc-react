#!/usr/bin/env bash
#
# improvement-runner.sh - Autonomous UI/UX Improvement Execution Wrapper
#
# Executes a single improvement spec (IMP-XXX) from the backlog:
# 1. Reads JSON spec from .claude/improvement-backlog/items/
# 2. Creates a git branch for the work
# 3. Constructs a structured prompt from the spec
# 4. Invokes Claude CLI with the prompt
# 5. Validates output against 4 gates (file scope, line count, lint, build)
# 6. On success: commits and reports. On failure: rolls back and records attempt.
#
# Usage:
#   ./scripts/improvement-runner.sh IMP-002           # Execute specific item
#   ./scripts/improvement-runner.sh IMP-002 --dry-run # Parse spec and print prompt only
#   ./scripts/improvement-runner.sh --status          # Show backlog status
#
# Safety:
#   - All work on sleepless/* branches (never main)
#   - File scope validation prevents changes outside allowedFiles
#   - Circuit breaker pauses after 3 consecutive failures
#   - maxLinesChanged cap prevents runaway modifications

set -euo pipefail

# ============================================================
# Configuration
# ============================================================

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKLOG_DIR="${REPO_ROOT}/.claude/improvement-backlog"
BACKLOG_INDEX="${BACKLOG_DIR}/BACKLOG_INDEX.json"
CIRCUIT_BREAKER_FILE="${BACKLOG_INDEX}"  # Circuit breaker state lives in the index
SHARED_CONTEXT="${REPO_ROOT}/.claude/shared-context"
LOG_FILE="/tmp/improvement-runner.log"
CLI_TIMEOUT=300  # 5 minutes max for Claude CLI

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================
# Logging
# ============================================================

log() {
    local level="${1:-INFO}"
    shift
    local msg="$*"
    local ts
    ts="$(date '+%Y-%m-%d %H:%M:%S')"
    echo -e "[${ts}] [${level}] ${msg}"
    echo "[${ts}] [${level}] ${msg}" >> "${LOG_FILE}" 2>/dev/null || true
}

log_info()  { log "INFO" "$@"; }
log_warn()  { log "${YELLOW}WARN${NC}" "$@"; }
log_error() { log "${RED}ERROR${NC}" "$@"; }
log_ok()    { log "${GREEN}OK${NC}" "$@"; }

# ============================================================
# JSON Parsing (portable - uses python3)
# ============================================================

json_get() {
    local file="$1"
    local key="$2"
    python3 -c "
import json, sys
with open('${file}') as f:
    data = json.load(f)
keys = '${key}'.split('.')
val = data
for k in keys:
    if isinstance(val, list):
        val = val[int(k)]
    else:
        val = val[k]
if isinstance(val, (dict, list)):
    print(json.dumps(val))
elif isinstance(val, bool):
    print('true' if val else 'false')
else:
    print(val)
" 2>/dev/null
}

json_get_array() {
    local file="$1"
    local key="$2"
    python3 -c "
import json
with open('${file}') as f:
    data = json.load(f)
keys = '${key}'.split('.')
val = data
for k in keys:
    if isinstance(val, list):
        val = val[int(k)]
    else:
        val = val[k]
if isinstance(val, list):
    for item in val:
        if isinstance(item, str):
            print(item)
        else:
            print(json.dumps(item))
" 2>/dev/null
}

json_update_spec() {
    local file="$1"
    local updates="$2"  # Python dict literal for updates
    python3 -c "
import json
with open('${file}') as f:
    data = json.load(f)
updates = ${updates}
for key, value in updates.items():
    keys = key.split('.')
    obj = data
    for k in keys[:-1]:
        obj = obj[k]
    obj[keys[-1]] = value
with open('${file}', 'w') as f:
    json.dump(data, f, indent=2)
    f.write('\n')
" 2>/dev/null
}

json_append_attempt() {
    local file="$1"
    local attempt_json="$2"
    python3 -c "
import json
with open('${file}') as f:
    data = json.load(f)
attempt = json.loads('${attempt_json}')
data.setdefault('attempts', []).append(attempt)
with open('${file}', 'w') as f:
    json.dump(data, f, indent=2)
    f.write('\n')
" 2>/dev/null
}

# ============================================================
# Circuit Breaker
# ============================================================

check_circuit_breaker() {
    if [ ! -f "${BACKLOG_INDEX}" ]; then
        log_error "Backlog index not found: ${BACKLOG_INDEX}"
        return 1
    fi

    local status
    status="$(json_get "${BACKLOG_INDEX}" "circuitBreaker.status")"
    local failures
    failures="$(json_get "${BACKLOG_INDEX}" "circuitBreaker.consecutiveFailures")"
    local threshold
    threshold="$(json_get "${BACKLOG_INDEX}" "circuitBreaker.threshold")"

    if [ "${status}" = "open" ]; then
        log_error "Circuit breaker is OPEN (${failures}/${threshold} failures). Run with --reset-circuit to re-enable."
        return 1
    fi

    if [ "${failures}" -ge "${threshold}" ]; then
        log_error "Circuit breaker threshold reached (${failures}/${threshold}). Opening circuit."
        json_update_spec "${BACKLOG_INDEX}" "{'circuitBreaker.status': 'open'}"
        return 1
    fi

    return 0
}

increment_circuit_failures() {
    python3 -c "
import json
with open('${BACKLOG_INDEX}') as f:
    data = json.load(f)
cb = data['circuitBreaker']
cb['consecutiveFailures'] = cb.get('consecutiveFailures', 0) + 1
if cb['consecutiveFailures'] >= cb.get('threshold', 3):
    cb['status'] = 'open'
with open('${BACKLOG_INDEX}', 'w') as f:
    json.dump(data, f, indent=2)
    f.write('\n')
print(cb['consecutiveFailures'])
" 2>/dev/null
}

reset_circuit_failures() {
    json_update_spec "${BACKLOG_INDEX}" "{'circuitBreaker.consecutiveFailures': 0, 'circuitBreaker.status': 'closed'}"
}

# ============================================================
# Git Operations
# ============================================================

ensure_clean_git() {
    cd "${REPO_ROOT}"
    if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
        log_warn "Working directory has uncommitted changes. Stashing..."
        git stash push -m "improvement-runner auto-stash $(date +%s)" 2>/dev/null
        STASHED=true
    else
        STASHED=false
    fi
}

create_branch() {
    local branch_name="$1"
    cd "${REPO_ROOT}"

    # Ensure we're on main and up to date
    git checkout main 2>/dev/null
    git pull --rebase 2>/dev/null || true

    # Create and checkout the improvement branch
    if git branch --list "${branch_name}" | grep -q "${branch_name}"; then
        log_warn "Branch ${branch_name} already exists. Deleting and recreating."
        git branch -D "${branch_name}" 2>/dev/null
    fi

    git checkout -b "${branch_name}" 2>/dev/null
    log_info "Created branch: ${branch_name}"
}

rollback_branch() {
    local branch_name="$1"
    cd "${REPO_ROOT}"

    git checkout -- . 2>/dev/null || true
    git clean -fd 2>/dev/null || true
    git checkout main 2>/dev/null
    git branch -D "${branch_name}" 2>/dev/null || true

    if [ "${STASHED:-false}" = "true" ]; then
        git stash pop 2>/dev/null || true
    fi

    log_info "Rolled back branch: ${branch_name}"
}

commit_branch() {
    local branch_name="$1"
    local imp_id="$2"
    local title="$3"
    cd "${REPO_ROOT}"

    git add -A
    git commit -m "$(cat <<EOF
Agent: ${imp_id} - ${title}

Autonomous improvement executed by sleepless-daemon improvement-runner.
Spec: .claude/improvement-backlog/items/${imp_id}-*.json
Branch: ${branch_name}

Co-Authored-By: Sleepless Agent <sleepless@yellowcircle.io>
EOF
)"

    log_ok "Committed on branch: ${branch_name}"
}

# ============================================================
# Validation Gates
# ============================================================

# Gate 1: File scope - only allowedFiles modified
validate_file_scope() {
    local spec_file="$1"
    cd "${REPO_ROOT}"

    local modified_files
    modified_files="$(git diff --name-only HEAD 2>/dev/null)"

    if [ -z "${modified_files}" ]; then
        log_error "Gate 1 FAIL: No files were modified"
        return 1
    fi

    # Get allowed files from spec
    local allowed_files
    allowed_files="$(json_get_array "${spec_file}" "allowedFiles")"

    local violations=""
    while IFS= read -r modified; do
        local found=false
        while IFS= read -r allowed; do
            if [ "${modified}" = "${allowed}" ]; then
                found=true
                break
            fi
        done <<< "${allowed_files}"

        if [ "${found}" = "false" ]; then
            violations="${violations}  - ${modified}\n"
        fi
    done <<< "${modified_files}"

    if [ -n "${violations}" ]; then
        log_error "Gate 1 FAIL: Files modified outside allowedFiles:"
        echo -e "${violations}"
        return 1
    fi

    log_ok "Gate 1 PASS: All modified files are in allowedFiles"
    return 0
}

# Gate 2: Line count - under maxLinesChanged
validate_line_count() {
    local spec_file="$1"
    cd "${REPO_ROOT}"

    local max_lines
    max_lines="$(json_get "${spec_file}" "maxLinesChanged")"

    local actual_lines
    actual_lines="$(git diff HEAD --stat | tail -1 | grep -oE '[0-9]+ insertion' | grep -oE '[0-9]+' || echo 0)"
    local deletions
    deletions="$(git diff HEAD --stat | tail -1 | grep -oE '[0-9]+ deletion' | grep -oE '[0-9]+' || echo 0)"
    local total_lines=$(( actual_lines + deletions ))

    if [ "${total_lines}" -gt "${max_lines}" ]; then
        log_error "Gate 2 FAIL: ${total_lines} lines changed (max: ${max_lines})"
        return 1
    fi

    log_ok "Gate 2 PASS: ${total_lines} lines changed (max: ${max_lines})"
    return 0
}

# Gate 3: Lint passes
validate_lint() {
    cd "${REPO_ROOT}"

    if npm run lint 2>&1; then
        log_ok "Gate 3 PASS: Lint clean"
        return 0
    else
        log_error "Gate 3 FAIL: Lint errors found"
        return 1
    fi
}

# Gate 4: Build succeeds
validate_build() {
    cd "${REPO_ROOT}"

    if npm run build 2>&1; then
        log_ok "Gate 4 PASS: Build succeeded"
        return 0
    else
        log_error "Gate 4 FAIL: Build failed"
        return 1
    fi
}

# Run all 4 validation gates
run_validation_gates() {
    local spec_file="$1"
    local failed_gates=""

    log_info "Running validation gates..."

    if ! validate_file_scope "${spec_file}"; then
        failed_gates="${failed_gates}file_scope,"
    fi

    if ! validate_line_count "${spec_file}"; then
        failed_gates="${failed_gates}line_count,"
    fi

    if ! validate_lint; then
        failed_gates="${failed_gates}lint,"
    fi

    if ! validate_build; then
        failed_gates="${failed_gates}build,"
    fi

    if [ -n "${failed_gates}" ]; then
        log_error "Validation FAILED: ${failed_gates%,}"
        return 1
    fi

    log_ok "All 4 validation gates PASSED"
    return 0
}

# ============================================================
# Prompt Construction
# ============================================================

build_structured_prompt() {
    local spec_file="$1"

    local title objective
    title="$(json_get "${spec_file}" "title")"
    objective="$(json_get "${spec_file}" "objective")"

    local allowed_files
    allowed_files="$(json_get_array "${spec_file}" "allowedFiles")"

    local forbidden_files
    forbidden_files="$(json_get_array "${spec_file}" "forbiddenFiles")"

    local max_lines
    max_lines="$(json_get "${spec_file}" "maxLinesChanged")"

    local pattern_desc pattern_example pattern_notes
    pattern_desc="$(json_get "${spec_file}" "pattern.description")"
    pattern_example="$(json_get "${spec_file}" "pattern.example")"
    pattern_notes="$(json_get "${spec_file}" "pattern.notes")"

    local criteria
    criteria="$(json_get_array "${spec_file}" "acceptanceCriteria")"

    # Check for previous attempts to include feedback
    local prev_attempts
    prev_attempts="$(python3 -c "
import json
with open('${spec_file}') as f:
    data = json.load(f)
attempts = data.get('attempts', [])
if attempts:
    for i, a in enumerate(attempts):
        print(f'Attempt {i+1} ({a.get(\"result\", \"unknown\")}): {a.get(\"reason\", \"no details\")}')
" 2>/dev/null)"

    # Build the prompt
    cat <<PROMPT_EOF
# IMPROVEMENT TASK: ${title}

## Objective
${objective}

## Allowed Files (ONLY modify these files)
${allowed_files}

## Forbidden Files (DO NOT modify these under any circumstances)
${forbidden_files}

## Maximum Lines Changed: ${max_lines}

## Pattern to Follow
${pattern_desc}

Example:
\`\`\`
${pattern_example}
\`\`\`

Notes: ${pattern_notes}

## Acceptance Criteria
$(echo "${criteria}" | sed 's/^/- /')

## CRITICAL RULES
1. ONLY modify files listed in "Allowed Files". Do NOT touch any other file.
2. Keep total lines changed under ${max_lines}.
3. Follow the existing code patterns and style exactly.
4. Do NOT add new imports unless absolutely necessary for the change.
5. Do NOT refactor, reorganize, or "improve" code outside the stated objective.
6. Ensure npm run lint and npm run build will pass after your changes.

$(if [ -n "${prev_attempts}" ]; then
    echo "## PREVIOUS ATTEMPTS (learn from these failures)"
    echo "${prev_attempts}"
    echo ""
    echo "You MUST avoid repeating these mistakes."
fi)

Execute the objective now. Only modify the allowed files. Be precise and minimal.
PROMPT_EOF
}

# ============================================================
# Slack Notification (optional)
# ============================================================

notify_slack() {
    local message="$1"
    local script_path="${REPO_ROOT}/scripts/slack-notify.sh"

    if [ -f "${script_path}" ] && [ -x "${script_path}" ]; then
        bash "${script_path}" "${message}" 2>/dev/null || true
    fi
}

# ============================================================
# Status Display
# ============================================================

show_status() {
    if [ ! -f "${BACKLOG_INDEX}" ]; then
        echo "No backlog index found at ${BACKLOG_INDEX}"
        exit 1
    fi

    echo ""
    echo "=========================================="
    echo "  Improvement Backlog Status"
    echo "=========================================="
    echo ""

    local round
    round="$(json_get "${BACKLOG_INDEX}" "currentRound")"
    local theme
    theme="$(json_get "${BACKLOG_INDEX}" "roundTheme")"
    local cb_status
    cb_status="$(json_get "${BACKLOG_INDEX}" "circuitBreaker.status")"
    local cb_failures
    cb_failures="$(json_get "${BACKLOG_INDEX}" "circuitBreaker.consecutiveFailures")"

    echo "  Current Round: ${round} (${theme})"
    echo "  Circuit Breaker: ${cb_status} (${cb_failures}/3 failures)"
    echo ""

    python3 -c "
import json
with open('${BACKLOG_INDEX}') as f:
    data = json.load(f)
for item in data.get('items', []):
    status_icon = {'ready': '  ', 'running': '>>',  'review': '!!', 'merged': 'OK', 'failed': 'XX'}.get(item['status'], '??')
    print(f\"  [{status_icon}] {item['id']} (Round {item['round']}) - {item['status']}\")
" 2>/dev/null

    echo ""
    echo "  Legend: [  ] ready  [>>] running  [!!] review  [OK] merged  [XX] failed"
    echo ""
}

# ============================================================
# Main Execution
# ============================================================

execute_improvement() {
    local imp_id="$1"
    local dry_run="${2:-false}"

    # Normalize ID format
    imp_id="$(echo "${imp_id}" | tr '[:lower:]' '[:upper:]')"

    log_info "Starting improvement: ${imp_id}"

    # Find the spec file
    local spec_file
    spec_file="$(find "${BACKLOG_DIR}/items" -name "${imp_id}-*.json" -type f 2>/dev/null | head -1)"

    if [ -z "${spec_file}" ] || [ ! -f "${spec_file}" ]; then
        log_error "Spec file not found for ${imp_id}"
        exit 1
    fi

    log_info "Spec file: ${spec_file}"

    # Check spec status
    local status
    status="$(json_get "${spec_file}" "status")"
    if [ "${status}" != "ready" ] && [ "${status}" != "failed" ]; then
        log_error "${imp_id} status is '${status}' (expected 'ready' or 'failed')"
        exit 1
    fi

    # Check attempt count
    local attempt_count
    attempt_count="$(python3 -c "
import json
with open('${spec_file}') as f:
    data = json.load(f)
print(len(data.get('attempts', [])))
" 2>/dev/null)"
    local max_attempts
    max_attempts="$(json_get "${spec_file}" "maxAttempts")"

    if [ "${attempt_count}" -ge "${max_attempts}" ]; then
        log_error "${imp_id} has reached max attempts (${attempt_count}/${max_attempts})"
        exit 1
    fi

    # Check circuit breaker
    if ! check_circuit_breaker; then
        exit 1
    fi

    # Read spec details
    local title branch_name
    title="$(json_get "${spec_file}" "title")"
    branch_name="$(json_get "${spec_file}" "branch")"

    log_info "Title: ${title}"
    log_info "Branch: ${branch_name}"

    # Build the structured prompt
    local prompt
    prompt="$(build_structured_prompt "${spec_file}")"

    # Dry run - just print the prompt
    if [ "${dry_run}" = "true" ]; then
        echo ""
        echo "=========================================="
        echo "  DRY RUN: ${imp_id}"
        echo "=========================================="
        echo ""
        echo "${prompt}"
        echo ""
        echo "=========================================="
        echo "  (No changes made - dry run complete)"
        echo "=========================================="
        return 0
    fi

    # Update spec status to running
    json_update_spec "${spec_file}" "{'status': 'running'}"

    # Ensure clean git state and create branch
    ensure_clean_git
    create_branch "${branch_name}"

    local attempt_result="failed"
    local attempt_reason=""
    local attempt_ts
    attempt_ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

    # Execute via Claude CLI
    log_info "Invoking Claude CLI (timeout: ${CLI_TIMEOUT}s)..."

    local cli_exit_code=0
    local cli_output
    cli_output="$(timeout "${CLI_TIMEOUT}" claude --print -p "${prompt}" 2>&1)" || cli_exit_code=$?

    if [ "${cli_exit_code}" -ne 0 ]; then
        attempt_reason="Claude CLI failed with exit code ${cli_exit_code}"
        log_error "${attempt_reason}"
    else
        log_info "Claude CLI completed successfully"

        # Run validation gates
        if run_validation_gates "${spec_file}"; then
            # All gates passed - commit!
            commit_branch "${branch_name}" "${imp_id}" "${title}"

            attempt_result="success"
            json_update_spec "${spec_file}" "{'status': 'review'}"
            reset_circuit_failures

            log_ok "============================================"
            log_ok "  ${imp_id} SUCCEEDED - Branch ready for review"
            log_ok "  Branch: ${branch_name}"
            log_ok "  Review: git diff main..${branch_name}"
            log_ok "============================================"

            notify_slack "Improvement ${imp_id} (${title}) ready for review on branch ${branch_name}"

            # Return to main but keep the branch
            git checkout main 2>/dev/null
            if [ "${STASHED:-false}" = "true" ]; then
                git stash pop 2>/dev/null || true
            fi

            # Record successful attempt
            json_append_attempt "${spec_file}" "{\"timestamp\": \"${attempt_ts}\", \"result\": \"success\", \"reason\": \"All 4 gates passed\"}"

            return 0
        else
            attempt_reason="Validation gates failed"
        fi
    fi

    # Failure path
    log_error "${imp_id} FAILED: ${attempt_reason}"

    # Record failed attempt
    json_append_attempt "${spec_file}" "{\"timestamp\": \"${attempt_ts}\", \"result\": \"failed\", \"reason\": \"${attempt_reason}\"}"

    # Rollback
    rollback_branch "${branch_name}"

    # Update spec status
    json_update_spec "${spec_file}" "{'status': 'failed'}"

    # Increment circuit breaker
    local failures
    failures="$(increment_circuit_failures)"
    log_warn "Circuit breaker: ${failures}/3 consecutive failures"

    notify_slack "Improvement ${imp_id} (${title}) FAILED: ${attempt_reason}. Circuit breaker: ${failures}/3"

    return 1
}

# ============================================================
# Entry Point
# ============================================================

main() {
    if [ $# -eq 0 ]; then
        echo "Usage:"
        echo "  $0 IMP-XXX              Execute improvement spec"
        echo "  $0 IMP-XXX --dry-run    Parse and print prompt only"
        echo "  $0 --status             Show backlog status"
        echo "  $0 --reset-circuit      Reset circuit breaker"
        echo "  $0 --next               Execute next ready item"
        exit 0
    fi

    local arg1="${1:-}"
    local arg2="${2:-}"

    case "${arg1}" in
        --status)
            show_status
            ;;
        --reset-circuit)
            reset_circuit_failures
            log_ok "Circuit breaker reset"
            ;;
        --next)
            # Find next ready item
            local next_id
            next_id="$(python3 -c "
import json
with open('${BACKLOG_INDEX}') as f:
    data = json.load(f)
for item in data.get('items', []):
    if item['status'] == 'ready':
        print(item['id'])
        break
" 2>/dev/null)"
            if [ -z "${next_id}" ]; then
                log_info "No ready items in backlog"
                exit 0
            fi
            log_info "Next ready item: ${next_id}"
            execute_improvement "${next_id}" "false"
            ;;
        IMP-*|imp-*)
            local dry_run="false"
            if [ "${arg2}" = "--dry-run" ]; then
                dry_run="true"
            fi
            execute_improvement "${arg1}" "${dry_run}"
            ;;
        *)
            log_error "Unknown argument: ${arg1}"
            exit 1
            ;;
    esac
}

main "$@"
