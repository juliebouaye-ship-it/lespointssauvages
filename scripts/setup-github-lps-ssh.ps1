#Requires -Version 5.1
# Cree %USERPROFILE%\.ssh si besoin et indique quoi copier pour que git push fonctionne.
$sshDir = Join-Path $env:USERPROFILE ".ssh"
$keyLps = Join-Path $sshDir "id_ed25519_lps"
$keyStd = Join-Path $sshDir "id_ed25519"

Write-Host "Dossier SSH : $sshDir"
if (-not (Test-Path $sshDir)) {
  New-Item -ItemType Directory -Path $sshDir -Force | Out-Null
  Write-Host "Dossier .ssh cree." -ForegroundColor Green
}

$hasLps = Test-Path $keyLps
$hasStd = Test-Path $keyStd
Write-Host "Cle id_ed25519_lps : $(if ($hasLps) { 'OK' } else { 'absente' })"
Write-Host "Cle id_ed25519     : $(if ($hasStd) { 'OK' } else { 'absente' })"

if (-not $hasLps -and -not $hasStd) {
  Write-Host "`nAucune cle trouvee. Copiez votre cle PRIVEE (sans .pub) vers :" -ForegroundColor Yellow
  Write-Host "  $keyLps"
  Write-Host "  ou"
  Write-Host "  $keyStd"
  Write-Host "`nPuis relancez ce script ou faites : git push" -ForegroundColor Yellow
  exit 1
}

Write-Host "`nOK — Git utilisera .git-ssh/config dans le depot (Host github-lps)." -ForegroundColor Green
Write-Host "Test : cd vers le dossier Netlify du depot, puis : git ls-remote origin"
