# Skill: protected-file-delivery

You are a senior security engineer implementing or auditing private file delivery on a production Next.js SaaS platform (KruCraft). Files are stored in a private Cloudflare R2 bucket and must never be exposed directly. The only valid download path is through an authenticated API route that verifies purchase status.

## Trigger

Use this skill when:
- Implementing a new file download route or endpoint
- Auditing an existing download flow for security gaps
- Adding a new file type or resource category
- Investigating a "can't download" or "403" bug report
- Reviewing any code that generates R2 URLs or accesses file keys

## Workflow

### Phase 1 — Audit the existing download flow

Read `src/app/api/download/route.ts` and its called service. Verify this exact sequence:

```
1. Session check → 401 if missing
2. Zod parse resourceId from query params
3. Call service: checkDownloadAccess(userId, resourceId)
   a. DB lookup: resource by ID (get fileKey, verify exists)
   b. DB lookup: Purchase by (userId, resourceId, status: COMPLETED) OR active subscription
   c. If no access: throw 403
4. Generate pre-signed R2 URL (expiry ≤ 60 seconds)
5. Return 302 redirect to pre-signed URL
```

Flag any deviation from this sequence.

### Phase 2 — Check for file key exposure

Search for these anti-patterns:

```bash
# R2 file key returned to client in any API response
grep -r "fileKey\|r2Key\|storageKey\|objectKey" src/app/api --include="*.ts" -l

# R2 bucket name or direct URL in client-side code
grep -r "r2\.cloudflarestorage\|\.r2\.dev" src/components --include="*.tsx" -l

# File key in query params accepted from client
grep -r "searchParams.*fileKey\|body.*fileKey" src/app/api --include="*.ts" -l
```

Expected: no matches. Any match = security gap.

### Phase 3 — Verify pre-signed URL expiry

Find the `generatePresignedR2Url` call. Verify the expiry argument is ≤ 60 seconds:

```typescript
// CORRECT
const url = await generatePresignedR2Url(fileKey, 60);

// WRONG — too long, exposes file for extended period
const url = await generatePresignedR2Url(fileKey, 3600);
```

The route must `return NextResponse.redirect(url)` — not return the URL as JSON to the client.

### Phase 4 — Verify ownership check logic

In the service, verify the ownership query:

```typescript
// CORRECT — checks purchase status from DB
const purchase = await findCompletedPurchase({ userId, resourceId });
if (!purchase) {
  // Also check subscription
  const subscription = await findActiveSubscription(userId);
  if (!subscription) throw new ForbiddenError("No purchase or subscription");
}
```

Anti-patterns to reject:
- `userId` from request body instead of session
- `fileKey` from request query params (must come from DB via `resourceId`)
- Trust signal from `isReturningFromCheckout=true` query param
- Checking `Purchase.status` from client-supplied data

### Phase 5 — Audit file upload (if relevant)

If the task involves file upload, verify:

```typescript
// CORRECT — key generated server-side, never from client
const fileKey = generateR2Key(resourceId, filename);

// WRONG — client tells server where to store the file
const fileKey = body.fileKey;
```

File keys must be generated server-side using a deterministic function of `resourceId` + sanitized `filename`. The client should receive only a pre-signed upload URL, not the key itself.

### Phase 6 — Implement (if adding a new download flow)

Follow this template:

```typescript
// src/app/api/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { downloadService } from "@/services/download.service";
import { z } from "zod";

const QuerySchema = z.object({
  resourceId: z.string().min(1),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = QuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const presignedUrl = await downloadService.generateDownloadUrl(
    session.user.id,
    parsed.data.resourceId,
  );

  return NextResponse.redirect(presignedUrl);
}
```

```typescript
// src/services/download.service.ts
async function generateDownloadUrl(userId: string, resourceId: string): Promise<string> {
  // 1. Look up resource — get fileKey from DB, never from client
  const resource = await findResourceById(resourceId);
  if (!resource?.fileKey) throw new NotFoundError("Resource not found");

  // 2. Verify access
  const hasAccess = await verifyDownloadAccess(userId, resourceId);
  if (!hasAccess) throw new ForbiddenError("No purchase or subscription");

  // 3. Generate short-lived pre-signed URL
  return generatePresignedR2Url(resource.fileKey, 60);
}
```

### Phase 7 — Verify

```bash
npx tsc --noEmit
npm run lint
```

Security checklist:
- [ ] `fileKey` never returned to client in any response
- [ ] `fileKey` always looked up from DB using `resourceId`, never from request
- [ ] Pre-signed URL expiry ≤ 60 seconds
- [ ] Route returns 302 redirect, not the URL as JSON
- [ ] Session checked before any DB access
- [ ] Access verified via `Purchase.status === "COMPLETED"` or active subscription
- [ ] No Prisma calls in route handler

## Rules (non-negotiable)

- **Never expose R2 file keys** to the client in any form
- **Never trust a client-supplied file path or key** — always DB lookup by `resourceId`
- **Pre-signed URLs must expire in ≤ 60 seconds**
- **Route returns 302 redirect** to the pre-signed URL — not the URL itself as a response body
- **`/api/download` is the only legitimate file access path** — no direct R2 public URLs
- File keys are generated server-side — clients receive upload URLs, not keys

## Key files

- `src/app/api/download/route.ts` — download gate
- `src/services/download.service.ts` (or equivalent) — access verification + presign
- `src/lib/storage.ts` (or `src/lib/r2.ts`) — `generatePresignedR2Url`, `generateR2Key`
- `src/repositories/purchase.repository.ts` — `findCompletedPurchase`
- `prisma/schema.prisma` — `Purchase` model, `status` enum
