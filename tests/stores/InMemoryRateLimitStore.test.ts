import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { InMemoryRateLimitStore } from '../../src/stores/InMemoryRateLimitStore.js';

describe('InMemoryRateLimitStore', () => {
  let store: InMemoryRateLimitStore;

  beforeEach(() => {
    store = new InMemoryRateLimitStore();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return count of 1 for first increment', async () => {
    const result = await store.increment('agent:abc:query', 3600);
    expect(result.count).toBe(1);
  });

  it('should return incrementing counts for same key in same window', async () => {
    await store.increment('agent:abc:query', 3600);
    await store.increment('agent:abc:query', 3600);
    const result = await store.increment('agent:abc:query', 3600);
    expect(result.count).toBe(3);
  });

  it('should track different keys independently', async () => {
    await store.increment('agent:abc:query', 3600);
    await store.increment('agent:abc:query', 3600);
    const result = await store.increment('agent:xyz:query', 3600);
    expect(result.count).toBe(1);
  });

  it('should reset count when window expires', async () => {
    await store.increment('agent:abc:query', 3600);
    await store.increment('agent:abc:query', 3600);

    // Advance past the 1-hour window
    vi.advanceTimersByTime(3600 * 1000);

    const result = await store.increment('agent:abc:query', 3600);
    expect(result.count).toBe(1);
  });

  it('should return correct resetAt timestamp', async () => {
    const result = await store.increment('agent:abc:query', 3600);

    // At 12:00:00 UTC with 3600s window, window is 12:00:00-13:00:00
    const expectedReset = Math.floor(new Date('2025-01-15T13:00:00Z').getTime() / 1000);
    expect(result.resetAt).toBe(expectedReset);
  });

  it('should not leak counts across different window sizes', async () => {
    await store.increment('agent:abc:ops', 3600);    // 1h window
    await store.increment('agent:abc:ops', 3600);    // 1h window

    // Same key prefix but different window size → different bucket
    const result = await store.increment('agent:abc:ops', 86400); // 24h window
    expect(result.count).toBe(1);
  });
});
