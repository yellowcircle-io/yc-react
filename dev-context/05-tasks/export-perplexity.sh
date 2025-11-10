#!/bin/bash
# Perplexity Bulk Export - Automated Execution Script
# Uses perplexport tool (https://github.com/leonid-shevtsov/perplexport)

set -e  # Exit on error

# Configuration
PROJECT_ROOT="/Users/christophercooper/Dropbox/CC Projects/yellowcircle/yellow-circle"
OUTPUT_DIR="$PROJECT_ROOT/dev-context/01-research/perplexity-exports"
DONE_FILE="$PROJECT_ROOT/dev-context/01-research/perplexity-done.json"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}   Perplexity Conversation Bulk Export${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""

# Check if email is provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: Email address required${NC}"
    echo ""
    echo "Usage: ./export-perplexity.sh your.email@example.com"
    echo ""
    exit 1
fi

EMAIL="$1"

# Create output directory
echo -e "${YELLOW}📁 Creating output directory...${NC}"
mkdir -p "$OUTPUT_DIR"

# Check Node.js
echo -e "${YELLOW}🔍 Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js v16 or higher.${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js ${NODE_VERSION} detected${NC}"
echo ""

# Check if Chrome is installed for Puppeteer
echo -e "${YELLOW}🔍 Checking Chrome installation for Puppeteer...${NC}"
if command -v google-chrome &> /dev/null || command -v chromium &> /dev/null; then
    echo -e "${GREEN}✅ Chrome/Chromium detected${NC}"
else
    echo -e "${YELLOW}⚠️  Chrome not detected. Installing via Puppeteer...${NC}"
    npx puppeteer browsers install chrome
fi
echo ""

# Run perplexport
echo -e "${GREEN}🚀 Starting perplexport...${NC}"
echo -e "${YELLOW}📧 Email: ${EMAIL}${NC}"
echo -e "${YELLOW}📂 Output: ${OUTPUT_DIR}${NC}"
echo -e "${YELLOW}📝 Progress: ${DONE_FILE}${NC}"
echo ""
echo -e "${YELLOW}⏳ Browser will open for authentication...${NC}"
echo -e "${YELLOW}   1. Enter your email in the browser${NC}"
echo -e "${YELLOW}   2. Check your email for authentication code${NC}"
echo -e "${YELLOW}   3. Enter the code in the browser${NC}"
echo -e "${YELLOW}   4. Export will continue automatically${NC}"
echo ""

cd "$PROJECT_ROOT"

npx perplexport \
  -e "$EMAIL" \
  -o "$OUTPUT_DIR" \
  -d "$DONE_FILE"

# Check results
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}   Export Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""

# Count files
MD_COUNT=$(find "$OUTPUT_DIR" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
JSON_COUNT=$(find "$OUTPUT_DIR" -name "*.json" 2>/dev/null | wc -l | tr -d ' ')

echo -e "${GREEN}✅ Markdown files: ${MD_COUNT}${NC}"
echo -e "${GREEN}✅ JSON files: ${JSON_COUNT}${NC}"
echo -e "${GREEN}✅ Output directory: ${OUTPUT_DIR}${NC}"
echo ""

# Show sample file
if [ "$MD_COUNT" -gt 0 ]; then
    SAMPLE_FILE=$(find "$OUTPUT_DIR" -name "*.md" 2>/dev/null | head -n 1)
    echo -e "${YELLOW}📄 Sample file:${NC}"
    echo -e "${GREEN}${SAMPLE_FILE}${NC}"
    echo ""
    echo -e "${YELLOW}First 20 lines:${NC}"
    head -n 20 "$SAMPLE_FILE"
fi

echo ""
echo -e "${GREEN}🎉 Success! All conversations exported.${NC}"
echo ""
