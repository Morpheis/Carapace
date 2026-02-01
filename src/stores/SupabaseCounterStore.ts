/**
 * Supabase-backed counter store.
 * Uses an atomic RPC function for concurrent-safe increment.
 * Persists across serverless invocations.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ICounterStore } from './ICounterStore.js';

export class SupabaseCounterStore implements ICounterStore {
  constructor(private readonly db: SupabaseClient) {}

  async increment(key: string, amount = 1): Promise<number> {
    const { data, error } = await this.db.rpc('increment_counter', {
      p_key: key,
      p_amount: amount,
    });

    if (error) {
      throw new Error(`Counter increment failed: ${error.message}`);
    }

    return data as number;
  }

  async get(key: string): Promise<number> {
    const { data, error } = await this.db
      .from('platform_counters')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error) {
      throw new Error(`Counter get failed: ${error.message}`);
    }

    return (data?.value as number) ?? 0;
  }
}
