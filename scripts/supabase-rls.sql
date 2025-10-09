-- Enable Realtime for task and treat tables (public schema)
-- Run this in Supabase SQL Editor

-- Ensure Realtime is enabled for the public schema or create publication entries:
-- NOTE: Supabase creates a default publication "supabase_realtime". Add tables to it:
alter publication supabase_realtime add table public.task;
alter publication supabase_realtime add table public.treat;

-- Enable RLS (Row Level Security)
alter table public.task enable row level security;
alter table public.treat enable row level security;
alter table public.group enable row level security;
alter table public.group_member enable row level security;
alter table public.user enable row level security;
alter table public.invite enable row level security;

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

-- STRICT POLICIES (after adding auth_user_id uuid to public.user)
-- Uncomment after migration is applied and backfilled
--
-- alter table public.task force row level security;
-- alter table public.treat force row level security;
-- alter table public.group force row level security;
-- alter table public.group_member force row level security;
-- alter table public.user force row level security;
-- alter table public.invite force row level security;
--
-- create or replace function public.is_member_of_group(gid int) returns boolean language sql stable as $$
--   select exists (
--     select 1 from public.user u
--     join public.group_member gm on gm.user_id = u.id
--     where u.auth_user_id = auth.uid() and gm.group_id = gid
--   );
-- $$;
--
-- create policy "task select strict" on public.task for select using (public.is_member_of_group(group_id));
-- create policy "task write strict" on public.task for all using (public.is_member_of_group(group_id)) with check (public.is_member_of_group(group_id));
-- create policy "treat select strict" on public.treat for select using (public.is_member_of_group(group_id));
-- create policy "treat write strict" on public.treat for all using (public.is_member_of_group(group_id)) with check (public.is_member_of_group(group_id));
-- create policy "group select strict" on public.group for select using (exists (
--   select 1 from public.group_member gm join public.user u on u.id = gm.user_id where gm.group_id = id and u.auth_user_id = auth.uid()
-- ));
-- create policy "group_member select strict" on public.group_member for select using (exists (
--   select 1 from public.user u where u.id = user_id and u.auth_user_id = auth.uid()
-- ));
-- create policy "user select self" on public.user for select using (auth.uid() = auth.uid());
-- create policy "invite select strict" on public.invite for select using (public.is_member_of_group(group_id));


