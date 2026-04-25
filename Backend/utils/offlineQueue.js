/**
 * Offline Queue — Persistent JSON file-based queue.
 *
 * When internet is down, SOS events are stored here.
 * A background worker retries them every 30 seconds.
 * In production, replace with Redis or IndexedDB on device.
 */

const fs = require('fs');
const path = require('path');
const { dispatchSOS } = require('../services/communicationService');

const QUEUE_FILE = path.join(__dirname, '../data/offline_queue.json');
const RETRY_INTERVAL_MS = 30_000;
const MAX_RETRIES = 10;

// Ensure data dir exists
fs.mkdirSync(path.dirname(QUEUE_FILE), { recursive: true });

function readQueue() {
  try {
    if (!fs.existsSync(QUEUE_FILE)) return [];
    return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeQueue(q) {
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(q, null, 2), 'utf8');
}

/**
 * Add a failed SOS event to the retry queue.
 */
function enqueue(sosEvent) {
  const q = readQueue();
  q.push({
    ...sosEvent,
    _queuedAt: new Date().toISOString(),
    _retries: 0,
  });
  writeQueue(q);
  console.log(`📥 [Queue] Enqueued SOS for boat ${sosEvent.boatId}. Queue size: ${q.length}`);
}

/**
 * Get current queue (for dashboard display).
 */
function getQueue() {
  return readQueue();
}

/**
 * Background worker: retries queued SOS events.
 * Removes events that succeed or exceed MAX_RETRIES.
 */
async function processQueue() {
  const q = readQueue();
  if (q.length === 0) return;

  console.log(`🔄 [Queue] Processing ${q.length} queued SOS event(s)...`);
  const remaining = [];

  for (const item of q) {
    try {
      const result = await dispatchSOS(item, 'online');
      if (result.success) {
        console.log(`✅ [Queue] Dispatched queued SOS for boat ${item.boatId}`);
        // Don't push to remaining — it's done
      } else {
        item._retries = (item._retries || 0) + 1;
        if (item._retries < MAX_RETRIES) {
          remaining.push(item);
        } else {
          console.error(`❌ [Queue] Max retries exceeded for boat ${item.boatId}. Dropping.`);
        }
      }
    } catch (err) {
      item._retries = (item._retries || 0) + 1;
      if (item._retries < MAX_RETRIES) remaining.push(item);
    }
  }

  writeQueue(remaining);
}

/**
 * Start the background retry worker.
 * Call once from server.js.
 */
function startRetryWorker() {
  console.log(`⏱  [Queue] Offline retry worker started (every ${RETRY_INTERVAL_MS / 1000}s)`);
  setInterval(processQueue, RETRY_INTERVAL_MS);
}

module.exports = { enqueue, getQueue, startRetryWorker };
