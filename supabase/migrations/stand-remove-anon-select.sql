-- Securite stand : a executer dans Supabase SQL **apres** deploiement Netlify de la fonction
-- `netlify/functions/stand-orders-list.js` et configuration des variables d'environnement
-- (voir brief-agent-extra-site.md section securite stand).
--
-- Avant cette migration : tout visiteur avec la cle anon (publique dans le JS) pouvait SELECT
-- l'integralite de `stand_orders` (fuite de donnees personnelles).

drop policy if exists "public_select_stand_orders" on public.stand_orders;

-- anon conserve uniquement INSERT (creation de fiches depuis /stand.html).
-- La lecture passe par la fonction Netlify + service_role.
