#!/bin/bash
# generate-personalized-plist.sh
# Generates a personalized iOS Shortcut plist with a hardcoded Save ID slug.
# Usage: ./generate-personalized-plist.sh <slug> <output-file>

set -euo pipefail

SLUG="$1"
OUTPUT_FILE="$2"

if [ -z "$SLUG" ] || [ -z "$OUTPUT_FILE" ]; then
    echo "Usage: $0 <slug> <output-file>"
    exit 1
fi

UUID="FFFFFFFF-FFFF-4FFF-BFFF-$(date +%s | md5 | head -c 12 | tr '[:lower:]' '[:upper:]')"

cat > "$OUTPUT_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>WFWorkflowClientVersion</key>
  <string>2605.0.5</string>
  <key>WFWorkflowMinimumClientVersion</key>
  <integer>900</integer>
  <key>WFWorkflowMinimumClientVersionString</key>
  <string>900</string>
  <key>WFWorkflowName</key>
  <string>Save to yellowCircle</string>
  <key>WFWorkflowTypes</key>
  <array>
    <string>ActionExtension</string>
    <string>NCWidget</string>
    <string>WatchKit</string>
  </array>
  <key>WFWorkflowInputContentItemClasses</key>
  <array>
    <string>WFURLContentItem</string>
    <string>WFArticleContentItem</string>
    <string>WFSafariWebPageContentItem</string>
  </array>
  <key>WFWorkflowIcon</key>
  <dict>
    <key>WFWorkflowIconGlyphNumber</key>
    <integer>59819</integer>
    <key>WFWorkflowIconStartColor</key>
    <integer>4294956800</integer>
  </dict>
  <key>WFWorkflowActions</key>
  <array>
    <dict>
      <key>WFWorkflowActionIdentifier</key>
      <string>is.workflow.actions.gettext</string>
      <key>WFWorkflowActionParameters</key>
      <dict>
        <key>WFTextActionText</key>
        <dict>
          <key>Value</key>
          <dict>
            <key>string</key>
            <string>https://yellowcircle.io/s/${SLUG}/</string>
            <key>attachmentsByRange</key>
            <dict>
            </dict>
          </dict>
          <key>WFSerializationType</key>
          <string>WFTextTokenString</string>
        </dict>
        <key>UUID</key>
        <string>${UUID}</string>
      </dict>
    </dict>
    <dict>
      <key>WFWorkflowActionIdentifier</key>
      <string>is.workflow.actions.openurl</string>
      <key>WFWorkflowActionParameters</key>
      <dict>
        <key>WFInput</key>
        <dict>
          <key>Value</key>
          <dict>
            <key>string</key>
            <string>&#xFFFC;&#xFFFC;</string>
            <key>attachmentsByRange</key>
            <dict>
              <key>{0, 1}</key>
              <dict>
                <key>Type</key>
                <string>ActionOutput</string>
                <key>OutputName</key>
                <string>Text</string>
                <key>OutputUUID</key>
                <string>${UUID}</string>
              </dict>
              <key>{1, 1}</key>
              <dict>
                <key>Type</key>
                <string>ExtensionInput</string>
              </dict>
            </dict>
          </dict>
          <key>WFSerializationType</key>
          <string>WFTextTokenString</string>
        </dict>
      </dict>
    </dict>
    <dict>
      <key>WFWorkflowActionIdentifier</key>
      <string>is.workflow.actions.notification</string>
      <key>WFWorkflowActionParameters</key>
      <dict>
        <key>WFNotificationActionBody</key>
        <string>Link saved to yellowCircle!</string>
        <key>WFNotificationActionTitle</key>
        <string>Saved</string>
        <key>WFNotificationActionSound</key>
        <true/>
      </dict>
    </dict>
  </array>
</dict>
</plist>
EOF

echo "Generated personalized plist for slug: $SLUG"
