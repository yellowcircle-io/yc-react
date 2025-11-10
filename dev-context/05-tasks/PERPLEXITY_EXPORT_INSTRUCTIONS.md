# Claude Code: Perplexity Bulk Export - Complete Instructions

## Project Overview

**Goal**: Export ~300 Perplexity threads to markdown files with CSV progress tracking
**Approach**: CSV-driven phased execution with real-time browser dashboard monitoring
**Expected Duration**: 4-5 hours total (2-3 hours unattended)

---

## Why This Approach Works

**Prior attempts failed due to:**
- No progress tracking (couldn't resume after failures)
- Page state accumulation (DOM/memory issues)
- Cascading failures (one error stopped everything)

**This approach succeeds by:**
- ✅ CSV tracks every thread's status (complete resumability)
- ✅ Fresh page for each export (no state accumulation)
- ✅ Atomic operations (errors are isolated and documented)
- ✅ Real-time dashboard (monitor progress live)

---

## Phase 0: Initial Setup

### Task 0.1: Create Project Structure

```bash
# Create directory structure
mkdir -p /Users/christophercooper/Dropbox/CC\ Projects/yellowcircle/yellow-circle/dev-context/01-research/perplexity-exports

# Navigate to tasks directory
cd /Users/christophercooper/Dropbox/CC\ Projects/yellowcircle/yellow-circle/dev-context/05-tasks
```

### Task 0.2: Install Dependencies

```bash
# Install required Python packages
pip install playwright pandas

# Install browser binaries
playwright install chromium
```

### Task 0.3: Create Progress Dashboard

Create `perplexity_dashboard.html` in the tasks directory with the following content:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Perplexity Export Progress</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
            background: #0a0a0a;
            color: #e0e0e0;
            padding: 20px;
        }

        .container {
            max-width: 1600px;
            margin: 0 auto;
        }

        h1 {
            color: #fff;
            margin-bottom: 10px;
            font-size: 32px;
            font-weight: 700;
        }

        .subtitle {
            color: #888;
            margin-bottom: 30px;
            font-size: 14px;
        }

        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .stat-card {
            background: linear-gradient(135deg, #1a1a1a 0%, #252525 100%);
            padding: 24px;
            border-radius: 16px;
            border: 1px solid #333;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        }

        .stat-card h3 {
            color: #888;
            font-size: 12px;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
        }

        .stat-card .value {
            font-size: 48px;
            font-weight: 800;
            color: #fff;
            line-height: 1;
        }

        .stat-card .subtext {
            color: #666;
            font-size: 13px;
            margin-top: 8px;
        }

        .stat-card.completed .value { color: #4ade80; }
        .stat-card.pending .value { color: #fbbf24; }
        .stat-card.failed .value { color: #f87171; }

        .progress-section {
            background: #1a1a1a;
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 30px;
            border: 1px solid #333;
        }

        .progress-bar {
            background: #0a0a0a;
            border-radius: 12px;
            height: 48px;
            overflow: hidden;
            border: 1px solid #333;
            position: relative;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #00d4ff, #00a8ff, #0088cc);
            transition: width 0.5s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-weight: 700;
            font-size: 16px;
        }

        .controls {
            margin-bottom: 20px;
            display: flex;
            gap: 12px;
            align-items: center;
        }

        button {
            background: linear-gradient(135deg, #00a8ff, #0088cc);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }

        button:hover {
            background: linear-gradient(135deg, #0088cc, #006699);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0,168,255,0.3);
        }

        .last-updated {
            color: #666;
            font-size: 13px;
            margin-left: auto;
        }

        .table-container {
            background: #1a1a1a;
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid #333;
            max-height: 600px;
            overflow-y: auto;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        thead {
            background: #252525;
            position: sticky;
            top: 0;
            z-index: 10;
        }

        th {
            padding: 16px;
            text-align: left;
            font-weight: 700;
            color: #fff;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #333;
        }

        td {
            padding: 14px 16px;
            border-top: 1px solid #2a2a2a;
            font-size: 14px;
        }

        tbody tr {
            transition: background 0.2s;
        }

        tbody tr:hover {
            background: #252525;
        }

        .status-badge {
            display: inline-block;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .status-completed {
            background: rgba(74, 222, 128, 0.15);
            color: #4ade80;
            border: 1px solid rgba(74, 222, 128, 0.3);
        }

        .status-pending {
            background: rgba(251, 191, 36, 0.15);
            color: #fbbf24;
            border: 1px solid rgba(251, 191, 36, 0.3);
        }

        .status-failed {
            background: rgba(248, 113, 113, 0.15);
            color: #f87171;
            border: 1px solid rgba(248, 113, 113, 0.3);
        }

        .error-text {
            color: #f87171;
            font-size: 12px;
            font-family: 'SF Mono', 'Monaco', monospace;
            max-width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .filter-tabs {
            margin-bottom: 20px;
            display: flex;
            gap: 10px;
        }

        .filter-tab {
            background: #1a1a1a;
            border: 1px solid #333;
            color: #888;
            padding: 10px 20px;
            border-radius: 10px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            transition: all 0.2s;
        }

        .filter-tab:hover {
            background: #252525;
            border-color: #444;
        }

        .filter-tab.active {
            background: linear-gradient(135deg, #00a8ff, #0088cc);
            color: white;
            border-color: #00a8ff;
        }

        .eta {
            background: #252525;
            padding: 12px 20px;
            border-radius: 10px;
            font-size: 13px;
            color: #888;
            display: inline-block;
        }

        .eta strong {
            color: #00a8ff;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔄 Perplexity Export Progress</h1>
        <div class="subtitle">Real-time monitoring • Auto-refresh every 5 seconds</div>

        <div class="stats">
            <div class="stat-card">
                <h3>Total Threads</h3>
                <div class="value" id="total">-</div>
            </div>
            <div class="stat-card completed">
                <h3>Completed</h3>
                <div class="value" id="completed">-</div>
                <div class="subtext" id="completed-pct">-</div>
            </div>
            <div class="stat-card pending">
                <h3>Pending</h3>
                <div class="value" id="pending">-</div>
            </div>
            <div class="stat-card failed">
                <h3>Failed</h3>
                <div class="value" id="failed">-</div>
            </div>
        </div>

        <div class="progress-section">
            <div class="progress-bar">
                <div class="progress-fill" id="progress-fill" style="width: 0%">0%</div>
            </div>
            <div style="margin-top: 16px;">
                <span class="eta" id="eta">Estimated time remaining: <strong>--</strong></span>
            </div>
        </div>

        <div class="controls">
            <button onclick="loadData()">🔄 Refresh Data</button>
            <input type="file" id="csvFile" accept=".csv" style="display: none;" onchange="handleFileSelect(event)">
            <button onclick="document.getElementById('csvFile').click()">📂 Load CSV</button>
            <div class="last-updated" id="last-updated">Never updated</div>
        </div>

        <div class="filter-tabs">
            <div class="filter-tab active" onclick="filterData('all', event)">All</div>
            <div class="filter-tab" onclick="filterData('completed', event)">✓ Completed</div>
            <div class="filter-tab" onclick="filterData('pending', event)">⏳ Pending</div>
            <div class="filter-tab" onclick="filterData('failed', event)">✗ Failed</div>
        </div>

        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th style="width: 100px;">Status</th>
                        <th>Title</th>
                        <th style="width: 120px;">Date</th>
                        <th style="width: 160px;">Exported</th>
                        <th style="width: 300px;">Error</th>
                    </tr>
                </thead>
                <tbody id="thread-table">
                    <tr><td colspan="5" style="text-align: center; padding: 60px; color: #666;">
                        Click "📂 Load CSV" to begin monitoring export progress
                    </td></tr>
                </tbody>
            </table>
        </div>
    </div>

    <script>
        let allThreads = [];
        let currentFilter = 'all';
        let csvFilePath = null;

        function handleFileSelect(event) {
            const file = event.target.files[0];
            if (!file) return;

            csvFilePath = file;
            const reader = new FileReader();
            reader.onload = function(e) {
                const content = e.target.result;
                parseCSV(content);
            };
            reader.readAsText(file);
        }

        function parseCSV(csv) {
            const lines = csv.trim().split('\n');
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

            allThreads = lines.slice(1).map(line => {
                const values = [];
                let current = '';
                let inQuotes = false;

                for (let char of line) {
                    if (char === '"') {
                        inQuotes = !inQuotes;
                    } else if (char === ',' && !inQuotes) {
                        values.push(current.trim().replace(/^"|"$/g, ''));
                        current = '';
                    } else {
                        current += char;
                    }
                }
                values.push(current.trim().replace(/^"|"$/g, ''));

                const thread = {};
                headers.forEach((header, i) => {
                    thread[header] = values[i] || '';
                });
                return thread;
            });

            updateStats();
            renderTable();
            updateTimestamp();
        }

        function updateStats() {
            const total = allThreads.length;
            const completed = allThreads.filter(t =>
                t.completed === 'True' || t.completed === 'true' || t.completed === true
            ).length;
            const failed = allThreads.filter(t => t.error && t.error !== '' && t.error !== 'None').length;
            const pending = total - completed;
            const pct = total > 0 ? (completed / total * 100).toFixed(1) : 0;

            // Calculate ETA
            const avgTimePerThread = 25; // seconds
            const etaMinutes = Math.ceil((pending * avgTimePerThread) / 60);
            const etaText = pending === 0 ? 'Complete!' :
                           etaMinutes < 60 ? `${etaMinutes} minutes` :
                           `${Math.floor(etaMinutes/60)}h ${etaMinutes%60}m`;

            document.getElementById('total').textContent = total;
            document.getElementById('completed').textContent = completed;
            document.getElementById('completed-pct').textContent = `${pct}% complete`;
            document.getElementById('pending').textContent = pending;
            document.getElementById('failed').textContent = failed;
            document.getElementById('progress-fill').style.width = `${pct}%`;
            document.getElementById('progress-fill').textContent = `${pct}%`;
            document.getElementById('eta').innerHTML = `Estimated time remaining: <strong>${etaText}</strong>`;
        }

        function renderTable() {
            const tbody = document.getElementById('thread-table');
            let filtered = allThreads;

            if (currentFilter === 'completed') {
                filtered = allThreads.filter(t =>
                    t.completed === 'True' || t.completed === 'true' || t.completed === true
                );
            } else if (currentFilter === 'pending') {
                filtered = allThreads.filter(t =>
                    t.completed === 'False' || t.completed === 'false' || !t.completed || t.completed === ''
                );
            } else if (currentFilter === 'failed') {
                filtered = allThreads.filter(t => t.error && t.error !== '' && t.error !== 'None');
            }

            if (filtered.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 60px; color: #666;">No threads match this filter</td></tr>';
                return;
            }

            tbody.innerHTML = filtered.map(thread => {
                const isCompleted = thread.completed === 'True' || thread.completed === 'true' || thread.completed === true;
                const hasFailed = thread.error && thread.error !== '' && thread.error !== 'None';
                const status = isCompleted ? 'completed' : (hasFailed ? 'failed' : 'pending');
                const statusText = isCompleted ? '✓ Done' : (hasFailed ? '✗ Error' : '⏳ Pending');

                let exportTime = '-';
                if (thread.export_timestamp && thread.export_timestamp !== '') {
                    try {
                        const date = new Date(thread.export_timestamp);
                        exportTime = date.toLocaleTimeString();
                    } catch (e) {
                        exportTime = thread.export_timestamp.split('T')[1]?.split('.')[0] || '-';
                    }
                }

                return `
                    <tr>
                        <td><span class="status-badge status-${status}">${statusText}</span></td>
                        <td style="max-width: 500px; overflow: hidden; text-overflow: ellipsis;">${thread.title || 'Untitled'}</td>
                        <td>${thread.date || '-'}</td>
                        <td style="font-size: 12px;">${exportTime}</td>
                        <td>${thread.error && thread.error !== 'None' ? `<div class="error-text" title="${thread.error}">${thread.error}</div>` : '-'}</td>
                    </tr>
                `;
            }).join('');
        }

        function filterData(filter, event) {
            currentFilter = filter;
            document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.remove('active'));
            if (event) event.target.classList.add('active');
            renderTable();
        }

        function loadData() {
            if (csvFilePath) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    parseCSV(e.target.result);
                };
                reader.readAsText(csvFilePath);
            } else {
                document.getElementById('csvFile').click();
            }
        }

        function updateTimestamp() {
            document.getElementById('last-updated').textContent =
                `Last updated: ${new Date().toLocaleTimeString()}`;
        }

        // Auto-refresh every 5 seconds
        setInterval(() => {
            if (csvFilePath) {
                loadData();
            }
        }, 5000);
    </script>
</body>
</html>
```

**After Setup:**
- Open `perplexity_dashboard.html` in your browser
- Keep it visible (second monitor or split-screen)

---

## Phase 1: Metadata Extraction

### Task 1.1: Create Export Script

Create `perplexity_exporter.py` in the tasks directory - I'll provide the complete implementation next.

**Before running:**
1. Ensure you're logged into Perplexity at https://www.perplexity.ai
2. Navigate to your Library page to verify you can see your threads

### Task 1.2: Extract Thread List

**Command:**
```bash
cd /Users/christophercooper/Dropbox/CC\ Projects/yellowcircle/yellow-circle/dev-context/05-tasks
python perplexity_exporter.py --extract
```

**What happens:**
1. Browser opens to Perplexity Library
2. Script scrolls to load all threads
3. Extracts: title, link, date, thread_id
4. Saves to `thread_inventory.csv` in tasks directory
5. Console shows: "✓ Extracted X unique threads"

**Immediately after:**
1. In dashboard, click "📂 Load CSV"
2. Select `thread_inventory.csv`
3. Verify ~300 threads appear with "⏳ Pending" status
4. **Keep dashboard open and visible**

---

## Phase 2: Test Run (10 Threads)

### Task 2.1: Test Export Process

**Command:**
```bash
python perplexity_exporter.py --test
```

**What to monitor:**
1. **Console**: Detailed logs of each export attempt
2. **Dashboard**: Auto-refreshes every 5 seconds showing real-time progress
3. **Export directory**: Verify markdown files being created

**Success criteria:**
- 8-10 threads successfully exported (80%+ success rate)
- Dashboard shows completed count increasing
- Files appear in `/dev-context/01-research/perplexity-exports/`

**If errors occur:**
- Review console for specific error messages
- Most common: "Export button not found" (UI selector issue)
- Check that you're still logged into Perplexity
- Script will continue past errors and document them

### Task 2.2: Review Test Results

**Command:**
```bash
python perplexity_exporter.py --report
```

**In dashboard:**
- Click "✗ Failed" filter to see any problem threads
- Review error messages

**Next steps:**
- If 80%+ success: Proceed to full export
- If <80% success: May need to adjust selectors (I'll help with this)

---

## Phase 3: Full Export

### Task 3.1: Run Complete Export

**Before starting:**
- [ ] Dashboard is open and showing current status
- [ ] Test run completed successfully (80%+ success)
- [ ] Sufficient disk space (~500MB-1GB for 300 threads)
- [ ] Computer won't sleep during execution

**Command:**
```bash
python perplexity_exporter.py --full
```

**Expected duration:** 2-3 hours for 300 threads

**What happens:**
- Processes threads in batches of 50
- Takes 2-minute break between batches
- Dashboard auto-updates every 5 seconds
- CSV updated after each thread export
- Progress bar shows real-time completion percentage

**Monitoring:**
1. **Primary**: Watch dashboard progress bar and stats
2. **Secondary**: Glance at console for error patterns
3. **Periodic**: Check `export_log.txt` for detailed logs

**Batch checkpoints:**
- After 50 threads: Check dashboard success rate
- After 100 threads: Spot-check a few exported files
- After 150 threads: Review any recurring error patterns

---

## Phase 4: Error Recovery

### Task 4.1: Review Results

**Command:**
```bash
python perplexity_exporter.py --report
```

**In dashboard:**
- Click "✗ Failed" to see problem threads
- Review error patterns

**Common errors:**
- **Timeout**: Threads took too long to load → Retry
- **Export button not found**: UI selector issue → Manual export
- **Network error**: Connection issue → Retry

### Task 4.2: Retry Failed Threads

Simply re-run the full command - it automatically skips completed threads:

```bash
python perplexity_exporter.py --full
```

**This only processes threads where** `completed == False`

### Task 4.3: Manual Export (if needed)

For remaining stubborn threads (~5-20):
1. Open failed thread links from dashboard
2. Use Perplexity's native export feature
3. Save to same directory
4. Manually update CSV if desired

---

## Timeline & Expectations

### **Session 1: Setup & Test** (45-60 minutes)
- Create files and structure: 10 min
- Run metadata extraction: 10 min
- Load dashboard and verify: 5 min
- Run 10-thread test: 20 min
- Review and optimize: 10 min

### **Session 2: Full Export** (2-3 hours, mostly unattended)
- Start full export: 5 min
- Monitor first 20 exports: 15 min
- Let run unattended: 2-2.5 hours
- Periodic dashboard checks: 5 min

### **Session 3: Cleanup** (15-30 minutes)
- Review completion status: 5 min
- Retry failed threads: 10 min
- Manual export stragglers: 5-10 min
- Final verification: 5 min

**Total: 4-5 hours over 1-2 days**

---

## Success Metrics

**After Test (10 threads):**
- ✅ 8+ successfully exported
- ✅ Dashboard updates automatically
- ✅ Files readable and complete
- ✅ No critical selector errors

**After Full Run (300 threads):**
- ✅ 270+ exported (90%+ success)
- ✅ All markdown files readable
- ✅ CSV tracking accurate
- ✅ Clear error documentation

---

## Quick Reference

### Commands
```bash
# Extract metadata
python perplexity_exporter.py --extract

# Test with 10 threads
python perplexity_exporter.py --test

# Full export
python perplexity_exporter.py --full

# Progress report
python perplexity_exporter.py --report
```

### File Locations
```
dev-context/
├── 05-tasks/
│   ├── perplexity_exporter.py        # Export script
│   ├── perplexity_dashboard.html     # Progress dashboard
│   ├── thread_inventory.csv          # Master tracking file
│   └── export_log.txt                # Detailed logs
└── 01-research/
    └── perplexity-exports/           # Exported markdown files
```

### Dashboard Actions
- **Load CSV**: Click "📂 Load CSV" button
- **Refresh**: Click "🔄 Refresh Data" (or wait 5s for auto-refresh)
- **Filter**: Click All / ✓ Completed / ⏳ Pending / ✗ Failed tabs

---

## Troubleshooting

### "No threads extracted"
- Verify you're logged into Perplexity
- Check browser is on Library page
- UI selectors may have changed (I'll help update)

### "Export button not found"
- Perplexity UI has changed
- Script tries multiple selector strategies
- Failed threads documented for manual export

### Dashboard not updating
- Click "🔄 Refresh Data" manually
- Check CSV file path is correct
- Verify CSV has proper format

### Script stops/crashes
- Check `export_log.txt` for details
- Re-run same command - resumes from last completed thread
- CSV preserves all progress

---

## Next Steps

1. **Create the export script** (I'll provide complete code next)
2. **Run extraction** to create CSV
3. **Open dashboard** and load CSV
4. **Test with 10 threads** to verify
5. **Run full export** and monitor via dashboard

Ready to proceed?
