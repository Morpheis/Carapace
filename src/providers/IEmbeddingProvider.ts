/**
 * Embedding generation interface.
 * Wraps external embedding APIs (OpenAI, etc).
 */

export interface IEmbeddingProvider {
  /** Generate embedding vector for a single text input. */
  generate(text: string): Promise<number[]>;

  /** Batch embedding for efficiency. */
  generateBatch(texts: string[]): Promise<number[][]>;

  /** Vector dimensions (e.g., 1536 for text-embedding-3-small). */
  readonly dimensions: number;
}
