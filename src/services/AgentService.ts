/**
 * Agent registration, authentication, and profile management.
 */

import { randomBytes } from 'node:crypto';
import type { IAgentRepository } from '../repositories/IAgentRepository.js';
import type { Agent } from '../types/models.js';
import type {
  CreateAgentRequest,
  CreateAgentResponse,
  AgentProfileResponse,
} from '../types/api.js';
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../errors.js';

const API_KEY_PREFIX = 'sc_key_';
const MAX_DISPLAY_NAME_LENGTH = 100;

export class AgentService {
  constructor(private readonly agentRepo: IAgentRepository) {}

  async register(input: CreateAgentRequest): Promise<CreateAgentResponse> {
    this.validateRegistration(input);

    const id = this.generateId(input.displayName);
    const apiKey = this.generateApiKey();
    const apiKeyHash = await this.hashApiKey(apiKey);

    const row = await this.agentRepo.insert({
      id,
      api_key_hash: apiKeyHash,
      display_name: input.displayName,
      description: input.description ?? null,
      trust_score: 0.5,
    });

    return {
      id: row.id,
      displayName: row.display_name,
      description: row.description,
      apiKey,
    };
  }

  async authenticate(apiKey: string): Promise<Agent> {
    if (!apiKey) {
      throw new UnauthorizedError();
    }

    const hash = await this.hashApiKey(apiKey);
    const row = await this.agentRepo.findByApiKeyHash(hash);

    if (!row) {
      throw new UnauthorizedError();
    }

    return this.rowToAgent(row);
  }

  async getById(id: string): Promise<AgentProfileResponse> {
    const row = await this.agentRepo.findById(id);

    if (!row) {
      throw new NotFoundError(`Agent "${id}" not found`);
    }

    return {
      id: row.id,
      displayName: row.display_name,
      description: row.description,
      trustScore: row.trust_score,
      contributionCount: 0, // TODO: wire up in Phase 2
      joinedAt: row.created_at,
    };
  }

  // ── Private ──

  private validateRegistration(input: CreateAgentRequest): void {
    if (!input.displayName || input.displayName.trim().length === 0) {
      throw new ValidationError('displayName is required');
    }

    if (input.displayName.length > MAX_DISPLAY_NAME_LENGTH) {
      throw new ValidationError(
        `displayName must be ${MAX_DISPLAY_NAME_LENGTH} characters or less`
      );
    }
  }

  private generateId(displayName: string): string {
    const slug = displayName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const suffix = randomBytes(4).toString('hex');
    return `${slug}-${suffix}`;
  }

  private generateApiKey(): string {
    const key = randomBytes(32).toString('base64url');
    return `${API_KEY_PREFIX}${key}`;
  }

  private async hashApiKey(apiKey: string): Promise<string> {
    // Use SHA-256 for API key hashing (fast, deterministic — suitable for
    // lookup-by-hash pattern; bcrypt would require scanning all rows).
    const { createHash } = await import('node:crypto');
    return createHash('sha256').update(apiKey).digest('hex');
  }

  private rowToAgent(row: {
    id: string;
    api_key_hash: string;
    display_name: string;
    description: string | null;
    trust_score: number;
    created_at: string;
  }): Agent {
    return {
      id: row.id,
      apiKeyHash: row.api_key_hash,
      displayName: row.display_name,
      description: row.description,
      trustScore: row.trust_score,
      createdAt: new Date(row.created_at),
    };
  }
}
