/**
 * Firestore optimization utilities for efficient data persistence
 * Implements caching strategies and pagination to reduce database reads
 */

/**
 * Simple in-memory cache for Firestore documents
 * Reduces repeated reads for the same document
 */
export class FirestoreCache {
  constructor(ttlMs = 5 * 60 * 1000) { // 5 minutes default TTL
    this.cache = new Map();
    this.ttl = ttlMs;
  }

  /**
   * Get cached data if available and not expired
   */
  get(docPath) {
    const cached = this.cache.get(docPath);
    if (!cached) return null;

    // Check if cache expired
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(docPath);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cache value
   */
  set(docPath, data) {
    this.cache.set(docPath, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Update specific fields in cached data
   */
  update(docPath, fields) {
    const cached = this.cache.get(docPath);
    if (!cached) return;

    const updated = { ...cached, ...fields };
    this.set(docPath, updated);
  }

  /**
   * Clear specific entry
   */
  delete(docPath) {
    this.cache.delete(docPath);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size() {
    return this.cache.size;
  }
}

/**
 * Manages debounced Firestore listener updates
 * Prevents excessive re-renders from rapid changes
 */
export class FirestoreListenerOptimizer {
  constructor(debounceMs = 300) {
    this.debounceMs = debounceMs;
    this.pendingUpdates = new Map();
    this.timeouts = new Map();
  }

  /**
   * Debounce an update callback
   */
  debounce(key, callback, data) {
    // Clear existing timeout for this key
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
    }

    // Store pending update
    this.pendingUpdates.set(key, data);

    // Set new timeout
    const timeoutId = setTimeout(() => {
      callback(this.pendingUpdates.get(key));
      this.pendingUpdates.delete(key);
      this.timeouts.delete(key);
    }, this.debounceMs);

    this.timeouts.set(key, timeoutId);
  }

  /**
   * Cancel pending updates for a key
   */
  cancel(key) {
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
      this.timeouts.delete(key);
    }
    this.pendingUpdates.delete(key);
  }

  /**
   * Clear all pending updates
   */
  clear() {
    for (const timeoutId of this.timeouts.values()) {
      clearTimeout(timeoutId);
    }
    this.timeouts.clear();
    this.pendingUpdates.clear();
  }
}

/**
 * Batch operations handler for efficient Firestore writes
 * Reduces number of write operations
 */
export class FirestoreBatchOptimizer {
  constructor(flushIntervalMs = 1000, maxBatchSize = 20) {
    this.flushInterval = flushIntervalMs;
    this.maxBatchSize = maxBatchSize;
    this.batch = [];
    this.timeoutId = null;
  }

  /**
   * Add operation to batch
   */
  add(operation) {
    this.batch.push(operation);

    // Flush if batch is full
    if (this.batch.length >= this.maxBatchSize) {
      this.flush();
      return;
    }

    // Schedule flush if not already scheduled
    if (!this.timeoutId) {
      this.timeoutId = setTimeout(() => this.flush(), this.flushInterval);
    }
  }

  /**
   * Flush batch operations
   */
  async flush(writeBatch) {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (this.batch.length === 0) {
      return;
    }

    const operationsToCommit = [...this.batch];
    this.batch = [];

    if (writeBatch) {
      try {
        for (const op of operationsToCommit) {
          if (op.type === 'set') {
            writeBatch.set(op.docRef, op.data, op.options);
          } else if (op.type === 'update') {
            writeBatch.update(op.docRef, op.data);
          } else if (op.type === 'delete') {
            writeBatch.delete(op.docRef);
          }
        }
        await writeBatch.commit();
      } catch (error) {
        // Re-queue failed operations
        this.batch = operationsToCommit;
        throw error;
      }
    }
  }

  /**
   * Clear pending operations
   */
  clear() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.batch = [];
  }
}

/**
 * Global cache instance for user data
 */
export const userDataCache = new FirestoreCache(10 * 60 * 1000); // 10 min TTL

/**
 * Global listener optimizer
 */
export const listenerOptimizer = new FirestoreListenerOptimizer(300);
