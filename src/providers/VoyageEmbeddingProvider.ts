/**
 * Voyage AI embedding provider.
 * Uses the Voyage API (OpenAI-compatible format) for voyage-4-lite (1024 dimensions).
 * No SDK dependency — uses native fetch.
 * Includes retry logic for transient errors (429, 500, 502, 503, 504).
 */

import type { IEmbeddingProvider } from './IEmbeddingProvider.js';
import { EmbeddingError } from '../errors.js';

const API_URL = 'https://api.voyageai.com/v1/embeddings';
const DEFAULT_MODEL = 'voyage-4-lite';
const DEFAULT_DIMENSIONS = 1024;

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

interface VoyageEmbeddingData {
  object: string;
  embedding: number[];
  index: number;
}

interface VoyageEmbeddingResponse {
  object: string;
  data: VoyageEmbeddingData[];
  model: string;
  usage: { total_tokens: number };
}

export class VoyageEmbeddingProvider implements IEmbeddingProvider {
  private apiKey: string;
  private model: string;
  readonly dimensions: number;

  constructor(opts?: {
    apiKey?: string;
    model?: string;
    dimensions?: number;
  }) {
    this.apiKey = opts?.apiKey ?? process.env.VOYAGE_API_KEY ?? '';
    this.model = opts?.model ?? DEFAULT_MODEL;
    this.dimensions = opts?.dimensions ?? DEFAULT_DIMENSIONS;
  }

  async generate(text: string): Promise<number[]> {
    const response = await this.callApi([text], 'document');
    return response.data[0].embedding;
  }

  async generateBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const response = await this.callApi(texts, 'document');

    return response.data
      .sort((a, b) => a.index - b.index)
      .map((d) => d.embedding);
  }

  private async callApi(
    input: string[],
    inputType: 'query' | 'document'
  ): Promise<VoyageEmbeddingResponse> {
    const body: Record<string, unknown> = {
      input,
      model: this.model,
      input_type: inputType,
    };

    // Only include output_dimension for non-default values
    if (this.dimensions !== DEFAULT_DIMENSIONS) {
      body.output_dimension = this.dimensions;
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
      }

      let res: Response;
      try {
        res = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(body),
        });
      } catch (fetchErr) {
        // Network-level error (DNS, timeout, etc.)
        lastError = new EmbeddingError(
          `Voyage API network error: ${(fetchErr as Error).message}`,
          { provider: 'voyage', attempt: attempt + 1, type: 'network' }
        );
        continue;
      }

      if (res.ok) {
        return (await res.json()) as VoyageEmbeddingResponse;
      }

      const errBody = await res.json().catch(() => ({})) as Record<string, unknown>;
      const detail = errBody.detail ?? errBody.message ?? errBody.error ?? 'Unknown error';

      if (RETRYABLE_STATUS_CODES.has(res.status) && attempt < MAX_RETRIES) {
        lastError = new EmbeddingError(
          `Voyage API error (${res.status}): ${detail}`,
          { provider: 'voyage', status: res.status, detail, attempt: attempt + 1 }
        );
        continue;
      }

      // Non-retryable or final attempt — throw immediately
      throw new EmbeddingError(
        `Voyage API error (${res.status}): ${detail}`,
        {
          provider: 'voyage',
          status: res.status,
          detail,
          attempts: attempt + 1,
          retryable: RETRYABLE_STATUS_CODES.has(res.status),
        }
      );
    }

    // All retries exhausted
    throw lastError ?? new EmbeddingError('Voyage API failed after retries', {
      provider: 'voyage',
      attempts: MAX_RETRIES + 1,
    });
  }
}
