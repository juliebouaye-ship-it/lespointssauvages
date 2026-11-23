-- Prix de la collection Noël, de Freddie et de l'offre « 3 minis ».
-- À exécuter une fois dans le SQL editor de Supabase.
-- (Mêmes prix au marché, à la mercerie et sur le site.)
--
-- « do update » : ces prix REMPLACENT ceux déjà présents pour ces clés.

insert into public.price_rules (scope, scope_id, price_key, amount_eur) values
  -- Minis (broderie finie uniquement, 8 cm, cercle rouge ou doré)
  ('site', 'default', 'product.noel-sapin.fini', 6.00),
  ('site', 'default', 'product.noel-flocon.fini', 6.00),
  ('site', 'default', 'product.noel-houx.fini', 6.00),
  -- Offre : 3 minis au choix
  ('site', 'default', 'bundle.minis', 15.00),
  -- Chocolat chaud (12,5 cm)
  ('site', 'default', 'product.noel-chocolat.kit', 15.00),
  ('site', 'default', 'product.noel-chocolat.fini', 20.00),
  -- Couronne de Noël (15 cm)
  ('site', 'default', 'product.noel-couronne.kit', 22.00),
  ('site', 'default', 'product.noel-couronne.fini', 35.00),
  -- Freddie (grand format ovale)
  ('site', 'default', 'product.freddie.kit', 25.00),
  ('site', 'default', 'product.freddie.fini', 40.00),
  -- La fille aux cheveux : kit au même prix qu'en mercerie (à passer à 25 si
  -- le prix mercerie change), broderie finie comme Freddie
  ('site', 'default', 'product.fille-cheveux.kit', 18.00),
  ('site', 'default', 'product.fille-cheveux.fini', 40.00),
  -- Petit chat qui dort : kit au même prix qu'en mercerie
  ('site', 'default', 'product.chat.kit', 18.00)
on conflict (scope, scope_id, price_key) do update set amount_eur = excluded.amount_eur;

-- Les minis ne sont pas vendus en kit : on retire d'éventuelles lignes « kit »
-- (par exemple créées avec le modèle à 0 €).
delete from public.price_rules
where scope = 'site' and scope_id = 'default'
  and price_key in ('product.noel-sapin.kit', 'product.noel-flocon.kit', 'product.noel-houx.kit');

-- Vérification :
-- select price_key, amount_eur from public.price_rules
-- where scope = 'site' and scope_id = 'default' order by price_key;
