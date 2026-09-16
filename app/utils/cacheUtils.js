// app/utils/cacheUtils.js
//
// High-performance bounded in-memory cache designed to handle
// 200k-500k daily active requests without memory leaks or OOM.
// - Max size cap (LRU eviction)
// - Expiration with TTL
// - Background auto-cleanup sweep

class BoundedMemoryCache {
    constructor(maxEntries = 2000, cleanupIntervalMs = 60000) {
        this.maxEntries = maxEntries;
        this.cache = new Map();

        // Run sweep periodically to purge expired keys
        if (typeof setInterval !== 'undefined') {
            const timer = setInterval(() => this.sweep(), cleanupIntervalMs);
            if (timer.unref) timer.unref(); // Don't prevent Node process from terminating
        }
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        const now = Date.now();
        if (item.expiresAt && item.expiresAt < now) {
            this.cache.delete(key);
            return null;
        }

        // Refresh LRU position (delete & re-insert to put at the end of iteration order)
        this.cache.delete(key);
        this.cache.set(key, item);
        return item.value;
    }

    set(key, value, ttlSeconds = 60) {
        // Enforce max size cap (evict oldest / least recently used key)
        if (this.cache.size >= this.maxEntries) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) this.cache.delete(oldestKey);
        }

        const expiresAt = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : null;
        this.cache.set(key, { value, expiresAt });
    }

    delete(key) {
        this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
    }

    sweep() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (item.expiresAt && item.expiresAt < now) {
                this.cache.delete(key);
            }
        }
    }

    size() {
        return this.cache.size;
    }
}

// Global singletons for catalog data and auth verification
export const catalogCache = new BoundedMemoryCache(1500, 30000);
export const authVerificationCache = new BoundedMemoryCache(5000, 20000);
export const telemetryRateLimiter = new BoundedMemoryCache(5000, 60000);
