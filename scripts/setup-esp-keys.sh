#!/bin/bash
# Setup ESP Keys Script
# Run this AFTER: firebase login --reauth
#
# This script will:
# 1. Set Firebase Functions config for Brevo and MailerSend
# 2. Set up Dash's client ESP key in Firestore
#
# Usage: ./scripts/setup-esp-keys.sh

echo "=== ESP Key Setup for yellowCircle ==="
echo ""

# Check Firebase auth
firebase projects:list &>/dev/null
if [ $? -ne 0 ]; then
  echo "❌ Firebase not authenticated. Run: firebase login --reauth"
  exit 1
fi
echo "✅ Firebase authenticated"

# Step 1: Set main yellowCircle ESP keys
echo ""
echo "=== Step 1: Setting yellowCircle ESP Keys ==="
echo "Enter Brevo API key for yellowCircle:"
read -s BREVO_KEY
echo ""
echo "Enter MailerSend API key for yellowCircle:"
read -s MAILERSEND_KEY
echo ""

firebase functions:config:set brevo.api_key="$BREVO_KEY" mailersend.api_key="$MAILERSEND_KEY"

if [ $? -eq 0 ]; then
  echo "✅ Firebase Functions config updated"
else
  echo "❌ Failed to update Firebase Functions config"
  exit 1
fi

# Step 2: Set Dash's client ESP key
echo ""
echo "=== Step 2: Setting Dash's Client ESP Key ==="
echo "Enter Brevo API key for dash@dashkolos.com:"
read -s DASH_BREVO_KEY
echo ""

cd "$(dirname "$0")/.." || exit 1
node scripts/setup-client-esp.cjs "dash@dashkolos.com" "brevo" "$DASH_BREVO_KEY" 300 9000

if [ $? -eq 0 ]; then
  echo "✅ Client ESP key configured"
else
  echo "❌ Failed to configure client ESP key"
  exit 1
fi

# Step 3: Deploy functions
echo ""
echo "=== Step 3: Deploy Functions? ==="
read -p "Deploy functions now? (y/n): " DEPLOY
if [ "$DEPLOY" = "y" ] || [ "$DEPLOY" = "Y" ]; then
  firebase deploy --only functions
else
  echo "Skipping deploy. Run manually: firebase deploy --only functions"
fi

echo ""
echo "=== ESP Setup Complete ==="
echo ""
echo "Test commands:"
echo "  curl https://us-central1-yellowcircle-app.cloudfunctions.net/getESPStatus"
echo ""
