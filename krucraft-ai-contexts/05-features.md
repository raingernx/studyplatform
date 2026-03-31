# KruCraft — Features and Functionality

## Core Marketplace Features

### Marketplace UX

- Discover feed with curated sections
- Category and tag filtering
- Search + live search suggestions
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

## Sorting Options

Standard public sort menu:

1. Trending
2. Newest
3. Most downloaded
4. Price: Low → High
5. Price: High → Low

Behavior notes:
- `/resources` default vs experiment treatment can vary with the ranking experiment cookie
- `/categories/[slug]` currently presents a newest-first curated listing

## Filtering

- Category filter
- Price filter
- Tags filter
- Search text
- Sort by

## Hero CMS System

Admin-manageable hero system includes:

- Featured resource hero
- Search-focus hero
- Collection / category hero
- Promotion / seasonal hero
- Fallback hero
- A/B testing hero behavior
- Admin live preview and hero analytics routes

## Admin Features

- Analytics and activity views
- Hero management
- Resource moderation / trash / bulk operations
- Category and tag management
- Review moderation
- User and order management
- Platform settings including brand assets

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

## Secure Download Endpoint

- Route: `/api/download/[resourceId]`
- Checks ownership via purchase record
- Generates protected access to the file
- Includes logging and guarded error handling
- Does not expose private storage directly without verification

---

*Refreshed against the repo state on 2026-03-31.*
