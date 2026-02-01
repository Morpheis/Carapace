/**
 * Supabase-backed rate limit store.
 * Uses an atomic RPC function for concurrent-safe increment.
 * Persists across serverless invocations.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { IRateLimitStore, RateLimitResult } from './IRateLimitStore.js';

export class SupabaseRateLimitStore implements IRateLimitStore {
  constructor(private readonly db: SupabaseClient) {}

  async increment(key: string, windowSeconds: number): Promise<RateLimitResult> {
    const { data, error } = await this.db.rpc('increment_rate_limit', {
      p_key: key,
      p_window_seconds: windowSeconds,
    });

    if (error) {
      throw new Error(`Rate limit increment failed: ${error.message}`);
    }

    // RPC returns a single row with { count, reset_at }
    const row = Array.isArray(data) ? data[0] : data;
    return {
      count: row.count,
      resetAt: row.reset_at,
    };
  }
}
