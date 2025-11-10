"""
Diagnostic script to see what's on the Perplexity Library page
"""
import os
from playwright.sync_api import sync_playwright
import time

AUTH_FILE = '/Users/christophercooper/Dropbox/CC Projects/yellowcircle/yellow-circle/dev-context/05-tasks/perplexity_auth_state.json'
OUTPUT_DIR = '/Users/christophercooper/Dropbox/CC Projects/yellowcircle/yellow-circle/dev-context/05-tasks'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)

    # Use saved auth
    if os.path.exists(AUTH_FILE):
        print("✓ Using saved authentication")
        context = browser.new_context(storage_state=AUTH_FILE)
    else:
        print("❌ No auth file found")
        context = browser.new_context()

    page = context.new_page()

    # Navigate to Library
    print("→ Going to Library...")
    page.goto('https://www.perplexity.ai/library', timeout=60000, wait_until='domcontentloaded')
    time.sleep(8)

    # Scroll
    print("→ Scrolling...")
    for i in range(5):
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        time.sleep(1)
    time.sleep(2)

    # Take screenshot
    screenshot_path = os.path.join(OUTPUT_DIR, 'library_screenshot.png')
    page.screenshot(path=screenshot_path, full_page=True)
    print(f"✓ Screenshot saved: {screenshot_path}")

    # Save HTML
    html = page.content()
    html_path = os.path.join(OUTPUT_DIR, 'library_page.html')
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"✓ HTML saved: {html_path}")

    # Diagnostic queries
    print("\n→ Diagnostic queries:")

    result = page.evaluate("""
        () => {
            return {
                totalLinks: document.querySelectorAll('a').length,
                searchLinks: document.querySelectorAll('a[href*="/search/"]').length,
                allHrefs: Array.from(document.querySelectorAll('a')).slice(0, 20).map(a => a.href),
                bodyText: document.body.innerText.substring(0, 500)
            };
        }
    """)

    print(f"  Total links on page: {result['totalLinks']}")
    print(f"  Links with '/search/': {result['searchLinks']}")
    print(f"\n  First 20 links:")
    for href in result['allHrefs']:
        print(f"    - {href}")
    print(f"\n  Page text (first 500 chars):")
    print(f"    {result['bodyText']}")

    print("\n→ Waiting 10 seconds (check the browser)...")
    time.sleep(10)

    browser.close()
    print("\n✅ Diagnostic complete!")
