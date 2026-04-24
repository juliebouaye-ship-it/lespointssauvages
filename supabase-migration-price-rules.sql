-- Run in Supabase SQL editor
-- Relational pricing model: one row = one price key for one scope.

create table if not exists public.price_rules (
  id bigint generated always as identity primary key,
  scope text not null check (scope in ('site', 'promo')),
  scope_id text not null,
  price_key text not null,
  amount_eur numeric(10,2) not null,
  unique (scope, scope_id, price_key)
);

alter table public.price_rules enable row level security;

drop policy if exists "public_read_price_rules" on public.price_rules;
create policy "public_read_price_rules"
on public.price_rules
for select
to anon
using (true);

-- Keep promo metadata table for activation window/flags.
create table if not exists public.promo_codes (
  code text primary key,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.promo_codes enable row level security;

drop policy if exists "public_read_promo_codes" on public.promo_codes;
create policy "public_read_promo_codes"
on public.promo_codes
for select
to anon
using (true);

-- SITE DEFAULT (current live prices from config.js)
insert into public.price_rules (scope, scope_id, price_key, amount_eur) values
('site','default','product.petit.kit',10),
('site','default','product.petit.fini',18),
('site','default','product.chat.kit',14),
('site','default','product.chat.fini',25),
('site','default','product.grand.kit',20),
('site','default','product.grand.fini',32),
('site','default','option.bicolore.kit',2),
('site','default','option.bicolore.fini',4),
('site','default','option.prenom.kit',3),
('site','default','option.prenom.fini',5),
('site','default','shipping',3.5),
('site','default','box.abo3Mois',51.5),
('site','default','box.aboAnnee',191.5),
('site','default','accessory.oreilles-chat',5),
('site','default','accessory.stand-triangle',3)
on conflict (scope, scope_id, price_key) do update
set amount_eur = excluded.amount_eur;

-- PROMO MARCHE25 (market prices)
insert into public.promo_codes (code, is_active)
values ('MARCHE25', true)
on conflict (code) do nothing;

insert into public.price_rules (scope, scope_id, price_key, amount_eur) values
('promo','MARCHE25','product.petit.kit',8),
('promo','MARCHE25','product.petit.fini',15),
('promo','MARCHE25','product.chat.kit',12),
('promo','MARCHE25','product.chat.fini',22),
('promo','MARCHE25','product.grand.kit',18),
('promo','MARCHE25','product.grand.fini',35),
('promo','MARCHE25','option.bicolore.kit',2),
('promo','MARCHE25','option.bicolore.fini',3),
('promo','MARCHE25','option.prenom.kit',2),
('promo','MARCHE25','option.prenom.fini',5),
('promo','MARCHE25','accessory.oreilles-chat',5),
('promo','MARCHE25','accessory.stand-triangle',3)
on conflict (scope, scope_id, price_key) do update
set amount_eur = excluded.amount_eur;
