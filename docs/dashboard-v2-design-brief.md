# Dashboard V2 Design Brief

Status: Draft for isolated prototype
Owner: Dashboard V2 redesign
Scope: Product dashboard, creator workspace, dashboard loading contract

## Objective

Build a new Dashboard V2 for Krukraft without reusing the fragile route/loading
structure that caused duplicated shells and first-entry layout stacking.

Dashboard V2 should start as an isolated prototype and remain disconnected from
production navigation until the shell contract, page inventory, loading states,
and route ownership model are proven.

Initial route:

```txt
/dev/dashboard-v2
```

Do not replace or link production dashboard routes until explicitly approved.

## Master Prompt

Use this prompt when asking a design agent, Impeccable skill, or implementation
agent to plan or critique Dashboard V2.

```txt
Design and plan Dashboard V2 for Krukraft, a SaaS marketplace for digital
learning resources.

The goal is to create a clean, modern, scalable dashboard experience that fixes
the structural problems in the current dashboard. The old dashboard has too many
route families, unclear loading ownership, and duplicated full-shell fallbacks.
Dashboard V2 must have one canonical app shell, content-only route loading, and
page skeletons that match final geometry.

Product context:
- Users browse, purchase, download, and manage digital learning resources.
- Some users are creators who upload resources, track analytics, manage sales,
  and configure creator settings.
- The dashboard must feel useful, calm, fast, and trustworthy. It should avoid
  generic SaaS layouts and avoid purple-gradient AI dashboard cliches.

Core requirements:
- One canonical dashboard shell owns sidebar, topbar, viewport background,
  responsive navigation, and content slot.
- Route pages own page content only.
- Route loading states must never render a second full dashboard shell.
- Suspense fallbacks must be local to the content block they replace.
- Dynamic import loading must be local and small.
- Skeletons must match final content geometry and approximate height.
- Use flat hierarchy with sections, tables, dividers, and subtle surfaces.
- Avoid card-inside-card nesting unless the inner surface has a distinct
  semantic purpose.
- Desktop and mobile must be planned from the start.
- Use the repo design system as the implementation surface. Prefer imports from
  "@/design-system".

Primary areas:
1. User dashboard
2. Creator workspace
3. Shared dashboard shell
4. Loading and skeleton system

Deliverables:
1. Route map
2. Shell contract
3. Loading ownership matrix
4. Page inventory
5. Component inventory
6. Visual direction
7. Build phases
8. Risks inherited from the old dashboard and how V2 avoids them
```

## Design Tool Workflow

Use the tools as references and critique layers, not as production dependencies.

| Tool | Role | Rule |
| --- | --- | --- |
| `awesome-design-md` | Reference design language documents for structure and prompt shape | Use for inspiration only; do not copy another brand identity |
| `shadcn-examples` | Reference interaction/layout patterns | Do not copy components into `src`; rebuild through `@/design-system` |
| `Impeccable` | Critique, audit, polish, typography, color, hierarchy | Use after a first draft exists; do not let it override repo DS rules |

Recommended critique sequence:

```txt
1. Draft static Dashboard V2 page
2. Run critique/audit pass with Impeccable concepts
3. Apply only changes that preserve the shell/loading contract
4. Re-check mobile, skeleton geometry, and route ownership
```

## Product Route Map

Dashboard V2 should be planned as one dashboard product with role-aware
navigation, not separate competing route families.

```txt
/dashboard-v2
/dashboard-v2/library
/dashboard-v2/downloads
/dashboard-v2/purchases
/dashboard-v2/membership
/dashboard-v2/settings
/dashboard-v2/creator
/dashboard-v2/creator/resources
/dashboard-v2/creator/resources/new
/dashboard-v2/creator/resources/[id]
/dashboard-v2/creator/analytics
/dashboard-v2/creator/sales
/dashboard-v2/creator/payouts
/dashboard-v2/creator/profile
/dashboard-v2/creator/settings
```

For the prototype, compress these into a single static dev page with sections or
tabs before creating real route files.

## Navigation Model

Sidebar groups:

```txt
Learn
- Home
- Library
- Downloads
- Purchases

Creator
- Workspace
- Resources
- Analytics
- Sales
- Payouts

Account
- Membership
- Settings

Explore
- Marketplace
```

Desktop:
- Persistent sidebar.
- Topbar with command search, route title context, notifications, account menu.
- Main content scrolls independently only if needed.

Mobile:
- No desktop sidebar.
- Topbar remains compact.
- Navigation opens as a sheet/drawer.
- Primary route actions remain reachable without horizontal overflow.

## Shell Contract

One shell exists for the entire Dashboard V2 family.

Shell owns:
- Sidebar.
- Topbar.
- User identity area.
- Upgrade/membership CTA placement.
- Dashboard background.
- Content max-width and gutter system.
- Mobile navigation.
- Global command/search affordance.

Pages own:
- Page title and description.
- Route-specific metrics.
- Tables, cards, forms, filters, empty states, and error states.
- Local Suspense boundaries for streamed subregions.

Pages must not own:
- A second sidebar.
- A second topbar.
- A full-screen shell skeleton.
- A route-family overlay that visually recreates the app shell.

## Loading Contract

The primary failure mode to avoid is full-shell-on-full-shell rendering.

| Layer | Allowed fallback | Forbidden fallback |
| --- | --- | --- |
| First dashboard entry before shell exists | Full shell skeleton | Final page content skeleton only |
| Route `loading.tsx` inside an existing shell | Content-only page skeleton | Sidebar/topbar/full shell |
| Page Suspense fallback | Local section skeleton | Full page or full shell skeleton |
| Dynamic import loading | Small local placeholder | Full page skeleton |
| Blocking mutation overlay | Local dimmer or button pending state | Navigation shell overlay |

Skeleton rules:
- Structure must match final page geometry.
- Approximate height must be stable.
- Neutral placeholder palette only.
- No brand/accent fills unless status-critical.
- Loading state must be updated with the final UI in the same patch.

## Page Inventory

### User Home

Purpose:
- Give the user a fast answer to "what can I do next?"

Required sections:
- Welcome header.
- Quick stats: owned resources, downloads, purchases, membership.
- Continue learning / recently accessed resources.
- Recent activity.
- Recommended resources.
- Creator entry CTA when relevant.

States:
- Populated.
- New user.
- Loading.
- Error or partial data unavailable.

### Library

Purpose:
- Manage owned resources and quickly reopen/download them.

Required sections:
- Search.
- Filters.
- Owned resource grid/list.
- Resource status chips.
- Empty state with marketplace CTA.

States:
- Populated.
- Empty.
- Filter no-results.
- Loading.
- Error.

### Downloads

Purpose:
- Make protected file access obvious and reliable.

Required sections:
- Summary pill or small stats row.
- Table-first download history.
- Resource/file identity.
- Download status.
- Primary download action.
- Retry/error state near the failed action.

States:
- Populated.
- Empty.
- Loading.
- Protected file error.
- Expired/unavailable file if applicable.

### Purchases

Purpose:
- Show transaction history and access receipts/resources.

Required sections:
- Purchases summary.
- Purchase table.
- Receipt/payment status.
- Linked resource access.

States:
- Populated.
- Empty.
- Loading.
- Payment issue or access mismatch.

### Membership

Purpose:
- Explain current plan and available upgrade path.

Required sections:
- Current plan.
- Benefits.
- Upgrade CTA.
- Billing portal area.
- Unknown/loading account state.

States:
- Free.
- Active.
- Past due/canceled if supported.
- Unknown/loading.

### Settings

Purpose:
- Manage profile, preferences, security, and notifications.

Required sections:
- Profile.
- Account/security.
- Preferences.
- Notifications.
- Danger zone only if real action exists.

Layout rule:
- Use flat sections and dividers. Do not nest repeated cards inside a large card.

## Creator Workspace Inventory

### Creator Overview

Purpose:
- Creator command center.

Required sections:
- KPI summary.
- Revenue/sales/download trend.
- Draft/published resource status.
- Setup checklist.
- Recent creator activity.
- Quick actions.

### Creator Resources

Purpose:
- Manage uploaded resources.

Required sections:
- Status filters.
- Search.
- Table/grid resource management.
- Bulk actions only if supported.
- Empty new-creator state.

Statuses:
- Draft.
- Pending review.
- Published.
- Rejected.
- Archived.

### Creator Upload

Purpose:
- Create or upload a new resource with confidence.

Required sections:
- Stepper.
- Resource metadata.
- File upload.
- Pricing/access settings.
- Preview/review.
- Publish/submit action.

### Creator Analytics

Purpose:
- Explain performance, not just show numbers.

Required sections:
- KPI cards.
- Date range.
- Time-series chart region.
- Top resources.
- Conversion/download insights.

### Creator Sales And Payouts

Purpose:
- Show money state clearly.

Required sections:
- Balance.
- Payout readiness.
- Transactions table.
- Stripe/connect setup state if applicable.

### Creator Profile And Settings

Purpose:
- Manage public creator presence and operational preferences.

Required sections:
- Public profile.
- Storefront copy.
- Support/contact preferences.
- Creator account settings.

## Visual Direction

Recommended direction:

```txt
Editorial workspace for educators, not generic admin SaaS.
Neutral canvas, crisp typography, restrained surfaces, useful density.
Accent should be used sparingly for current navigation, primary actions, and
status emphasis. Resource previews and creator metrics provide the visual
energy, not gradients or glow.
```

Principles:
- Use one dominant action per section.
- Prefer structured tables for operational tasks.
- Prefer image/resource-led cards for learning content.
- Use dividers and spacing before adding more bordered boxes.
- Avoid same-looking `bg-card border rounded-xl` surfaces stacked repeatedly.
- Keep data numbers tabular.
- Keep copy short and direct.

Anti-patterns:
- Full dashboard shell inside route loading.
- Multiple parallel dashboard layouts.
- Sidebar skeleton rendered inside real sidebar.
- Card inside card inside card.
- Purple gradient hero dashboard.
- Empty states with no next action.
- Route-specific custom primitives that duplicate DS components.

## Component Inventory

Prefer existing design-system components first:

```txt
@/design-system
- Button
- Card
- Badge
- Input
- SearchInput
- EmptyState
- Pagination
- PriceBadge
- PriceLabel
- SectionHeader
- Container
- PageSection
- Sidebar
- LoadingSkeleton
```

Likely new Dashboard V2 domain components:

```txt
DashboardV2Shell
DashboardV2Sidebar
DashboardV2Topbar
DashboardV2MobileNav
DashboardV2PageHeader
DashboardV2Stat
DashboardV2ActivityRow
DashboardV2ResourceRow
DashboardV2ResourceTile
DashboardV2DataTable
DashboardV2Section
DashboardV2ContentSkeleton
```

Creation guard:
- Before creating any component, search `src/design-system`,
  `src/components/ui`, and `src/components` for existing equivalents.
- If a component is one-off, keep it inside the dev prototype first.
- Promote to shared component only after at least two routes need it.

## Static Prototype Scope

The first implementation should be a single isolated static prototype:

```txt
src/app/dev/dashboard-v2/page.tsx
```

Prototype goals:
- Prove shell geometry.
- Prove navigation groups.
- Prove one user route and one creator route in the same shell.
- Prove content-only skeleton shape.
- Avoid data fetching.
- Avoid production links.
- Avoid modifying existing dashboard routes.

Suggested prototype content:
- Left sidebar.
- Topbar.
- User Home section.
- Downloads section preview.
- Creator Overview section.
- Creator Resources table preview.
- Membership/settings compact previews.
- One skeleton preview panel showing content-only loading.

## Build Phases

### Phase 1: Contract Prototype

Deliver:
- `docs/dashboard-v2-design-brief.md`
- Static `/dev/dashboard-v2`
- Shell, nav, and content skeleton demonstration.

Do not:
- Add production nav links.
- Delete old dashboard.
- Connect real data.

### Phase 2: Visual System Hardening

Deliver:
- Refined spacing, surfaces, type hierarchy.
- Mobile layout.
- Empty/loading/error state examples.
- Impeccable critique pass.

### Phase 3: Route Architecture

Deliver:
- Real isolated route group.
- Shared layout.
- Route-level content-only loading contract.
- Guard script for full-shell duplication.

### Phase 4: Data Integration

Deliver:
- User dashboard routes wired to existing services.
- Creator workspace routes wired to existing services.
- Runtime verification for downloads, purchases, membership, and creator data.

### Phase 5: Migration And Cutover

Deliver:
- Side-by-side QA with old dashboard.
- Production navigation switch.
- Old route cleanup only after V2 routes are verified.

## Definition Of Done For V2 Prototype

Prototype is ready for review when:
- `/dev/dashboard-v2` renders without touching production dashboard.
- Desktop and mobile layouts are stable.
- The visual hierarchy is understandable without real data.
- Content-only loading skeleton is demonstrated.
- No full-shell loading is nested inside the content slot.
- No direct dependency on shadcn examples or external design repos exists.
- `git status` shows only intentional files.

