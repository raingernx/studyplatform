import type { ReactNode } from "react";
import { Navbar } from "./Navbar";

interface AppLayoutProps {
  children: ReactNode;
  /** Optional footer (e.g. for marketing pages) */
  footer?: ReactNode;
}

/** Public app layout: Navbar + main content. Use for marketplace, library (public), auth, etc. */
export function AppLayout({ children, footer }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      {footer}
    </div>
  );
}
