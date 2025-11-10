# Dashboard Not Updating? Quick Fix

## Issue
The "Perplexity Export Progress" dashboard doesn't auto-update properly.

## Solution

The dashboard needs you to manually load the CSV each time. Here's how to use it:

### Step 1: Open Dashboard
```bash
open perplexity_dashboard.html
```

### Step 2: Load CSV Manually
1. Click the "📂 Load CSV" button
2. Navigate to:
   ```
   /Users/christophercooper/Dropbox/CC Projects/yellowcircle/yellow-circle/dev-context/05-tasks/
   ```
3. Select `thread_inventory.csv`

### Step 3: Refresh to See Updates
While the export script is running:
- Click "🔄 Refresh Data" button manually
- OR reload the page (Cmd+R) and re-load the CSV

The auto-refresh every 5 seconds requires the browser to have file system access, which most browsers block for security.

## Alternative: Check Progress in Terminal

Instead of using the dashboard, you can check progress anytime by running:

```bash
cd /Users/christophercooper/Dropbox/CC\ Projects/yellowcircle/yellow-circle/dev-context/05-tasks
python3 perplexity_exporter.py --report
```

This will show:
- Total threads
- Completed count
- Failed count
- Pending count
- Recent errors

## Or: Monitor the CSV Directly

Open the CSV in Excel/Numbers and refresh it periodically to see updates.

```bash
open thread_inventory.csv
```

The `completed` column will show `True` for exported threads.
