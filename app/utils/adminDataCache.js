// app/utils/adminDataCache.js
// High-Speed Client-Side Cache for Admin Portal
// Eliminates duplicate network queries, provides 0ms tab transitions,
// and supports real-time optimistic state updates.

class AdminDataCache {
    constructor() {
        this.cache = new Map();
        this.listeners = new Set();
    }

    get(key) {
        const entry = this.cache.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }

    set(key, data, ttlSeconds = 180) {
        this.cache.set(key, {
            data,
            expiry: Date.now() + (ttlSeconds * 1000)
        });
        this.notify(key);
    }

    invalidate(key) {
        if (this.cache.has(key)) {
            this.cache.delete(key);
            this.notify(key);
        }
    }

    clear() {
        this.cache.clear();
        this.notify('*');
    }

    addArrayItem(key, newItem) {
        const entry = this.cache.get(key);
        if (entry && Array.isArray(entry.data)) {
            entry.data = [newItem, ...entry.data];
            this.notify(key);
        }
    }

    updateArrayItem(key, idKey, idVal, updater) {
        const entry = this.cache.get(key);
        if (entry && Array.isArray(entry.data)) {
            entry.data = entry.data.map(item => {
                if (item[idKey] === idVal) {
                    return typeof updater === 'function' ? updater(item) : { ...item, ...updater };
                }
                return item;
            });
            this.notify(key);
        }
    }

    removeArrayItem(key, idKey, idVal) {
        const entry = this.cache.get(key);
        if (entry && Array.isArray(entry.data)) {
            entry.data = entry.data.filter(item => item[idKey] !== idVal);
            this.notify(key);
        }
    }

    subscribe(fn) {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }

    notify(key) {
        this.listeners.forEach(fn => {
            try {
                fn(key);
            } catch (e) {
                console.error("AdminCache listener error:", e);
            }
        });
    }
}

export const adminCache = new AdminDataCache();
