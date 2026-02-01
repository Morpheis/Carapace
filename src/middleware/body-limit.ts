/**
 * Request body size limit middleware.
 * Rejects payloads over the configured byte limit with 413.
 * Checks Content-Length header first (fast path), falls back to reading body.
 */

import type { Handler, Middleware } from './pipeline.js';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export function bodyLimit(maxBytes: number): Middleware {
  return (next: Handler): Handler => {
    return async (req, ctx) => {
      // Skip bodyless methods
      if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
        return next(req, ctx);
      }

      // Fast path: check Content-Length header
      const contentLength = req.headers.get('Content-Length');
      if (contentLength && parseInt(contentLength, 10) > maxBytes) {
        return tooLarge(maxBytes);
      }

      // Slow path: read body and check actual size
      const body = await req.text();
      if (body.length > maxBytes) {
        return tooLarge(maxBytes);
      }

      // Re-create request with the consumed body
      const newReq = new Request(req.url, {
        method: req.method,
        headers: req.headers,
        body,
      });

      return next(newReq, ctx);
    };
  };
}

function tooLarge(maxBytes: number): Response {
  const maxKB = Math.round(maxBytes / 1024);
  return new Response(
    JSON.stringify({
      error: {
        code: 'INVALID_REQUEST',
        message: `Request body too large (max ${maxKB}KB)`,
      },
    }),
    { status: 413, headers: JSON_HEADERS }
  );
}
