-- ============================================================
-- Migration 003: Projects (specific goals/outcomes)
-- Renames the old unused `projects` table, then creates a new
-- `projects` table for goal-level project tracking.
-- ============================================================

-- 1. Rename the old projects table (migrated to contexts in 002)
ALTER TABLE IF EXISTS projects RENAME TO _legacy_projects;

-- 2. Drop old FK from tasks.project_id → old projects
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_project_id_fkey;

-- 3. NULL out old project_id values (they were context IDs; context_id now holds that)
UPDATE tasks SET project_id = NULL;

-- 4. Create new projects table (specific goals / outcomes)
CREATE TABLE projects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  context_id   UUID REFERENCES contexts(id) ON DELETE SET NULL,
  name         TEXT NOT NULL,
  description  TEXT,
  color        TEXT,
  due_date     DATE,
  status       TEXT NOT NULL DEFAULT 'active',
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT projects_status_check CHECK (status IN ('active', 'completed', 'archived'))
);

-- 5. RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their projects select"
  ON projects FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users own their projects insert"
  ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users own their projects update"
  ON projects FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users own their projects delete"
  ON projects FOR DELETE USING (auth.uid() = user_id);

-- 6. Auto-update updated_at
CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 7. Re-add FK on tasks.project_id → new projects table
ALTER TABLE tasks ADD CONSTRAINT tasks_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

-- 8. Indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id     ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_status ON projects(user_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_context_id  ON projects(context_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id     ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_project   ON tasks(user_id, project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status    ON tasks(user_id, status);
