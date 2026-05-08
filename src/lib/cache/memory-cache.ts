interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
}

export class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxEntries: number;
  private defaultTtl: number;

  constructor(options?: { maxEntries?: number; defaultTtl?: number }) {
    this.maxEntries = options?.maxEntries || 10000;
    this.defaultTtl = options?.defaultTtl || 5 * 60 * 1000; // 5 minutes default

    // Auto-cleanup expired entries every 2 minutes
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), 2 * 60 * 1000);
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    entry.accessCount++;
    entry.lastAccessed = Date.now();
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttl?: number): void {
    // Evict least recently used if at capacity
    if (this.cache.size >= this.maxEntries && !this.cache.has(key)) {
      this.evictLru();
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttl || this.defaultTtl),
      createdAt: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
    });
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  // Invalidate cache entries by prefix (e.g., invalidate all user-related caches)
  invalidateByPrefix(prefix: string): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  // Invalidate cache entries by pattern
  invalidateByPattern(pattern: RegExp): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  // Get or set pattern - fetch from source if not cached
  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) return cached;

    const value = await fetcher();
    this.set(key, value, ttl);
    return value;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  private evictLru(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) this.cache.delete(oldestKey);
  }

  getStats(): { size: number; maxEntries: number; hitRate: number } {
    let totalAccesses = 0;
    for (const entry of this.cache.values()) {
      totalAccesses += entry.accessCount;
    }
    return { size: this.cache.size, maxEntries: this.maxEntries, hitRate: this.cache.size > 0 ? totalAccesses / this.cache.size : 0 };
  }
}

// Singleton cache instances for different domains
export const userCache = new MemoryCache({ defaultTtl: 2 * 60 * 1000 }); // 2 min for user data
export const domainCache = new MemoryCache({ defaultTtl: 5 * 60 * 1000 }); // 5 min for domain data
export const pricingCache = new MemoryCache({ defaultTtl: 30 * 60 * 1000 }); // 30 min for pricing (rarely changes)
export const adminCache = new MemoryCache({ defaultTtl: 1 * 60 * 1000 }); // 1 min for admin stats
export const apiCache = new MemoryCache({ defaultTtl: 3 * 60 * 1000 }); // 3 min general API cache
