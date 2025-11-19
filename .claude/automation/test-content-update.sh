#!/bin/bash

# Comprehensive debug script for content updates
# This will show EXACTLY what's happening at each step

echo "════════════════════════════════════════════"
echo "🔍 CONTENT UPDATE DEBUG SCRIPT"
echo "════════════════════════════════════════════"
echo ""

echo "📋 Parameters Received:"
echo "  \$1 (should be --page): $1"
echo "  \$2 (should be value): $2"
echo "  \$3 (should be --section): $3"
echo "  \$4 (should be value): $4"
echo "  \$5 (should be --text): $5"
echo "  \$6 (should be value): $6"
echo ""
echo "  Full command line: $@"
echo ""

echo "🔍 Environment Check:"
echo "  Current directory: $(pwd)"
echo "  Node version: $(node --version 2>&1 || echo 'Node not found')"
echo "  Script exists: $([ -f content-update.js ] && echo 'YES' || echo 'NO')"
echo ""

echo "🚀 Running content-update.js with parameters..."
echo "  Command: node content-update.js $@"
echo ""
echo "════════════════════════════════════════════"
echo ""

# Run the actual command and capture output
node content-update.js "$@" 2>&1
EXIT_CODE=$?

echo ""
echo "════════════════════════════════════════════"
echo "📊 Exit Code: $EXIT_CODE"
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Script completed successfully"
else
    echo "❌ Script failed with exit code $EXIT_CODE"
fi
echo "════════════════════════════════════════════"

exit $EXIT_CODE
