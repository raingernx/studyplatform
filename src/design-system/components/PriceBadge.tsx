import { formatPrice } from "@/lib/price";

export interface PriceBadgeProps {
  priceMinorUnits: number | null | undefined;
  isFree?: boolean;
  currency?: "THB" | "USD";
}

export function PriceBadge({
  priceMinorUnits,
  isFree,
  currency = "THB",
}: PriceBadgeProps) {
  const value = priceMinorUnits ?? 0;

  if (isFree || value === 0) {
    return (
      <span className="rounded-md border border-success-500/20 bg-accent px-2 py-1 text-xs font-medium text-success-700">
        Free
      </span>
    );
  }

  const majorUnits = value / 100;

  return (
    <span className="rounded-md border border-success-500/20 bg-accent px-2 py-1 text-xs font-medium text-success-700">
      {formatPrice(majorUnits, currency)}
    </span>
  );
}
