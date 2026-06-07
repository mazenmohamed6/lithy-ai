param(
  [string]$PdfServiceDir = $PSScriptRoot
)

$ErrorActionPreference = "Stop"

Write-Host "=== Starting Lithy PDF Service ===" -ForegroundColor Cyan

# 1. Start the PDF service
$nodeExe = (Get-Command node).Source
$serverPath = Join-Path $PdfServiceDir "server.js"
Write-Host "[1/3] Starting PDF service on port 3001..." -ForegroundColor Yellow
$pdfProcess = Start-Process -FilePath $nodeExe -ArgumentList "`"$serverPath`"" -WindowStyle Hidden -PassThru
Start-Sleep -Seconds 3

# Verify PDF service is running
$ok = $false
for ($i = 0; $i -lt 5; $i++) {
  try {
    $r = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 3
    if ($r.StatusCode -eq 200) { $ok = $true; break }
  } catch {}
  Start-Sleep -Seconds 2
}
if (-not $ok) { Write-Host "FAILED: PDF service not responding" -ForegroundColor Red; exit 1 }
Write-Host "  ✓ PDF service running (PID $($pdfProcess.Id))" -ForegroundColor Green

# 2. Install Cloudflare Tunnel if not present
$cfBin = (Get-Command cloudflared -ErrorAction SilentlyContinue).Source
if (-not $cfBin) {
  Write-Host "[2/3] Installing cloudflared..." -ForegroundColor Yellow
  Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile "$env:TEMP\cloudflared.exe" -UseBasicParsing
  $cfBin = "$env:TEMP\cloudflared.exe"
} else {
  Write-Host "[2/3] cloudflared found at $cfBin" -ForegroundColor Yellow
}

# 3. Start Cloudflare Tunnel
Write-Host "[3/3] Starting Cloudflare Tunnel..." -ForegroundColor Yellow
$cfProcess = Start-Process -FilePath $cfBin -ArgumentList "tunnel --url http://localhost:3001 --no-autoupdate" -WindowStyle Hidden -PassThru
Start-Sleep -Seconds 8

# Get the tunnel URL by reading its output
# (cloudflared logs to stdout; we can't capture from a Hidden process easily)
Write-Host ""
Write-Host "=== IMPORTANT ===" -ForegroundColor Cyan
Write-Host "The tunnel is running. To find its URL, check the Cloudflare Tunnel dashboard or" -ForegroundColor White
Write-Host "run this command in another terminal to see the tunnel output:" -ForegroundColor White
Write-Host "  taskkill /f /pid $($cfProcess.Id) 2>nul; cloudflared tunnel --url http://localhost:3001" -ForegroundColor Yellow
Write-Host ""
Write-Host "Once you have the tunnel URL (e.g. https://xxx.trycloudflare.com):" -ForegroundColor White
Write-Host "  1. Go to https://vercel.com/YOUR_PROJECT/settings/environment-variables" -ForegroundColor White
Write-Host "  2. Add PDF_SERVICE_URL = <tunnel-url>" -ForegroundColor White
Write-Host ""
Write-Host "To stop services:" -ForegroundColor Cyan
Write-Host "  Stop-Process -Id $($pdfProcess.Id) -Force; Stop-Process -Id $($cfProcess.Id) -Force" -ForegroundColor Yellow
Write-Host ""

# Keep running so the tunnel stays alive
while ($true) {
  $pAlive = (Get-Process -Id $pdfProcess.Id -ErrorAction SilentlyContinue) -ne $null
  $cAlive = (Get-Process -Id $cfProcess.Id -ErrorAction SilentlyContinue) -ne $null
  if (-not $pAlive) { Write-Host "PDF service crashed!" -ForegroundColor Red; break }
  if (-not $cAlive) { Write-Host "Cloudflare Tunnel crashed!" -ForegroundColor Red; break }
  Start-Sleep -Seconds 30
}
