# UI Design System Skill — KruCraft

**Scope of this file:** Repo-aware implementation truth. Actual components, real variants, real token names, real code behavior. This is the operational layer for UI work.

For design decision quality → `skill.md`
For enforcement rules and forbidden practices → `UI_RULES.md`

---

## 0. Source of Truth Priority

**This section governs all conflicts. Read it first.**

```
Priority 1 → .Codex/skills/ui-design-system.md   (this file)
Priority 2 → Actual component code in the repo
Priority 3 → UI_RULES.md
Priority 4 → skill.md
```

**Resolution rules:**
- When sources conflict, higher priority always wins.
- If the actual component code disagrees with any doc, **follow the code**. Update the doc — never change code to match stale docs.
- If this file says the primary button is `brand-600` (blue) but another doc says it's violet — this file is correct. The component code confirms it.
- Never let a lower-priority document override a decision made by a higher-priority one.

---

## 1. Role Definition

You are a senior UI engineer in the KruCraft codebase. Your sole purpose is to make UI changes that are consistent, predictable, and regression-free. You enforce the existing design system. You do not redesign. You do not refactor beyond scope. You produce UI that looks like it was always there.

---

## 2. System Architecture

```
skill.md               → design decision quality (WHY)
  ↓
UI_RULES.md            → enforcement constraints (WHAT IS FORBIDDEN)
  ↓
ui-design-system.md    → repo-aware implementation truth (HOW) ← YOU ARE HERE
  ↓
src/design-system/ + src/components/ui/ → component layer (PRIMARY)
  ↓
Tailwind CSS → layout, spacing, minor adjustments (SECONDARY)
```

Tailwind is not the design system. It supports it. Never bypass the component layer with raw utilities.

---

## 3. Mandatory Repo Search Requirement

**This is a hard requirement, not a suggestion.**

Before writing any UI code, you MUST:

1. Search `src/design-system/primitives/` for a matching primitive
2. Search `src/components/ui/` for a matching component
3. Search `src/design-system/components/` for a matching compound component
4. Search `src/design-system/layout/` for a matching layout primitive
5. Search `src/components/` broadly for any component that covers the use case

You must not assume a component does not exist. You must verify by searching.

**If you skip this step and create a duplicate component, that is a violation — not a style preference.**

Exact search targets:
- Component names (e.g., `ResourceCard`, `PurchaseCard`, `Button`, `Badge`)
- Pattern names (e.g., `StatCard`, `EmptyState`, `Pagination`)
- Layout wrappers (e.g., `PageContent`, `Container`, `PageSection`)

---

## 4. Component Creation Guardrails

**Default answer: NO. You may not create a new component.**

Before creating any new component, you must complete this checklist and output it explicitly:

```
COMPONENT CREATION CHECKLIST
[ ] Searched src/design-system/primitives/ — result: [found / not found]
[ ] Searched src/components/ui/ — result: [found / not found]
[ ] Searched src/design-system/components/ — result: [found / not found]
[ ] Searched src/components/ broadly — result: [found / not found]
[ ] Reuse as-is: possible? [YES / NO — reason]
[ ] Extend via props/variant: possible? [YES / NO — reason]
VERDICT: Creating new component because: [explicit justification]
```

If you cannot fill in every line above — you do not have permission to create a new component.

**If creating a new component:**
- It must be generic and reusable (not one-off)
- It must accept standard props (`className`, `children`, etc.)
- It must follow the design token system exactly
- It must be placed in the correct directory:
  - `src/design-system/primitives/` — low-level UI element
  - `src/components/ui/` — shadcn-style component
  - `src/components/[domain]/` — domain-specific compound component
- It must be documented with its intended use case

---

## 5. Reuse-Before-Create Workflow

This is the mandatory workflow for every UI task. Execute it in order. Do not skip steps.

### Step 1 — Search existing components (MANDATORY)

Run the Repo Search Requirement from Section 3 before touching any file.

### Step 2 — Audit the target file

Read the complete target component/page. Identify:
- Which design system components are already imported
- Which tokens are already in use
- Every deviation from this skill (cite file:line)

### Step 3 — Diagnose issues

Output every issue before writing any fix:
```
ISSUE: [file:line] — [what is wrong]
RULE VIOLATED: [which rule from UI_RULES.md or this skill]
FIX: [concrete change]
```

### Step 4 — Declare scope

List every file you will modify. State explicitly what you will NOT touch (business logic, data fetching, API calls, routing, test files).

### Step 5 — Get approval

Output the full plan and wait. Do not write implementation code until approved.

### Step 6 — Implement

Apply fixes in this order:
1. Layout structure (Container wrapping, grid, responsive breakpoints)
2. Typography (heading levels, text scale, weight hierarchy)
3. Color and surface (backgrounds, borders, text tokens)
4. Interactive elements (Button variants, correct states)
5. Empty / loading / error states (if absent)

### Step 7 — Run Design QA Checklist

See Section 6.

---

## 6. Design QA Checklist — Run After Every UI Change

After every implementation step, verify each item. Output the results.

```
DESIGN QA
[ ] 1. Is the primary action obvious? One dominant CTA per section?
[ ] 2. Is spacing consistent with the system scale? No arbitrary values?
[ ] 3. Is color usage within the allowed palette? No gray-*, raw hex, or inline styles?
[ ] 4. Are all four states handled? Loading / Empty / Error / Success
[ ] 5. Did this reuse an existing component where one was available?
[ ] 6. Did this introduce any one-off pattern that cannot be reused?
[ ] 7. Does this match the current repo implementation, not just the docs?
[ ] 8. Is copy clear and minimal? No verbose, ambiguous, or off-brand text?
[ ] 9. Does mobile layout work at 375px?
[ ] 10. Were any locked components modified? If yes, was there explicit justification?
```

Any NO answer is a blocker. Fix before marking the task complete.

---

## 7. Component Lock System

The following components are **locked**. They may only be modified with explicit justification. They may never be forked, duplicated, or worked around.

### Locked Components

| Component | File | Lock Reason |
|---|---|---|
| `Button` | `src/components/ui/Button.tsx` | Core interaction primitive — changes affect every CTA in the app |
| `Card` | `src/design-system/primitives/Card.tsx` | Structural primitive — changes affect all dashboard panels |
| `Badge` | `src/components/ui/Badge.tsx` | Semantic status indicator — inconsistency causes user confusion |
| `Input` | `src/design-system/primitives/Input.tsx` | Form primitive — accessibility and focus states must remain intact |
| `ResourceCard` | `src/components/resources/ResourceCard.tsx` | Single canonical marketplace card — duplication causes drift |
| `PurchaseCard` | `src/components/resource/PurchaseCard.tsx` | Highest-impact conversion surface — changes affect revenue |
| `BuyButton` | `src/components/resources/BuyButton.tsx` | Checkout entry point — changes affect payment initiation |

### Locked Surfaces

| Surface | Rule |
|---|---|
| PurchaseCard CTA area | One CTA per ownership state. No additions without product approval. |
| ResourceCard thumbnail + badge area | Badge position and logic is fixed. No new overlay patterns. |
| Checkout flow entry | BuyButton handles all checkout initiation. No parallel paths. |

### Rules for Locked Components

1. **Do not invent new styles around them.** If the existing variant does not cover the use case, add a variant — do not wrap the component in custom styling.
2. **Do not fork them.** `CustomButton`, `StyledResourceCard`, `NewPurchasePanel` are forbidden.
3. **Do not override base styles with `className`** unless it is a layout-only tweak (`w-full`, `mt-4`).
4. **Any modification must be justified** with which variant was insufficient and why.

---

## 8. Design Tokens

### Color System

The palette is semantic. Use intent tokens. Never use raw Tailwind colors for decisions that carry meaning.

#### Brand / Primary
| Token | Use |
|---|---|
| `bg-brand-600` / `text-brand-600` | Primary CTA, active links, brand accent |
| `bg-brand-50` / `border-brand-200` | Highlighted info panels, gentle brand tint |
| `text-brand-700` | Text on brand-tinted surfaces |

#### Accent (violet)
| Token | Use |
|---|---|
| `bg-accent-600` / `text-accent-600` | Owned/subscribed state, premium features |
| `bg-accent-50` / `border-accent-200` | Subtle accent surfaces |

#### Surface / Neutral (zinc scale)
| Token | Use |
|---|---|
| `bg-white` | Card / panel background |
| `bg-surface-50` | Inset content area, tinted background |
| `bg-surface-100` | Pills, tags, chip backgrounds |
| `border-surface-200` | Default card and panel borders |
| `text-zinc-900` / `text-text-primary` | High-emphasis text |
| `text-zinc-500` / `text-text-secondary` | Supporting text, metadata |
| `text-zinc-400` / `text-text-muted` / `text-muted-foreground` | Placeholder, disabled, minor labels |

#### Semantic State Colors
| Intent | Token |
|---|---|
| Success | `text-success-600`, `bg-success-50`, `text-emerald-700`, `bg-emerald-50` |
| Warning | `text-warning-600`, `bg-warning-50` |
| Danger / Error | `text-danger-600`, `bg-danger-50` |
| Info | `text-brand-600`, `bg-brand-50` |

#### FORBIDDEN color patterns
- `text-gray-*` or `bg-gray-*` — use `zinc` or `surface` tokens
- `text-slate-*` — not in this system
- `text-red-*` or `bg-red-*` — use `danger-*` or the danger Button variant
- Raw hex in className: `text-[#6b6b6b]`
- Inline style colors: `style={{ color: '#333' }}`
- More than 3 distinct accent colors visible on the same screen section

---

### Typography Scale

Arbitrary sizes like `text-[13px]` are tolerated only when already established in the component pattern — do not introduce new ones.

| Use | Class |
|---|---|
| Page hero | `text-h1 font-display` |
| Section heading | `text-h2 font-display` |
| Card / subsection heading | `text-h3 font-semibold` |
| Body copy | `text-base` (1rem / 1.7 line-height) |
| Supporting / metadata | `text-meta` or `text-sm` |
| Micro labels, badges, captions | `text-micro` or `text-xs` |

**Rules:**
- Never mix competing `font-bold` elements at the same visual level
- No arbitrary font sizes: `text-[17px]`, `text-[11.5px]`

---

### Spacing

| Name | Value | Tailwind |
|---|---|---|
| xs | 4px | `gap-1` / `p-1` |
| sm | 8px | `gap-2` / `p-2` |
| md | 12px | `gap-3` / `p-3` |
| lg | 16px | `gap-4` / `p-4` |
| xl | 24px | `gap-6` / `p-6` |
| 2xl | 32px | `gap-8` / `p-8` |
| 3xl | 48px | `gap-12` / `p-12` |

**Rules:**
- No arbitrary spacing: `mt-[13px]`, `p-[11px]`, `gap-[7px]`
- Prefer `gap-*` over `space-y-*` when using flexbox with `mt-auto`

---

### Border Radius

| Use | Class |
|---|---|
| Small inputs, chips | `rounded-md` (8px) |
| Cards, panels, modals | `rounded-2xl` |
| Buttons | `rounded-md` (set by component) |
| Badges, pills, tags | `rounded-full` |
| Inset panels inside cards | `rounded-xl` |

---

### Shadows

Use named shadow tokens only. Never write `shadow-[0_4px_...]`.

| Token | When |
|---|---|
| `shadow-card` | Default card resting state |
| `shadow-card-md` | Hover state elevation |
| `shadow-card-lg` | Modals, sticky sidebars, elevated panels (e.g. PurchaseCard) |
| `shadow-glow-blue` | Featured items, highlighted CTAs |
| `shadow-sm` | Inset widgets, micro-cards inside panels |

---

## 9. UI Smell Detection

Detect and fix these automatically on any file you are editing.

### Spacing smells
- Mixed rhythm: `mt-3` next to `mb-5` next to `gap-2` → standardize
- Arbitrary values: `p-[11px]`, `mt-[22px]` → nearest scale token
- No breathing room between sections → add `PageSection` or `py-8`

### Hierarchy smells
- Multiple `font-bold` or `font-semibold` at the same level → one heading, rest demoted
- More than one `primary` Button in the same section → one primary, rest `outline` or `secondary`
- All body text at the same size → apply scale (heading / body / meta)
- Section has no title → add one

### Color smells
- Raw colors: `text-[#666]`, `bg-[#f5f5f5]` → replace with tokens
- `text-gray-400` used where `text-text-muted` is available → fix
- More than 3 distinct accent colors on one screen → reduce

### CTA smells
- 3+ action buttons with equal visual weight → establish hierarchy
- Destructive action using `primary` variant → use `danger` or `destructive`
- Async button without loading state → add `loading` prop
- Raw `<button>` or `<a>` in a feature component → replace with `<Button>`

### Empty state smells
- Data list renders nothing when empty → add empty state
- Loading state shows blank white area → add skeleton or spinner

### Structure smells
- `div > div > div > div` with no semantic meaning → flatten or use semantic HTML
- Page content not wrapped in `Container` or `PageContent*` → wrap it
- Grid without responsive variants: `grid-cols-4` → add `sm:`, `lg:` breakpoints

---

## 10. Component Rules

### Button

**Import:** `import { Button } from "@/design-system"`
**Source:** `src/design-system/primitives/Button.tsx` → `src/components/ui/Button.tsx`
**Status: LOCKED** — see Component Lock System (Section 7)

The actual `primary` variant is **brand-blue** (`bg-brand-600`). Violet is the `accent-*` palette.

| Variant | When to use |
|---|---|
| `primary` | The one dominant action on a surface (brand blue) |
| `secondary` | Secondary action beside a primary |
| `outline` | Tertiary / low-emphasis action |
| `ghost` | Icon buttons, nav items, inline row actions |
| `danger` | Solid red — irreversible destructive actions |
| `destructive` | Subtle red — inline destructive (table rows, confirmations) |
| `accent` | Orange highlight — promotional, special offer |
| `dark` | Dark zinc — owned-state downloads (matches PurchaseCard style) |
| `link` | Inline text links that behave as buttons |

**Sizes:** `xs` `sm` `md` (default) `lg` `icon` `icon-sm` `icon-lg`

**Additional props:** `loading={boolean}`, `fullWidth={boolean}`, `leftIcon`, `rightIcon`

**Rules:**
- Never use raw `<button>` in feature components.
- Never use `<a>` for navigation — use `<Button asChild><Link href="...">`.
- Only one `primary` per visual section.
- Always use `loading` on async actions.
- Destructive actions: `danger` variant, not `primary`.

---

### Card

**Import:** `import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction } from "@/design-system"`
**Source:** `src/design-system/primitives/Card.tsx`
**Status: LOCKED** — see Component Lock System (Section 7)

Uses `data-slot` composition — sub-components communicate through CSS selectors. Do not replicate this structure manually.

| Sub-component | Purpose |
|---|---|
| `Card` | Outer container. `size="sm"` for compact panels. |
| `CardHeader` | Title area. Auto-handles action grid when `CardAction` present. |
| `CardTitle` | `text-base font-semibold text-text-primary` |
| `CardDescription` | `text-meta text-text-secondary` |
| `CardAction` | Top-right slot — action button or status badge |
| `CardContent` | Body content with horizontal padding |
| `CardFooter` | Bottom strip with `bg-surface-50/60` — do not add custom footer inside `CardContent` |

**Rules:**
- Use for all dashboard panels, stat blocks, and content containers.
- Never replicate manually: `rounded-xl border bg-white shadow` in raw divs.

---

### ResourceCard — SINGLE CANONICAL CARD

**Import:** `import { ResourceCard } from "@/design-system"`
**Source:** `src/components/resources/ResourceCard.tsx`
**Status: LOCKED** — see Component Lock System (Section 7)

| Variant | Purpose |
|---|---|
| `marketplace` | Browse grid — hover overlay, price badge, full metadata |
| `library` | Owned content — download/preview/open CTA buttons, no price |
| `hero` | Featured placement — 16:9 aspect, larger footprint |
| `compact` | Admin and preview contexts |

| Prop | Use |
|---|---|
| `variant` | Select the card mode |
| `owned={true}` | When the current user owns the resource |
| `previewMode={true}` | Admin static preview — no link wrapping |

**Rules:**
- This is the **only** resource card component. No `ResourceCardSmall`, `ResourceCardRow`, `ResourceListItem`, or alternatives.
- To add a layout variation → add a `variant`. Never duplicate.
- Never copy internal markup into another component.

---

### PurchaseCard — CONVERSION-CRITICAL

**Source:** `src/components/resource/PurchaseCard.tsx`
**Status: LOCKED** — see Component Lock System (Section 7)

**Structure:** `isOwned` → download CTA | `isFree` → free-claim CTA | `paid` → buy CTA

**Rules:**
- One dominant CTA per state — never two competing primary actions.
- The CTA block is at the bottom of the top content section. Never push it below the fold.
- Trust signals (ratings, sales, downloads) live in the trust grid above the CTA.
- Owned state uses `bg-zinc-900` download button — intentional. Do not change.
- Recent activity panel uses `border-brand-200 bg-brand-50` — do not change the color.
- `space-y-4` spacing sections — do not compress.
- No new CTAs without explicit product approval.

---

### BuyButton

**Source:** `src/components/resources/BuyButton.tsx`
**Status: LOCKED** — see Component Lock System (Section 7)

This is the checkout entry point. Do not create parallel checkout initiation paths.

---

### Badge

**Source:** `src/components/ui/Badge.tsx`
**Status: LOCKED** — see Component Lock System (Section 7)

Use for: status labels, category chips, ownership indicators.
Do not use for decoration.

---

### Layout Components

**Import:** `import { Container, PageContent, PageContentWide, PageContentNarrow, PageSection } from "@/design-system/layout"`

| Component | Purpose | Max width |
|---|---|---|
| `Container` | Full-width outer wrapper | `max-w-7xl` (~1400px) |
| `PageContent` | Standard page body | `max-w-[1100px]` |
| `PageContentWide` | Admin tables, wide grids | `max-w-[1400px]` |
| `PageContentNarrow` | Forms, focused flows | `max-w-[800px]` |
| `PageSection` | Section vertical rhythm | `py-6 md:py-8 lg:py-12` |

**Page density:**
| Surface | Container | Spacing |
|---|---|---|
| Public / marketing | `Container` | Relaxed — `py-12 lg:py-20` |
| Dashboard | `PageContent` | Medium — `py-6 md:py-8` |
| Admin | `PageContentWide` | Compact — `py-4 md:py-6` |

**Rules:**
- All page content must use one of these wrappers. No raw `max-w-*` on page-level elements.
- Never add `py-*` directly to a raw `<section>` — use `PageSection`.

---

### Form Primitives

**Import:** `import { Input, Textarea, Select, Switch, SearchInput } from "@/design-system"`

| Component | Source |
|---|---|
| `Input` | `src/design-system/primitives/Input.tsx` |
| `Textarea` | `src/design-system/primitives/Textarea.tsx` |
| `Select` | `src/design-system/primitives/Select.tsx` |
| `Switch` | `src/design-system/primitives/Switch.tsx` |
| `SearchInput` | `src/design-system/primitives/SearchInput.tsx` |

Never use raw `<input>`, `<textarea>`, or `<select>`.

---

### Icons

- **Only `lucide-react`.** No other icon libraries.
- Body content: `h-4 w-4` | Inline with small text: `h-3.5 w-3.5` | Micro/badge: `h-3 w-3`
- Decorative icons: `aria-hidden`. Icon-only buttons: `aria-label`.

---

## 11. Layout Rules

### Standard Dashboard Page Structure

```tsx
export default function SomePage() {
  return (
    <PageContainer>
      <PageContent>
        <PageSection>
          {/* content */}
        </PageSection>
      </PageContent>
    </PageContainer>
  )
}
```

### Grid Patterns

| Context | Class |
|---|---|
| Resource marketplace grid | `grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` |
| Dashboard stat blocks | `grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4` |
| Admin two-column | `grid grid-cols-1 gap-6 lg:grid-cols-3` (2fr content + 1fr sidebar) |
| Form fields | Single column inside `PageContentNarrow` |

### Flex Patterns

| Pattern | Class |
|---|---|
| Row: label + action | `flex items-center justify-between gap-4` |
| Row: icon + text | `flex items-center gap-2` |
| Row: button group | `flex items-center gap-2 flex-wrap` |
| Stacked sections | `flex flex-col gap-4` |

### Empty State Pattern — Required

```tsx
{items.length === 0 && (
  <div className="flex flex-col items-center gap-3 py-12 text-center">
    <SomeIcon className="h-8 w-8 text-text-muted" aria-hidden />
    <p className="text-meta text-text-secondary">No items yet.</p>
    {/* optional primary CTA */}
  </div>
)}
```

### State Handling

| State | Implementation |
|---|---|
| Loading | Skeleton component or `Button loading={isPending}` |
| Empty | Empty state with icon + message |
| Error | Visible error message — never silent |
| Success | Inline confirmation or toast |

---

## 12. Interaction Rules

| State | Rule |
|---|---|
| Hover | Color shift (built into variants). Never shift layout. |
| Active | Darker background — built into all variants |
| Focus | `focus-visible:ring-2` ring — built into all primitives |
| Disabled | `opacity-50 pointer-events-none` — built in |
| Loading | Spinner via `loading` prop — never text change only |

- Hover must not cause layout shift.
- Animations on interactive elements: 200–300ms max.
- Heavy motion (fade-up, scale-in) only for page-level transitions — never on repeated list items.

---

## 13. Forbidden Practices

These are absolute. No exceptions.

- `style={{}}` props for anything achievable with Tailwind
- Raw hex values in className or style
- `text-gray-*` or `bg-gray-*`
- Arbitrary spacing or font sizes
- New icon libraries — only `lucide-react`
- Creating a new card, button, or input component when an existing one covers the use case
- Copying ResourceCard's internal markup into another component
- Adding CTAs to PurchaseCard without product approval
- Forking or duplicating any locked component
- Overdesigned UI: decorative gradients, heavy shadows, dribbble-style layering
- `!important` in Tailwind classes
- Modifying business logic, data fetching, or routing as part of a UI task
- Editing files outside the declared task scope

---

## 14. Output Format

### Before implementation:

```
## Audit
[Files read, current state]

## Issues Found
1. [file:line] — [issue] — [rule violated]

## Scope
Will modify: [files]
Will NOT touch: [files + reason]

## Component Search Results
[What was searched and what was found]

## Plan
1. [change + file]

---
Waiting for approval.
```

### After each file change:

```
### [filename]
- Fixed: [what]
- Why: [rule satisfied]
```

### Design QA output (after implementation):

```
DESIGN QA
[✓/✗] 1. Primary action obvious?
[✓/✗] 2. Spacing consistent with scale?
[✓/✗] 3. Color within allowed palette?
[✓/✗] 4. All four states handled?
[✓/✗] 5. Reused existing component?
[✓/✗] 6. No one-off patterns introduced?
[✓/✗] 7. Matches repo implementation (not just docs)?
[✓/✗] 8. Copy is clear and minimal?
[✓/✗] 9. Mobile works at 375px?
[✓/✗] 10. No locked components modified without justification?
```

### Never:
- Output implementation code in the same response as the plan.
- Modify files not in the declared scope.
- Skip the Repo Search step.
- Skip the Design QA checklist.
- Create a component without completing the Component Creation Checklist.
