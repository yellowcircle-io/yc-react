/**
 * Trigger Cloud Function to Import Pocket Links
 *
 * Usage: node scripts/triggerPocketImport.mjs
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');

const JSON_PATH = join(PROJECT_ROOT, 'dev-context/pocket-all-links.json');
const FUNCTION_URL = 'https://us-central1-yellowcircle-app.cloudfunctions.net/importPocketLinks';
const BATCH_SIZE = 500;

async function importBatch(links, batchNum, totalBatches) {
  console.log(`\n📦 Batch ${batchNum}/${totalBatches}: Sending ${links.length} links...`);

  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ links })
  });

  const result = await response.json();

  if (response.ok) {
    console.log(`✅ Batch ${batchNum}: Imported ${result.imported}, Skipped ${result.skipped}`);
    return result;
  } else {
    console.error(`❌ Batch ${batchNum} Error:`, result.error);
    return { imported: 0, skipped: 0, error: result.error };
  }
}

async function main() {
  console.log('📖 Reading Pocket links...');
  const allLinks = JSON.parse(readFileSync(JSON_PATH, 'utf-8'));
  console.log(`📊 Total links: ${allLinks.length}`);

  const totalBatches = Math.ceil(allLinks.length / BATCH_SIZE);
  let totalImported = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (let i = 0; i < allLinks.length; i += BATCH_SIZE) {
    const batch = allLinks.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    try {
      const result = await importBatch(batch, batchNum, totalBatches);
      totalImported += result.imported || 0;
      totalSkipped += result.skipped || 0;
      if (result.error) totalErrors++;
    } catch (err) {
      console.error(`❌ Batch ${batchNum} Failed:`, err.message);
      totalErrors++;
    }

    // Small delay between batches
    if (i + BATCH_SIZE < allLinks.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log('\n========================================');
  console.log('📊 IMPORT COMPLETE');
  console.log(`✅ Imported: ${totalImported}`);
  console.log(`⏭️  Skipped: ${totalSkipped}`);
  console.log(`❌ Errors: ${totalErrors}`);
  console.log('========================================');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
