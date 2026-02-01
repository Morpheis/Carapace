/**
 * Contribution data access interface.
 */

import type { ContributionRow, ScoredContributionRow } from '../types/database.js';
import type { PaginationOptions } from '../types/common.js';

export interface VectorSearchOptions {
  maxResults: number;
  minConfidence?: number;
  domainTags?: string[];
}

export interface IContributionRepository {
  insert(
    row: Omit<ContributionRow, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ContributionRow>;

  findById(id: string): Promise<ContributionRow | null>;

  findByAgent(
    agentId: string,
    options: PaginationOptions
  ): Promise<ContributionRow[]>;

  countByAgent(agentId: string): Promise<number>;

  update(id: string, data: Partial<ContributionRow>): Promise<ContributionRow>;

  delete(id: string): Promise<void>;

  vectorSearch(
    embedding: number[],
    options: VectorSearchOptions
  ): Promise<ScoredContributionRow[]>;

  findSimilar(
    embedding: number[],
    threshold: number
  ): Promise<ContributionRow[]>;
}
