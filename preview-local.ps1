param(
    [ValidateSet("netlify", "simple")]
    [string]$Mode = "netlify",
    [int]$Port = 8888
)

if ($Mode -eq "netlify") {
    Write-Host "Starting Netlify local preview on port $Port..."
    netlify dev --port $Port
}
else {
    Write-Host "Starting simple HTTP preview on port $Port..."
    npx --yes serve . -l $Port
}
