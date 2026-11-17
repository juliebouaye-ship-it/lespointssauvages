-- Demandes de rétractation (« Renoncer au contrat ici »).
-- À exécuter une fois dans le SQL editor de Supabase.
--
-- Écriture uniquement par la fonction Netlify withdrawal-request (clé
-- service_role, qui contourne la RLS). Aucun accès pour le public (anon) :
-- ces lignes contiennent des emails de clients.

create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  received_at timestamptz not null,
  email text not null,
  order_ref text not null,
  details text,
  ack_sent boolean not null default false,
  status text not null default 'new' -- new / en_cours / rembourse / refuse
);

alter table public.withdrawal_requests enable row level security;
-- Pas de policy : seul le service_role (fonction Netlify) et le dashboard Supabase y accèdent.

create index if not exists withdrawal_requests_created_at_idx
  on public.withdrawal_requests (created_at desc);
