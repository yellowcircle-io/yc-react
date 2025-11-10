"""
Perplexity Thread Metadata Extractor
Opens browser and waits for you to manually navigate and click a button when ready
"""

from playwright.sync_api import sync_playwright
import pandas as pd
import time

# File paths
CSV_PATH = '/Users/christophercooper/Dropbox/CC Projects/yellowcircle/yellow-circle/dev-context/05-tasks/thread_inventory.csv'

print("="*80)
print("PERPLEXITY THREAD METADATA EXTRACTOR")
print("="*80)
print("\n📍 CSV will be saved to:")
print(f"   {CSV_PATH}")
print("\n" + "="*80)
print("INSTRUCTIONS:")
print("="*80)
print("""
1. Browser will open
2. Manually log into Perplexity
3. Navigate to your Library page
4. When you can see your threads, come back here
5. Press ENTER in this terminal to extract threads
""")
print("="*80)
input("\nPress ENTER when ready to start browser...")

with sync_playwright() as p:
    print("\n→ Opening browser...")
    browser = p.chromium.launch(
        headless=False,
        args=['--start-maximized']
    )

    page = browser.new_page(viewport={'width': 1920, 'height': 1080})

    print("→ Navigating to Perplexity Library...")
    try:
        page.goto('https://www.perplexity.ai/library', timeout=10000)
    except:
        # If library page requires login, go to home first
        print("→ Going to home page first...")
        page.goto('https://www.perplexity.ai', timeout=10000)

    print("\n" + "="*80)
    print("⏸️  BROWSER IS OPEN - DO THIS NOW:")
    print("="*80)
    print("""
1. Log into Perplexity (if not already logged in)
2. Click on 'Library' or 'History' in the sidebar
3. Scroll down to make sure all your threads are loaded
4. Verify you can see your ~300 threads

Then come back here and press ENTER to extract.
""")
    print("="*80)

    input("\n✋ Press ENTER when you're on the Library page with threads visible...")

    print("\n→ Extracting thread metadata...")

    # Scroll to ensure all threads loaded
    print("→ Scrolling page...")
    for i in range(5):
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        time.sleep(1)

    time.sleep(2)

    # Extract threads
    threads = page.evaluate("""
        () => {
            const threads = [];

            console.log('=== EXTRACTION DEBUG ===');

            // Strategy 1: Search for links with /search/
            const searchLinks = document.querySelectorAll('a[href*="/search/"]');
            console.log('Links with /search/:', searchLinks.length);

            searchLinks.forEach((el, idx) => {
                const link = el.href;

                // Get title
                let title = '';
                const titleEl = el.querySelector('[class*="title"]') ||
                               el.querySelector('h3') ||
                               el.querySelector('h4') ||
                               el.querySelector('span') ||
                               el.querySelector('div') ||
                               el;

                title = titleEl.textContent?.trim().replace(/\\s+/g, ' ') || '';

                if (title.length > 200) {
                    title = title.substring(0, 200);
                }

                // Get date
                let date = '';
                const dateEl = el.querySelector('time') ||
                              el.querySelector('[class*="date"]');

                if (dateEl) {
                    date = dateEl.textContent?.trim() || dateEl.getAttribute('datetime') || '';
                }

                if (link && title && title.length > 0) {
                    threads.push({ title, link, date });
                }
            });

            console.log('Threads extracted:', threads.length);

            // If no threads found, try alternative strategy
            if (threads.length === 0) {
                console.log('No threads with /search/, trying alternative...');

                // Look for any links that might be threads
                const allLinks = document.querySelectorAll('a[href^="/"]');
                console.log('All internal links:', allLinks.length);

                allLinks.forEach(el => {
                    const href = el.getAttribute('href');
                    if (href && href.includes('thread') || href.includes('chat')) {
                        const title = el.textContent?.trim().replace(/\\s+/g, ' ') || '';
                        if (title.length > 5) {
                            threads.push({
                                title: title,
                                link: el.href,
                                date: ''
                            });
                        }
                    }
                });

                console.log('Alternative strategy found:', threads.length);
            }

            return threads;
        }
    """)

    # Get page info for debugging
    page_info = page.evaluate("""
        () => ({
            url: window.location.href,
            title: document.title,
            totalLinks: document.querySelectorAll('a').length
        })
    """)

    browser.close()

# Process results
print(f"\n→ Processing extraction results...")
print(f"\n📊 Page Info:")
print(f"   URL: {page_info['url']}")
print(f"   Title: {page_info['title']}")
print(f"   Total links: {page_info['totalLinks']}")

if not threads or len(threads) == 0:
    print("\n" + "="*80)
    print("❌ NO THREADS FOUND")
    print("="*80)
    print("""
This could mean:
  1. You're not on the Library page
  2. Perplexity's page structure has changed significantly
  3. There are no threads in your library

What was the URL you were on when you pressed ENTER?
""")
    print(f"Detected URL: {page_info['url']}")
    print("="*80)
    exit(1)

# Create DataFrame
print(f"\n→ Found {len(threads)} potential threads")
df = pd.DataFrame(threads)

# Extract thread ID from URL
df['thread_id'] = df['link'].str.extract(r'/search/([^/?#]+)')

# If no search URLs, try alternative ID extraction
if df['thread_id'].isna().all():
    print("   Using alternative ID extraction...")
    df['thread_id'] = df['link'].str.extract(r'/([^/?#]+)$')

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

if len(df) == 0:
    print("\n❌ All threads were filtered out (missing IDs)")
    exit(1)

# Save to CSV
df.to_csv(CSV_PATH, index=False)

print("\n" + "="*80)
print(f"✅ SUCCESS: Extracted {len(df)} unique threads!")
print("="*80)
print(f"\n📄 CSV saved to:")
print(f"   {CSV_PATH}")
print("\n📊 First 5 threads:")
print("="*80)
for i, row in df.head(5).iterrows():
    print(f"\n  {i+1}. {row['title'][:70]}")
    print(f"     ID: {row['thread_id']}")
    if row['date']:
        print(f"     Date: {row['date']}")

print("\n" + "="*80)
print("NEXT STEPS:")
print("="*80)
print("""
1. Verify the CSV location:
   {CSV_PATH}

2. Open dashboard in browser:
   open perplexity_dashboard.html

3. In dashboard, click 'Load CSV' and select:
   thread_inventory.csv

4. Run test export (10 threads):
   python3 perplexity_exporter.py --test
""".format(CSV_PATH=CSV_PATH))
print("="*80)
