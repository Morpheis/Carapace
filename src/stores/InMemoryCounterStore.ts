/**
 * In-memory counter store.
 * Suitable for testing and single-instance development.
 */

import type { ICounterStore } from './ICounterStore.js';

export class InMemoryCounterStore implements ICounterStore {
  private readonly counters = new Map<string, number>();

  async increment(key: string, amount = 1): Promise<number> {
    const current = this.counters.get(key) ?? 0;
    const next = current + amount;
    this.counters.set(key, next);
    return next;
  }

  async get(key: string): Promise<number> {
    return this.counters.get(key) ?? 0;
  }
}
