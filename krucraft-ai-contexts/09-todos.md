# KruCraft — Current TODOs and Audit Scope

## Current Priority TODOs

- [ ] Replace `XENDIT_SECRET_KEY` test key in production environment
- [ ] Verify `DIRECT_URL` is present and correct for Prisma CLI / migration workflows in production
- [ ] Add DB indexing / tuning for search (`pg_trgm`) and other high-value filter paths
- [ ] Keep post-deploy warm targets aligned with perf smoke coverage
- [ ] Re-run perf measurements after major listing/detail changes and update thresholds intentionally
- [ ] Continue refining detail-page CTA/trust/review timing if new regressions appear

## Product / UX Follow-Ups

- [ ] Keep discover fallbacks aligned with final section intent; avoid misleading placeholder destinations
- [ ] Audit live search, filter/sidebar fallbacks, and creator-profile fallbacks for usable-but-consistent loading states
- [ ] Verify brand asset changes against admin settings and production cache behavior after logo updates

## Audit Scope (Useful Ongoing Areas)

- `src/app/resources`
- `src/app/categories`
- `src/app/creators`
- `src/app/dashboard`
- `src/app/admin`
- `src/app/api`
- `src/components`
- `src/services`
- `src/repositories`
- `prisma/schema.prisma`

## Audit Scope (Topics)

- Payment config and webhook correctness
- Upload and storage flows
- Search / filter / category / recommendation behavior
- RSC streaming performance and cache consistency
- Admin settings / platform branding / build-safe config boundaries
- Security boundaries: auth guards, admin routes, internal warm routes
- Deployment workflow: build vs migrate separation, warm-cache coverage, perf thresholds

---

*Refreshed against the repo state on 2026-03-31.*
