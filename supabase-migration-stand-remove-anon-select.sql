-- Sécurité stand : à exécuter dans Supabase SQL **après** déploiement Netlify de la fonction
-- `netlify/functions/stand-orders-list.js` et configuration des variables d'environnement
-- (voir brief-agent-extra-site.md section sécurité stand).
--
-- Avant cette migration : tout visiteur avec la clé anon (publique dans le JS) pouvait SELECT
-- l'intégralité de `stand_orders` (fuite de données personnelles).

drop policy if exists "public_select_stand_orders" on public.stand_orders;

-- anon conserve uniquement INSERT (création de fiches depuis /stand.html).
-- La lecture passe par la fonction Netlify + service_role.
