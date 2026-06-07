$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "=== Lithy PDF Service Starter ===" -ForegroundColor Cyan
Write-Host ""

function Start-Service {
  # Kill any existing instance on port 3001
  $existing = netstat -ano | Select-String ":3001 "
  if ($existing) {
    $pid = ($existing -split '\s+')[-1]
    if ($pid -ne "0") { taskkill /f /pid $pid 2>$null }
    Start-Sleep 1
  }

  # 1. Start PDF service
  Write-Host "[1/3] Starting PDF service on http://localhost:3001..." -ForegroundColor Yellow
  $node = (Get-Command node).Source
  $svr = Join-Path $ScriptDir "server.js"
  $p1 = Start-Process -FilePath $node -ArgumentList "`"$svr`"" -WindowStyle Hidden -PassThru
  Start-Sleep 3

  # Verify
  $ok = $false
  for ($i = 0; $i -lt 5; $i++) {
    try { $r = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { $ok = $true; break } } catch {}
    Start-Sleep 2
  }
  if (-not $ok) { throw "PDF service failed to start" }
  Write-Host "   ✓ Running (PID $($p1.Id))" -ForegroundColor Green

  # 2. Ensure cloudflared
  $cf = (Get-Command cloudflared -ErrorAction SilentlyContinue).Source
  if (-not $cf) {
    Write-Host "[2/3] Downloading cloudflared..." -ForegroundColor Yellow
    $cf = "$env:TEMP\cloudflared.exe"
    Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile $cf -UseBasicParsing
  } else {
    Write-Host "[2/3] Found cloudflared" -ForegroundColor Yellow
  }

  # 3. Start tunnel
  Write-Host "[3/3] Starting Cloudflare Tunnel..." -ForegroundColor Yellow
  $p2 = Start-Process -FilePath $cf -ArgumentList "tunnel --url http://localhost:3001 --no-autoupdate" -WindowStyle Hidden -PassThru
  Start-Sleep 5

  Write-Host ""
  Write-Host "=== TUNNEL RUNNING ===" -ForegroundColor Green
  Write-Host ""
  Write-Host "Check the Cloudflare dashboard or re-run this script" -ForegroundColor White
  Write-Host "in a terminal WITHOUT -WindowStyle Hidden to see the URL:" -ForegroundColor White
  Write-Host "  cloudflared tunnel --url http://localhost:3001 --no-autoupdate" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "Once you have the URL (https://xxx.trycloudflare.com):" -ForegroundColor White
  Write-Host "  1. Go to https://vercel.com/[team]/[project]/settings/environment-variables" -ForegroundColor White
  Write-Host "  2. Add PDF_SERVICE_URL = https://xxx.trycloudflare.com (Production, backend)" -ForegroundColor White
  Write-Host ""
  Write-Host "Press Ctrl+C to stop both services" -ForegroundColor Cyan

  # Keep alive and monitor
  while ($true) {
    $a = (Get-Process -Id $p1.Id -ErrorAction SilentlyContinue) -ne $null
    $b = (Get-Process -Id $p2.Id -ErrorAction SilentlyContinue) -ne $null
    if (-not $a) { Write-Host "`nERROR: PDF service crashed!" -ForegroundColor Red; break }
    if (-not $b) { Write-Host "`nERROR: Tunnel crashed!" -ForegroundColor Red; break }
    Start-Sleep 10
  }
}

try {
  Start-Service
} catch {
  Write-Host "FAILED: $_" -ForegroundColor Red
  Read-Host "Press Enter to exit"
}
