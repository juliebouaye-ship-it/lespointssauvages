-- Galerie aperçu box (photos des éditions passées / du type de projet).
-- 1) Exécuter ce script dans Supabase → SQL Editor.
-- 2) Storage → New bucket « box-motifs » → Public bucket : ON.
-- 3) Uploader une photo (ex. mai-2026.jpg) dans ce bucket.
-- 4) Table Editor → box_motif_gallery → Insert :
--      storage_path = nom du fichier dans le bucket (ex. mai-2026.jpg)
--      caption = libellé optionnel (ex. Mai 2026)
--      sort_order = plus grand = affiché en premier (ex. 10, 20…)

create table if not exists public.box_motif_gallery (
  id uuid primary key default gen_random_uuid(),
  caption text,
  storage_path text not null,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists box_motif_gallery_sort_idx
  on public.box_motif_gallery (sort_order desc, created_at desc);

alter table public.box_motif_gallery enable row level security;

drop policy if exists "anon_select_published_box_motif_gallery" on public.box_motif_gallery;
create policy "anon_select_published_box_motif_gallery"
  on public.box_motif_gallery
  for select
  to anon
  using (is_published = true);

-- Bucket public (lecture des images sur le site)
insert into storage.buckets (id, name, public)
values ('box-motifs', 'box-motifs', true)
on conflict (id) do update set public = true;

drop policy if exists "public_read_box_motifs_storage" on storage.objects;
create policy "public_read_box_motifs_storage"
  on storage.objects
  for select
  to public
  using (bucket_id = 'box-motifs');
