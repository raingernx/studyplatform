import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/design-system";
import { routes } from "@/lib/routes";
import { getPlatform } from "@/services/platform.service";

export async function CreatorCTA() {
  const platform = await getPlatform();

  return (
    <section className="py-10">
      <div className="grid grid-cols-1 items-center gap-8 rounded-[32px] border border-surface-200 bg-gradient-to-br from-white via-white to-brand-50/60 p-6 shadow-card sm:p-8 lg:grid-cols-[1.15fr_1fr] lg:p-10">
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
              Creator marketplace
            </p>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
            Sell your study resources
            </h2>
            <p className="max-w-xl text-body leading-7 text-text-secondary">
              Reach students and educators worldwide. Upload worksheets, flashcards, and study guides, then price them your way with a storefront that feels built for thoughtful creators.
            </p>
          </div>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
              Set your own price
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
              Instant downloads
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
              Global audience
            </li>
          </ul>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-brand-600 text-white hover:bg-brand-700">
              <Link href={routes.membership}>Start selling</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={routes.membership}>Learn more</Link>
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="inline-flex items-center rounded-full border border-surface-200 bg-white px-3 py-1 text-xs font-medium text-text-secondary shadow-sm">
              Trusted by 12,000+ educators
            </span>
            <span className="inline-flex items-center rounded-full border border-surface-200 bg-white px-3 py-1 text-xs font-medium text-text-secondary shadow-sm">
              Creator-first payouts
            </span>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div className="relative aspect-[4/3] w-full max-w-md overflow-hidden rounded-[28px] border border-surface-200 bg-gradient-to-br from-white to-surface-100 p-6 shadow-card">
            <Image
              src="/brand/krucraft-mark.svg"
              alt={`Creators sharing study resources on ${platform.platformShortName}`}
              fill
              sizes="(max-width: 1024px) calc(100vw - 48px), 448px"
              className="object-contain p-8"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
