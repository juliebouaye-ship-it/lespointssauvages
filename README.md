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

## Organisation des fichiers

- Migrations Supabase: `supabase/migrations/`
- Fonctions Netlify: `netlify/functions/`
- Assets images du site: `images/`
