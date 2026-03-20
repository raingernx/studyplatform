"use client";

import { Input } from "@/design-system";
import { cn } from "@/lib/utils";

/** Price input + free toggle. Controlled. */
interface PriceSelectorProps {
  isFree: boolean;
  onFreeChange: (free: boolean) => void;
  price: string;
  onPriceChange: (value: string) => void;
  currencyLabel?: string;
  className?: string;
}

export function PriceSelector({
  isFree,
  onFreeChange,
  price,
  onPriceChange,
  currencyLabel = "THB ",
  className,
}: PriceSelectorProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isFree}
          onChange={(e) => onFreeChange(e.target.checked)}
          className="rounded border-zinc-300"
        />
        <span className="text-sm font-medium">Free</span>
      </label>
      {!isFree && (
        <div className="relative font-thai">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
            {currencyLabel}
          </span>
          <Input
            type="number"
            min={0}
            step={0.01}
            value={price}
            onChange={(e) => onPriceChange(e.target.value)}
            className="pl-8"
            placeholder="0.00"
          />
        </div>
      )}
    </div>
  );
}
