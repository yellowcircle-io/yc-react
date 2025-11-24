#!/bin/bash

# Test Hybrid Shortcut System - Verify All Commands Work
# Run this to ensure all 18 commands are accessible via shortcut-router.js

echo "🧪 Testing Hybrid Shortcut System"
echo "=================================="
echo ""

cd "$(dirname "$0")/../automation" || exit 1

PASS=0
FAIL=0

test_command() {
    local cmd=$1
    local args=$2
    local desc=$3

    echo -n "Testing: $desc... "

    if node shortcut-router.js $cmd $args --help >/dev/null 2>&1 || node shortcut-router.js $cmd $args >/dev/null 2>&1; then
        echo "✅ PASS"
        ((PASS++))
    else
        echo "❌ FAIL"
        ((FAIL++))
    fi
}

echo "📱 SYNC Commands:"
test_command "sync" "" "Sync roadmap to Notion"
test_command "wip" "" "Daily WIP sync"
echo ""

echo "⚠️  ALERT Commands:"
test_command "deadline" "" "Check deadline alerts"
test_command "blocked" "" "Check blocked tasks"
echo ""

echo "📊 REPORTING Commands:"
test_command "summary" "" "Weekly summary"
echo ""

echo "✏️  CONTENT Commands:"
test_command "content" "" "Update page content"
echo ""

echo "📄 PAGE Management Commands:"
test_command "create-page" "" "Create new page"
test_command "duplicate-page" "" "Duplicate page"
test_command "delete-page" "" "Delete page"
echo ""

echo "🎨 GLOBAL Component Commands:"
test_command "global" "--action=list" "Edit global components"
test_command "edit-header" "" "Edit header"
test_command "edit-footer" "" "Edit footer"
test_command "edit-theme" "" "Edit theme"
echo ""

echo "🔄 ROLLBACK Commands (NEW!):"
test_command "rollback" "" "Rollback last change"
test_command "restore" "" "Restore from last commit"
test_command "last-change" "" "Show last change"
test_command "history" "" "Show recent history"
echo ""

echo "🧪 TESTING Commands:"
test_command "all" "" "Run all automations"
echo ""

echo "=================================="
echo "Results: $PASS passed, $FAIL failed"
echo ""

if [ $FAIL -eq 0 ]; then
    echo "✅ All commands working!"
    echo "✅ Hybrid system ready for iPhone use"
    exit 0
else
    echo "❌ Some commands failed"
    echo "⚠️  Check command implementation"
    exit 1
fi
