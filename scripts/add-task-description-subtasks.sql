-- Migration: Add description and subtasks to tasks
-- Run this in Supabase SQL Editor

-- 1. Add description column to task table
ALTER TABLE public.task ADD COLUMN description TEXT;

-- 2. Create subtask table
CREATE TABLE public.subtask (
  id BIGSERIAL PRIMARY KEY,
  task_id BIGINT NOT NULL REFERENCES public.task(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_number INT NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000
);

-- 3. Create index on task_id for faster lookups
CREATE INDEX idx_subtask_task_id ON public.subtask(task_id);

-- 4. Create index on order_number for sorting
CREATE INDEX idx_subtask_order ON public.subtask(task_id, order_number);

-- 5. Enable RLS for subtask table
ALTER TABLE public.subtask ENABLE ROW LEVEL SECURITY;

-- 6. Create policies for subtask (same permissions as task)
CREATE POLICY "subtask read" ON public.subtask
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "subtask write" ON public.subtask
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 7. Enable Realtime for subtask table
ALTER PUBLICATION supabase_realtime ADD TABLE public.subtask;

