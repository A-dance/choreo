create table if not exists public.shares (
  id uuid primary key default gen_random_uuid(),
  song_title text not null default '',
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists shares_created_at_idx on public.shares (created_at desc);

alter table public.shares enable row level security;

drop policy if exists "shares_public_read" on public.shares;
create policy "shares_public_read"
  on public.shares for select
  using (true);

insert into storage.buckets (id, name, public, file_size_limit)
values ('share-media', 'share-media', true, 52428800)
on conflict (id) do update
  set public = true,
      file_size_limit = 52428800;

drop policy if exists "share_media_public_read" on storage.objects;
create policy "share_media_public_read"
  on storage.objects for select
  using (bucket_id = 'share-media');
