import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function CreatorCTA() {
  return (
    <section className="py-16">
      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
            Sell your study resources
          </h2>
          <p className="mt-4 max-w-xl text-body text-text-secondary">
            Reach students and educators worldwide. Upload worksheets, flashcards, and study guides—set your own prices or offer them for free.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
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
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="bg-brand-600 text-white hover:bg-brand-700">
              <Link href="/membership">Start selling</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/membership">Learn more</Link>
            </Button>
          </div>
          <p className="pt-2 text-xs text-muted-foreground">
            Trusted by 12,000+ educators
          </p>
        </div>
        <div className="flex items-center justify-center">
          <div className="relative aspect-[4/3] w-full max-w-md overflow-hidden rounded-xl bg-surface-100">
            <Image
              src="/brand/paperdock-mark.svg"
              alt="Creators sharing study resources on PaperDock"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
