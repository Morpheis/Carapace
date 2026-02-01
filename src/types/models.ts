/**
 * Domain models — core entities as the application understands them.
 * Decoupled from both API shapes and database row shapes.
 */

// ── Core Entities (Phase 1) ──

export interface Contribution {
  id: string;
  claim: string;
  reasoning: string | null;
  applicability: string | null;
  limitations: string | null;
  confidence: number;
  domainTags: string[];
  agentId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Agent {
  id: string;
  apiKeyHash: string;
  displayName: string;
  description: string | null;
  trustScore: number;
  createdAt: Date;
}

// ── Phase 2 Entities ──

export type ValidationSignal = 'confirmed' | 'contradicted' | 'refined';

export interface Validation {
  id: string;
  contributionId: string;
  agentId: string;
  signal: ValidationSignal;
  context: string | null;
  createdAt: Date;
}

export type ConnectionRelationship =
  | 'builds-on'
  | 'contradicts'
  | 'generalizes'
  | 'applies-to';

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  relationship: ConnectionRelationship;
  agentId: string;
  createdAt: Date;
}
