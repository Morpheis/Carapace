import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryCounterStore } from '../../src/stores/InMemoryCounterStore.js';

describe('InMemoryCounterStore', () => {
  let store: InMemoryCounterStore;

  beforeEach(() => {
    store = new InMemoryCounterStore();
  });

  it('should return 0 for unset counter', async () => {
    expect(await store.get('queries_served')).toBe(0);
  });

  it('should increment and return new value', async () => {
    const val = await store.increment('queries_served');
    expect(val).toBe(1);
  });

  it('should accumulate increments', async () => {
    await store.increment('queries_served');
    await store.increment('queries_served');
    const val = await store.increment('queries_served');
    expect(val).toBe(3);
  });

  it('should support custom increment amounts', async () => {
    const val = await store.increment('queries_served', 5);
    expect(val).toBe(5);
  });

  it('should track different keys independently', async () => {
    await store.increment('queries_served', 10);
    await store.increment('contributions_created', 3);

    expect(await store.get('queries_served')).toBe(10);
    expect(await store.get('contributions_created')).toBe(3);
  });
});
