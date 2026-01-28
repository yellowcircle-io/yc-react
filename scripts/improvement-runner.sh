#!/usr/bin/env bash
#
# improvement-runner.sh - Autonomous UI/UX Improvement Execution Wrapper
#
# Executes a single improvement spec (IMP-XXX) from the backlog:
# 1. Reads JSON spec from .claude/improvement-backlog/items/
# 2. Creates a git branch for the work
# 3. Constructs a structured prompt from the spec
# 4. Invokes Claude CLI in agentic mode with restricted tools
# 5. Validates output against 4 gates (file scope, line count, lint, build)
# 6. On success: commits, pushes, creates PR (if gh available), reports.
#    On failure: rolls back and records attempt.
#
# Usage:
#   ./scripts/improvement-runner.sh IMP-002           # Execute specific item
#   ./scripts/improvement-runner.sh IMP-002 --dry-run # Parse spec and print prompt only
#   ./scripts/improvement-runner.sh --status          # Show backlog status
#   ./scripts/improvement-runner.sh --next            # Execute next ready item
#   ./scripts/improvement-runner.sh --review          # List items pending review
#   ./scripts/improvement-runner.sh --approve IMP-002 # Merge approved improvement
#   ./scripts/improvement-runner.sh --reject IMP-002 [reason] # Reject improvement
#   ./scripts/improvement-runner.sh --diff IMP-002    # Show branch diff
#   ./scripts/improvement-runner.sh --preflight       # Check all dependencies
#
# Safety:
#   - All work on sleepless/* branches (never main)
#   - File scope validation prevents changes outside allowedFiles
#   - Circuit breaker pauses after 3 consecutive failures
#   - maxLinesChanged cap prevents runaway modifications
#   - Concurrency lock prevents parallel execution
#   - Tool restriction: agent limited to Edit,Read,Glob,Grep (no Bash/Write)
#   - Explicit file staging (only allowedFiles committed, not git add -A)

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
LOCK_DIR="/tmp/improvement-runner.lock"
LOCK_STALE_SECONDS=900  # 15 minutes = stale lock

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track stash state
STASHED=false

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
# Concurrency Lock (Blocker 7)
# ============================================================

acquire_lock() {
    # Check for stale lock (older than LOCK_STALE_SECONDS)
    if [ -d "${LOCK_DIR}" ]; then
        local lock_pid_file="${LOCK_DIR}/pid"
        if [ -f "${lock_pid_file}" ]; then
            local lock_pid
            lock_pid="$(cat "${lock_pid_file}" 2>/dev/null || echo "")"
            # Check if the process that holds the lock is still alive
            if [ -n "${lock_pid}" ] && ! kill -0 "${lock_pid}" 2>/dev/null; then
                log_warn "Stale lock found (PID ${lock_pid} is dead). Removing."
                rm -rf "${LOCK_DIR}"
            else
                # Process alive - check age
                local lock_age=0
                if [ "$(uname)" = "Darwin" ]; then
                    local lock_mtime
                    lock_mtime="$(stat -f %m "${lock_pid_file}" 2>/dev/null || echo 0)"
                    local now
                    now="$(date +%s)"
                    lock_age=$(( now - lock_mtime ))
                else
                    lock_age="$(( $(date +%s) - $(stat -c %Y "${lock_pid_file}" 2>/dev/null || echo 0) ))"
                fi
                if [ "${lock_age}" -ge "${LOCK_STALE_SECONDS}" ]; then
                    log_warn "Lock older than ${LOCK_STALE_SECONDS}s (age: ${lock_age}s). Forcing removal."
                    rm -rf "${LOCK_DIR}"
                fi
            fi
        fi
    fi

    if ! mkdir "${LOCK_DIR}" 2>/dev/null; then
        log_error "Another improvement runner is already executing. Lock: ${LOCK_DIR}"
        log_error "If this is incorrect, remove the lock: rm -rf ${LOCK_DIR}"
        exit 1
    fi

    # Write our PID for stale detection
    echo "$$" > "${LOCK_DIR}/pid"
    log_info "Acquired execution lock (PID $$)"
}

release_lock() {
    if [ -d "${LOCK_DIR}" ]; then
        rm -rf "${LOCK_DIR}"
    fi
}

# ============================================================
# Preflight Checks
# ============================================================

preflight_check() {
    local errors=0

    echo ""
    echo "=========================================="
    echo "  Preflight Dependency Check"
    echo "=========================================="
    echo ""

    # python3
    if command -v python3 &>/dev/null; then
        echo "  [OK] python3: $(python3 --version 2>&1)"
    else
        echo "  [FAIL] python3: not found"
        errors=$((errors + 1))
    fi

    # git
    if command -v git &>/dev/null; then
        echo "  [OK] git: $(git --version 2>&1)"
    else
        echo "  [FAIL] git: not found"
        errors=$((errors + 1))
    fi

    # claude CLI
    if command -v claude &>/dev/null; then
        echo "  [OK] claude: $(claude --version 2>&1 | head -1)"
    else
        echo "  [FAIL] claude: not found (required for execution)"
        errors=$((errors + 1))
    fi

    # npm/node
    if command -v npm &>/dev/null; then
        echo "  [OK] npm: $(npm --version 2>&1)"
    else
        echo "  [FAIL] npm: not found (required for lint/build gates)"
        errors=$((errors + 1))
    fi

    # gh CLI (optional but recommended)
    if command -v gh &>/dev/null; then
        local gh_auth
        gh_auth="$(gh auth status 2>&1 || true)"
        if echo "${gh_auth}" | grep -q "Logged in"; then
            echo "  [OK] gh: $(gh --version 2>&1 | head -1) (authenticated)"
        else
            echo "  [WARN] gh: installed but NOT authenticated. Run: gh auth login"
        fi
    else
        echo "  [WARN] gh: not found (PR workflow unavailable). Install: brew install gh"
    fi

    # Backlog directory
    if [ -d "${BACKLOG_DIR}/items" ]; then
        local item_count
        item_count="$(find "${BACKLOG_DIR}/items" -name "IMP-*.json" -type f 2>/dev/null | wc -l | tr -d ' ')"
        echo "  [OK] backlog: ${item_count} spec files in ${BACKLOG_DIR}/items/"
    else
        echo "  [FAIL] backlog: directory not found at ${BACKLOG_DIR}/items/"
        errors=$((errors + 1))
    fi

    # Backlog index
    if [ -f "${BACKLOG_INDEX}" ]; then
        echo "  [OK] index: ${BACKLOG_INDEX}"
    else
        echo "  [FAIL] index: not found at ${BACKLOG_INDEX}"
        errors=$((errors + 1))
    fi

    # Git repo
    if git -C "${REPO_ROOT}" rev-parse --git-dir &>/dev/null; then
        local branch
        branch="$(git -C "${REPO_ROOT}" branch --show-current 2>/dev/null)"
        echo "  [OK] git repo: branch '${branch}'"
    else
        echo "  [FAIL] git repo: ${REPO_ROOT} is not a git repository"
        errors=$((errors + 1))
    fi

    # Lint baseline check
    echo ""
    echo "  Lint baseline check (allowedFiles only)..."
    local sample_file="src/components/unity-plus/nodes/StickyNode.jsx"
    if [ -f "${REPO_ROOT}/${sample_file}" ]; then
        if npx eslint "${REPO_ROOT}/${sample_file}" --no-error-on-unmatched-pattern 2>&1 | grep -q "error"; then
            echo "  [WARN] lint: pre-existing errors in ${sample_file}"
            echo "         Gate 3 lints only allowedFiles, not full codebase"
        else
            echo "  [OK] lint: ${sample_file} is clean"
        fi
    fi

    echo ""
    if [ "${errors}" -gt 0 ]; then
        echo "  RESULT: ${errors} critical issue(s) found. Fix before running."
        return 1
    else
        echo "  RESULT: All critical checks passed."
        return 0
    fi
    echo ""
}

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
# Spec Lookup Helper
# ============================================================

find_spec_file() {
    local imp_id="$1"
    imp_id="$(echo "${imp_id}" | tr '[:lower:]' '[:upper:]')"
    local spec_file
    spec_file="$(find "${BACKLOG_DIR}/items" -name "${imp_id}-*.json" -type f 2>/dev/null | head -1)"
    if [ -z "${spec_file}" ] || [ ! -f "${spec_file}" ]; then
        echo ""
        return 1
    fi
    echo "${spec_file}"
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
        log_warn "Working directory has uncommitted changes. Stashing (including untracked)..."
        # Blocker 11: -u includes untracked files in stash to prevent data loss
        git stash push -u -m "improvement-runner auto-stash $(date +%s)" 2>/dev/null
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

    # Delete local branch if it exists
    if git branch --list "${branch_name}" | grep -q "${branch_name}"; then
        log_warn "Branch ${branch_name} already exists locally. Deleting and recreating."
        git branch -D "${branch_name}" 2>/dev/null
    fi

    # Delete remote branch if it exists (leftover from previous failed run)
    if git ls-remote --heads origin "${branch_name}" 2>/dev/null | grep -q "${branch_name}"; then
        log_warn "Branch ${branch_name} exists on remote. Deleting."
        git push origin --delete "${branch_name}" 2>/dev/null || true
    fi

    git checkout -b "${branch_name}" 2>/dev/null
    log_info "Created branch: ${branch_name}"
}

rollback_branch() {
    local branch_name="$1"
    cd "${REPO_ROOT}"

    # Blocker 10: Only revert tracked file changes. Do NOT use git clean -fd
    # which would destroy user's untracked files that weren't part of agent work.
    git checkout -- . 2>/dev/null || true
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
    local spec_file="$4"
    cd "${REPO_ROOT}"

    # Blocker 8: Stage only files from allowedFiles list, not git add -A.
    # This prevents committing unexpected files the agent may have created.
    local allowed_files
    allowed_files="$(json_get_array "${spec_file}" "allowedFiles")"
    local staged_count=0

    while IFS= read -r allowed; do
        if [ -n "${allowed}" ] && [ -f "${REPO_ROOT}/${allowed}" ]; then
            git add "${allowed}" 2>/dev/null && staged_count=$((staged_count + 1))
        fi
    done <<< "${allowed_files}"

    if [ "${staged_count}" -eq 0 ]; then
        log_error "No allowed files were staged for commit"
        return 1
    fi

    git commit -m "$(cat <<EOF
Agent: ${imp_id} - ${title}

Autonomous improvement executed by sleepless-daemon improvement-runner.
Spec: .claude/improvement-backlog/items/${imp_id}-*.json
Branch: ${branch_name}

Co-Authored-By: Sleepless Agent <sleepless@yellowcircle.io>
EOF
)"

    log_ok "Committed ${staged_count} file(s) on branch: ${branch_name}"

    # Blocker 4: Push branch to remote for PR-based review
    log_info "Pushing branch to remote..."
    if git push -u origin "${branch_name}" 2>&1; then
        log_ok "Pushed branch: ${branch_name}"

        # Create PR if gh is available
        if command -v gh &>/dev/null; then
            log_info "Creating draft PR..."
            local pr_url
            pr_url="$(gh pr create \
                --title "Agent: ${imp_id} - ${title}" \
                --body "$(cat <<PRBODY
## Autonomous Improvement: ${imp_id}

**Objective:** ${title}

**Spec:** \`.claude/improvement-backlog/items/${imp_id}-*.json\`

### Validation Gates
- [x] Gate 1: File scope (only allowedFiles modified)
- [x] Gate 2: Line count (under max)
- [x] Gate 3: Lint (allowedFiles clean)
- [x] Gate 4: Build passes

### Review
Review the diff and approve/reject via:
- GitHub PR UI (merge or close)
- Slack: \`/sleepless improve approve ${imp_id}\`
- Slack: \`/sleepless improve reject ${imp_id} [reason]\`

---
*Generated by sleepless-daemon improvement-runner*
PRBODY
)" \
                --draft \
                --base main \
                --head "${branch_name}" 2>&1)" || true

            if [ -n "${pr_url}" ] && echo "${pr_url}" | grep -q "http"; then
                log_ok "PR created: ${pr_url}"
                # Record PR URL in spec for approve/reject commands
                python3 -c "
import json
with open('${spec_file}') as f:
    data = json.load(f)
data['prUrl'] = '${pr_url}'
with open('${spec_file}', 'w') as f:
    json.dump(data, f, indent=2)
    f.write('\n')
" 2>/dev/null
            else
                log_warn "PR creation returned: ${pr_url:-empty}"
            fi
        else
            log_warn "gh CLI not available. Branch pushed but no PR created."
            log_warn "Review manually: git diff main..${branch_name}"
        fi
    else
        log_warn "Push failed. Branch exists locally only. Review: git diff main..${branch_name}"
    fi
}

# ============================================================
# Validation Gates
# ============================================================

# Gate 1: File scope - only allowedFiles modified (+ untracked detection)
validate_file_scope() {
    local spec_file="$1"
    cd "${REPO_ROOT}"

    # Blocker 9: Use both git diff (tracked changes) AND git status (untracked files)
    # to catch any new files the agent may have created outside allowedFiles.
    local modified_tracked
    modified_tracked="$(git diff --name-only HEAD 2>/dev/null || true)"

    local new_untracked
    new_untracked="$(git ls-files --others --exclude-standard 2>/dev/null || true)"

    # Combine both lists
    local all_changes=""
    if [ -n "${modified_tracked}" ]; then
        all_changes="${modified_tracked}"
    fi
    if [ -n "${new_untracked}" ]; then
        if [ -n "${all_changes}" ]; then
            all_changes="${all_changes}
${new_untracked}"
        else
            all_changes="${new_untracked}"
        fi
    fi

    if [ -z "${all_changes}" ]; then
        log_error "Gate 1 FAIL: No files were modified"
        return 1
    fi

    # Get allowed files from spec
    local allowed_files
    allowed_files="$(json_get_array "${spec_file}" "allowedFiles")"

    local violations=""
    while IFS= read -r modified; do
        [ -z "${modified}" ] && continue
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
    done <<< "${all_changes}"

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

# Gate 3: Lint passes on allowedFiles only
# Blocker 3: Full-project lint has 13 pre-existing errors (exit code 1 always).
# Only lint the files the agent was allowed to modify.
validate_lint() {
    local spec_file="$1"
    cd "${REPO_ROOT}"

    local allowed_files
    allowed_files="$(json_get_array "${spec_file}" "allowedFiles")"

    # Build file list for eslint
    local lint_files=""
    while IFS= read -r allowed; do
        [ -z "${allowed}" ] && continue
        if [ -f "${REPO_ROOT}/${allowed}" ]; then
            lint_files="${lint_files} ${allowed}"
        fi
    done <<< "${allowed_files}"

    if [ -z "${lint_files}" ]; then
        log_warn "Gate 3 SKIP: No allowed files found to lint"
        return 0
    fi

    # shellcheck disable=SC2086
    if npx eslint --no-error-on-unmatched-pattern ${lint_files} 2>&1; then
        log_ok "Gate 3 PASS: Lint clean on allowed files"
        return 0
    else
        log_error "Gate 3 FAIL: Lint errors in allowed files"
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

    if ! validate_lint "${spec_file}"; then
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
7. Do NOT create new files. Only edit existing files.
8. Do NOT run any shell commands. Only use Edit and Read tools.

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
    blocked = ''
    if item.get('blockedBy'):
        blocked = f' [blocked by: {\", \".join(item[\"blockedBy\"])}]'
    print(f\"  [{status_icon}] {item['id']} (Round {item['round']}) - {item['status']}{blocked}\")
" 2>/dev/null

    echo ""
    echo "  Legend: [  ] ready  [>>] running  [!!] review  [OK] merged  [XX] failed"
    echo ""
}

# ============================================================
# Review Operations (Blocker 6)
# ============================================================

# List items in review status
show_review() {
    if [ ! -f "${BACKLOG_INDEX}" ]; then
        echo "No backlog index found"
        exit 1
    fi

    echo ""
    echo "=========================================="
    echo "  Items Pending Review"
    echo "=========================================="
    echo ""

    python3 -c "
import json
with open('${BACKLOG_INDEX}') as f:
    data = json.load(f)
found = False
for item in data.get('items', []):
    if item['status'] == 'review':
        found = True
        imp_id = item['id']
        # Try to find spec for PR URL
        import glob
        specs = glob.glob('${BACKLOG_DIR}/items/' + imp_id + '-*.json')
        pr_url = ''
        branch = ''
        if specs:
            with open(specs[0]) as sf:
                spec = json.load(sf)
            pr_url = spec.get('prUrl', '')
            branch = spec.get('branch', '')
        print(f'  {imp_id}:')
        if branch:
            print(f'    Branch: {branch}')
        if pr_url:
            print(f'    PR: {pr_url}')
        else:
            print(f'    Review: git diff main..{branch}')
        print()
if not found:
    print('  No items pending review.')
" 2>/dev/null

    echo ""
}

# Show diff for an improvement branch
show_diff() {
    local imp_id="$1"
    imp_id="$(echo "${imp_id}" | tr '[:lower:]' '[:upper:]')"

    local spec_file
    spec_file="$(find_spec_file "${imp_id}")"
    if [ -z "${spec_file}" ]; then
        log_error "Spec file not found for ${imp_id}"
        exit 1
    fi

    local branch_name
    branch_name="$(json_get "${spec_file}" "branch")"
    local pr_url
    pr_url="$(python3 -c "
import json
with open('${spec_file}') as f:
    data = json.load(f)
print(data.get('prUrl', ''))
" 2>/dev/null)"

    echo ""
    echo "=========================================="
    echo "  Diff: ${imp_id}"
    echo "=========================================="

    if [ -n "${pr_url}" ]; then
        echo "  PR: ${pr_url}"
    fi
    echo "  Branch: ${branch_name}"
    echo ""

    cd "${REPO_ROOT}"

    # Check if branch exists locally or remotely
    if git rev-parse --verify "${branch_name}" &>/dev/null; then
        git diff main.."${branch_name}" --stat
        echo ""
        git diff main.."${branch_name}"
    elif git rev-parse --verify "origin/${branch_name}" &>/dev/null; then
        git fetch origin "${branch_name}" 2>/dev/null || true
        git diff main.."origin/${branch_name}" --stat
        echo ""
        git diff main.."origin/${branch_name}"
    else
        log_error "Branch ${branch_name} not found locally or on remote"
        exit 1
    fi
}

# Approve and merge an improvement
approve_improvement() {
    local imp_id="$1"
    imp_id="$(echo "${imp_id}" | tr '[:lower:]' '[:upper:]')"

    local spec_file
    spec_file="$(find_spec_file "${imp_id}")"
    if [ -z "${spec_file}" ]; then
        log_error "Spec file not found for ${imp_id}"
        exit 1
    fi

    local status
    status="$(json_get "${spec_file}" "status")"
    if [ "${status}" != "review" ]; then
        log_error "${imp_id} status is '${status}' (expected 'review')"
        exit 1
    fi

    local branch_name
    branch_name="$(json_get "${spec_file}" "branch")"
    local pr_url
    pr_url="$(python3 -c "
import json
with open('${spec_file}') as f:
    data = json.load(f)
print(data.get('prUrl', ''))
" 2>/dev/null)"

    log_info "Approving ${imp_id} (branch: ${branch_name})"

    cd "${REPO_ROOT}"

    # Try gh pr merge first (preferred: uses GitHub API, no local git state issues)
    if command -v gh &>/dev/null && [ -n "${pr_url}" ]; then
        log_info "Merging via GitHub PR..."
        local pr_number
        pr_number="$(echo "${pr_url}" | grep -oE '[0-9]+$')"
        if gh pr merge "${pr_number}" --merge --delete-branch 2>&1; then
            log_ok "${imp_id} merged via PR #${pr_number}"
            git checkout main 2>/dev/null
            git pull --rebase 2>/dev/null || true
        else
            log_error "gh pr merge failed. Attempting local merge..."
            # Fall through to local merge
            pr_url=""
        fi
    fi

    # Local git merge fallback
    if [ -z "${pr_url}" ] || ! command -v gh &>/dev/null; then
        log_info "Merging via local git..."
        ensure_clean_git
        git checkout main 2>/dev/null
        git pull --rebase 2>/dev/null || true

        if git merge "${branch_name}" 2>&1; then
            git push 2>&1 || log_warn "Push failed. Merged locally but not pushed."
            git branch -d "${branch_name}" 2>/dev/null || true
            git push origin --delete "${branch_name}" 2>/dev/null || true
            log_ok "${imp_id} merged via local git"
        else
            log_error "Merge failed. Conflicts detected."
            git merge --abort 2>/dev/null || true
            if [ "${STASHED:-false}" = "true" ]; then
                git stash pop 2>/dev/null || true
            fi
            exit 1
        fi

        if [ "${STASHED:-false}" = "true" ]; then
            git stash pop 2>/dev/null || true
        fi
    fi

    # Update spec status to merged
    json_update_spec "${spec_file}" "{'status': 'merged'}"

    # Update backlog index item status
    python3 -c "
import json
with open('${BACKLOG_INDEX}') as f:
    data = json.load(f)
for item in data.get('items', []):
    if item['id'] == '${imp_id}':
        item['status'] = 'merged'
        break
with open('${BACKLOG_INDEX}', 'w') as f:
    json.dump(data, f, indent=2)
    f.write('\n')
" 2>/dev/null

    # Reset circuit breaker on successful merge
    reset_circuit_failures

    log_ok "============================================"
    log_ok "  ${imp_id} APPROVED AND MERGED"
    log_ok "============================================"

    notify_slack "Improvement ${imp_id} approved and merged to main"
}

# Reject an improvement
reject_improvement() {
    local imp_id="$1"
    local reason="${2:-No reason provided}"
    imp_id="$(echo "${imp_id}" | tr '[:lower:]' '[:upper:]')"

    local spec_file
    spec_file="$(find_spec_file "${imp_id}")"
    if [ -z "${spec_file}" ]; then
        log_error "Spec file not found for ${imp_id}"
        exit 1
    fi

    local status
    status="$(json_get "${spec_file}" "status")"
    if [ "${status}" != "review" ]; then
        log_error "${imp_id} status is '${status}' (expected 'review')"
        exit 1
    fi

    local branch_name
    branch_name="$(json_get "${spec_file}" "branch")"
    local pr_url
    pr_url="$(python3 -c "
import json
with open('${spec_file}') as f:
    data = json.load(f)
print(data.get('prUrl', ''))
" 2>/dev/null)"

    log_info "Rejecting ${imp_id}: ${reason}"

    cd "${REPO_ROOT}"

    # Close PR if available
    if command -v gh &>/dev/null && [ -n "${pr_url}" ]; then
        local pr_number
        pr_number="$(echo "${pr_url}" | grep -oE '[0-9]+$')"
        gh pr close "${pr_number}" --comment "Rejected: ${reason}" 2>/dev/null || true
        log_info "Closed PR #${pr_number}"
    fi

    # Delete branch (local + remote)
    git branch -D "${branch_name}" 2>/dev/null || true
    git push origin --delete "${branch_name}" 2>/dev/null || true

    # Update spec: status back to failed, record rejection
    json_update_spec "${spec_file}" "{'status': 'failed'}"
    local reject_ts
    reject_ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    json_append_attempt "${spec_file}" "{\"timestamp\": \"${reject_ts}\", \"result\": \"rejected\", \"reason\": \"Human rejected: ${reason}\"}"

    # Update backlog index
    python3 -c "
import json
with open('${BACKLOG_INDEX}') as f:
    data = json.load(f)
for item in data.get('items', []):
    if item['id'] == '${imp_id}':
        item['status'] = 'failed'
        break
with open('${BACKLOG_INDEX}', 'w') as f:
    json.dump(data, f, indent=2)
    f.write('\n')
" 2>/dev/null

    # Note: Rejections do NOT increment circuit breaker.
    # Rejections mean the agent produced valid but wrong output.
    # Circuit breaker is for execution/validation failures only.

    log_ok "============================================"
    log_ok "  ${imp_id} REJECTED: ${reason}"
    log_ok "  Branch deleted. Spec reset to 'failed'."
    log_ok "  Agent can retry if attempts remain."
    log_ok "============================================"

    notify_slack "Improvement ${imp_id} rejected: ${reason}"
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
    spec_file="$(find_spec_file "${imp_id}")"

    if [ -z "${spec_file}" ]; then
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
        echo "  CLI invocation would be:"
        echo "  claude -p <prompt> --dangerously-skip-permissions --tools 'Edit,Read,Glob,Grep'"
        echo "  (No changes made - dry run complete)"
        echo "=========================================="
        return 0
    fi

    # Acquire concurrency lock for execution
    acquire_lock
    # Ensure lock is released on exit (including errors)
    trap 'release_lock' EXIT

    # Update spec status to running
    json_update_spec "${spec_file}" "{'status': 'running'}"

    # Ensure clean git state and create branch
    ensure_clean_git
    create_branch "${branch_name}"

    local attempt_result="failed"
    local attempt_reason=""
    local attempt_ts
    attempt_ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

    # Blocker 1+2: Execute via Claude CLI in agentic mode
    # - Removed --print (was redundant with -p and may limit tool use)
    # - Added --dangerously-skip-permissions for headless execution
    # - Added --tools to restrict agent to safe tools only (no Bash, no Write)
    # - Timeout handled via background process (macOS has no 'timeout' command)
    log_info "Invoking Claude CLI (agentic mode, timeout: ${CLI_TIMEOUT}s)..."
    log_info "Tools: Edit,Read,Glob,Grep (Bash/Write excluded for safety)"

    local cli_exit_code=0
    local cli_output=""
    local cli_tmp
    cli_tmp="$(mktemp /tmp/imp-cli-XXXXXX)"

    # Run Claude CLI in background with timeout watchdog
    claude -p "${prompt}" \
        --dangerously-skip-permissions \
        --tools "Edit,Read,Glob,Grep" \
        > "${cli_tmp}" 2>&1 &
    local cli_pid=$!

    # Watchdog: kill CLI if it exceeds timeout
    ( sleep "${CLI_TIMEOUT}" && kill "${cli_pid}" 2>/dev/null ) &
    local watchdog_pid=$!

    # Wait for CLI to finish (or be killed by watchdog)
    wait "${cli_pid}" 2>/dev/null || cli_exit_code=$?

    # Clean up watchdog
    kill "${watchdog_pid}" 2>/dev/null 2>&1 || true
    wait "${watchdog_pid}" 2>/dev/null 2>&1 || true

    # Read CLI output
    cli_output="$(cat "${cli_tmp}" 2>/dev/null || echo "(no output)")"
    rm -f "${cli_tmp}"

    # Check for timeout (killed by watchdog = exit 137 SIGKILL or 143 SIGTERM)
    if [ "${cli_exit_code}" -eq 137 ] || [ "${cli_exit_code}" -eq 143 ]; then
        attempt_reason="Claude CLI timed out after ${CLI_TIMEOUT}s"
        log_error "${attempt_reason}"
    elif [ "${cli_exit_code}" -ne 0 ]; then
        attempt_reason="Claude CLI failed with exit code ${cli_exit_code}"
        log_error "${attempt_reason}"
        # Log first 500 chars of output for debugging
        log_error "CLI output: ${cli_output:0:500}"
    else
        log_info "Claude CLI completed successfully"

        # Run validation gates
        if run_validation_gates "${spec_file}"; then
            # All gates passed - commit and push!
            commit_branch "${branch_name}" "${imp_id}" "${title}" "${spec_file}"

            attempt_result="success"
            json_update_spec "${spec_file}" "{'status': 'review'}"
            reset_circuit_failures

            log_ok "============================================"
            log_ok "  ${imp_id} SUCCEEDED - Ready for review"
            log_ok "  Branch: ${branch_name}"
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
        echo "  $0 --review             List items pending review"
        echo "  $0 --approve IMP-XXX    Merge approved improvement"
        echo "  $0 --reject IMP-XXX [reason]  Reject improvement"
        echo "  $0 --diff IMP-XXX       Show branch diff"
        echo "  $0 --reset-circuit      Reset circuit breaker"
        echo "  $0 --next               Execute next ready item"
        echo "  $0 --preflight          Check all dependencies"
        exit 0
    fi

    local arg1="${1:-}"
    local arg2="${2:-}"
    local arg3="${3:-}"

    case "${arg1}" in
        --status)
            show_status
            ;;
        --review)
            show_review
            ;;
        --approve)
            if [ -z "${arg2}" ]; then
                log_error "Usage: $0 --approve IMP-XXX"
                exit 1
            fi
            approve_improvement "${arg2}"
            ;;
        --reject)
            if [ -z "${arg2}" ]; then
                log_error "Usage: $0 --reject IMP-XXX [reason]"
                exit 1
            fi
            # Collect all args after IMP-XXX as the reason
            local reason=""
            shift 2
            reason="$*"
            reject_improvement "${arg2}" "${reason:-No reason provided}"
            ;;
        --diff)
            if [ -z "${arg2}" ]; then
                log_error "Usage: $0 --diff IMP-XXX"
                exit 1
            fi
            show_diff "${arg2}"
            ;;
        --reset-circuit)
            reset_circuit_failures
            log_ok "Circuit breaker reset"
            ;;
        --preflight)
            preflight_check
            ;;
        --next)
            # Find next ready item (respects blockedBy dependencies)
            local next_id
            next_id="$(python3 -c "
import json
with open('${BACKLOG_INDEX}') as f:
    data = json.load(f)
items = data.get('items', [])
item_status = {item['id']: item['status'] for item in items}
for item in items:
    if item['status'] != 'ready':
        continue
    # Check blockedBy dependencies
    blocked_by = item.get('blockedBy', [])
    if blocked_by:
        all_merged = all(item_status.get(dep) == 'merged' for dep in blocked_by)
        if not all_merged:
            continue
    print(item['id'])
    break
" 2>/dev/null)"
            if [ -z "${next_id}" ]; then
                log_info "No ready items in backlog (all items may be blocked, in review, or complete)"
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
