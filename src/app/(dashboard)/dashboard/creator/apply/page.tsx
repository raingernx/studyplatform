import { redirect } from "next/navigation";
import {
  BarChart2,
  Clock,
  DollarSign,
  FileText,
  Sparkles,
  Upload,
  XCircle,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { requireSession } from "@/lib/auth/require-session";
import { PageContent } from "@/design-system";
import { routes } from "@/lib/routes";
import { canAccessCreatorWorkspace, getCreatorAccessState } from "@/services/creator.service";
import { CreatorApplicationForm } from "@/components/creator/CreatorApplicationForm";
import { findCreatorApplicationRecord } from "@/repositories/creators/creator.repository";

export const metadata = {
  title: "Become a Creator",
};

export const dynamic = "force-dynamic";

const BENEFITS = [
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

export default async function CreatorApplyPage() {
  const { userId } = await requireSession("/dashboard/creator/apply");

  const access = await getCreatorAccessState(userId);

  // Already approved — send them to creator dashboard
  if (canAccessCreatorWorkspace(access) || access.applicationStatus === "APPROVED") {
    redirect(routes.creatorDashboard);
  }

  const applicationStatus = access.applicationStatus;

  return (
    <PageContent className="space-y-8">
      {/* Header */}
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
          downloads and analytics from one dashboard.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {BENEFITS.map((benefit) => {
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

      {/* State-based action panel */}
      {applicationStatus === "PENDING" && <PendingPanel />}
      {applicationStatus === "REJECTED" && (
        <RejectedPanel userId={userId} />
      )}
      {applicationStatus === "NOT_APPLIED" && (
        <ApplyPanel />
      )}
    </PageContent>
  );
}

function PendingPanel() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-card">
      <div className="flex items-start gap-3">
        <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
        <div>
          <h2 className="text-base font-semibold text-amber-900">Application under review</h2>
          <p className="mt-1.5 text-sm text-amber-800">
            Your creator application has been submitted and is currently being reviewed by our team.
            We typically respond within 1–3 business days. You'll be notified when a decision is made.
          </p>
        </div>
      </div>
    </div>
  );
}

async function RejectedPanel({ userId }: { userId: string }) {
  const record = await findCreatorApplicationRecord(userId);
  const reason = record?.rejectionReason;

  return (
    <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-card space-y-5">
      <div className="flex items-start gap-3">
        <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
        <div>
          <h2 className="text-base font-semibold text-neutral-900">Application not approved</h2>
          <p className="mt-1.5 text-sm text-neutral-600">
            Unfortunately your application was not approved at this time.
            {reason ? " Please see the feedback below." : " You may reapply with updated information."}
          </p>
          {reason && (
            <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
              <span className="font-medium">Feedback: </span>
              {reason}
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-neutral-900 mb-4">Submit a new application</h3>
        <CreatorApplicationForm />
      </div>
    </div>
  );
}

function ApplyPanel() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-card">
      <h2 className="text-lg font-semibold text-neutral-900">Apply for creator access</h2>
      <p className="mt-2 mb-6 text-sm text-neutral-500">
        Fill in the details below to submit your application. Our team reviews applications manually
        and will get back to you within 1–3 business days.
      </p>
      <CreatorApplicationForm />
    </div>
  );
}
