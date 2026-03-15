# PaperDock Development TODO

## Marketplace UX

- [ ] Improve resource discovery on the marketplace (categories, tags, and search defaults).
- [ ] Refine the resource detail page layout and copy for clearer value and purchase options.
- [ ] Polish the purchase UI flow from resource page → checkout → confirmation.

## Upload Flow

- [ ] Ensure the admin resource upload endpoint behaves reliably for large files and edge cases.
- [ ] Smooth out preview image uploads and display states in the admin UI.
- [ ] Improve version history display for resources so admins can clearly see and navigate past versions.

## Purchase → Download Flow

- [ ] Validate that the checkout flow (Stripe/Xendit) and redirects feel seamless from a user perspective.
- [ ] Confirm purchase record creation and state transitions are correct for successful and failed checkouts.
- [ ] Review and tighten the secure download endpoint behavior after purchase (including basic logging and error handling).

