-- Prix de la boutique : Supabase devient la SEULE source des prix.
-- À exécuter une fois dans le SQL editor de Supabase.
--
-- « on conflict do nothing » : les prix déjà présents dans price_rules
-- (tes vrais prix) ne sont PAS modifiés. Seules les lignes manquantes sont
-- créées, avec les anciens montants par défaut du code du site.
-- Vérifie ensuite dans le Table editor (price_rules) et corrige au besoin.

insert into public.price_rules (scope, scope_id, price_key, amount_eur) values
  -- Broderies (kit / broderie finie)
  ('site', 'default', 'product.petit.kit', 10.00),
  ('site', 'default', 'product.petit.fini', 18.00),
  ('site', 'default', 'product.grand.kit', 20.00),
  ('site', 'default', 'product.grand.fini', 32.00),
  ('site', 'default', 'product.chat.kit', 14.00),
  ('site', 'default', 'product.chat.fini', 25.00),
  -- Options du petit chat
  ('site', 'default', 'option.bicolore.kit', 2.00),
  ('site', 'default', 'option.bicolore.fini', 4.00),
  ('site', 'default', 'option.prenom.kit', 3.00),
  ('site', 'default', 'option.prenom.fini', 5.00),
  -- Accessoires PLA
  ('site', 'default', 'accessory.cercle-couleur', 5.00),
  ('site', 'default', 'accessory.oreilles-chat', 5.00),
  ('site', 'default', 'accessory.stand-triangle', 3.00),
  -- Box
  ('site', 'default', 'box.aboMensuel', 19.50),
  ('site', 'default', 'box.abo3Mois', 49.50),
  -- Livraison
  ('site', 'default', 'shipping', 3.50)
on conflict (scope, scope_id, price_key) do nothing;

-- Pour voir tous les prix actuels :
-- select price_key, amount_eur from public.price_rules
-- where scope = 'site' and scope_id = 'default' order by price_key;
