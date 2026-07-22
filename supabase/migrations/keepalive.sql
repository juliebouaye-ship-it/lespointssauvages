-- Run in Supabase SQL editor
-- Table dediee au ping de garde (empeche la mise en pause du projet gratuit).
--
-- Supabase ne demande pas « un appel dans les 7 jours » mais « quelques requetes
-- base par jour sur la semaine ecoulee ». Deux planificateurs independants y
-- ecrivent plusieurs fois par jour :
--   - .github/workflows/supabase-keepalive.yml  (cle anon, insert + select)
--   - netlify/functions/supabase-keepalive.js   (cle service_role, + purge)
--
-- `anon` ne peut qu'inserer : ni lecture ni suppression exposees publiquement.
-- La purge des vieux pings passe par la cle service_role, qui contourne RLS,
-- donc aucune policy DELETE n'est necessaire ici.

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
