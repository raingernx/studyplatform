# Krukraft — Features and Functionality

## Core Marketplace Features

### Marketplace UX

- Discover feed with curated sections when `/resources` is in discover mode
- Category and tag filtering
- Canonical marketplace search routed through `/resources?search=...`
- Debounced live search suggestions with direct-to-detail selection
- No-result recovery with alternate queries plus category/tag browse links
- Public creator pages
- Resource detail page with gallery, purchase rail, reviews, related content, and creator context
- Library-style ownership states in marketplace/detail surfaces

### Upload / Admin Resource Flow

- Admin resource create/edit flows
- Preview image uploads and live preview states
- Version history browsing for resources
- Review moderation and platform settings

### Purchase → Download Flow

- Checkout flow with Stripe and Xendit
- Free-resource checkout path
- Purchase record creation and state transitions
- Protected download access after ownership is confirmed

## Discover Sections

The marketplace discover page currently centers around these public sections:

1. Trending resources
2. Popular resources
3. Newest resources
4. Featured resources
5. Free resources
6. Top creator / creator spotlight content

The discover page now mixes:
- streamed server sections
- warmed cache variants
- lighter-weight fallbacks that match the final section intent
- a lazy personalized client section so signed-in recommendation UI is not part of the initial `/resources` client payload
- a route-level loading shell that mirrors the live discover shape:
  - lavender hero stage with the same split-banner footprint as the live route
  - section header + resource-card skeletons
  - no extra discover-meta strip above the hero while loading
- the shared secondary controls row is now mode-agnostic at the component
  boundary: route mode still decides whether `/resources` is discover or
  listing, but `ResourcesCatalogControls` and its skeleton no longer receive
  prop hints such as active-filter counts or discover-meta toggles just to
  differentiate those two shells

## Sorting Options

Standard public sort menu:

1. Trending
2. Newest
3. Most downloaded
4. Price: Low → High
5. Price: High → Low

Search behavior notes:
- `/resources` defaults to relevance / best-match sorting when a search query is present
- selecting a suggestion opens the resource detail directly
- pressing Enter or using the dropdown footer routes to the canonical marketplace results page
- no-result flows recover on the same marketplace route instead of bouncing to ad-hoc pages
- the full `HeroSearch` client bundle is now treated as critical only on the main marketplace route; secondary public routes such as support, category, creator, membership, and resource-detail pages lazy-load the navbar search and show the structural search shell first

Behavior notes:
- `/resources` default vs experiment treatment can vary with the ranking experiment cookie
- `/categories/[slug]` currently presents a newest-first curated listing

## Filtering

- Category filter
- Price filter
- Tags filter
- Search text
- Sort by

The marketplace route switches from discover mode into listing mode whenever
search, filters, pagination, or a non-default sort are active.

## Admin Features

- Analytics and activity views
- Resource moderation / trash / bulk operations
- Category and tag management
- Review moderation
- User and order management
- Platform settings including brand assets
- Admin audit/history tables now keep pagination outside the table element itself so browser verification does not hit hydration mismatches from invalid `<table>` descendants

Marketplace hero note:
- `/resources` discover hero is currently a fixed repo-owned design surface
- legacy admin hero management, hero analytics, and hero impression/click endpoints are no longer part of the active app surface

Platform settings notes:
- Full, full-dark, icon, icon-dark, OG, email, and favicon assets can be edited independently
- Admin previews may show inherited fallback assets, but stored values must remain distinct from inherited preview state
- Public metadata and tab/icon surfaces now read brand assets through runtime `/brand-assets/*` routes so uploads propagate without falling back to stale build-time defaults
- Dark theme navigation and auth surfaces can now use dedicated dark logos rather than reusing the light assets
- Navigation branding now renders the active theme-specific uploaded logo directly and only falls back to the repo-owned asset if that upload fails, which avoids refresh-time position jumps caused by swapping between different logo artboards
- The navbar brand is now intentionally stricter than other branding surfaces: it uses the repo-owned local light/dark logo pair so the first visible chrome stays stable on hard refreshes instead of waiting on uploaded remote assets
- The marketplace navbar Suspense fallback now reserves both the top-row chrome and the category-row height so refreshes do not collapse to a shorter header before the live navbar mounts
- If no dedicated dark logo is stored, dark-theme runtime branding now stays on the repo-owned dark fallback instead of resolving back to the uploaded light logo after refresh
- The repo-owned fallback asset set is now centered on `public/brand/*`; legacy `public/logo/*` exports are no longer treated as the canonical fallback source

## Payment Flow

### Providers

1. Stripe
2. Xendit

### Purchase Flow

```
Resource detail page
  → purchase / free access CTA
  → checkout (Stripe or Xendit)
  → success redirect
  → confirmation page
  → purchase record created in DB
  → library/download access unlocked
```

### Webhook Handling

- Stripe webhook handler
- Xendit webhook handler
- Purchase state is confirmed via webhook, not just redirect

## Account Recovery / Verification

- Password reset request + confirm flow
- Email verification flow (soft verification approach)
- Credentials + Google login
- Theme selection still supports `light`, `dark`, and `system`, but new/no-preference users now start from `light` by default and newly created `UserPreference` rows now seed `light` at the data layer too
- canonical seeded/local admin identity now uses `admin@krukraft.dev`

## Secure Download Endpoint

- Route: `/api/download/[resourceId]`
- Checks ownership via purchase record
- Generates protected access to the file
- Includes logging and guarded error handling
- Does not expose private storage directly without verification
- Branded allowlist examples now assume `files.krukraft.com` for custom R2/public delivery hosts

---

*Refreshed against the repo state on 2026-04-05.*
