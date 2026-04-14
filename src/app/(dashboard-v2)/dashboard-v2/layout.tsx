import type { ReactNode } from "react";
import type { Metadata } from "next";

import { DashboardV2Shell } from "@/components/dashboard-v2/DashboardV2Shell";

export const metadata: Metadata = {
  title: {
    default: "Dashboard V2 | Krukraft",
    template: "%s | Dashboard V2 | Krukraft",
  },
};

export default function DashboardV2Layout({
  children,
}: {
  children: ReactNode;
}) {
  return <DashboardV2Shell>{children}</DashboardV2Shell>;
}
