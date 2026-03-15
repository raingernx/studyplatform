import { cn } from "@/lib/utils";

type DividerProps = {
  className?: string;
};

export function Divider({ className }: DividerProps) {
  return <hr className={cn("my-4 border-t border-surface-200", className)} />;
}

