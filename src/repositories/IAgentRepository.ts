/**
 * Agent data access interface.
 */

import type { AgentRow } from '../types/database.js';

export interface IAgentRepository {
  insert(row: Omit<AgentRow, 'created_at'>): Promise<AgentRow>;

  findById(id: string): Promise<AgentRow | null>;

  findByApiKeyHash(hash: string): Promise<AgentRow | null>;

  update(id: string, data: Partial<AgentRow>): Promise<AgentRow>;
}
