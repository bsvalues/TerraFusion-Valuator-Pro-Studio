# Setup git hooks to use repository .githooks folder
# Run this once per clone: `.	ools\setup-githooks.ps1` or `powershell -ExecutionPolicy Bypass -File scripts/setup-githooks.ps1`

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $repoRoot

Write-Host "Setting git core.hooksPath to .githooks"
git config core.hooksPath .githooks

if ($?) {
    Write-Host "Hooks configured. To enable scripts on Windows, ensure PowerShell execution policy allows running these scripts or run commits with --no-verify to skip." -ForegroundColor Green
} else {
    Write-Host "Failed to set hooksPath. You can run: git config core.hooksPath .githooks" -ForegroundColor Red
}
