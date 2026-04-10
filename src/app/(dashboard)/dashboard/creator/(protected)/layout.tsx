import type { ReactNode } from "react";

import CreatorProtectedLayoutContent from "./CreatorProtectedLayoutContent";

export default function CreatorProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <CreatorProtectedLayoutContent>{children}</CreatorProtectedLayoutContent>;
}
