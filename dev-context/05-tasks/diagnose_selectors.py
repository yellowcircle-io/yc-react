"""
Diagnostic script to inspect Perplexity Library page structure
This will help identify the correct selectors for thread extraction
"""

from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()

    print("Opening Perplexity Library...")
    print("Please make sure you're logged in to Perplexity!")
    print("\nWaiting 10 seconds for you to verify login...")

    page.goto('https://www.perplexity.ai/library')
    time.sleep(10)

    print("\nAnalyzing page structure...")

    # Get all links
    result = page.evaluate("""
        () => {
            const info = {
                total_links: document.querySelectorAll('a').length,
                search_links: document.querySelectorAll('a[href*="/search/"]').length,
                all_hrefs: Array.from(document.querySelectorAll('a')).map(a => a.href).slice(0, 20),
                page_html_sample: document.body.innerHTML.substring(0, 2000)
            };

            // Try to find thread elements
            const possibleThreads = document.querySelectorAll('div[class*="thread"], li, article, [data-testid*="thread"]');
            info.possible_thread_elements = possibleThreads.length;

            // Sample first few elements
            info.sample_elements = Array.from(possibleThreads).slice(0, 3).map(el => ({
                tagName: el.tagName,
                className: el.className,
                textContent: el.textContent?.substring(0, 100)
            }));

            return info;
        }
    """)

    print("\n" + "="*80)
    print("PAGE ANALYSIS RESULTS:")
    print("="*80)
    print(f"\nTotal links on page: {result['total_links']}")
    print(f"Links containing '/search/': {result['search_links']}")
    print(f"Possible thread elements found: {result['possible_thread_elements']}")

    print("\nFirst 20 links found:")
    for i, href in enumerate(result['all_hrefs'][:20], 1):
        print(f"  {i}. {href}")

    print("\nSample thread-like elements:")
    for i, elem in enumerate(result['sample_elements'], 1):
        print(f"\n  Element {i}:")
        print(f"    Tag: {elem['tagName']}")
        print(f"    Class: {elem['className']}")
        print(f"    Text: {elem['textContent'][:80]}...")

    print("\n" + "="*80)
    print("\nBrowser window will stay open for 30 seconds.")
    print("Please inspect the page manually to see your threads.")
    print("="*80)

    time.sleep(30)
    browser.close()

    print("\nDone! Use this information to update selectors in perplexity_exporter.py")
