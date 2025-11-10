"""
Update thread_inventory-personal.csv with manually exported conversations from Nov 8
"""
import pandas as pd
import os
from datetime import datetime

CSV_PATH = '/Users/christophercooper/Dropbox/CC Projects/yellowcircle/yellow-circle/dev-context/05-tasks/thread_inventory-personal.csv'
EXPORT_DIR = '/Users/christophercooper/Dropbox/CC Projects/yellowcircle/yellow-circle/dev-context/01-research/perplexity-exports'

# New files manually exported Nov 8, 2024
new_exports = [
    "Claude-Trimurti project chat reconciliation and business positioning.md",
    "Protecting Personal Data on Your Work Computer_ Wh.md",
    "How conceivable is it to grow a company from 70M t.md",
    "What are the philosophical roots of the modern Ame.md",
    "Help me explore career coaching and options to acc.md",
    "Evidence based examination of types and kinds of m.md",
    "Give an overview of candidates and proposals on th.md",
    "The Word You're Looking for is _Symbol_.md",
    "Procedures vs Rituals in _Games People Play_.md",
    "Dynamic List Management in HubSpot_ Streamlining M.md",
    "The Prevalence of Inefficient Scaling and Growth-a.md",
    "Is MeetRobyn AI Vaporware_ A Critical Assessment (1).md"
]

# Read existing CSV
df = pd.read_csv(CSV_PATH)
print(f"Loaded CSV with {len(df)} threads")
print(f"Currently completed: {df['completed'].sum()}")

# Add new rows for manually exported threads
timestamp = "2025-11-08T17:07:00"  # Approximate export time

for filename in new_exports:
    # Extract title from filename
    title = filename.replace('.md', '').replace('_', ' ')

    # Create new row
    new_row = {
        'title': title,
        'link': '',  # No link for manual exports
        'date': '',
        'thread_id': f'manual_{filename[:30]}',  # Pseudo ID
        'completed': True,
        'error': '',
        'export_timestamp': timestamp,
        'file_path': filename
    }

    # Check if already exists
    if not ((df['file_path'] == filename) | (df['title'] == title)).any():
        df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
        print(f"✓ Added: {title[:60]}")
    else:
        print(f"⚠ Skipped (already exists): {title[:60]}")

# Save updated CSV
df.to_csv(CSV_PATH, index=False)

print(f"\n✅ CSV updated!")
print(f"Total threads: {len(df)}")
print(f"Completed: {df['completed'].sum()}")
print(f"Pending: {len(df) - df['completed'].sum()}")
