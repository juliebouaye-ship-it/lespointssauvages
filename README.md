# Les Points Sauvages

Site vitrine statique de **Les Points Sauvages**.

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

### Preview CLI (alias fixe `preview`)

Depuis ce dossier `Netlify`. Reference complete : **`../brief-agent-extra-site.md`** (section « Deploiement Netlify »).

```powershell
npx --yes netlify-cli deploy --no-build --dir . --alias preview
```

URL du type : `https://preview--lespointssauvages.netlify.app`.

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
