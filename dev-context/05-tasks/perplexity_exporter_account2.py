"""
Perplexity Thread Bulk Exporter - ACCOUNT 2
CSV-driven approach with progress tracking and error recovery
Separate file paths to avoid mixing with Account 1 data

Usage:
  python perplexity_exporter_account2.py --extract    # Extract thread metadata
  python perplexity_exporter_account2.py --test       # Test with 10 threads
  python perplexity_exporter_account2.py --full       # Export all threads
  python perplexity_exporter_account2.py --report     # Show progress report
"""

import pandas as pd
from playwright.sync_api import sync_playwright
import time
import os
from datetime import datetime
import logging
import argparse
import re

# Configuration - ACCOUNT 2 PATHS
CONFIG = {
    'csv_path': '/Users/christophercooper/Dropbox/CC Projects/yellowcircle/yellow-circle/dev-context/05-tasks/thread_inventory_account2-rho.csv',
    'export_dir': '/Users/christophercooper/Dropbox/CC Projects/yellowcircle/yellow-circle/dev-context/01-research/perplexity-exports-account2',
    'log_file': '/Users/christophercooper/Dropbox/CC Projects/yellowcircle/yellow-circle/dev-context/05-tasks/export_log_account2.txt',
    'auth_state_file': '/Users/christophercooper/Dropbox/CC Projects/yellowcircle/yellow-circle/dev-context/05-tasks/perplexity_auth_state_account2.json',
    'delay_seconds': 3,
    'batch_size': 50,
    'batch_break_seconds': 120,
    'timeout_ms': 60000,  # Increased to 60 seconds for longer threads
    'content_wait_ms': 20000,  # Wait up to 20 seconds for content to load
}

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(CONFIG['log_file']),
        logging.StreamHandler()
    ]
)

def sanitize_filename(text, max_length=50):
    """Convert text to safe filename"""
    if not text:
        return 'untitled'
    text = re.sub(r'[^\w\s-]', '', str(text))
    text = re.sub(r'[-\s]+', '_', text)
    return text[:max_length].strip('_').lower()

def extract_thread_metadata():
    """Phase 1: Extract all threads from Library"""
    logging.info("="*80)
    logging.info("PHASE 1: METADATA EXTRACTION - ACCOUNT 2")
    logging.info("="*80)
    logging.info("\n⚠️  IMPORTANT: Make sure you are logged into Perplexity with ACCOUNT 2!\n")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # Navigate to Library
        logging.info("→ Navigating to Perplexity Library...")
        try:
            page.goto('https://www.perplexity.ai/library', timeout=30000)
            page.wait_for_load_state('networkidle')
            time.sleep(3)
        except Exception as e:
            logging.error(f"❌ Failed to load Library page: {str(e)}")
            logging.error("Please ensure you're logged into Perplexity (Account 2) and try again.")
            browser.close()
            return None

        # Scroll to load all threads (handles lazy loading)
        logging.info("→ Scrolling to load all threads...")
        for i in range(5):
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            time.sleep(1)
            logging.info(f"  Scroll {i+1}/5...")

        time.sleep(2)  # Final wait for content

        # Extract thread data using multiple selector strategies
        logging.info("→ Extracting thread metadata...")
        threads = page.evaluate("""
            () => {
                const threads = [];

                // Strategy 1: Find all links containing /search/
                const searchLinks = document.querySelectorAll('a[href*="/search/"]');

                console.log('Found', searchLinks.length, 'search links');

                searchLinks.forEach((el, index) => {
                    // Get the link
                    const link = el.href;

                    // Try to find title (multiple strategies)
                    let title = '';

                    // Look for title element
                    const titleEl = el.querySelector('[class*="title"]') ||
                                   el.querySelector('h3') ||
                                   el.querySelector('h4') ||
                                   el.querySelector('[class*="text"]') ||
                                   el.querySelector('div');

                    if (titleEl) {
                        title = titleEl.textContent?.trim();
                    } else {
                        // Fallback to link text
                        title = el.textContent?.trim();
                    }

                    // Clean up title (remove extra whitespace, newlines)
                    if (title) {
                        title = title.replace(/\\s+/g, ' ').trim();
                        // Take first 200 chars if very long
                        if (title.length > 200) {
                            title = title.substring(0, 200);
                        }
                    }

                    // Try to find date
                    let date = '';
                    const dateEl = el.querySelector('[class*="date"]') ||
                                  el.querySelector('time') ||
                                  el.closest('div')?.querySelector('[class*="date"]') ||
                                  el.closest('li')?.querySelector('time');

                    if (dateEl) {
                        date = dateEl.textContent?.trim() || dateEl.getAttribute('datetime') || '';
                    }

                    // Only add if we have both link and title
                    if (link && title && title.length > 0) {
                        threads.push({
                            title: title,
                            link: link,
                            date: date,
                        });
                    }
                });

                console.log('Extracted', threads.length, 'valid threads');
                return threads;
            }
        """)

        browser.close()

    # Validate extraction
    if not threads or len(threads) == 0:
        logging.error("❌ No threads extracted!")
        logging.error("\nPossible issues:")
        logging.error("  1. Not logged into Perplexity (Account 2)")
        logging.error("  2. Library page structure has changed")
        logging.error("  3. No threads in your library")
        logging.error("\nPlease check the Library page manually and verify threads are visible.")
        return None

    # Create DataFrame
    logging.info(f"→ Processing {len(threads)} extracted threads...")
    df = pd.DataFrame(threads)

    # Extract thread ID from URL
    df['thread_id'] = df['link'].str.extract(r'/search/([^/?#]+)')

    # Add tracking columns
    df['completed'] = False
    df['error'] = ''
    df['export_timestamp'] = ''
    df['file_path'] = ''

    # Remove duplicates based on thread_id
    original_count = len(df)
    df = df.drop_duplicates(subset=['thread_id'], keep='first')

    if len(df) < original_count:
        logging.info(f"  Removed {original_count - len(df)} duplicate threads")

    # Remove any rows with missing thread_id
    df = df[df['thread_id'].notna() & (df['thread_id'] != '')]

    # Save to CSV
    df.to_csv(CONFIG['csv_path'], index=False)

    logging.info("\n" + "="*80)
    logging.info(f"✅ SUCCESS: Extracted {len(df)} unique threads from Account 2")
    logging.info("="*80)
    logging.info(f"\n📄 Saved to: {CONFIG['csv_path']}")
    logging.info(f"\n📊 Next steps:")
    logging.info(f"  1. Run test: python perplexity_exporter_account2.py --test")
    logging.info(f"  2. Run full export: python perplexity_exporter_account2.py --full\n")

    return df

def update_thread_status(thread_id, completed, error='', file_path=''):
    """Update single thread status in CSV (atomic operation)"""
    try:
        df = pd.read_csv(CONFIG['csv_path'])
        mask = df['thread_id'] == thread_id

        df.loc[mask, 'completed'] = completed
        df.loc[mask, 'error'] = str(error) if error else ''
        df.loc[mask, 'export_timestamp'] = datetime.now().isoformat()
        df.loc[mask, 'file_path'] = file_path if file_path else ''

        df.to_csv(CONFIG['csv_path'], index=False)
    except Exception as e:
        logging.error(f"Failed to update CSV for thread {thread_id}: {str(e)}")

def export_single_thread(page, thread):
    """
    Export one thread to markdown
    Returns: (success: bool, error_message: str, file_path: str)
    """
    thread_title = thread.get('title', 'Untitled')[:60]

    try:
        # Navigate to thread
        logging.info(f"  → Navigating to thread...")
        page.goto(thread['link'], timeout=CONFIG['timeout_ms'])
        page.wait_for_load_state('networkidle')
        time.sleep(2)  # Extra buffer for dynamic content

        # Verify content loaded - try multiple selectors
        logging.info(f"  → Waiting for content to load...")
        content_selectors = [
            '[class*="thread"]',
            '[class*="message"]',
            '[class*="answer"]',
            '[class*="content"]',
            '[data-testid*="thread"]',
            'article',
            'main'
        ]

        content_loaded = False
        for selector in content_selectors:
            try:
                page.wait_for_selector(selector, timeout=CONFIG['content_wait_ms'])
                content_loaded = True
                logging.info(f"  ✓ Content loaded (selector: {selector})")
                break
            except:
                continue

        if not content_loaded:
            return False, "Content did not load (no content selectors found)", None

        time.sleep(2)  # Longer pause for longer threads

        # Find and click Export button - try multiple strategies
        logging.info(f"  → Looking for Export button...")
        export_selectors = [
            'button:has-text("Export")',
            '[aria-label*="Export"]',
            '[aria-label*="export"]',
            'button[class*="export"]',
            '[data-testid*="export"]',
            'button:has-text("export")',
            '[role="button"]:has-text("Export")'
        ]

        export_clicked = False
        for selector in export_selectors:
            try:
                export_btn = page.locator(selector).first
                if export_btn.is_visible(timeout=2000):
                    export_btn.click()
                    export_clicked = True
                    logging.info(f"  ✓ Clicked Export (selector: {selector})")
                    break
            except:
                continue

        if not export_clicked:
            # Try keyboard shortcut as fallback
            try:
                logging.info(f"  → Trying keyboard shortcut...")
                page.keyboard.press('Control+E')  # or Cmd+E on Mac
                time.sleep(1)
                export_clicked = True
            except:
                pass

        if not export_clicked:
            return False, "Export button not found (tried all selectors)", None

        time.sleep(3)  # Longer wait for export menu to appear and render

        # Find and click Markdown option
        logging.info(f"  → Selecting Markdown format...")
        markdown_selectors = [
            'text="Markdown"',
            'button:has-text("Markdown")',
            '[role="menuitem"]:has-text("Markdown")',
            '[class*="markdown"]',
            'text="markdown"',
            '[data-format="markdown"]',
            'text=/markdown/i',  # Case insensitive
            'div:has-text("Markdown")',
            'span:has-text("Markdown")',
            'li:has-text("Markdown")',
            '[role="option"]:has-text("Markdown")',
            'text=/md/i'
        ]

        markdown_clicked = False
        for selector in markdown_selectors:
            try:
                md_btn = page.locator(selector).first
                if md_btn.is_visible(timeout=2000):
                    md_btn.click()
                    markdown_clicked = True
                    logging.info(f"  ✓ Selected Markdown (selector: {selector})")
                    break
            except:
                continue

        # If Markdown not found, try fallback formats
        if not markdown_clicked:
            try:
                # Try to find any export format option as fallback
                logging.info(f"  → Markdown not found, trying Text format as fallback...")
                text_selectors = [
                    'text="Text"',
                    'button:has-text("Text")',
                    '[role="menuitem"]:has-text("Text")',
                    'text=/txt/i',
                    'text="Plain text"'
                ]
                for selector in text_selectors:
                    try:
                        txt_btn = page.locator(selector).first
                        if txt_btn.is_visible(timeout=2000):
                            txt_btn.click()
                            markdown_clicked = True  # Use same flag since we got something
                            logging.info(f"  ✓ Selected Text format as fallback (selector: {selector})")
                            break
                    except:
                        continue
            except:
                pass

        # If still not found, try pressing Enter as last resort
        if not markdown_clicked:
            try:
                logging.info(f"  → Trying Enter key to select default option...")
                page.keyboard.press('Enter')
                time.sleep(0.5)
                # Press Enter again to confirm/trigger download
                page.keyboard.press('Enter')
                time.sleep(1)
                markdown_clicked = True
                logging.info(f"  ✓ Pressed Enter twice for selection and confirmation")
            except:
                pass

        if not markdown_clicked:
            return False, "Markdown option not found in export menu (tried Markdown, Text, and Enter key)", None

        # Handle file download
        logging.info(f"  → Waiting for download...")
        try:
            with page.expect_download(timeout=CONFIG['timeout_ms']) as download_info:
                download = download_info.value

            # Generate clean filename
            safe_title = sanitize_filename(thread.get('title', 'untitled'))
            thread_id = thread.get('thread_id', 'unknown')
            filename = f"{thread_id}_{safe_title}.md"
            filepath = os.path.join(CONFIG['export_dir'], filename)

            # Save download
            download.save_as(filepath)

            # Verify file was saved
            if not os.path.exists(filepath):
                return False, "File was not saved to disk", None

            file_size = os.path.getsize(filepath)
            if file_size < 50:
                return False, f"File too small ({file_size} bytes) - may be empty", None

            logging.info(f"  ✅ File saved: {filename} ({file_size:,} bytes)")
            return True, "", filename

        except Exception as e:
            return False, f"Download failed: {str(e)[:100]}", None

    except Exception as e:
        error_msg = str(e)[:200]
        logging.error(f"  ❌ Exception: {error_msg}")
        return False, error_msg, None

def process_bulk_export(limit=None):
    """
    Phase 2/3: Export threads with progress tracking
    limit: If set, only process this many threads (for testing)
    """

    # Verify CSV exists
    if not os.path.exists(CONFIG['csv_path']):
        logging.error(f"❌ CSV file not found: {CONFIG['csv_path']}")
        logging.error("Please run with --extract first to create the CSV")
        return

    # Load pending threads
    df = pd.read_csv(CONFIG['csv_path'])

    # Convert completed column to boolean if needed
    df['completed'] = df['completed'].astype(str).str.lower() == 'true'

    pending = df[df['completed'] == False].copy()

    if limit:
        pending = pending.head(limit)
        logging.info("\n" + "="*80)
        logging.info(f"TEST MODE: Processing only {limit} threads from Account 2")
        logging.info("="*80 + "\n")
    else:
        logging.info("\n" + "="*80)
        logging.info(f"FULL EXPORT MODE - ACCOUNT 2")
        logging.info("="*80 + "\n")

    total = len(pending)

    if total == 0:
        logging.info("✅ No pending threads to export - all done!")
        print_progress_report()
        return

    logging.info(f"📊 Export Status:")
    logging.info(f"  Total threads in CSV: {len(df)}")
    logging.info(f"  Already completed: {len(df) - total}")
    logging.info(f"  Pending: {total}")
    logging.info(f"\n📂 Export directory: {CONFIG['export_dir']}")
    logging.info(f"📈 Progress will be tracked in CSV updates\n")

    # Create export directory
    os.makedirs(CONFIG['export_dir'], exist_ok=True)

    # Start export process
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=False,  # Set to True for unattended runs
            args=['--start-maximized']
        )

        # Check for saved authentication state
        auth_state_exists = os.path.exists(CONFIG['auth_state_file'])

        if auth_state_exists:
            logging.info("✓ Using saved authentication state for Account 2")
            # Load persistent auth state - keeps login between sessions
            context = browser.new_context(storage_state=CONFIG['auth_state_file'])
        else:
            logging.info("⚠️  No saved authentication found for Account 2")
            logging.info("   Opening Perplexity for login...")

            # Create temporary context for login
            context = browser.new_context()
            page = context.new_page()
            page.goto('https://www.perplexity.ai')

            logging.info("\n" + "="*80)
            logging.info("🔐 PLEASE LOG IN TO PERPLEXITY - ACCOUNT 2")
            logging.info("="*80)
            logging.info("  1. Log in using your SECOND account credentials")
            logging.info("  2. Wait until you see the Perplexity homepage")
            logging.info("  3. Script will automatically continue in 60 seconds")
            logging.info("="*80 + "\n")

            # Wait for user to log in
            time.sleep(60)

            # Save authentication state for future use
            context.storage_state(path=CONFIG['auth_state_file'])
            logging.info("✅ Account 2 authentication saved for future runs\n")

            page.close()

        # Set default timeout for all operations
        context.set_default_timeout(CONFIG['timeout_ms'])

        success_count = 0
        failure_count = 0

        for i, (idx, thread) in enumerate(pending.iterrows(), 1):
            # Progress header
            logging.info("\n" + "="*80)
            logging.info(f"THREAD {i}/{total} ({i/total*100:.1f}%)")
            logging.info(f"Title: {thread['title'][:70]}")
            logging.info(f"ID: {thread['thread_id']}")
            logging.info("="*80)

            # Create fresh page (important for isolation)
            page = context.new_page()

            try:
                # Export the thread
                success, error, file_path = export_single_thread(page, thread)

                # Update CSV immediately
                update_thread_status(thread['thread_id'], success, error, file_path)

                if success:
                    success_count += 1
                    logging.info(f"  ✅ SUCCESS: Exported to {file_path}")
                else:
                    failure_count += 1
                    logging.warning(f"  ❌ FAILED: {error}")

                # Update progress bar after each thread
                print_progress_bar(i, total, success_count, failure_count)

            except Exception as e:
                failure_count += 1
                error_msg = f"Unexpected error: {str(e)[:150]}"
                logging.error(f"  ❌ {error_msg}")
                update_thread_status(thread['thread_id'], False, error_msg)

                # Update progress bar even on exception
                print_progress_bar(i, total, success_count, failure_count)

            finally:
                # Always close page (prevents memory/resource buildup)
                try:
                    page.close()
                except:
                    pass

            # Rate limiting - respectful delay
            if i < total:  # Don't delay after last thread
                time.sleep(CONFIG['delay_seconds'])

            # Batch break logic
            if i % CONFIG['batch_size'] == 0 and i < total:
                logging.info("\n" + "*"*80)
                logging.info(f"BATCH CHECKPOINT: {i} threads processed")
                logging.info(f"Success: {success_count} | Failed: {failure_count}")
                logging.info(f"Taking {CONFIG['batch_break_seconds']} second break...")
                logging.info("*"*80 + "\n")

                time.sleep(CONFIG['batch_break_seconds'])

                # Mini progress report
                print_progress_report()

        browser.close()

    # Final report
    logging.info("\n" + "="*80)
    logging.info("EXPORT PROCESS COMPLETE - ACCOUNT 2")
    logging.info("="*80)
    logging.info(f"Processed: {total} threads")
    logging.info(f"Successful: {success_count} ({success_count/total*100:.1f}%)")
    logging.info(f"Failed: {failure_count} ({failure_count/total*100:.1f}%)")
    logging.info("="*80 + "\n")

    print_progress_report()

    if failure_count > 0:
        logging.info(f"\n💡 TIP: Re-run 'python perplexity_exporter_account2.py --full' to retry failed threads")
        logging.info(f"   The script will automatically skip completed threads.\n")

def print_progress_bar(current, total, success, failed, prefix='Export Progress [Account 2]'):
    """
    Display a terminal progress bar with stats
    Shows batch milestones every 10 threads
    """
    bar_length = 50
    filled_length = int(bar_length * current / total)

    # Create the bar with filled and unfilled characters
    bar = '█' * filled_length + '░' * (bar_length - filled_length)

    # Calculate percentage
    percent = 100 * (current / float(total))

    # Build the progress line
    print(f'\r{prefix}: |{bar}| {current}/{total} ({percent:.1f}%) | ✓ {success} | ✗ {failed}', end='', flush=True)

    # Print newline on batch milestones (every 10) or completion
    if current % 10 == 0 or current == total:
        print()  # New line for batch milestone


def print_progress_report():
    """Display current progress statistics"""
    if not os.path.exists(CONFIG['csv_path']):
        logging.error(f"CSV file not found: {CONFIG['csv_path']}")
        return

    df = pd.read_csv(CONFIG['csv_path'])

    # Convert completed to boolean
    df['completed'] = df['completed'].astype(str).str.lower() == 'true'

    total = len(df)
    completed = df['completed'].sum()
    failed_mask = (df['error'].notna()) & (df['error'] != '') & (df['error'] != 'None')
    failed = failed_mask.sum()
    pending = total - completed

    # Estimate time remaining
    avg_time_per_thread = 25  # seconds
    est_time_minutes = (pending * avg_time_per_thread) / 60

    hours = int(est_time_minutes // 60)
    minutes = int(est_time_minutes % 60)

    if pending == 0:
        eta_str = "Complete!"
    elif hours > 0:
        eta_str = f"{hours}h {minutes}m"
    else:
        eta_str = f"{minutes}m"

    report = f"""
╔════════════════════════════════════════════════════╗
║    EXPORT PROGRESS REPORT - ACCOUNT 2              ║
╠════════════════════════════════════════════════════╣
║                                                    ║
║  Total Threads:        {total:>5}                        ║
║  Completed:            {completed:>5}  ({completed/total*100 if total > 0 else 0:>5.1f}%)           ║
║  Failed:               {failed:>5}                        ║
║  Pending:              {pending:>5}                        ║
║                                                    ║
║  Estimated Time Left:  {eta_str:>15}               ║
║                                                    ║
╚════════════════════════════════════════════════════╝
    """

    print(report)

    # Show recent errors
    if failed > 0:
        print("\n📋 Recent Errors (last 5):")
        print("-" * 80)
        error_df = df[failed_mask].tail(5)
        for idx, row in error_df.iterrows():
            title = str(row['title'])[:50]
            error = str(row['error'])[:60]
            print(f"  • {title}")
            print(f"    Error: {error}\n")

def main():
    """Main entry point with CLI argument parsing"""
    parser = argparse.ArgumentParser(
        description='Perplexity Thread Bulk Exporter - ACCOUNT 2',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python perplexity_exporter_account2.py --extract    # Extract thread list from Library
  python perplexity_exporter_account2.py --test       # Test export with 10 threads
  python perplexity_exporter_account2.py --full       # Export all threads
  python perplexity_exporter_account2.py --report     # Show progress report
        """
    )

    parser.add_argument('--extract', action='store_true',
                       help='Extract thread metadata from Perplexity Library')
    parser.add_argument('--test', action='store_true',
                       help='Test export with first 10 threads')
    parser.add_argument('--full', action='store_true',
                       help='Run full export of all pending threads')
    parser.add_argument('--report', action='store_true',
                       help='Display progress report only')

    args = parser.parse_args()

    # Execute based on arguments
    if args.extract:
        extract_thread_metadata()
    elif args.test:
        process_bulk_export(limit=10)
    elif args.full:
        process_bulk_export()
    elif args.report:
        print_progress_report()
    else:
        parser.print_help()
        print("\n💡 Start with: python perplexity_exporter_account2.py --extract")

if __name__ == '__main__':
    main()
