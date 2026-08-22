-- Niu-LKH — Supabase schema (recommended for production)
-- Apply with: supabase db push (or run in Supabase SQL Editor).
-- Follows supabase-postgres-best-practices skill:
--   * lowercase, snake_case identifiers
--   * explicit primary keys
--   * indexes on hot query paths (tanggal, id, user_id)
--   * RLS enabled with anonymous read-only policy where acceptable

begin;

create table if not exists public.lkh_entries (
  id               text primary key,
  user_id          text not null default 'afrizal',
  tanggal          date not null,
  hari             text not null default '',
  jam              text not null default '',
  uraian_kegiatan  text not null,
  tempat           text not null default '',
  penjab           text not null default '',
  dasar_surat      text not null default '',
  output_hasil_kerja text not null default '',
  bukti_dukung     text not null default '',
  nama             text not null default '',
  nip              text not null default '',
  gol              text not null default '',
  jabatan          text not null default '',
  unit_kerja       text not null default '',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Hot query paths
create index if not exists lkh_entries_tanggal_idx on public.lkh_entries (tanggal desc);
create index if not exists lkh_entries_user_id_idx on public.lkh_entries (user_id);
create index if not exists lkh_entries_created_at_idx on public.lkh_entries (created_at desc);
create index if not exists lkh_entries_updated_at_idx on public.lkh_entries (updated_at desc);

-- Enable Row Level Security
alter table public.lkh_entries enable row level security;

-- Anonymous (browser public client) read/write policy for this single-user app.
-- If you add auth later, replace with `auth.uid() = user_id`.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'lkh_entries' and policyname = 'lkh_entries_public_all'
  ) then
    create policy lkh_entries_public_all on public.lkh_entries
      for all
      to anon, authenticated
      using (true)
      with check (true);
  end if;
end
$$;

commit;
