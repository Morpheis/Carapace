/**
 * In-memory rate limit store.
 * Tracks request counts in a Map keyed by composite bucket keys.
 * Suitable for testing and single-instance development.
 * NOT suitable for production serverless (state lost between invocations).
 */

import type { IRateLimitStore, RateLimitResult } from './IRateLimitStore.js';

interface Bucket {
  count: number;
  resetAt: number;
}

export class InMemoryRateLimitStore implements IRateLimitStore {
  private readonly buckets = new Map<string, Bucket>();

  async increment(key: string, windowSeconds: number): Promise<RateLimitResult> {
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - (now % windowSeconds);
    const resetAt = windowStart + windowSeconds;
    const bucketKey = `${key}:${windowStart}`;

    const existing = this.buckets.get(bucketKey);
    if (existing && existing.resetAt === resetAt) {
      existing.count++;
      return { count: existing.count, resetAt };
    }

    this.buckets.set(bucketKey, { count: 1, resetAt });
    return { count: 1, resetAt };
  }
}
