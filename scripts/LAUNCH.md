# LITHY AI — Pre-Launch Checklist

## Phase 1: Local Verification
- [ ] Run `scripts\start-all.bat` (builds frontend, starts backend + frontend + Stripe)
- [ ] Visit http://localhost:3000 — CSS should load (check `/logo.svg` and layout)
- [ ] Visit http://localhost:4000/api/v1/subscriptions/plans — should return 5 plans
- [ ] Visit http://localhost:4000/api/docs — Swagger UI should load
- [ ] Sign up at http://localhost:3000/signup
- [ ] Run `scripts\create-admin.ps1 -Email "your@email.com"` to become admin
- [ ] Visit http://localhost:3000/admin — admin panel should load

## Phase 2: OAuth Setup
Follow `scripts\SETUP-OAUTH.md` to enable:
- [ ] Google OAuth in Supabase Dashboard
- [ ] GitHub OAuth in Supabase Dashboard
- [ ] LinkedIn OAuth in Supabase Dashboard
- [ ] Apple OAuth in Supabase Dashboard

Supabase project: `pobeisftgpkbgpnspser`
Dashboard: https://supabase.com/dashboard/project/pobeisftgpkbgpnspser

## Phase 3: Production Deployment
- [ ] **Replace Stripe keys** in `backend/.env`:
  - `STRIPE_SECRET_KEY` — production secret key
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — production publishable key
  - `STRIPE_WEBHOOK_SECRET` — new webhook secret from Stripe Dashboard
- [ ] **Update Stripe price IDs** in database if prices change
- [ ] **Deploy backend** to Railway or Render:
  - Set all env vars from `backend/.env.example`
  - Ensure PostgreSQL 15+ is available
  - Run `npx prisma migrate deploy`
  - Run `node dist/src/seed.js`
- [ ] **Deploy frontend** to Vercel:
  - Set all env vars from `frontend/.env.example`
  - Build command: `npm run build -w frontend`
  - Output directory: `.next`
- [ ] **Update CORS origins** in `backend/src/main.ts` to production domain
- [ ] **Update site URL** in `frontend/.env` to production domain
- [ ] **Configure Stripe webhook** in Stripe Dashboard → Webhooks:
  - Endpoint: `https://your-api.com/api/v1/payments/webhook`
  - Events: `checkout.session.completed`, `customer.subscription.updated`,
    `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`
- [ ] **Enable email verification** — user must verify email before sign-in
- [ ] **Update Supabase settings**:
  - Site URL → production frontend URL
  - Redirect URLs → include auth callback
  - Email templates → customize sender name/logo

## Phase 4: Final Checks
- [ ] Build passes with 0 errors: `npm run build -w frontend`
- [ ] Backend starts without errors: `node dist/src/main.js`
- [ ] All 44 pages load without 404
- [ ] Auth flow works (signup → verify → signin → session)
- [ ] Admin panel accessible at /admin
- [ ] Stripe checkout flow works end-to-end
- [ ] AI resume generation works (requires Groq key — free at https://console.groq.com)
- [ ] Email sending works (requires Resend key)

## Environment Variables
Required in `backend/.env`:
```
SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
GROQ_API_KEY, GROQ_MODEL (default: llama-3.3-70b-versatile), RESEND_API_KEY
DATABASE_URL
```

Required in `frontend/.env`:
```
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_SITE_URL
```

## Quick Start (Development)
```powershell
cd C:\opencode\lithy-ai
.\scripts\start-all.bat
# Visit http://localhost:3000
# Admin: admin@lithy.ai / Admin123456!
```
