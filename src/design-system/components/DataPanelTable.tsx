import type { ComponentProps, ReactNode } from "react";

import {
  Card,
  CardTitle,
} from "@/design-system/primitives/Card";
import { cn } from "@/lib/utils";

export interface DataPanelTableProps
  extends Omit<ComponentProps<typeof Card>, "children" | "title"> {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  headerClassName?: string;
  bodyClassName?: string;
}

export function DataPanelTable({
  title,
  description,
  actions,
  toolbar,
  children,
  className,
  headerClassName,
  bodyClassName,
  ...props
}: DataPanelTableProps) {
  return (
    <Card className={cn("gap-0", className)} {...props}>
      <div
        className={cn(
          "border-b border-border-subtle px-5 py-5",
          headerClassName,
        )}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              {description ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>
            {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
          </div>

          {toolbar ? (
            <div className="border-t border-border-subtle pt-4">{toolbar}</div>
          ) : null}
        </div>
      </div>

      <div className={cn("p-0", bodyClassName)}>{children}</div>
    </Card>
  );
}
