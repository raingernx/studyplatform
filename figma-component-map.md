# Krukraft Figma Component Map

Repo-owned manual mapping registry between the live Figma design-system file and
the codebase.

Use this file when Code Connect is unavailable or when working on `Professional`
plan handoff workflows.

If this file conflicts with code, the code wins. If this file conflicts with the
live Figma canvas, update this file in the same work session.

Validation:

- Run `npm run figma-map:check` after adding or renaming DS component files or
  reusable Figma library components.
- Run `npm run tokens:audit` when a DS token file, export surface, or token
  inventory doc changes.
- The check currently enforces row coverage for every `.tsx` file under:
  - `src/design-system/primitives`
  - `src/design-system/components`

## Live File

- Figma file: [Krukraft Design System](https://www.figma.com/design/D3cCyIYFnHDlY34eCqDURf)
- File key: `D3cCyIYFnHDlY34eCqDURf`
- Workspace status: moved into the shared Team project, not kept in personal
  Drafts.

## Registry Rules

- Every shared DS component that is added to the live Figma library should get
  a row here.
- Every new row must include:
  - Figma page
  - Figma node ID
  - canonical code path
  - ownership category
  - mapping status
- Use repo-canonical paths, not compatibility wrappers.
- Prefer the implementation owner path even if the component is re-exported from
  `@/design-system`.
- For reusable Figma component-set properties, prefer code-style prop naming:
  - property names should mirror code props such as `variant`, `size`, `align`,
    `submitButton`
  - variant option values should stay lower-case when the code prop values are
    lower-case, such as `primary`, `outline`, `sm`, `md`, `flat`, `card`
- When a component is renamed in Figma or code, update this registry in the same
  change.
- When a component is removed from Figma or code, remove or mark the row in the
  same change.

## Status Legend

- `mapped-manual`: Figma component exists and its code owner is recorded here.
- `pending-figma`: code exists, but a production-quality Figma component is not
  in the live library yet.
- `pending-code`: Figma component exists, but no canonical code owner has been
  chosen yet.
- `legacy`: do not use for new work.

## Primitives

| Figma page | Figma node | Figma component | Code path | Owner | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `Primitives` | `20:10` | `Button` | `src/design-system/primitives/Button.tsx` | DS primitive | `mapped-manual` | Primary and outline variants are in Figma. |
| `Primitives` | `21:10` | `Badge` | `src/design-system/primitives/Badge.tsx` | DS primitive | `mapped-manual` | Neutral, success, warning, info variants in Figma. |
| `Primitives` | `22:13` | `Input` | `src/design-system/primitives/Input.tsx` | DS primitive | `mapped-manual` | Figma shows default, hint, and error states. |
| `Primitives` | `22:28` | `Select` | `src/design-system/primitives/Select.tsx` | DS primitive | `mapped-manual` | Figma mirrors input shell plus caret. |
| `Primitives` | `22:41` | `Textarea` | `src/design-system/primitives/Textarea.tsx` | DS primitive | `mapped-manual` | Figma mirrors input shell plus multiline body. |
| `Primitives` | `23:20` | `Card` | `src/design-system/primitives/Card.tsx` | DS primitive | `mapped-manual` | Default and small size variants in Figma. |
| `Primitives` | `23:27` | `Switch` | `src/design-system/primitives/Switch.tsx` | DS primitive | `mapped-manual` | Includes unchecked, checked, disabled. |
| `Primitives` | `25:42` | `Dropdown` | `src/design-system/primitives/Dropdown.tsx` | DS primitive | `mapped-manual` | Static menu-state representation only. |
| `Primitives` | `24:9` | `Avatar` | `src/design-system/primitives/Avatar.tsx` | DS primitive | `mapped-manual` | Includes initials and generic photo variants. |
| `Primitives` | `24:46` | `Modal` | `src/design-system/primitives/Modal.tsx` | DS primitive | `mapped-manual` | Small, medium, large shell variants. |
| `Primitives` | `23:31` | `LoadingSkeleton` | `src/design-system/primitives/LoadingSkeleton.tsx` | DS primitive | `mapped-manual` | Neutral-only placeholder variants. |
| `Primitives` | `not-built` | `SearchInput` | `src/design-system/primitives/SearchInput.tsx` | DS primitive | `pending-figma` | Removed from `Product / Marketplace` during the hero-only marketplace reset and should be rebuilt later if it returns to the live library. |
| `Primitives` | `not-built` | `RevealImage` | `src/design-system/primitives/RevealImage.tsx` | DS primitive | `pending-figma` | Needs a Figma documentation pattern, not just a static frame. |
| `Primitives` | `not-built` | `ToastProvider` | `src/design-system/primitives/ToastProvider.tsx` | DS primitive | `pending-figma` | Better documented as a behavior pattern than a static component set. |

## Composed

| Figma page | Figma node | Figma component | Code path | Owner | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `Composed` | `33:33` | `FormSection` | `src/design-system/components/FormSection.tsx` | DS composed | `mapped-manual` | Flat and card variants. |
| `Composed` | `33:49` | `SectionHeader` | `src/design-system/components/SectionHeader.tsx` | DS composed | `mapped-manual` | Left and center align variants. |
| `Composed` | `33:76` | `Pagination` | `src/design-system/components/Pagination.tsx` | DS composed | `mapped-manual` | Default and compact pagination. |
| `Composed` | `33:84` | `EmptyState` | `src/design-system/components/EmptyState.tsx` | DS composed | `mapped-manual` | Dashed-shell empty state exemplar. |
| `Composed` | `34:16` | `RowActions` | `src/design-system/components/RowActions.tsx` | DS composed | `mapped-manual` | Default and review action clusters. |
| `Composed` | `34:56` | `ConfirmDialog` | `src/design-system/components/ConfirmDialog.tsx` | DS composed | `mapped-manual` | Danger, warning, and info variants. |

## Product-Bound DS Exports

| Figma page | Figma node | Figma component | Code path | Owner | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `Product / Marketplace` | `not-built` | `ResourceCard` | `src/components/resources/ResourceCard.tsx` | Product DS export | `pending-figma` | Marketplace card mappings still need a refreshed canonical Figma surface; the hero banner is currently the stable marketplace exemplar. |
| `Product / Marketplace` | `not-built` | `PriceBadge` | `src/design-system/components/PriceBadge.tsx` | Product DS export | `pending-figma` | Still pending a refreshed canonical marketplace pricing surface in Figma. |
| `Product / Marketplace` | `not-built` | `PriceLabel` | `src/design-system/components/PriceLabel.tsx` | Product DS export | `pending-figma` | Still pending a refreshed canonical marketplace pricing surface in Figma. |
| `Product / Marketplace` | `53:62` | `HeroBanner` | `src/components/marketplace/HeroBanner.tsx`, `src/components/marketplace/HeroSurface.tsx` | Product DS export | `mapped-manual` | Component set with `viewport=desktop|mobile` variants and a dedicated `HeroBanner / Preview` block. |
| `Product / Admin` | `39:35` | `FileUploadWidget` | `src/design-system/components/FileUploadWidget.tsx` | Product DS export | `mapped-manual` | Empty, selected, uploaded states. |
| `Product / Admin` | `38:12` | `NotificationButton` | `src/design-system/components/NotificationButton.tsx` | Product DS export | `mapped-manual` | 0, 3, 9+ count variants. |
| `Product / Admin` | `38:31` | `PickerControls` | `src/design-system/components/PickerControls.tsx` | Product DS export | `mapped-manual` | Actions, icons, dropzone representations. |

## Product Flow Exemplars

These are owner-page flow exemplars, not one-to-one Code Connect candidates.

| Figma page | Figma node | Pattern | Backing source | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| `Product / Admin` | `41:2` | `Flow / Admin Settings` | `src/components/settings/*`, `src/app/admin/settings/AdminSettingsClient.tsx` | `mapped-manual` | Anti-nesting and flat-section exemplar. |
| `Product / Marketplace` | `58:2` | `Flow / Hero Banner` | `src/components/marketplace/HeroSurface.tsx`, `src/components/marketplace/HeroBanner.tsx` | `mapped-manual` | Canonical marketplace hero flow. The page contains `HeroBanner / Component Set` and `HeroBanner / Preview` sections for source-first editing and validation. |
| `Product / Dashboard` | `41:86` | `Flow / Creator Dashboard` | `src/app/(dashboard)/dashboard/creator/(protected)/*` | `mapped-manual` | Metrics row + single table surface. |

## First Manual Mapping Set

If the team stays on Figma Professional and keeps using manual mapping instead
of Code Connect, the minimum set to keep accurate is:

- `Button`
- `Badge`
- `Input`
- `Select`
- `Textarea`
- `Card`
- `FormSection`
- `SectionHeader`
- `Pagination`
- `EmptyState`

## Change Checklist

When adding a new shared component in code:

1. Add or update the canonical implementation under `src/design-system/*` if it
   is a generic DS surface.
2. Add or update the matching component in the live Figma library.
3. Add or update the row in this file.
4. Update `/design-system.md`, `src/design-system/README.md`, and
   `krukraft-ai-contexts/06-design-system.md` if the change affects shared
   ownership or handoff understanding.
5. Run `npm run figma-map:check` before closing the task.

When adding a new component in Figma first:

1. Decide whether it is a generic DS surface or a product-bound export.
2. Pick the canonical code owner path.
3. Add the row here immediately, even if the code component is still pending.
4. Do not leave anonymous or temporary Figma components without a registry row
   once they are intended to be reused.
5. Run `npm run figma-map:check` after the corresponding code surface is added
   or renamed.
