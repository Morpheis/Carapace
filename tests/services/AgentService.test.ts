import { describe, it, expect, beforeEach } from 'vitest';
import { AgentService } from '../../src/services/AgentService.js';
import { MockAgentRepository } from '../mocks/MockAgentRepository.js';
import { UnauthorizedError, NotFoundError, ValidationError } from '../../src/errors.js';

describe('AgentService', () => {
  let agentService: AgentService;
  let agentRepo: MockAgentRepository;

  beforeEach(() => {
    agentRepo = new MockAgentRepository();
    agentService = new AgentService(agentRepo);
  });

  // ── register ──

  describe('register', () => {
    it('should create an agent and return an API key', async () => {
      const result = await agentService.register({
        displayName: 'TestAgent',
        description: 'A test agent',
      });

      expect(result.displayName).toBe('TestAgent');
      expect(result.description).toBe('A test agent');
      expect(result.id).toBeTruthy();
      expect(result.apiKey).toBeTruthy();
      expect(result.apiKey).toMatch(/^sc_key_/);
    });

    it('should generate a slugified ID from displayName', async () => {
      const result = await agentService.register({
        displayName: 'My Cool Agent 2000',
      });

      // Should be lowercase, hyphenated, with a random suffix
      expect(result.id).toMatch(/^my-cool-agent-2000-[a-z0-9]+$/);
    });

    it('should store the agent with a hashed API key', async () => {
      const result = await agentService.register({
        displayName: 'TestAgent',
      });

      const stored = await agentRepo.findById(result.id);
      expect(stored).not.toBeNull();
      expect(stored!.api_key_hash).not.toBe(result.apiKey);
      expect(stored!.api_key_hash).toBeTruthy();
    });

    it('should set default trust score to 0.5', async () => {
      const result = await agentService.register({
        displayName: 'TestAgent',
      });

      const stored = await agentRepo.findById(result.id);
      expect(stored!.trust_score).toBe(0.5);
    });

    it('should set description to null when not provided', async () => {
      const result = await agentService.register({
        displayName: 'TestAgent',
      });

      expect(result.description).toBeNull();
    });

    it('should generate unique IDs for same displayName', async () => {
      const result1 = await agentService.register({
        displayName: 'TestAgent',
      });
      const result2 = await agentService.register({
        displayName: 'TestAgent',
      });

      expect(result1.id).not.toBe(result2.id);
    });

    it('should reject empty displayName', async () => {
      await expect(
        agentService.register({ displayName: '' })
      ).rejects.toThrow(ValidationError);
    });

    it('should reject displayName exceeding max length', async () => {
      await expect(
        agentService.register({ displayName: 'a'.repeat(101) })
      ).rejects.toThrow(ValidationError);
    });
  });

  // ── authenticate ──

  describe('authenticate', () => {
    it('should return the agent for a valid API key', async () => {
      const registered = await agentService.register({
        displayName: 'TestAgent',
        description: 'A test agent',
      });

      const agent = await agentService.authenticate(registered.apiKey);

      expect(agent.id).toBe(registered.id);
      expect(agent.displayName).toBe('TestAgent');
    });

    it('should throw UnauthorizedError for invalid API key', async () => {
      await expect(
        agentService.authenticate('sc_key_bogus')
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for empty API key', async () => {
      await expect(agentService.authenticate('')).rejects.toThrow(
        UnauthorizedError
      );
    });
  });

  // ── getById ──

  describe('getById', () => {
    it('should return agent profile with contribution count', async () => {
      const registered = await agentService.register({
        displayName: 'TestAgent',
        description: 'A test agent',
      });

      const profile = await agentService.getById(registered.id);

      expect(profile.id).toBe(registered.id);
      expect(profile.displayName).toBe('TestAgent');
      expect(profile.description).toBe('A test agent');
      expect(profile.trustScore).toBe(0.5);
      expect(profile.contributionCount).toBe(0);
      expect(profile.joinedAt).toBeTruthy();
    });

    it('should throw NotFoundError for non-existent agent', async () => {
      await expect(agentService.getById('nonexistent')).rejects.toThrow(
        NotFoundError
      );
    });
  });
});
