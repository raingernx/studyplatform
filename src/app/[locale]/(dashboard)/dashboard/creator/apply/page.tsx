import { redirect } from "next/navigation";
import {
  BarChart2,
  DollarSign,
  FileText,
  Sparkles,
  Upload,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { requireSession } from "@/lib/auth/require-session";
import { BecomeCreatorButton } from "@/components/creator/BecomeCreatorButton";
import { PageContent } from "@/design-system";
import { routes } from "@/lib/routes";
import { canAccessCreatorWorkspace, getCreatorAccessState } from "@/services/creator.service";

export const metadata = {
  title: "Become a Creator",
};

export const dynamic = "force-dynamic";

export default async function CreatorApplyPage() {
  const { userId } = await requireSession("/dashboard/creator/apply");

  const access = await getCreatorAccessState(userId);
  if (canAccessCreatorWorkspace(access)) {
    redirect(routes.creatorDashboard);
  }

  const benefits = [
    {
      icon: Upload,
      title: "Upload and publish resources",
      description: "List study guides, notes, templates, and downloadable assets for learners.",
    },
    {
      icon: DollarSign,
      title: "Earn from sales",
      description: "Track gross revenue and creator share directly from your dashboard.",
    },
    {
      icon: BarChart2,
      title: "Monitor performance",
      description: "Review downloads, top-performing resources, and recent sales activity.",
    },
    {
      icon: FileText,
      title: "Build your creator profile",
      description: "Customize your public creator identity with a slug, bio, banner, and links.",
    },
  ];

  return (
    <PageContent className="space-y-8">
        <div className="rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-violet-50 p-8 shadow-card">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-500">
                Creator
              </p>
              <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-neutral-900">
                Become a Creator
              </h1>
            </div>
          </div>

          <p className="mt-5 max-w-3xl text-sm leading-6 text-neutral-600">
            Unlock creator tools to upload marketplace resources, earn from every sale, and monitor
            downloads and analytics from one dashboard. In this version, creator access can be
            enabled instantly for your account.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={benefit.title}
                  className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h2 className="mt-4 text-sm font-semibold text-neutral-900">{benefit.title}</h2>
                  <p className="mt-2 text-sm text-neutral-500">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-card">
          <h2 className="text-lg font-semibold text-neutral-900">Ready to get started?</h2>
          <p className="mt-2 text-sm text-neutral-500">
            Enabling creator access will add creator navigation to your dashboard and unlock the
            creator management pages immediately.
          </p>
          <div className="mt-5">
            <BecomeCreatorButton />
          </div>
        </div>
    </PageContent>
  );
}
