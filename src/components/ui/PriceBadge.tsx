import { formatPrice } from "@/lib/price";

interface PriceBadgeProps {
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
      <span className="rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
        Free
      </span>
    );
  }

  const majorUnits = value / 100;

  return (
    <span className="rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
      {formatPrice(majorUnits, currency)}
    </span>
  );
}

