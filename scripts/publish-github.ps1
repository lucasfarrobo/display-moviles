# Publica display-moviles en GitHub (requiere: gh auth login previo)
$ErrorActionPreference = "Stop"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

gh auth status
if ($LASTEXITCODE -ne 0) {
  Write-Host "Primero ejecutá: gh auth login"
  exit 1
}

Set-Location $PSScriptRoot\..

if (-not (git rev-parse --verify HEAD 2>$null)) {
  git add .
  git commit -m "Add display de moviles dashboard and Google Sheets API"
}

git branch -M main

gh repo create display-moviles --public --source=. --remote=origin --push --description "Dashboard de estado de moviles desde Google Sheets"

Write-Host "Listo: https://github.com/$(gh api user -q .login)/display-moviles"
