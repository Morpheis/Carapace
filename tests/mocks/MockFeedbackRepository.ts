import type { Feedback } from '../../src/types/models.js';
import type {
  IFeedbackRepository,
  CreateFeedbackInput,
} from '../../src/repositories/IFeedbackRepository.js';

export class MockFeedbackRepository implements IFeedbackRepository {
  readonly items: Feedback[] = [];

  async create(input: CreateFeedbackInput): Promise<Feedback> {
    const feedback: Feedback = {
      id: `fb-${this.items.length + 1}`,
      agentId: input.agentId,
      message: input.message,
      category: input.category,
      severity: input.severity ?? null,
      endpoint: input.endpoint ?? null,
      context: input.context ?? null,
      status: 'new',
      createdAt: new Date(),
    };
    this.items.push(feedback);
    return feedback;
  }
}
