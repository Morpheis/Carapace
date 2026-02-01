/**
 * Feedback repository interface.
 * Handles persistence of agent feedback submissions.
 */

import type { Feedback, FeedbackCategory, FeedbackSeverity } from '../types/models.js';

export interface CreateFeedbackInput {
  agentId: string;
  message: string;
  category: FeedbackCategory;
  severity?: FeedbackSeverity;
  endpoint?: string;
  context?: Record<string, unknown>;
}

export interface IFeedbackRepository {
  /** Create a new feedback entry. Returns the created feedback. */
  create(input: CreateFeedbackInput): Promise<Feedback>;
}
