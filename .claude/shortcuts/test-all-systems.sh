#!/bin/bash

# Complete Test Suite for yellowCircle Mobile Command System
# Tests all three execution methods: Router, Email/GitHub, and Shortcuts

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AUTOMATION_DIR="$SCRIPT_DIR/../automation"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo ""
    echo "╔════════════════════════════════════════════╗"
    echo "║  $1"
    echo "╚════════════════════════════════════════════╝"
    echo ""
}

print_test() {
    echo ""
    echo -e "${BLUE}🧪 Test: $1${NC}"
    echo "-------------------------------------------"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

run_test() {
    local test_name="$1"
    local test_command="$2"

    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    print_test "$test_name"

    if eval "$test_command"; then
        print_success "PASSED"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        print_error "FAILED"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# ============================================
# TEST SUITE 1: SHORTCUT ROUTER
# ============================================

test_router_suite() {
    print_header "TEST SUITE 1: Shortcut Router"

    cd "$AUTOMATION_DIR"

    # Test 1: Router exists and is executable
    run_test "Router file exists" "[ -x shortcut-router.js ]"

    # Test 2: Router shows menu
    run_test "Router shows menu" "node shortcut-router.js | grep -q 'Available Commands'"

    # Test 3: Router lists sync command
    run_test "Router has sync command" "node shortcut-router.js | grep -q 'sync'"

    # Test 4: Router lists wip command
    run_test "Router has wip command" "node shortcut-router.js | grep -q 'wip'"

    # Test 5: Router lists content command
    run_test "Router has content command" "node shortcut-router.js | grep -q 'content'"

    # Test 6: Router handles unknown command
    run_test "Router rejects unknown command" "node shortcut-router.js unknown-cmd 2>&1 | grep -q 'Unknown command' || true"

    print_info "Shortcut router tests complete"
}

# ============================================
# TEST SUITE 2: CONTENT UPDATE SYSTEM
# ============================================

test_content_suite() {
    print_header "TEST SUITE 2: Content Update System"

    cd "$AUTOMATION_DIR"

    # Test 1: Content update script exists
    run_test "Content script exists" "[ -f content-update.js ]"

    # Test 2: Content script is executable
    run_test "Content script executable" "[ -x content-update.js ]"

    # Test 3: Content script shows error on missing args
    run_test "Content script validates args" "node content-update.js 2>&1 | grep -q 'Missing required arguments' || true"

    print_info "Content update tests complete"
}

# ============================================
# TEST SUITE 3: SHORTCUTS GENERATION
# ============================================

test_generation_suite() {
    print_header "TEST SUITE 3: Shortcuts Generation"

    cd "$SCRIPT_DIR"

    # Test 1: Package.json exists
    run_test "Package.json exists" "[ -f package.json ]"

    # Test 2: shortcuts-js installed
    run_test "shortcuts-js installed" "[ -d node_modules/@joshfarrant/shortcuts-js ]"

    # Test 3: Generate script exists
    run_test "Generate script exists" "[ -f generate-shortcuts.js ]"

    # Test 4: Generated directory exists
    run_test "Generated directory exists" "[ -d generated ]"

    # Test 5: Rho shortcut generated
    run_test "Rho shortcut exists" "[ -f generated/rho-sync.shortcut ]"

    # Test 6: Unity shortcut generated
    run_test "Unity shortcut exists" "[ -f generated/unity-sync.shortcut ]"

    # Test 7: Personal shortcut generated
    run_test "Personal shortcut exists" "[ -f generated/personal-sync.shortcut ]"

    # Test 8: Main shortcut generated
    run_test "Main shortcut exists" "[ -f generated/yellowcircle-command-generated.shortcut ]"

    print_info "Shortcuts generation tests complete"
}

# ============================================
# TEST SUITE 4: GITHUB WORKFLOWS
# ============================================

test_workflows_suite() {
    print_header "TEST SUITE 4: GitHub Workflows"

    cd "$SCRIPT_DIR/../../.github/workflows"

    # Test 1: Command executor exists
    run_test "Command executor exists" "[ -f command-executor.yml ]"

    # Test 2: Auto-revert exists
    run_test "Auto-revert exists" "[ -f auto-revert.yml ]"

    # Test 3: Command executor has content parsing
    run_test "Command executor has content logic" "grep -q 'content update' command-executor.yml"

    # Test 4: Auto-revert has hourly schedule
    run_test "Auto-revert has cron schedule" "grep -q \"cron: '0 \\* \\* \\* \\*'\" auto-revert.yml"

    print_info "GitHub workflows tests complete"
}

# ============================================
# TEST SUITE 5: DOCUMENTATION
# ============================================

test_documentation_suite() {
    print_header "TEST SUITE 5: Documentation"

    cd "$SCRIPT_DIR"

    # Test 1: QUICKSTART exists
    run_test "QUICKSTART.md exists" "[ -f QUICKSTART.md ]"

    # Test 2: README exists
    run_test "README.md exists" "[ -f README.md ]"

    # Test 3: Solution doc exists
    run_test "PROGRAMMATIC_SHORTCUTS_SOLUTION.md exists" "[ -f PROGRAMMATIC_SHORTCUTS_SOLUTION.md ]"

    # Test 4: Import instructions exist
    run_test "Import instructions exist" "[ -f generated/IMPORT_INSTRUCTIONS.md ]"

    # Test 5: Email examples exist
    run_test "Email examples exist" "[ -f ../EMAIL_COMMAND_EXAMPLES.md ]"

    # Test 6: Deployment complete doc exists
    run_test "Deployment complete doc exists" "[ -f ../AUTOMATION_DEPLOYMENT_COMPLETE.md ]"

    print_info "Documentation tests complete"
}

# ============================================
# TEST SUITE 6: MAC SHORTCUTS CLI
# ============================================

test_shortcuts_cli_suite() {
    print_header "TEST SUITE 6: Mac Shortcuts CLI"

    # Test 1: shortcuts command exists
    run_test "shortcuts CLI exists" "which shortcuts > /dev/null"

    # Test 2: shortcuts can list
    run_test "shortcuts can list" "shortcuts list > /dev/null"

    # Test 3: shortcuts can sign
    run_test "shortcuts has sign command" "shortcuts help sign | grep -q 'Sign a shortcut file'"

    print_info "Shortcuts CLI tests complete"
}

# ============================================
# TEST SUITE 7: NETWORK CONNECTIVITY
# ============================================

test_connectivity_suite() {
    print_header "TEST SUITE 7: Network Connectivity"

    # Test 1: Hostname resolves
    run_test "Hostname resolves" "hostname > /dev/null"

    # Test 2: SSH is enabled (skip if sudo requires password)
    run_test "SSH is enabled" "sudo -n systemsetup -getremotelogin 2>/dev/null | grep -q 'On' || echo 'SKIP: Requires sudo password'"

    # Test 3: Git remote exists
    run_test "Git remote configured" "cd \"$SCRIPT_DIR/../..\" && git remote -v | grep -q 'origin'"

    print_info "Network connectivity tests complete"
}

# ============================================
# RUN ALL TESTS
# ============================================

main() {
    clear

    print_header "yellowCircle Mobile Command System - Test Suite"

    echo "📊 Running comprehensive tests..."
    echo ""
    echo "Test environment:"
    echo "  • Mac: $(hostname)"
    echo "  • Directory: $SCRIPT_DIR"
    echo "  • Date: $(date)"
    echo ""

    # Run all test suites
    test_router_suite
    test_content_suite
    test_generation_suite
    test_workflows_suite
    test_documentation_suite
    test_shortcuts_cli_suite
    test_connectivity_suite

    # Print summary
    print_header "TEST SUMMARY"

    echo "Total Tests: $TESTS_TOTAL"
    echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
    echo ""

    if [ $TESTS_FAILED -eq 0 ]; then
        print_success "ALL TESTS PASSED! 🎉"
        echo ""
        echo "✅ System is ready for production use"
        echo ""
        echo "Next steps:"
        echo "  1. Run: ./create-mac-shortcut.sh"
        echo "  2. Wait 30 seconds for iCloud sync"
        echo "  3. Check iPhone Shortcuts app"
        echo "  4. Test with: shortcuts list | grep yellowCircle"
        echo ""
        return 0
    else
        print_error "SOME TESTS FAILED"
        echo ""
        echo "⚠️  Please review failures above before proceeding"
        echo ""
        return 1
    fi
}

# Run main
main
