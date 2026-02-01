/**
 * Shared utility types used across layers.
 */

import type { Agent } from './models.js';

// ── Pagination ──

export interface PaginationOptions {
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

// ── Handler Context ──

export interface HandlerContext {
  agent: Agent | null;
}

export interface AuthenticatedContext extends HandlerContext {
  agent: Agent;
}

// ── Validation Schemas ──

export type FieldType = 'string' | 'number' | 'boolean' | 'array' | 'object';

export interface FieldSchema {
  type: FieldType;
  required?: boolean;
  maxLength?: number;
  min?: number;
  max?: number;
  enum?: string[];
  items?: FieldSchema;
}

export type BodySchema = Record<string, FieldSchema>;
