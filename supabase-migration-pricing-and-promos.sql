-- Run in Supabase SQL editor
-- Dynamic pricing + promo codes without redeploy.

create table if not exists public.site_pricing_config (
  slug text primary key,
  pricing_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.promo_codes (
  code text primary key,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  pricing_overrides jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_pricing_config enable row level security;
alter table public.promo_codes enable row level security;

drop policy if exists "public_read_site_pricing_config" on public.site_pricing_config;
create policy "public_read_site_pricing_config"
on public.site_pricing_config
for select
to anon
using (true);

drop policy if exists "public_read_promo_codes" on public.promo_codes;
create policy "public_read_promo_codes"
on public.promo_codes
for select
to anon
using (true);

insert into public.site_pricing_config (slug, pricing_data)
values (
  'default',
  jsonb_build_object(
    'product_base_eur', jsonb_build_object(
      'petit', jsonb_build_object('kit', 10, 'fini', 18),
      'chat',  jsonb_build_object('kit', 14, 'fini', 25),
      'grand', jsonb_build_object('kit', 20, 'fini', 32)
    ),
    'option_fees', jsonb_build_object(
      'bicoloreKit', 2,
      'bicoloreFini', 4,
      'prenomKit', 3,
      'prenomFini', 5
    ),
    'shipping_eur', 3.5,
    'box_one_shot_eur', jsonb_build_object('abo3Mois', 51.5, 'aboAnnee', 191.5),
    'accessory_prices', jsonb_build_object('oreilles-chat', 5, 'stand-triangle', 3)
  )
)
on conflict (slug) do nothing;

insert into public.promo_codes (code, is_active, pricing_overrides)
values (
  'MARCHE25',
  true,
  jsonb_build_object(
    'product_base_eur', jsonb_build_object(
      'petit', jsonb_build_object('kit', 8, 'fini', 15),
      'chat',  jsonb_build_object('kit', 12, 'fini', 22),
      'grand', jsonb_build_object('kit', 18, 'fini', 35)
    ),
    'option_fees', jsonb_build_object(
      'bicoloreKit', 2,
      'bicoloreFini', 3,
      'prenomKit', 2,
      'prenomFini', 5
    ),
    'accessory_prices', jsonb_build_object('oreilles-chat', 5, 'stand-triangle', 3)
  )
)
on conflict (code) do nothing;
