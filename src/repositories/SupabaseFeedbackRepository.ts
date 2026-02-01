/**
 * Supabase implementation of IFeedbackRepository.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { IFeedbackRepository, CreateFeedbackInput } from './IFeedbackRepository.js';
import type { FeedbackRow } from '../types/database.js';
import type { Feedback, FeedbackCategory, FeedbackSeverity, FeedbackStatus } from '../types/models.js';

function rowToFeedback(row: FeedbackRow): Feedback {
  return {
    id: row.id,
    agentId: row.agent_id,
    message: row.message,
    category: row.category as FeedbackCategory,
    severity: row.severity as FeedbackSeverity | null,
    endpoint: row.endpoint,
    context: row.context,
    status: row.status as FeedbackStatus,
    createdAt: new Date(row.created_at),
  };
}

export class SupabaseFeedbackRepository implements IFeedbackRepository {
  constructor(private readonly db: SupabaseClient) {}

  async create(input: CreateFeedbackInput): Promise<Feedback> {
    const id = crypto.randomUUID();

    const { data, error } = await this.db
      .from('agent_feedback')
      .insert({
        id,
        agent_id: input.agentId,
        message: input.message,
        category: input.category,
        severity: input.severity ?? null,
        endpoint: input.endpoint ?? null,
        context: input.context ?? null,
        status: 'new',
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to insert feedback: ${error.message}`);
    return rowToFeedback(data as FeedbackRow);
  }
}
