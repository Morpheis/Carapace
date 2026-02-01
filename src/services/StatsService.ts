/**
 * Platform statistics service.
 * Aggregates counts from repositories and counter stores.
 */

import type { IAgentRepository } from '../repositories/IAgentRepository.js';
import type { IContributionRepository } from '../repositories/IContributionRepository.js';
import type { ICounterStore } from '../stores/ICounterStore.js';

export interface PlatformStats {
  /** Total registered agents ("Molters"). */
  molters: number;
  /** Total contributions ("Insights Shared"). */
  insights: number;
  /** Total semantic queries served. */
  queriesServed: number;
  /** Unique domain tags across all contributions. */
  domains: number;
}

const QUERIES_KEY = 'queries_served';

export class StatsService {
  constructor(
    private readonly agentRepo: IAgentRepository,
    private readonly contributionRepo: IContributionRepository,
    private readonly counterStore: ICounterStore
  ) {}

  async getStats(): Promise<PlatformStats> {
    const [molters, insights, domains, queriesServed] = await Promise.all([
      this.agentRepo.count(),
      this.contributionRepo.count(),
      this.contributionRepo.countDomains(),
      this.counterStore.get(QUERIES_KEY),
    ]);

    return { molters, insights, queriesServed, domains };
  }

  async recordQuery(): Promise<void> {
    await this.counterStore.increment(QUERIES_KEY);
  }
}
