import { cn } from "@/lib/utils";
import { Container } from "./Container";

type SectionSpacing = "hero" | "normal" | "compact";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  /** hero → py-24 | normal → py-16 | compact → py-12 */
  spacing?: SectionSpacing;
  /** Skip the inner Container (use when the caller manages its own layout) */
  bare?: boolean;
  id?: string;
}

const spacingMap: Record<SectionSpacing, string> = {
  hero:    "py-24",
  normal:  "py-16",
  compact: "py-12",
};

export function Section({
  children,
  className,
  spacing = "normal",
  bare = false,
  id,
}: SectionProps) {
  return (
    <section id={id} className={cn(spacingMap[spacing], className)}>
      {bare ? children : <Container>{children}</Container>}
    </section>
  );
}
