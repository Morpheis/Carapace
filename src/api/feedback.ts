/**
 * Feedback endpoint.
 * POST /api/v1/feedback — Submit feedback (auth required)
 */

import { pipeline, errorHandler } from '../middleware/index.js';
import { validateBody } from '../middleware/validate-body.js';
import type { Handler } from '../middleware/pipeline.js';
import type { Container } from '../container.js';
import type { BodySchema } from '../types/common.js';

const feedbackSchema: BodySchema = {
  message: { type: 'string', required: true, maxLength: 5000 },
  category: { type: 'string', required: true, maxLength: 50 },
  severity: { type: 'string', required: false, maxLength: 20 },
  endpoint: { type: 'string', required: false, maxLength: 200 },
  context: { type: 'object', required: false },
};

export function createFeedbackHandlers(container: Container) {
  const submit: Handler = pipeline(
    container.bodyLimit,
    container.logging,
    errorHandler,
    container.authenticate,
    container.rateLimit.feedback,
    validateBody(feedbackSchema)
  )(async (req, ctx) => {
    const body = await req.json() as Record<string, unknown>;

    const result = await container.feedbackService.submit(
      {
        message: body.message as string,
        category: body.category as any,
        severity: body.severity as any,
        endpoint: body.endpoint as string | undefined,
        context: body.context as Record<string, unknown> | undefined,
      },
      ctx.agent!.id
    );

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  });

  return { submit };
}
