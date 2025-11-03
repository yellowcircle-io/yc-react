#!/bin/bash

# Google Drive to Dropbox/dev-context Reconciliation Script
# Created: November 2, 2025
# Purpose: Reconcile Google Drive "Rho Assessments 2026" with Dropbox dev-context

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Paths
GDRIVE_PATH="/Users/christophercooper_1/Library/CloudStorage/GoogleDrive-christopher@yellowcircle.io/My Drive/Rho Assessments 2026"
DROPBOX_PATH="/Users/christophercooper_1/Library/CloudStorage/Dropbox/CC Projects/yellowcircle/yellow-circle/dev-context"
REPORT_FILE="${DROPBOX_PATH}/GOOGLE_DRIVE_RECONCILIATION_REPORT.md"

echo -e "${BLUE}=== Google Drive Reconciliation Script ===${NC}"
echo "Source: $GDRIVE_PATH"
echo "Destination: $DROPBOX_PATH"
echo ""

# Create report header
cat > "$REPORT_FILE" << 'EOF'
# Google Drive Reconciliation Report

**Date:** $(date)
**Source:** Google Drive - Rho Assessments 2026
**Destination:** Dropbox - dev-context
**Purpose:** Identify and copy missing files from Google Drive to dev-context

---

## Summary

EOF

# Count files
echo -e "${YELLOW}Counting files...${NC}"
GDRIVE_TOTAL=$(find "$GDRIVE_PATH" -type f \( -name "*.md" -o -name "*.pdf" -o -name "*.docx" -o -name "*.csv" -o -name "*.txt" \) | wc -l | tr -d ' ')
DEVCONTEXT_TOTAL=$(find "$DROPBOX_PATH" -type f \( -name "*.md" -o -name "*.pdf" -o -name "*.docx" -o -name "*.csv" -o -name "*.txt" \) | wc -l | tr -d ' ')

echo "Google Drive files: $GDRIVE_TOTAL"
echo "dev-context files: $DEVCONTEXT_TOTAL"
echo ""

# Add counts to report
cat >> "$REPORT_FILE" << EOF
- **Google Drive Total:** $GDRIVE_TOTAL files
- **dev-context Total:** $DEVCONTEXT_TOTAL files

---

## Files in Google Drive (by type)

EOF

# List files by type
echo -e "${YELLOW}Analyzing Google Drive files...${NC}"

echo "### Markdown Files" >> "$REPORT_FILE"
find "$GDRIVE_PATH" -type f -name "*.md" -exec basename {} \; | sort >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "### PDF Files" >> "$REPORT_FILE"
find "$GDRIVE_PATH" -type f -name "*.pdf" -exec basename {} \; | sort >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "### Word Documents" >> "$REPORT_FILE"
find "$GDRIVE_PATH" -type f -name "*.docx" -exec basename {} \; | sort >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "### CSV Files" >> "$REPORT_FILE"
find "$GDRIVE_PATH" -type f -name "*.csv" -exec basename {} \; | sort >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Find missing files
echo -e "${YELLOW}Identifying missing files...${NC}"
echo "## Missing Files (in Google Drive but not in dev-context)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

MISSING_COUNT=0
while IFS= read -r gdrive_file; do
    filename=$(basename "$gdrive_file")
    # Search for file in dev-context
    if ! find "$DROPBOX_PATH" -name "$filename" -type f | grep -q .; then
        echo "- $filename" >> "$REPORT_FILE"
        ((MISSING_COUNT++))
    fi
done < <(find "$GDRIVE_PATH" -type f \( -name "*.md" -o -name "*.pdf" -o -name "*.docx" -o -name "*.csv" -o -name "*.txt" \))

echo "" >> "$REPORT_FILE"
echo "**Total Missing:** $MISSING_COUNT files" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo -e "${GREEN}Missing files identified: $MISSING_COUNT${NC}"
echo ""
echo -e "${BLUE}Report generated: $REPORT_FILE${NC}"
echo ""
echo -e "${YELLOW}Next step: Review report, then run copy operation${NC}"
