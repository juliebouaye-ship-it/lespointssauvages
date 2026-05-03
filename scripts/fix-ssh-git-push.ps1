#Requires -Version 5.1
<#
  Diagnostique les chemins IdentityFile dans ~/.ssh/config et les repare si la
  cle existe ailleurs (ex. deplacee hors OneDrive, renommage de dossier).
  Usage (PowerShell) :
    cd "C:\Users\julie\OneDrive\Documents\LPS\Netlify"   # ou la racine du depot Git
    powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\fix-ssh-git-push.ps1

  Si la cle est introuvable : basculer le remote en HTTPS (instructions en fin de script).
#>
param(
  [string]$RepoPath = ""
)

$ErrorActionPreference = "Continue"
function Write-Step([string]$m) { Write-Host "`n=== $m ===" -ForegroundColor Cyan }

$sshDir = Join-Path $env:USERPROFILE ".ssh"
$configPath = Join-Path $sshDir "config"

if ($RepoPath -eq "") { $RepoPath = (Get-Location).Path }

Write-Step "Contexte"
Write-Host "USERPROFILE : $env:USERPROFILE"
Write-Host "Depot teste : $RepoPath"
Write-Host "SSH config  : $configPath"

if (-not (Test-Path $configPath)) {
  Write-Host "`nAucun fichier config SSH. Cree $configPath ou utilise HTTPS (voir fin)." -ForegroundColor Yellow
  exit 1
}

function Find-KeyFile([string]$leaf) {
  $found = @()
  if (Test-Path $sshDir) {
    $p = Join-Path $sshDir $leaf
    if (Test-Path $p) { $found += (Resolve-Path $p).Path }
  }
  $searchRoots = @(
    (Join-Path $env:USERPROFILE "OneDrive"),
    (Join-Path $env:USERPROFILE "OneDrive\Documents"),
    (Join-Path $env:USERPROFILE "OneDrive - Perso"),
    (Join-Path $env:USERPROFILE "OneDrive - Personal")
  ) | Where-Object { Test-Path $_ }

  foreach ($root in $searchRoots) {
    try {
      Get-ChildItem -LiteralPath $root -Recurse -Depth 6 -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -eq $leaf } |
        ForEach-Object { $found += $_.FullName }
    } catch {}
  }
  return $found | Select-Object -Unique
}

Write-Step "Verification des IdentityFile"
$configLines = Get-Content -LiteralPath $configPath
$fixes = @()
$i = 0
foreach ($line in $configLines) {
  $i++
  if ($line -match '^\s*IdentityFile\s+(.+?)\s*$') {
    $raw = $Matches[1].Trim().Trim('"').Trim("'")
    $expanded = [Environment]::ExpandEnvironmentVariables($raw)
    $ok = Test-Path -LiteralPath $expanded
    Write-Host ("L{0}: {1}" -f $i, $line.TrimEnd())
    if ($ok) {
      Write-Host "  -> OK (accessible)" -ForegroundColor Green
    } else {
      Write-Host "  -> INACCESSIBLE" -ForegroundColor Red
      $leaf = Split-Path -Leaf $expanded
      $cands = Find-KeyFile $leaf
      if ($cands.Count -eq 1) {
        $fixes += [pscustomobject]@{ Old = $raw; New = $cands[0]; LineNum = $i }
        Write-Host "  -> Cle retrouvee : $($cands[0])" -ForegroundColor Yellow
      } elseif ($cands.Count -gt 1) {
        Write-Host "  -> Plusieurs fichiers nommes '$leaf' ; corrigez a la main :" -ForegroundColor Yellow
        $cands | ForEach-Object { Write-Host "     $_" }
      } else {
        Write-Host "  -> Aucun fichier '$leaf' trouve sous .ssh / OneDrive (profondeur limitee)." -ForegroundColor Yellow
        Write-Host "     Si la cle est ailleurs, deplacez-la vers $sshDir et mettez a jour config." -ForegroundColor Yellow
      }
    }
  }
}

if ($fixes.Count -gt 0) {
  Write-Step "Sauvegarde et correction"
  $bak = "$configPath.bak." + (Get-Date -Format "yyyyMMdd-HHmmss")
  Copy-Item -LiteralPath $configPath -Destination $bak -Force
  Write-Host "Copie : $bak"

  $newContent = Get-Content -LiteralPath $configPath -Raw
  foreach ($f in $fixes) {
    # Remplacement prudent : chemin tel qu'ecrit dans le fichier
    $oldEsc = [regex]::Escape($f.Old)
    $newContent = $newContent -replace $oldEsc, $f.New
  }
  Set-Content -LiteralPath $configPath -Value $newContent -Encoding utf8
  Write-Host "config mis a jour." -ForegroundColor Green
} else {
  Write-Host "`nAucune correction automatique appliquee." -ForegroundColor DarkGray
}

Write-Step "Remote Git (si depot)"
Push-Location $RepoPath
try {
  $remote = git remote get-url origin 2>$null
  if ($LASTEXITCODE -eq 0) { Write-Host "origin : $remote" } else { Write-Host "Pas de remote 'origin' ici." }
} finally {
  Pop-Location
}

Write-Step "Prochaine etape"
Write-Host "1) Tester : ssh -T git@github.com   (ou l'hote indique dans votre config Host)"
Write-Host "2) Si la cle est sur OneDrive : clic droit sur le fichier -> 'Toujours conserver sur cet appareil'"
Write-Host "3) HTTPS (push sans cle SSH) dans le dossier du depot :"
Write-Host "   git remote set-url origin https://github.com/VOTRE_USER/VOTRE_DEPOT.git"
Write-Host "   Puis git push (ouverture navigateur / gestionnaire d'identification Windows)"
