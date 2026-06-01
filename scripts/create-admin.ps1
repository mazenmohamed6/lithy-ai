# LITHY AI — Create Admin User
# Run this to promote a user to Admin role.
#
# Usage:
#   1. First sign up at http://localhost:3000/signup
#   2. Run this script with your email:
#      .\scripts\create-admin.ps1 -Email "your@email.com"
#
# Or run without args to see instructions:
#      .\scripts\create-admin.ps1

param([string]$Email = "")

if (-not $Email) {
    Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  LITHY AI — Create Admin User" -ForegroundColor Cyan
    Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Usage:" -ForegroundColor Yellow
    Write-Host "    .\scripts\create-admin.ps1 -Email ""your@email.com"""
    Write-Host ""
    Write-Host "  Or via Supabase SQL Editor directly:" -ForegroundColor Yellow
    Write-Host "    1. Open https://supabase.com/dashboard/project/pobeisftgpkbgpnspser" -ForegroundColor White
    Write-Host "    2. Go to SQL Editor" -ForegroundColor White
    Write-Host '    3. Run: UPDATE "user" SET role = '"'ADMIN'"' WHERE email = '"'your@email.com'"';' -ForegroundColor White
    Write-Host ""
    Write-Host "  To see all users in the database:" -ForegroundColor Yellow
    Write-Host '    SELECT id, email, role, "emailVerified" FROM "user";' -ForegroundColor White
    Write-Host "══════════════════════════════════════════════════════" -ForegroundColor Cyan
    exit
}

Write-Host "Promoting $Email to ADMIN..." -ForegroundColor Yellow

# Try using Prisma directly
Set-Location -LiteralPath "C:\opencode\lithy-ai\backend"

# Create a temporary script
$script = @"
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({ where: { email: '$Email' } });
  if (!user) {
    console.log('User not found. Sign up first at http://localhost:3000/signup');
    process.exit(1);
  }
  await prisma.user.update({ where: { email: '$Email' }, data: { role: 'ADMIN' } });
  console.log('User promoted to ADMIN successfully!');
  console.log('Email:', user.email);
  console.log('Role: ADMIN');
  console.log('');
  console.log('Access admin panel at: http://localhost:3000/admin');
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.\$disconnect());
"@

$script | npx ts-node - 2>&1

if ($?) {
    Write-Host ""
    Write-Host "Now log in at http://localhost:3000/login and visit http://localhost:3000/admin"
}
