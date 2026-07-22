# Les Points Rebelles

Site vitrine statique de **Les Points Rebelles**.

## Stack

- HTML
- CSS
- JavaScript vanilla
- Netlify (hebergement et deploiement)

## Lancer en local

### Preview Netlify (recommande)

Depuis le dossier `Netlify`:

`.\preview-local.ps1`

Puis ouvrez `http://localhost:8888`.

### Preview simple (sans Netlify)

Depuis le dossier `Netlify`:

`.\preview-local.ps1 -Mode simple -Port 8080`

Puis ouvrez `http://localhost:8080`.

Ou utilisez directement:

`npx --yes serve . -l 8080`

## Deploiement

Le site est deploye via Netlify.
Les deploiements automatiques se font depuis la branche `main` du repository GitHub.

## Notifications email automatiques

Le site envoie maintenant un email d'alerte admin pour:

- nouvelle commande payee
- nouvelle demande de contact
- nouvelle demande abonnement (et intention d'abonnement mensuel/bi-mensuel avant redirection PayPal)

Variables Netlify a definir:

- `LPS_SMTP_USER` : ton Gmail (ex: `lespointsrebelles@gmail.com`)
- `LPS_SMTP_APP_PASSWORD` : mot de passe d'application Google (16 caracteres)
- `LPS_NOTIFY_TO_EMAIL` (optionnel) : boite qui recoit les alertes, sinon `LPS_SMTP_USER`
- `LPS_NOTIFY_FROM_EMAIL` (optionnel) : expediteur affiche, sinon `LPS_SMTP_USER`

La fonction utilisee est `/.netlify/functions/notify-admin`.

### Preview CLI (alias fixe `preview`)

Depuis ce dossier `Netlify`. Reference complete : **`../brief-agent-extra-site.md`** (section « Deploiement Netlify »).

```powershell
npx --yes netlify-cli deploy --no-build --dir . --alias preview
```

URL du type : `https://preview--lespointsrebelles.netlify.app`.

### Production CLI

```powershell
npx --yes netlify-cli deploy --no-build --dir . --prod
```

## Workflow recommande

1. Modifier les fichiers du site dans ce dossier.
2. Committer les changements.
3. Pousser sur GitHub.
4. Laisser Netlify redeployer automatiquement.

Pour tester avant merge vers `main`, utiliser la commande preview ci‑dessus avec `--alias preview`.

## Supabase (plan gratuit) : éviter la mise en pause

Le projet Supabase « sleep » après une période sans activité. Attention au critère
exact : Supabase ne demande **pas** « au moins un appel dans les 7 jours » mais
« quelques requêtes base **par jour** sur la semaine écoulée ». Un ping hebdomadaire
écrit bien en base tout en restant classé « low activity » → mail d’avertissement.

Deux planificateurs **indépendants** tapent donc la base plusieurs fois par jour :

| Où | Fréquence (UTC) | Clé | Requêtes |
|----|-----------------|-----|----------|
| `.github/workflows/supabase-keepalive.yml` | 06:19, 12:37, 18:41 | `anon` | insert + select |
| `netlify/functions/supabase-keepalive.js` (planifiée via `netlify.toml`) | 03:23, 15:23 | `service_role` | insert + select + purge > 30 j |

Le doublon n’est pas du zèle : les crons GitHub gratuits sont parfois retardés ou
sautés, et GitHub **désactive automatiquement les workflows planifiés après 60 jours
sans commit** sur le dépôt. Si le site ne bouge pas pendant deux mois, seul le cron
Netlify continue.

La table dédiée `public.keepalive` (insert seul autorisé pour `anon`) vient de
`supabase/migrations/keepalive.sql` — à exécuter une fois dans le SQL editor.
Une écriture est privilégiée à une simple lecture : elle laisse une trace datée,
directement vérifiable dans le Table editor.

**Configuration une fois** (dépôt GitHub → **Settings** → **Secrets and variables**
→ **Actions** → **New repository secret**) :

| Nom du secret        | Valeur |
|---------------------|--------|
| `SUPABASE_URL`      | URL du projet, ex. `https://xxxx.supabase.co` (sans `/` final) |
| `SUPABASE_ANON_KEY` | Clé **anon** / public (Project API keys dans Supabase) |

Côté Netlify, la fonction réutilise `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY`,
déjà définies pour `stand-orders-list` — rien à ajouter.

**Vérifications :**

- GitHub : onglet **Actions** → workflow **Supabase keepalive** → **Run workflow**.
- Netlify : **Logs** → **Functions** → `supabase-keepalive` (les fonctions planifiées
  ne sont pas appelables en HTTP public).
- Supabase : Table editor → `keepalive`, contrôler que `pinged_at` avance chaque jour.

Si tu renommes la table `keepalive` ou retires sa policy `anon` en insertion, mets à
jour l’URL dans le workflow **et** dans la fonction Netlify.

## Organisation des fichiers

- Migrations Supabase: `supabase/migrations/`
- Fonctions Netlify: `netlify/functions/`
- Assets images du site: `images/`
