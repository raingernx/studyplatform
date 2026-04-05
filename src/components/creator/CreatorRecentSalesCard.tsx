import { ShoppingBag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/design-system";
import { formatPrice, formatRelativeDate } from "@/lib/format";
import type { DashboardRecentSale } from "@/services/creator";

interface CreatorRecentSalesCardProps {
  sales: DashboardRecentSale[];
}

export function CreatorRecentSalesCard({ sales }: CreatorRecentSalesCardProps) {
  if (sales.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <ShoppingBag className="h-4 w-4 text-blue-600" />
          Recent sales
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border/60">
          {sales.map((sale) => (
            <li
              key={sale.id}
              className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {sale.resourceTitle}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {sale.buyerName} · {formatRelativeDate(sale.createdAt)}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-emerald-700">
                +{formatPrice(sale.creatorShare / 100)}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
