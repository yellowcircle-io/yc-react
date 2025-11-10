"""
Improved Perplexity Thread Extractor - ACCOUNT 2
- No viewport restrictions (mobile responsive)
- Much more aggressive scrolling (200+ scrolls)
- Longer wait times for full library load
- Separate file paths to avoid mixing with Account 1 data
"""

from playwright.sync_api import sync_playwright
import pandas as pd
import time
import os

CSV_PATH = '/Users/christophercooper/Dropbox/CC Projects/yellowcircle/yellow-circle/dev-context/05-tasks/thread_inventory_account2.csv'
AUTH_STATE_FILE = '/Users/christophercooper/Dropbox/CC Projects/yellowcircle/yellow-circle/dev-context/05-tasks/perplexity_auth_state_account2.json'

print("="*80)
print("PERPLEXITY THREAD EXTRACTOR - ACCOUNT 2 (IMPROVED VERSION)")
print("="*80)
print(f"\nCSV Location: {CSV_PATH}\n")
print("="*80)
print("IMPROVEMENTS:")
print("="*80)
print("""
✓ Responsive browser (no fixed viewport)
✓ Aggressive scrolling (200+ scrolls to load all threads)
✓ Longer wait times for content loading
✓ Better thread detection
✓ SEPARATE FILES - will not interfere with Account 1 data

WHAT WILL HAPPEN:
1. Browser opens to Perplexity (responsive size)
2. You have 5 MINUTES to:
   - Log in with ACCOUNT 2 credentials
   - Navigate to Library
3. Script will scroll 200+ times to load ALL threads
4. Extracts all discovered threads
5. Updates CSV with complete thread list
""")
print("="*80)
print("\n⚠️  IMPORTANT: Log in with your SECOND account credentials!\n")
print("="*80)
print("\nStarting in 3 seconds...\n")
time.sleep(3)

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=False,
        args=['--start-maximized']
    )

    # Check for saved authentication state for account 2
    auth_state_exists = os.path.exists(AUTH_STATE_FILE)

    if auth_state_exists:
        print("✓ Using saved authentication state for Account 2")
        # Load persistent auth state - keeps login between sessions
        context = browser.new_context(storage_state=AUTH_STATE_FILE)
        page = context.new_page()

        print("→ Navigating to Library...")
        page.goto('https://www.perplexity.ai/library', timeout=60000)
        page.wait_for_load_state('networkidle', timeout=60000)
        time.sleep(5)
    else:
        print("⚠️  No saved authentication found for Account 2")
        print("   Opening Perplexity for login...")

        # Create context without auth
        context = browser.new_context()
        page = context.new_page()

        print("→ Opening Perplexity...")
        page.goto('https://www.perplexity.ai')

        print("\n" + "="*80)
        print("⏰ YOU HAVE 5 MINUTES")
        print("="*80)
        print(" 1. Log into Perplexity with ACCOUNT 2 credentials")
        print(" 2. Click Library/History")
        print(" 3. Wait for extraction")
        print("="*80)

        # Countdown
        for mins in range(5, 0, -1):
            print(f"\n   ⏱️  {mins} minute(s) remaining...")
            time.sleep(60)

        # Save authentication state for future use
        context.storage_state(path=AUTH_STATE_FILE)
        print("✅ Account 2 authentication saved for future runs\n")

    print("\n→ Starting extraction NOW...")

    # Try to go to library if not there
    current_url = page.url
    if 'library' not in current_url.lower():
        print("→ Navigating to Library...")
        try:
            page.goto('https://www.perplexity.ai/library', timeout=15000)
            page.wait_for_load_state('networkidle')
        except:
            print("   Warning: Could not navigate to library")

    time.sleep(3)

    # EXTREME AGGRESSIVE SCROLLING - for FULL thread list to hermit thread endpoint
    print("→ EXTREME aggressive scrolling to load ALL threads to hermit endpoint...")
    print("   (This will take about 10 minutes - 200 scrolls)")

    for i in range(200):
        # Scroll to bottom
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        time.sleep(3)  # 3 seconds between each scroll for full loading

        if (i + 1) % 20 == 0:
            print(f"   Scroll {i+1}/200... (loading more threads)")

    # Final wait for any lazy-loaded content
    print("→ Waiting for final content to load...")
    time.sleep(15)

    # Extract
    print("→ Extracting threads...")
    threads = page.evaluate("""
        () => {
            const threads = [];
            const searchLinks = document.querySelectorAll('a[href*="/search/"]');

            console.log('Found search links:', searchLinks.length);

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

# Check if CSV exists and merge with existing data
import os
if os.path.exists(CSV_PATH):
    print(f"\n→ Merging with existing Account 2 CSV...")
    existing_df = pd.read_csv(CSV_PATH)

    # Keep completion status from existing threads
    for idx, row in existing_df.iterrows():
        if row['thread_id'] in df['thread_id'].values:
            df.loc[df['thread_id'] == row['thread_id'], 'completed'] = row['completed']
            df.loc[df['thread_id'] == row['thread_id'], 'error'] = row['error']
            df.loc[df['thread_id'] == row['thread_id'], 'export_timestamp'] = row['export_timestamp']
            df.loc[df['thread_id'] == row['thread_id'], 'file_path'] = row['file_path']

df.to_csv(CSV_PATH, index=False)

print(f"\n✅ SUCCESS: Extracted {len(df)} threads from Account 2")
print(f"📄 Saved to: {CSV_PATH}")
print(f"\nFirst 10 threads:")
for i, row in df.head(10).iterrows():
    status = "✓" if row['completed'] else "○"
    print(f"  {status} {i+1}. {row['title'][:60]}")

print(f"\n📊 Summary:")
completed_count = df['completed'].sum()
print(f"  Total threads: {len(df)}")
print(f"  Already exported: {completed_count}")
print(f"  Remaining: {len(df) - completed_count}")

print(f"\n🎯 NEXT: Export remaining threads from Account 2:")
print(f"  python3 perplexity_exporter_account2.py --full")
