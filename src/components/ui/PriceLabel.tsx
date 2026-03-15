import { formatPrice } from "@/lib/format";

interface PriceLabelProps {
  price: number | null | undefined;
  isFree?: boolean;
}

export function PriceLabel({ price, isFree }: PriceLabelProps) {
  const resolvedPrice = price ?? 0;

  if (isFree || resolvedPrice === 0) {
    return <span className="font-medium text-green-600">Free</span>;
  }

  // Resource prices are stored in the smallest unit (satang).
  // Convert back to THB for display.
  const baht = resolvedPrice / 100;

  return (
    <span className="font-semibold text-neutral-900">
      {formatPrice(baht)}
    </span>
  );
}

