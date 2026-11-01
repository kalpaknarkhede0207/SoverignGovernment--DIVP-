/**
 * concurrencyLock.js - High-Assurance File & Memory Mutex Lock
 * Part of SG-DIVP (Sovereign Government Document Intelligence & Verification Platform)
 * 
 * Provides serialized critical section execution for file and database mutations.
 * Prevents race conditions, data corruption, and dirty reads during concurrent
 * high-volume document ingestion. Validated by TC-05 and TC-18.
 */

const fs = require('fs');
const path = require('path');
const { AsyncLocalStorage } = require('async_hooks');

const lockContext = new AsyncLocalStorage();
const memoryLocks = new Map();

/**
 * Executes an async callback within a serialized critical section
 * using an in-memory re-entrant mutex and optional atomic file writes.
 * Supports re-entrant acquisition within the same asynchronous call chain.
 */
async function withFileLock(resourceKey, callback) {
  const heldLocks = lockContext.getStore();
  if (heldLocks && heldLocks.has(resourceKey)) {
    // Re-entrant lock acquisition in the same async execution context
    return await callback();
  }

  while (memoryLocks.has(resourceKey)) {
    await memoryLocks.get(resourceKey);
  }

  let release;
  const promise = new Promise((resolve) => {
    release = resolve;
  });

  memoryLocks.set(resourceKey, promise);

  const nextHeld = new Set(heldLocks || []);
  nextHeld.add(resourceKey);

  return lockContext.run(nextHeld, async () => {
    try {
      return await callback();
    } finally {
      memoryLocks.delete(resourceKey);
      release();
    }
  });
}

/**
 * Atomically writes data to a file by writing to a temporary file first
 * and then atomically renaming it to the target file.
 */
async function atomicWriteJson(filePath, data) {
  return withFileLock(filePath, async () => {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const tempPath = `${filePath}.${Date.now()}.${Math.random().toString(36).substring(2, 8)}.tmp`;
    const serialized = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

    fs.writeFileSync(tempPath, serialized, 'utf8');
    fs.renameSync(tempPath, filePath);
    return true;
  });
}

/**
 * Reads JSON safely with fallbacks
 */
function readJsonSafe(filePath, fallback = null) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`[LOCK] Failed to read ${filePath}:`, err.message);
    return fallback;
  }
}

module.exports = {
  withFileLock,
  atomicWriteJson,
  readJsonSafe
};
