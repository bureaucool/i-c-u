-- Enable Realtime for task and treat tables (public schema)
-- Run this in Supabase SQL Editor

-- Ensure Realtime is enabled for the public schema or create publication entries:
-- NOTE: Supabase creates a default publication "supabase_realtime". Add tables to it:
alter publication supabase_realtime add table public.task;
alter publication supabase_realtime add table public.treat;

-- Enable RLS (Row Level Security)
alter table public.task enable row level security;
alter table public.treat enable row level security;

-- Minimal permissive policies (adjust to your group logic later)
-- These policies allow authenticated users to see and modify rows in their group.

-- Assuming you will later add a group membership join table to enforce group checks via policies.
-- For now, fallback policies based on user id ownership fields.

-- Tasks: read any task; insert/update/delete if user is authenticated
create policy "task read" on public.task
    for select using (auth.role() = 'authenticated');

create policy "task write" on public.task
    for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Treats: read any; write if authenticated
create policy "treat read" on public.treat
    for select using (auth.role() = 'authenticated');

create policy "treat write" on public.treat
    for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- TIP: Tighten these by storing the Supabase auth.uid() on your user table and
-- joining against memberships to check group permissions.


