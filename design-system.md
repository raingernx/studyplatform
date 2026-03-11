# PaperDock Gumroad‑Style Design System

## Colors

- **Brand (`brand.*`)**: Primary actions, key accents (buttons, price highlights).
- **Accent (`accent.*`)**: Secondary CTAs, special states.
- **Highlight (`highlight.*`)**: Sale, discount, warning chips.
- **Surface (`surface.*`)**: Backgrounds and neutrals.
- **Text (`text.*`)**:
  - `text.primary`: Headlines and main copy.
  - `text.secondary`: Supporting copy.
  - `text.muted`: Meta information, hints.
- **Border (`border.*`)**:
  - `border.subtle`: Card and container outlines.
  - `border.strong`: Dividers and emphasis borders.
  - `border.focus`: Focus rings.

**Rules**

- Never hard‑code hex colors in JSX; always use Tailwind tokens from `tailwind.config.ts`.
- On dark backgrounds, use `text.onDark` or plain white for text.

## Spacing

- Base unit: 4px (Tailwind spacing scale).
- Section padding: `py-20` for main sections, `py-24` for hero sections.
- Card padding: `p-5` by default.
- Grid gaps: `gap-5`–`gap-6` for resource grids.
- Use generous whitespace between vertical blocks (`space-y-6`+).

## Typography

- Hero / display: `text-4xl`–`text-5xl font-bold tracking-tight`.
- Section titles: `text-2xl`–`text-3xl font-bold`.
- Body: `text-sm`/`text-base` with `leading-relaxed`.
- Eyebrow labels: `text-xs font-semibold uppercase tracking-[0.18em] text-text-muted`.

## Components

- **Buttons** (`src/components/ui/Button.tsx`)
  - Use `variant="primary" | "secondary" | "outline" | "ghost"` and size props.
  - Primary actions (purchases, key flows) should use primary/secondary variants.
  - Avoid custom button Tailwind strings in pages; wrap everything in `<Button>`.

- **Cards** (`src/components/ui/Card.tsx`)
  - Base shell for surfaces: rounded, border, soft shadow, hover lift.
  - Use for dashboard panels, info boxes, and grouped UI.

- **Resource cards** (`src/components/resources/ResourceCard.tsx` and re‑exports in `ui/ResourceCard.tsx`)
  - Canonical marketplace card: preview image or gradient, price pill, tags, stats.
  - All resource listings should use this component or extend it, not recreate markup.

- **Badges & Tags**
  - `Badge`: status counts, prices, small labels with higher emphasis.
  - `Tag`: filters and categorical labels with lower emphasis.

- **Section headers** (`ui/SectionHeader.tsx`)
  - Standard pattern for the top of each section: eyebrow → title → description → optional actions.

## UI Do / Don’t

**Do**

- Use large type and whitespace to create a bold, Gumroad‑like feel.
- Keep corners rounded and shadows soft (`shadow-card`, `shadow-card-md`).
- Reuse shared components (`Button`, `Card`, `ResourceCard`, `Badge`, `Tag`, `SectionHeader`).

**Don’t**

- Don’t introduce new shadow or radius values outside the configured tokens.
- Don’t hard‑code colors, font sizes, or spacing values.
- Don’t duplicate button or card markup in pages; import the shared components instead.

---

# PaperDock Design System v1

For Next.js + Tailwind. Goal: unified UI so Marketplace, Library, and Admin share the same visual language.

**Core principles:** Consistency first · Reusable components · Minimal visual noise · Marketplace-first layout · Card-driven UI.

## 1. Card System

All resources use the same card: **`src/components/resources/ResourceCard.tsx`** (base shell: **`src/components/ui/Card.tsx`**).

**Used in:** Marketplace, Library, Admin preview, Search results, Related resources.

**Structure:** preview → tags → title → description → meta → actions.

**ResourceCard props:** `id`, `slug`, `title`, `description?`, `author`, `previewUrl?`, `tags?`, `price?`, `owned?`, `variant?: "marketplace" | "library" | "preview"`.

**Card hover:** `transition-all hover:shadow-md hover:-translate-y-[2px]`.

**Grid layout:**
- **Marketplace:** `grid grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-4`
- **Library:** `grid grid-cols-2 gap-6 lg:grid-cols-3`

## 2. Button System

**Component:** `src/components/ui/Button.tsx`

| Variant     | Use case           | Style |
|------------|--------------------|--------|
| `primary`  | Main actions       | `bg-black text-white hover:bg-neutral-800` |
| `secondary`| Secondary actions  | `border bg-white hover:bg-neutral-50` |
| `ghost`    | In cards / toolbars| `bg-transparent hover:bg-neutral-100` |
| `danger`   | Delete, destructive| `bg-red-500 text-white` |

**Sizes:** `sm`, `md` (default), `lg`. Legacy: `outline` (= secondary), `accent`, `dark`.

## 3. Badge System

**Component:** `src/components/ui/Badge.tsx`

| Variant    | Style |
|-----------|--------|
| `free`    | `bg-green-100 text-green-700` |
| `price`   | `bg-blue-100 text-blue-700` |
| `owned`   | `bg-neutral-100 text-neutral-700` |
| `featured`| `bg-amber-100 text-amber-700` |

Example: `<Badge variant="free">Free</Badge>`, `<Badge variant="price">฿300</Badge>`.

## 4. Tag System

**Component:** `src/components/ui/Tag.tsx`

- **Rules:** Always lowercase, short labels, **max 2 visible** in cards; overflow as `+N`.
- **Style:** `bg-neutral-100 text-neutral-700 rounded-full text-xs px-2.5 py-0.5 font-medium`.

## 5. Input System

**Component:** `src/components/ui/Input.tsx` (uses `.input-base` in `globals.css`).

- **Standard:** `h-10 rounded-md border px-3 text-sm focus:ring-2 focus:ring-blue-500`.
- **Search:** `src/components/ui/SearchInput.tsx` — `rounded-full pl-10` for icon.

## 6. Form System

**Structure:** Form → FormSection → FormField. Used in Create Resource, Edit Resource, Settings.

- **Grid:** `grid grid-cols-1 md:grid-cols-2 gap-6`, **Spacing:** `space-y-6`.

## 7. Layout System

- **Page container:** `max-w-7xl mx-auto px-6 py-8`.
- **Admin two-column:** `grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8` — left: Form, right: Live preview / Stats / Details.

## 8. Grid System

- **Marketplace:** `grid-cols-2 md:grid-cols-3 xl:grid-cols-4`, `gap-6`.
- **Library:** `grid-cols-2 lg:grid-cols-3`, `gap-6`.
- **Admin dashboard:** `grid-cols-2 lg:grid-cols-4`, `gap-6`.

## 9. Spacing

- Scale: 4px. **Common:** `gap-4`, `gap-6`, `gap-8`. **Sections:** `space-y-6`. **Page:** `py-8 px-6`. **Card:** `p-4`.

## 10. Typography

- **Page title:** `text-2xl font-semibold`
- **Card title:** `text-sm font-medium`
- **Descriptions:** `text-sm text-neutral-500`
- **Meta:** `text-xs text-neutral-400`

## 11. Image / Preview

- **Preview area:** `aspect-[4/3]`, `bg-neutral-100`, `rounded-md` (or rounded-t-2xl to match card). Fallback: centered file icon.

## 12. Design Rules

1. All resources must use **ResourceCard**.
2. Cards must never have different layouts per page.
3. Admin live preview must use the same card component (`variant="preview"`).
4. Tags must always be **lowercase**.
5. Maximum **two** visible tags in cards; show `+N` for overflow.
6. Primary action is always the **left-most** button.
7. Grid layouts must follow the defined breakpoints.

## 13. Component Folder Structure

```
src/components/
  ui/
    Button.tsx
    Card.tsx
    Badge.tsx
    Tag.tsx
    Input.tsx
    SearchInput.tsx
  resources/
    ResourceCard.tsx
    ResourceGrid.tsx
  forms/
    ResourceForm.tsx  (admin)
  layout/
    DashboardSidebar.tsx
    Navbar.tsx
```

## 14. Future Extensions

Planned: FilterBar, EmptyState, Modal, Toast, Pagination, ResourcePreview.

