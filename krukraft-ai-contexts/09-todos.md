# Krukraft — Current TODOs and Audit Scope

## Current Priority TODOs

- [ ] Replace `XENDIT_SECRET_KEY` test key in production environment
- [ ] Verify `DIRECT_URL` is present and correct for Prisma CLI / migration workflows in production
- [ ] Keep tuning ranked-search query plans and decide whether Postgres-backed relevance is still sufficient before introducing a separate search engine
- [ ] Keep post-deploy warm targets aligned with perf smoke and browser verification coverage
- [ ] Re-run perf measurements after major listing/detail/search changes and update thresholds intentionally
- [ ] Continue refining detail-page CTA/trust/review timing if new regressions appear
- [ ] Recheck preview/production LCP after major marketplace image or layout changes; local dev reruns on 2026-04-02 stopped reproducing the old Next `loading="eager"` advice, but dev-mode LHCI is still not production truth
- [ ] Verify uploaded favicon and OG logo changes propagate correctly through `/brand-assets/*` in production browsers and social crawlers
- [ ] Recheck that the trimmed repo-owned fallback asset set (`public/brand/*` without legacy `public/logo/*`) still covers every favicon / metadata surface that should remain first-party
- [ ] Recheck production refresh behavior after the latest navbar fallback-height and logo-flicker fixes to confirm the remaining brand chrome feels visually stable on cold loads
- [ ] Finish route-family fallback cleanup on public routes so hard refreshes on `/resources` and other public pages stay inside family-specific or neutral shells without route-agnostic navbar/page chrome reading as another page

## Product / UX Follow-Ups

- [ ] Keep discover fallbacks aligned with final section intent; avoid misleading placeholder destinations
- [ ] Audit live search, filter/sidebar fallbacks, and creator-profile fallbacks for usable-but-consistent loading states
- [ ] Verify dashboard/admin hard refreshes no longer show the global app-root fallback before their family loading shells under repeated refresh stress
- [ ] Pilot `boneyard-js` on one high-value flow before considering wider skeleton replacement; keep route-level loading/error/empty-state contracts explicit even if DOM-captured bones are adopted
- [ ] Keep Playwright search smoke aligned with real canonical submit flows as marketplace search UX evolves
- [ ] Re-audit brand asset previews if legacy stored values from earlier fallback behavior still exist in the database

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

*Refreshed against the repo state on 2026-04-05.*
