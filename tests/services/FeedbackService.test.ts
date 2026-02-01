import { describe, it, expect, beforeEach } from 'vitest';
import { FeedbackService } from '../../src/services/FeedbackService.js';
import { MockFeedbackRepository } from '../mocks/MockFeedbackRepository.js';

describe('FeedbackService', () => {
  let service: FeedbackService;
  let feedbackRepo: MockFeedbackRepository;

  beforeEach(() => {
    feedbackRepo = new MockFeedbackRepository();
    service = new FeedbackService(feedbackRepo);
  });

  // --- submit() ---

  it('should create feedback with required fields', async () => {
    const result = await service.submit({
      message: 'Search results not relevant for security domain',
      category: 'quality',
    }, 'agent-1');

    expect(result.id).toBeDefined();
    expect(result.message).toBe('Search results not relevant for security domain');
    expect(result.category).toBe('quality');
    expect(result.agentId).toBe('agent-1');
    expect(result.status).toBe('new');
    expect(result.severity).toBeNull();
    expect(result.endpoint).toBeNull();
    expect(result.context).toBeNull();
  });

  it('should create feedback with all optional fields', async () => {
    const result = await service.submit({
      message: 'Query endpoint returns 500 when domainTags is empty array',
      category: 'bug',
      severity: 'high',
      endpoint: '/api/v1/query',
      context: {
        requestBody: { question: 'test', domainTags: [] },
        responseStatus: 500,
      },
    }, 'agent-2');

    expect(result.category).toBe('bug');
    expect(result.severity).toBe('high');
    expect(result.endpoint).toBe('/api/v1/query');
    expect(result.context).toEqual({
      requestBody: { question: 'test', domainTags: [] },
      responseStatus: 500,
    });
  });

  it('should store feedback in repository', async () => {
    await service.submit({ message: 'test', category: 'general' }, 'agent-1');
    await service.submit({ message: 'another', category: 'feature' }, 'agent-2');

    expect(feedbackRepo.items).toHaveLength(2);
    expect(feedbackRepo.items[0].agentId).toBe('agent-1');
    expect(feedbackRepo.items[1].agentId).toBe('agent-2');
  });

  // --- validation ---

  it('should reject empty message', async () => {
    await expect(
      service.submit({ message: '', category: 'general' }, 'agent-1')
    ).rejects.toThrow('Message is required');
  });

  it('should reject whitespace-only message', async () => {
    await expect(
      service.submit({ message: '   ', category: 'general' }, 'agent-1')
    ).rejects.toThrow('Message is required');
  });

  it('should reject invalid category', async () => {
    await expect(
      service.submit({ message: 'test', category: 'invalid' as any }, 'agent-1')
    ).rejects.toThrow('Invalid category');
  });

  it('should reject invalid severity', async () => {
    await expect(
      service.submit({ message: 'test', category: 'bug', severity: 'critical' as any }, 'agent-1')
    ).rejects.toThrow('Invalid severity');
  });

  it('should reject message exceeding max length', async () => {
    const longMessage = 'x'.repeat(5001);
    await expect(
      service.submit({ message: longMessage, category: 'general' }, 'agent-1')
    ).rejects.toThrow('Message exceeds maximum length');
  });

  it('should accept message at exactly max length', async () => {
    const maxMessage = 'x'.repeat(5000);
    const result = await service.submit({ message: maxMessage, category: 'general' }, 'agent-1');
    expect(result.message).toBe(maxMessage);
  });

  it('should accept all valid categories', async () => {
    const categories = ['bug', 'feature', 'quality', 'usability', 'general'] as const;
    for (const category of categories) {
      const result = await service.submit({ message: `testing ${category}`, category }, 'agent-1');
      expect(result.category).toBe(category);
    }
  });

  it('should accept all valid severities', async () => {
    const severities = ['low', 'medium', 'high'] as const;
    for (const severity of severities) {
      const result = await service.submit(
        { message: `severity ${severity}`, category: 'bug', severity },
        'agent-1'
      );
      expect(result.severity).toBe(severity);
    }
  });

  it('should reject endpoint string exceeding max length', async () => {
    const longEndpoint = '/api/' + 'x'.repeat(300);
    await expect(
      service.submit({ message: 'test', category: 'bug', endpoint: longEndpoint }, 'agent-1')
    ).rejects.toThrow('Endpoint exceeds maximum length');
  });

  it('should reject context object exceeding max size', async () => {
    const hugeContext = { data: 'x'.repeat(11_000) };
    await expect(
      service.submit({ message: 'test', category: 'bug', context: hugeContext }, 'agent-1')
    ).rejects.toThrow('Context exceeds maximum size');
  });

  it('should accept context within size limit', async () => {
    const okContext = { data: 'x'.repeat(5000) };
    const result = await service.submit(
      { message: 'test', category: 'bug', context: okContext },
      'agent-1'
    );
    expect(result.context).toEqual(okContext);
  });
});
