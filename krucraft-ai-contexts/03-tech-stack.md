# KruCraft — Tech Stack

## Stack Overview

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 App Router |
| Language | TypeScript |
| UI Library | React 18 |
| Styling | Tailwind CSS |
| Components | Repo design system + selected Radix/shadcn foundations |
| Authentication | NextAuth |
| ORM | Prisma |
| Database | PostgreSQL |
| Payment (Primary) | Stripe |
| Payment (Secondary) | Xendit |
| File Storage | Cloudflare R2 |
| Caching | Upstash Redis + `unstable_cache` + `runSingleFlight` |
| Deployment | Vercel |
| Analytics | Vercel Analytics + Vercel Speed Insights |
| Icons | lucide-react |

## Runtime / Tooling Notes

- `build`: `prisma generate && next build --webpack`
- `typecheck`: `tsc -p tsconfig.typecheck.json --noEmit`
- `lint`: scoped ESLint run that does not depend on `.next` artifacts
- `db:deploy`: `prisma migrate deploy`
- `perf:post-deploy`: warm cache + smoke perf suite

Important: build must stay schema-mutation-free. Migration deploy is a separate operational step.

## Analytics / Observability

- Vercel Analytics via `@vercel/analytics`
- Vercel Speed Insights via `@vercel/speed-insights`
- Custom server-side performance tracing utilities live under `src/lib/performance/*`

## File Storage Pattern

| Use case | Method |
|---------|--------|
| Public preview image | public R2/CDN URL, often bypassing `/_next/image` for faster delivery |
| Paid/private file | protected route: `/api/download/[resourceId]` |
| Secure file delivery | purchase/ownership check → guarded access / signed URL flow |

## Environment Variables (Core)

```
DATABASE_URL
DIRECT_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRO_MONTHLY_PRICE_ID
STRIPE_PRO_ANNUAL_PRICE_ID
XENDIT_SECRET_KEY
XENDIT_WEBHOOK_TOKEN
R2_ENDPOINT
R2_BUCKET
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

## Environment Variable Notes

- `DATABASE_URL` is the app runtime DB connection.
- `DIRECT_URL` is still required operationally for Prisma CLI / migration workflows because `prisma/schema.prisma` declares `directUrl`.
- `RESEND_API_KEY` + `EMAIL_FROM` are needed for verify-email / reset-password mail delivery.
- `PERFORMANCE_WARM_SECRET` is used by internal warm routes and post-deploy perf jobs.
- Current production warning: `XENDIT_SECRET_KEY` is still a test key.

---

*Refreshed against the repo state on 2026-03-31.*
