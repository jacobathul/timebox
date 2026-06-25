-- ============================================================
-- Migration 002: Hierarchical Project Contexts
-- Adds a `contexts` table and migrates tasks from project_id → context_id.
-- The `projects` table is left intact for rollback safety; it is no longer
-- written by the application after this migration.
-- ============================================================

-- 1. Create contexts table
CREATE TABLE IF NOT EXISTS contexts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_context_id UUID REFERENCES contexts(id) ON DELETE SET NULL,
  name              TEXT NOT NULL,
  color             TEXT NOT NULL DEFAULT '#3b82f6',
  depth             INTEGER NOT NULL DEFAULT 1,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT contexts_max_depth CHECK (depth >= 1 AND depth <= 5)
);

-- 2. RLS
ALTER TABLE contexts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their contexts select"
  ON contexts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users own their contexts insert"
  ON contexts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users own their contexts update"
  ON contexts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users own their contexts delete"
  ON contexts FOR DELETE USING (auth.uid() = user_id);

-- 3. Auto-update updated_at
CREATE TRIGGER set_contexts_updated_at
  BEFORE UPDATE ON contexts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4. Migrate existing projects → contexts (top-level, depth = 1)
INSERT INTO contexts (id, user_id, name, color, depth, created_at, updated_at)
SELECT id, user_id, name, color, 1, created_at, updated_at
FROM projects
ON CONFLICT (id) DO NOTHING;

-- 5. Add context_id to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS context_id UUID REFERENCES contexts(id) ON DELETE SET NULL;

-- 6. Copy project_id → context_id where the context now exists
UPDATE tasks
SET context_id = project_id
WHERE project_id IS NOT NULL
  AND project_id IN (SELECT id FROM contexts)
  AND context_id IS NULL;
