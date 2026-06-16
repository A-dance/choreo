-- Auth profiles (display name, language, avatar path)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  language text not null default 'en',
  avatar_path text,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- One workspace document per user (mirrors localStorage v3 shape)
create table if not exists public.user_workspaces (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists user_workspaces_updated_at_idx
  on public.user_workspaces (updated_at desc);

alter table public.user_workspaces enable row level security;

drop policy if exists "user_workspaces_select_own" on public.user_workspaces;
create policy "user_workspaces_select_own"
  on public.user_workspaces for select
  using (auth.uid() = user_id);

drop policy if exists "user_workspaces_insert_own" on public.user_workspaces;
create policy "user_workspaces_insert_own"
  on public.user_workspaces for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_workspaces_update_own" on public.user_workspaces;
create policy "user_workspaces_update_own"
  on public.user_workspaces for update
  using (auth.uid() = user_id);

-- Private avatar bucket
insert into storage.buckets (id, name, public, file_size_limit)
values ('avatars', 'avatars', false, 1048576)
on conflict (id) do update
  set public = false,
      file_size_limit = 1048576;

drop policy if exists "avatars_read_own" on storage.objects;
create policy "avatars_read_own"
  on storage.objects for select
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_write_own" on storage.objects;
create policy "avatars_write_own"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
