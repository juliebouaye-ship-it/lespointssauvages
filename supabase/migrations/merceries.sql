-- Run in Supabase SQL editor
-- Mini backoffice merceries : chaque mercerie note les kits qu'elle a vendus.
--
-- Securite : ces deux tables n'ont AUCUNE policy pour `anon`.
-- La cle anon est publique (components/config.js) : tout ce qui est lisible par
-- `anon` est lisible par n'importe quel visiteur. Les mots de passe des merceries
-- et leurs ventes ne passent donc QUE par la fonction Netlify
-- `netlify/functions/mercerie-api.js`, qui utilise la cle service_role
-- (serveur uniquement) et contourne RLS.

create table if not exists public.merceries (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null,
  city text,
  contact_email text,
  is_active boolean not null default true,
  -- Hash PBKDF2-SHA256 du mot de passe (voir scripts/mercerie-password.mjs).
  -- Jamais le mot de passe en clair.
  password_salt text not null,
  password_hash text not null,
  password_iterations integer not null default 150000
);

alter table public.merceries enable row level security;

-- Aucune policy volontairement : seule la cle service_role accede a la table.
drop policy if exists "anon_select_merceries" on public.merceries;

create table if not exists public.mercerie_sales (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  mercerie_id bigint not null references public.merceries (id) on delete cascade,
  sold_on date not null default current_date,
  product_key text not null,
  product_label text not null,
  format text not null default 'kit' check (format in ('kit', 'fini')),
  quantity integer not null check (quantity > 0 and quantity <= 999),
  unit_price_eur numeric(10, 2) not null default 0 check (unit_price_eur >= 0),
  total_eur numeric(10, 2) generated always as (quantity * unit_price_eur) stored,
  note text
);

alter table public.mercerie_sales enable row level security;

-- Aucune policy volontairement : lecture/ecriture uniquement via service_role.
drop policy if exists "anon_select_mercerie_sales" on public.mercerie_sales;

create index if not exists mercerie_sales_shop_date_idx
  on public.mercerie_sales (mercerie_id, sold_on desc);

-- Exemple d'ajout d'une mercerie (les valeurs salt/hash sont produites par
-- `node scripts/mercerie-password.mjs "Mercerie du Coin" "motdepasse"`) :
--
-- insert into public.merceries (name, city, contact_email, password_salt, password_hash, password_iterations)
-- values ('Mercerie du Coin', 'Nantes', 'contact@exemple.fr', '<salt>', '<hash>', 150000);
