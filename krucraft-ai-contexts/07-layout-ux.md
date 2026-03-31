# KruCraft — Layout System and UX

> Layout/UX reference. Validate marketplace/detail/admin behavior against the
> current app tree before assuming every section here still matches production.

## Global Container

```tsx
// src/components/layout/container.tsx
<div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
  {children}
</div>
```

## Layout Rules

- **Marketplace pages:** Full-width background sections, content inside Container
- **Dashboard pages:** Same Container as marketplace
- **Admin pages:** Same Container, identical layout rules
- **Hero section:** Full-width background, inner content inside Container with `max-w-2xl` for text

## Responsive Breakpoints (Tailwind standard)

| Breakpoint | Width |
|-----------|-------|
| Mobile | base |
| Tablet | sm (640px), md (768px) |
| Desktop | lg (1024px), xl (1280px), 2xl (1536px) |

## Grid Scaling

```css
/* Resource grid on large screens */
grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6
/* Or preferred adaptive: */
[grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]
```

## Max-Width Philosophy

- **1600px** = sweet spot for marketplace with many cards
- Never let headline text span full 1600px — wrap with `max-w-2xl` or `max-w-3xl`
- Card grid fills space naturally via `auto-fill + minmax`
- Section padding: `py-16` standard, hero `py-20`

---

## Page Layouts

### /resources (Main Marketplace / Discover)

- Primary public page — functions as the homepage
- Contains discovery sections + filtered listing
- Hero banner at top
- Category quick links
- Search and filter sidebar
- Featured resource card
- Resource grid with cards
- Recommendation sections

**Layout settings:**
- Max-width: `max-w-[1600px]`
- Grid: `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`
- Gap: `gap-6` to `gap-8`
- Hero: full-width background, content inside `max-w-[1600px]` container
- Typography: headings and paragraphs wrapped with `max-w-2xl` or `max-w-3xl`

### /resources/[slug] (Resource Detail)

Three-column layout:

```
max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8
  ↳ breadcrumb
  ↳ title / metadata
  ↳ main grid: [auto_minmax(0,1fr)_380px]
      left: thumbnail rail (fixed)
      center: preview area (max-w-[1100px])
      right: purchase sidebar (380px fixed)
```

- Breadcrumb navigation
- Full-screen preview capability
- Purchase options
- Related resources section
- Reviews section

### /library (User Library)

- Shows purchased/owned resources
- Cards have consistent action button alignment (fixed with `h-full flex flex-col` + `mt-auto`)
- Action buttons: Download, Preview, Open
- Filter and sort options

### /dashboard (User Dashboard)

- Per-user dynamic rendering
- Purchases section
- Download history
- Learning profile
- Creator access state

---

## Admin Dashboard Layout

```
Sidebar:
  - Dashboard
  - Resources
  - Creators
  - Users
  - Sales
  - Analytics
  - Payouts
  - Settings

Main Content:
  - Top Bar
  - Metrics Cards (4 cols)
  - Revenue Chart (col-span-8)
  - Activity Timeline
  - Resource Performance
  - Creator Earnings
  - Recent Sales
```

---

*Extracted from Claude conversation exports (conversations-008.json) dated 2026-03-29.*
