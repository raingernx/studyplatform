import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";

export interface PriceLabelProps {
  price: number | null | undefined;
  isFree?: boolean;
  className?: string;
  freeClassName?: string;
  paidClassName?: string;
}

export function PriceLabel({
  price,
  isFree,
  className,
  freeClassName,
  paidClassName,
}: PriceLabelProps) {
  const resolvedPrice = price ?? 0;

  if (isFree || resolvedPrice === 0) {
    return (
      <span className={cn("font-medium text-success-600", className, freeClassName)}>
        Free
      </span>
    );
  }

  // Resource prices are stored in satang and need converting back to THB.
  const baht = resolvedPrice / 100;

  return (
    <span className={cn("font-semibold text-foreground", className, paidClassName)}>
      {formatPrice(baht)}
    </span>
  );
}
