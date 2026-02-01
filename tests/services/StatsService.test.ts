import { describe, it, expect, beforeEach } from 'vitest';
import { StatsService } from '../../src/services/StatsService.js';
import { MockAgentRepository } from '../mocks/MockAgentRepository.js';
import { MockContributionRepository } from '../mocks/MockContributionRepository.js';
import { InMemoryCounterStore } from '../../src/stores/InMemoryCounterStore.js';

describe('StatsService', () => {
  let statsService: StatsService;
  let agentRepo: MockAgentRepository;
  let contributionRepo: MockContributionRepository;
  let counterStore: InMemoryCounterStore;

  beforeEach(() => {
    agentRepo = new MockAgentRepository();
    contributionRepo = new MockContributionRepository();
    counterStore = new InMemoryCounterStore();
    statsService = new StatsService(agentRepo, contributionRepo, counterStore);
  });

  describe('getStats', () => {
    it('should return zeros when empty', async () => {
      const stats = await statsService.getStats();

      expect(stats.molters).toBe(0);
      expect(stats.insights).toBe(0);
      expect(stats.queriesServed).toBe(0);
      expect(stats.domains).toBe(0);
    });

    it('should count registered agents as molters', async () => {
      await agentRepo.insert({
        id: 'agent-1',
        api_key_hash: 'hash1',
        display_name: 'Agent One',
        description: null,
        trust_score: 0.5,
      });
      await agentRepo.insert({
        id: 'agent-2',
        api_key_hash: 'hash2',
        display_name: 'Agent Two',
        description: null,
        trust_score: 0.5,
      });

      const stats = await statsService.getStats();
      expect(stats.molters).toBe(2);
    });

    it('should count contributions as insights', async () => {
      await contributionRepo.insert({
        claim: 'Test insight',
        reasoning: null,
        applicability: null,
        limitations: null,
        confidence: 0.8,
        domain_tags: ['testing'],
        agent_id: 'agent-1',
        embedding: JSON.stringify([1, 0, 0]),
      });

      const stats = await statsService.getStats();
      expect(stats.insights).toBe(1);
    });

    it('should count unique domain tags', async () => {
      await contributionRepo.insert({
        claim: 'Insight A',
        reasoning: null,
        applicability: null,
        limitations: null,
        confidence: 0.8,
        domain_tags: ['testing', 'architecture'],
        agent_id: 'agent-1',
        embedding: JSON.stringify([1, 0, 0]),
      });
      await contributionRepo.insert({
        claim: 'Insight B',
        reasoning: null,
        applicability: null,
        limitations: null,
        confidence: 0.7,
        domain_tags: ['testing', 'deployment'],
        agent_id: 'agent-1',
        embedding: JSON.stringify([0, 1, 0]),
      });

      const stats = await statsService.getStats();
      // testing, architecture, deployment = 3 unique
      expect(stats.domains).toBe(3);
    });

    it('should return query count from counter store', async () => {
      await counterStore.increment('queries_served', 42);

      const stats = await statsService.getStats();
      expect(stats.queriesServed).toBe(42);
    });
  });

  describe('recordQuery', () => {
    it('should increment queries served counter', async () => {
      await statsService.recordQuery();
      await statsService.recordQuery();
      await statsService.recordQuery();

      const stats = await statsService.getStats();
      expect(stats.queriesServed).toBe(3);
    });
  });
});
