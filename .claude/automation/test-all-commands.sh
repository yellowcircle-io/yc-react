#!/bin/bash

# Test All Shortcut Commands
# Run this from Mac terminal to verify all commands work before iPhone testing

echo ""
echo "🧪 Testing yellowCircle Automation Commands"
echo "============================================"
echo ""

AUTOMATION_DIR="$HOME/Library/CloudStorage/Dropbox/CC Projects/yellowcircle/yellow-circle/.claude/automation"

# Function to test command
test_command() {
  local cmd=$1
  local name=$2

  echo "📋 Testing: $name"
  echo "   Command: $cmd"
  echo ""

  cd "$AUTOMATION_DIR" || exit 1

  if eval "$cmd"; then
    echo "✅ $name - PASSED"
  else
    echo "❌ $name - FAILED"
  fi

  echo ""
  echo "---"
  echo ""
}

# Test each command (safe, read-only first)
echo "🔍 Phase 1: Read-Only Commands (Safe)"
echo ""

test_command "node shortcut-router.js" "Router Help Menu"

# Only test if Notion is configured
if [ -f "$AUTOMATION_DIR/.env" ]; then
  echo "⚠️  Skipping Notion commands (would modify data)"
  echo "   To test: Uncomment in test script"
  echo ""
  # test_command "node shortcut-router.js deadline" "Deadline Alerts"
  # test_command "node shortcut-router.js summary" "Weekly Summary"
else
  echo "ℹ️  Notion not configured (.env missing)"
  echo "   Skipping: sync, wip, deadline, summary"
  echo ""
fi

echo "🔄 Phase 2: Content Update (Modifies Website)"
echo ""
echo "⚠️  This will commit and push to git!"
read -p "Test content update? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  test_command "node shortcut-router.js content --page=about --section=headline --text='Automated Test from Mac at $(date +%H:%M)'" "Content Update"

  echo "📊 Recent Git Commits:"
  cd "$HOME/Library/CloudStorage/Dropbox/CC Projects/yellowcircle/yellow-circle" || exit 1
  git log --oneline -3
  echo ""
else
  echo "⏭️  Skipped content update test"
  echo ""
fi

echo "✅ Testing Complete!"
echo ""
echo "Next steps:"
echo "1. If all passed: Create iPhone shortcuts"
echo "2. If failures: Debug on Mac first"
echo "3. After iPhone sync: Test from mobile"
echo ""
