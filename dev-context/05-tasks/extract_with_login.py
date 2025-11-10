"""
Perplexity Thread Metadata Extractor
With extended time for manual login
"""

from playwright.sync_api import sync_playwright
import pandas as pd
import time
import re

# File paths
CSV_PATH = '/Users/christophercooper/Dropbox/CC Projects/yellowcircle/yellow-circle/dev-context/05-tasks/thread_inventory.csv'

print("="*80)
print("PERPLEXITY THREAD METADATA EXTRACTOR")
print("="*80)
print("\nCSV will be saved to:")
print(f"  {CSV_PATH}")
print("\n" + "="*80)
print("\nSTEPS:")
print("  1. Chromium browser will open")
print("  2. You have 3 MINUTES to log into Perplexity")
print("  3. Navigate to your Library page")
print("  4. Script will automatically extract threads after 3 minutes")
print("="*80)
print("\nStarting browser...\n")

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=False,
        args=['--start-maximized']
    )

    page = browser.new_page(viewport={'width': 1920, 'height': 1080})

    # Open Perplexity
    print("→ Opening Perplexity.ai...")
    page.goto('https://www.perplexity.ai')

    print("\n" + "="*80)
    print("⏰ YOU HAVE 3 MINUTES TO:")
    print("="*80)
    print("  1. Log into Perplexity")
    print("  2. Click on your Library/History")
    print("  3. Make sure you can see your threads")
    print("\nThe script will continue automatically in:")
    print("="*80 + "\n")

    # Countdown timer
    for remaining in range(180, 0, -10):
        minutes = remaining // 60
        seconds = remaining % 60
        print(f"  ⏱️  {minutes:02d}:{seconds:02d} remaining...", end='\r')
        time.sleep(10)

    print("\n\n→ Proceeding with extraction...")

    # Get current URL to verify we're on library page
    current_url = page.url
    print(f"\nCurrent page: {current_url}")

    if 'library' not in current_url.lower():
        print("\n⚠️  WARNING: You don't appear to be on the Library page!")
        print("   Trying to navigate there now...")
        page.goto('https://www.perplexity.ai/library')
        page.wait_for_load_state('networkidle')
        time.sleep(3)

    # Scroll to load all threads
    print("\n→ Scrolling to load all threads...")
    for i in range(5):
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        time.sleep(1)
        print(f"   Scroll {i+1}/5...")

    time.sleep(2)

    # Extract threads with multiple strategies
    print("\n→ Extracting thread metadata...")

    threads = page.evaluate("""
        () => {
            const threads = [];

            console.log('Starting extraction...');

            // Strategy 1: Look for links with /search/
            const searchLinks = document.querySelectorAll('a[href*="/search/"]');
            console.log('Found search links:', searchLinks.length);

            searchLinks.forEach((el) => {
                const link = el.href;

                // Get title from various possible locations
                let title = '';

                // Try multiple strategies to find title
                const titleEl = el.querySelector('[class*="title"]') ||
                               el.querySelector('h3') ||
                               el.querySelector('h4') ||
                               el.querySelector('span') ||
                               el.querySelector('div');

                if (titleEl) {
                    title = titleEl.textContent?.trim();
                } else {
                    title = el.textContent?.trim();
                }

                // Clean up title
                if (title) {
                    title = title.replace(/\\s+/g, ' ').trim();
                    if (title.length > 200) {
                        title = title.substring(0, 200);
                    }
                }

                // Try to find date
                let date = '';
                const dateEl = el.querySelector('time') ||
                              el.querySelector('[class*="date"]') ||
                              el.closest('div')?.querySelector('time');

                if (dateEl) {
                    date = dateEl.textContent?.trim() || dateEl.getAttribute('datetime') || '';
                }

                if (link && title && title.length > 0) {
                    threads.push({
                        title: title,
                        link: link,
                        date: date
                    });
                }
            });

            console.log('Extracted threads:', threads.length);
            return threads;
        }
    """)

    browser.close()

# Process results
print(f"\n→ Processing results...")

if not threads or len(threads) == 0:
    print("\n" + "="*80)
    print("❌ NO THREADS EXTRACTED")
    print("="*80)
    print("\nPossible reasons:")
    print("  1. Not logged into Perplexity")
    print("  2. Not on the Library page")
    print("  3. Page structure has changed")
    print("\nTry running the script again and make sure you:")
    print("  - Log in successfully")
    print("  - Navigate to Library/History")
    print("  - Can see your threads before the timer runs out")
    print("="*80)
    exit(1)

# Create DataFrame
df = pd.DataFrame(threads)

# Extract thread ID from URL
df['thread_id'] = df['link'].str.extract(r'/search/([^/?#]+)')

# Add tracking columns
df['completed'] = False
df['error'] = ''
df['export_timestamp'] = ''
df['file_path'] = ''

# Remove duplicates
original_count = len(df)
df = df.drop_duplicates(subset=['thread_id'], keep='first')

if len(df) < original_count:
    print(f"   Removed {original_count - len(df)} duplicates")

# Remove rows with missing thread_id
df = df[df['thread_id'].notna() & (df['thread_id'] != '')]

# Save to CSV
df.to_csv(CSV_PATH, index=False)

print("\n" + "="*80)
print(f"✅ SUCCESS: Extracted {len(df)} unique threads")
print("="*80)
print(f"\n📄 CSV saved to:")
print(f"   {CSV_PATH}")
print("\n📊 Sample of extracted threads:")
print("-"*80)
for i, row in df.head(5).iterrows():
    print(f"\n  {i+1}. {row['title'][:70]}")
    print(f"     ID: {row['thread_id']}")
    print(f"     Date: {row['date'] if row['date'] else 'N/A'}")

print("\n" + "="*80)
print("NEXT STEPS:")
print("="*80)
print("\n1. Open the dashboard:")
print("   open perplexity_dashboard.html")
print("\n2. In dashboard, click 'Load CSV' and select:")
print("   thread_inventory.csv")
print("\n3. Run test export:")
print("   python3 perplexity_exporter.py --test")
print("\n" + "="*80)
