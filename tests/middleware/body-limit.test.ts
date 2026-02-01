import { describe, it, expect } from 'vitest';
import { bodyLimit } from '../../src/middleware/body-limit.js';
import type { Handler, HandlerContext } from '../../src/middleware/pipeline.js';

const ctx: HandlerContext = { agent: null };

function makeRequest(body: string, contentType = 'application/json'): Request {
  return new Request('http://localhost/api/v1/test', {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body,
  });
}

const echoHandler: Handler = async (req) => {
  const body = await req.text();
  return new Response(body, { status: 200 });
};

describe('bodyLimit middleware', () => {
  const limit50KB = bodyLimit(50 * 1024);

  it('should pass through requests under the limit', async () => {
    const small = JSON.stringify({ message: 'hello' });
    const wrapped = limit50KB(echoHandler);
    const res = await wrapped(makeRequest(small), ctx);

    expect(res.status).toBe(200);
    expect(await res.text()).toBe(small);
  });

  it('should reject requests over the limit with 413', async () => {
    const huge = 'x'.repeat(60 * 1024);
    const wrapped = limit50KB(echoHandler);
    const res = await wrapped(makeRequest(huge), ctx);

    expect(res.status).toBe(413);
    const body = await res.json() as any;
    expect(body.error.code).toBe('INVALID_REQUEST');
    expect(body.error.message).toContain('too large');
  });

  it('should accept requests at exactly the limit', async () => {
    const exact = 'x'.repeat(50 * 1024);
    const wrapped = limit50KB(echoHandler);
    const res = await wrapped(makeRequest(exact), ctx);

    expect(res.status).toBe(200);
  });

  it('should pass through GET requests without body', async () => {
    const req = new Request('http://localhost/api/v1/test', { method: 'GET' });
    const handler: Handler = async () => new Response('ok', { status: 200 });
    const wrapped = limit50KB(handler);
    const res = await wrapped(req, ctx);

    expect(res.status).toBe(200);
  });

  it('should use Content-Length header when available', async () => {
    const req = new Request('http://localhost/api/v1/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': String(100 * 1024),
      },
      body: '{}',
    });
    const wrapped = limit50KB(echoHandler);
    const res = await wrapped(req, ctx);

    expect(res.status).toBe(413);
  });

  it('should work with a custom limit', async () => {
    const tiny = bodyLimit(100);
    const wrapped = tiny(echoHandler);

    const over = await wrapped(makeRequest('x'.repeat(101)), ctx);
    expect(over.status).toBe(413);

    const under = await wrapped(makeRequest('x'.repeat(50)), ctx);
    expect(under.status).toBe(200);
  });
});
