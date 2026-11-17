-- Code promo MARCHE : livraison offerte pour les clients du marché de Noël.
-- À exécuter une fois dans le SQL editor de Supabase.
--
-- Ne change aucun prix produit (mêmes prix au marché, à la mercerie et sur le
-- site) : seule la livraison passe à 0 €, jusqu'au 31 décembre 2026 inclus.
-- Pour arrêter l'offre avant : passer is_active à false dans promo_codes.

insert into public.promo_codes (code, is_active, add1_month, starts_at, ends_at)
select 'MARCHE', true, false, '2026-12-01 00:00:00+01', '2026-12-31 23:59:59+01'
where not exists (select 1 from public.promo_codes where code = 'MARCHE');

update public.promo_codes
set is_active = true,
    add1_month = false,
    starts_at = '2026-12-01 00:00:00+01',
    ends_at = '2026-12-31 23:59:59+01'
where code = 'MARCHE';

insert into public.price_rules (scope, scope_id, price_key, amount_eur)
values ('promo', 'MARCHE', 'shipping', 0)
on conflict (scope, scope_id, price_key) do update set amount_eur = excluded.amount_eur;

-- Combien de commandes avec ce code ? (le code est noté dans shipping_notes)
-- select count(*) from public.orders where shipping_notes ilike '%Code promo : MARCHE%';
