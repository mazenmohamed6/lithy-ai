# LITHY AI — AI-Powered Resume Builder SaaS

A production-grade SaaS application for building AI-powered resumes, cover letters, LinkedIn profile optimization, ATS scoring, and job match analysis.

## Tech Stack

- **Frontend:** Next.js 14 (React), Tailwind CSS v4, shadcn/ui, Supabase Auth
- **Backend:** NestJS, Prisma ORM, PostgreSQL
- **Payments:** Stripe
- **AI:** OpenAI GPT-4o
- **Email:** Resend
- **Analytics:** PostHog
- **Storage:** Supabase Storage
- **OCR:** Google Cloud Vision
- **Hosting:** Vercel + Railway (or self-hosted)

## Getting Started

### Prerequisites

- Node.js >= 18
- PostgreSQL database
- Supabase project
- Stripe account
- OpenAI API key

### Installation

```bash
# Clone and install
cd lithy-ai
npm install

# Set up backend .env
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

# Set up frontend .env
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local with your credentials

# Initialize database
npm run db:generate
npm run db:push
npm run db:seed

# Run development servers
npm run dev
```

Frontend runs on http://localhost:3000
Backend runs on http://localhost:4000
API docs at http://localhost:4000/api/docs

## Project Structure

```
lithy-ai/
├── frontend/          # Next.js 14 App Router
│   ├── src/
│   │   ├── app/       # Route groups: (auth), (dashboard), (marketing), (legal), (admin)
│   │   ├── components/# UI, layout, forms, resume, landing components
│   │   ├── lib/       # Supabase client, API client, utils, constants
│   │   ├── providers/ # Theme, Supabase context providers
│   │   └── hooks/     # Custom React hooks
│   └── ...
├── backend/           # NestJS API
│   ├── src/
│   │   ├── auth/      # Authentication (Supabase + OAuth)
│   │   ├── users/     # User profiles and management
│   │   ├── resumes/   # Resume CRUD and versioning
│   │   ├── ai/        # OpenAI integration for generation
│   │   ├── payments/  # Stripe subscriptions + webhooks
│   │   ├── subscriptions/ # Plan management
│   │   ├── ats/       # ATS score analysis
│   │   ├── job-match/ # Job match analysis
│   │   ├── linkedin/  # LinkedIn optimizer
│   │   ├── cover-letters/ # Cover letter management
│   │   ├── admin/     # Admin dashboard
│   │   ├── email/     # Resend email service
│   │   └── storage/   # Supabase Storage
│   ├── prisma/        # Schema + migrations + seed
│   └── ...
└── packages/shared/   # Shared TypeScript types and utilities
```

## Subscription Plans

| Feature | Free | Pro (75 EGP/mo) | Premium (150 EGP/mo) |
|---------|------|------------------|----------------------|
| Resumes | 3 | 10/mo | Unlimited |
| AI Generations | 0 | 10/mo | Unlimited |
| ATS Scans | 0 | 5/mo | Unlimited |
| Job Match | 0 | 5/mo | Unlimited |
| LinkedIn Optimizer | ✗ | ✗ | ✓ |
| Templates | Basic | Premium | Premium |
| PDF Export | Branded | Clean | White-label |
| Analytics | ✗ | ✗ | ✓ |
| Priority Support | ✗ | ✗ | ✓ |

## API Endpoints

**Authentication:** POST /api/v1/auth/signup, POST /api/v1/auth/signin, GET /api/v1/auth/oauth/:provider
**Users:** GET/PUT /api/v1/users/me, /profile, /usage, /sessions, /export
**Resumes:** CRUD /api/v1/resumes, /:id/toggle-public, /:id/duplicate
**AI:** POST /api/v1/ai/generate-resume, /improve-resume, /cover-letter, /analyze-ats, /analyze-job-match, /optimize-linkedin
**Payments:** POST /api/v1/payments/create-checkout, /addon-checkout, /customer-portal, /webhook
**Admin:** GET /api/v1/admin/users, /revenue, /ai-metrics, /logs, /feature-flags, /blog

## License

Private — All rights reserved.
