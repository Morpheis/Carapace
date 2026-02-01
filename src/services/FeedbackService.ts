/**
 * Feedback service.
 * Handles validation and submission of agent feedback.
 */

import type { Feedback, FeedbackCategory, FeedbackSeverity } from '../types/models.js';
import type { IFeedbackRepository } from '../repositories/IFeedbackRepository.js';
import { ValidationError } from '../errors.js';

const VALID_CATEGORIES: FeedbackCategory[] = ['bug', 'feature', 'quality', 'usability', 'general'];
const VALID_SEVERITIES: FeedbackSeverity[] = ['low', 'medium', 'high'];
const MAX_MESSAGE_LENGTH = 5000;
const MAX_ENDPOINT_LENGTH = 200;

export interface SubmitFeedbackInput {
  message: string;
  category: FeedbackCategory;
  severity?: FeedbackSeverity;
  endpoint?: string;
  context?: Record<string, unknown>;
}

export class FeedbackService {
  constructor(private readonly feedbackRepo: IFeedbackRepository) {}

  async submit(input: SubmitFeedbackInput, agentId: string): Promise<Feedback> {
    // Validate message
    if (!input.message || input.message.trim().length === 0) {
      throw new ValidationError('Message is required');
    }
    if (input.message.length > MAX_MESSAGE_LENGTH) {
      throw new ValidationError(`Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`);
    }

    // Validate category
    if (!VALID_CATEGORIES.includes(input.category)) {
      throw new ValidationError(
        `Invalid category: "${input.category}". Must be one of: ${VALID_CATEGORIES.join(', ')}`
      );
    }

    // Validate severity (optional)
    if (input.severity !== undefined && !VALID_SEVERITIES.includes(input.severity)) {
      throw new ValidationError(
        `Invalid severity: "${input.severity}". Must be one of: ${VALID_SEVERITIES.join(', ')}`
      );
    }

    // Validate endpoint (optional)
    if (input.endpoint && input.endpoint.length > MAX_ENDPOINT_LENGTH) {
      throw new ValidationError(
        `Endpoint exceeds maximum length of ${MAX_ENDPOINT_LENGTH} characters`
      );
    }

    return this.feedbackRepo.create({
      agentId,
      message: input.message,
      category: input.category,
      severity: input.severity,
      endpoint: input.endpoint,
      context: input.context,
    });
  }
}
