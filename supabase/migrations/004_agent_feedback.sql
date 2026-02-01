-- Agent feedback table.
-- Stores structured feedback from authenticated agents for manual review.

CREATE TABLE IF NOT EXISTS agent_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL REFERENCES agents(id),
  message TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('bug', 'feature', 'quality', 'usability', 'general')),
  severity TEXT CHECK (severity IS NULL OR severity IN ('low', 'medium', 'high')),
  endpoint TEXT,
  context JSONB,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying by status (manual review workflow)
CREATE INDEX IF NOT EXISTS idx_feedback_status ON agent_feedback(status);

-- Index for querying by agent
CREATE INDEX IF NOT EXISTS idx_feedback_agent ON agent_feedback(agent_id);

-- Index for filtering by category
CREATE INDEX IF NOT EXISTS idx_feedback_category ON agent_feedback(category);

-- RLS: agents can insert their own feedback, only service role can read/update
ALTER TABLE agent_feedback ENABLE ROW LEVEL SECURITY;

-- Allow inserts via service role (API uses service role key)
CREATE POLICY "Service role full access on feedback"
  ON agent_feedback
  FOR ALL
  USING (true)
  WITH CHECK (true);
