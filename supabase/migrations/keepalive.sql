-- Run in Supabase SQL editor
-- Table dediee au ping de garde (empeche la mise en pause du projet gratuit
-- apres 7 jours d'inactivite). Le workflow GitHub Actions "Supabase keepalive"
-- y insere une ligne a intervalle regulier : une ecriture reelle est un signal
-- d'activite plus fiable qu'une simple lecture (qui peut ne renvoyer aucune
-- ligne selon les policies RLS de la table lue).

create table if not exists public.keepalive (
  id bigint generated always as identity primary key,
  pinged_at timestamptz not null default now()
);

alter table public.keepalive enable row level security;

drop policy if exists "anon_insert_keepalive" on public.keepalive;
create policy "anon_insert_keepalive"
on public.keepalive
for insert
to anon
with check (true);
