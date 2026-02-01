/**
 * Rate limit store interface.
 * Tracks request counts per key within sliding windows.
 * Implementations: InMemoryRateLimitStore (dev/test), SupabaseRateLimitStore (production).
 */

export interface RateLimitResult {
  /** Current request count within the window (after this increment). */
  count: number;
  /** Unix timestamp (seconds) when the current window resets. */
  resetAt: number;
}

export interface IRateLimitStore {
  /**
   * Increment the counter for a key and return current count + reset time.
   * The store determines the window boundary from windowSeconds.
   */
  increment(key: string, windowSeconds: number): Promise<RateLimitResult>;
}
