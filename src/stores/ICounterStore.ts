/**
 * Counter store interface.
 * Tracks named counters (e.g. "queries_served") with atomic increment.
 * Used for platform-level metrics that can't be derived from table counts.
 */

export interface ICounterStore {
  /** Atomically increment a counter and return the new value. */
  increment(key: string, amount?: number): Promise<number>;

  /** Get the current value of a counter (0 if not set). */
  get(key: string): Promise<number>;
}
