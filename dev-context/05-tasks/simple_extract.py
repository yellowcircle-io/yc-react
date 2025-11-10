"""
Simple Perplexity Thread Extractor
Just keeps browser open for 5 minutes - log in and navigate to Library
"""

from playwright.sync_api import sync_playwright
import pandas as pd
import time

CSV_PATH = '/Users/christophercooper/Dropbox/CC Projects/yellowcircle/yellow-circle/dev-context/05-tasks/thread_inventory.csv'

print("="*80)
print("PERPLEXITY THREAD EXTRACTOR - SIMPLE VERSION")
print("="*80)
print(f"\nCSV Location: {CSV_PATH}\n")
print("="*80)
print("WHAT WILL HAPPEN:")
print("="*80)
print("""
1. Browser opens to Perplexity
2. You have 5 MINUTES to:
   - Log in
   - Navigate to Library
   - Make sure threads are visible
3. Script automatically extracts after 5 minutes
4. Browser closes, CSV is saved
""")
print("="*80)
print("\nStarting in 3 seconds...\n")
time.sleep(3)

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=False,
        args=['--start-maximized']
    )
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})

    print("→ Opening Perplexity...")
    page.goto('https://www.perplexity.ai')

    print("\n" + "="*80)
    print("⏰ YOU HAVE 5 MINUTES")
    print("="*80)
    print(" 1. Log into Perplexity")
    print(" 2. Click Library/History")
    print(" 3. Wait for extraction")
    print("="*80)

    # Countdown
    for mins in range(5, 0, -1):
        print(f"\n   ⏱️  {mins} minute(s) remaining...")
        time.sleep(60)

    print("\n\n→ Starting extraction NOW...")

    # Try to go to library if not there
    current_url = page.url
    if 'library' not in current_url.lower():
        print("→ Navigating to Library...")
        try:
            page.goto('https://www.perplexity.ai/library', timeout=10000)
            page.wait_for_load_state('networkidle')
        except:
            print("   Warning: Could not navigate to library")

    # Scroll
    print("→ Scrolling...")
    for i in range(5):
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        time.sleep(1)

    time.sleep(2)

    # Extract
    print("→ Extracting threads...")
    threads = page.evaluate("""
        () => {
            const threads = [];
            const searchLinks = document.querySelectorAll('a[href*="/search/"]');

            searchLinks.forEach(el => {
                const link = el.href;
                let title = el.textContent?.trim().replace(/\\s+/g, ' ') || '';

                if (title.length > 200) title = title.substring(0, 200);

                const dateEl = el.querySelector('time') || el.querySelector('[class*="date"]');
                const date = dateEl?.textContent?.trim() || dateEl?.getAttribute('datetime') || '';

                if (link && title.length > 0) {
                    threads.push({ title, link, date });
                }
            });

            return threads;
        }
    """)

    browser.close()

# Process
if not threads or len(threads) == 0:
    print("\n❌ No threads found!")
    print("   Were you logged in and on the Library page?")
    exit(1)

df = pd.DataFrame(threads)
df['thread_id'] = df['link'].str.extract(r'/search/([^/?#]+)')
df['completed'] = False
df['error'] = ''
df['export_timestamp'] = ''
df['file_path'] = ''

df = df.drop_duplicates(subset=['thread_id'], keep='first')
df = df[df['thread_id'].notna() & (df['thread_id'] != '')]

df.to_csv(CSV_PATH, index=False)

print(f"\n✅ SUCCESS: Extracted {len(df)} threads")
print(f"📄 Saved to: {CSV_PATH}")
print(f"\nFirst 5 threads:")
for i, row in df.head(5).iterrows():
    print(f"  {i+1}. {row['title'][:60]}")

print(f"\n NEXT: Load {CSV_PATH} into the dashboard")
