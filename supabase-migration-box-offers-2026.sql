-- Offres box 2026 : abonnement (prix / box) + paiement unique 3 mois.
-- À exécuter dans Supabase SQL.

insert into public.price_rules (scope, scope_id, price_key, amount_eur) values
('site','default','box.aboMensuel',19.50),
('site','default','box.abo3Mois',49.50)
on conflict (scope, scope_id, price_key) do update set amount_eur = excluded.amount_eur;

delete from public.price_rules
where scope = 'site'
  and scope_id = 'default'
  and price_key in (
    'box.aboBiMensuel',
    'box.aboPack6Mois3'
  );
