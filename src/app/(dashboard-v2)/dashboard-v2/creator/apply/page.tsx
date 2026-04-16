import { Suspense } from "react";
import { redirect } from "next/navigation";
import {
  Clock,
  XCircle,
} from "lucide-react";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageContent,
} from "@/design-system";
import { CreatorApplicationForm } from "@/components/creator/CreatorApplicationForm";
import { CreatorApplyRejectedFeedbackSkeleton } from "@/components/skeletons/CreatorApplyPageSkeleton";
import { requireSession } from "@/lib/auth/require-session";
import { routes } from "@/lib/routes";
import { findCreatorApplicationRecord } from "@/repositories/creators/creator.repository";
import {
  canAccessCreatorWorkspace,
  getCreatorAccessStateFresh,
} from "@/services/creator";

export const metadata = {
  title: "Become a Creator",
};

export const dynamic = "force-dynamic";

const CREATOR_HIGHLIGHTS = [
  "Publish resources",
  "Track earnings",
  "Build your profile",
] as const;

export default async function DashboardV2CreatorApplyPage() {
  const { userId, session } = await requireSession(routes.dashboardV2CreatorApply);

  if (session.user.role === "ADMIN" || session.user.role === "INSTRUCTOR") {
    redirect(routes.dashboardV2Creator);
  }

  const access = await getCreatorAccessStateFresh(userId);

  if (canAccessCreatorWorkspace(access)) {
    redirect(routes.dashboardV2Creator);
  }

  const applicationStatus = access.applicationStatus;
  const statePanel = await CreatorApplyStatePanel({
    applicationStatus,
    userId,
  });

  return (
    <PageContent
      data-route-shell-ready="dashboard-creator-apply"
      className="space-y-6"
    >
      <section className="border-b border-border-subtle pb-5">
        <div className="flex flex-wrap items-center">
          <Badge variant="info" className="w-fit">
            Creator
          </Badge>
        </div>

        <div className="mt-4 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Become a Creator
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Apply once to publish resources, manage your profile, and track
              sales from one workspace.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 xl:max-w-md xl:justify-end">
            {CREATOR_HIGHLIGHTS.map((highlight) => (
              <span
                key={highlight}
                className="rounded-full border border-border-subtle bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground"
              >
                {highlight}
              </span>
            ))}
          </div>
        </div>
      </section>
      {statePanel}
    </PageContent>
  );
}

async function CreatorApplyStatePanel({
  applicationStatus,
  userId,
}: {
  applicationStatus: string;
  userId: string;
}) {
  if (applicationStatus === "APPROVED") {
    return <ApprovedPanel />;
  }

  if (applicationStatus === "PENDING") {
    return <PendingPanel />;
  }

  if (applicationStatus === "REJECTED") {
    return <RejectedPanel userId={userId} />;
  }

  return <ApplyPanel />;
}

function PendingPanel() {
  return (
    <Card className="rounded-2xl">
      <CardContent className="flex items-start gap-3 px-6 py-6">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning-50 text-warning-700">
          <Clock className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <Badge variant="warning" className="w-fit">
            Pending
          </Badge>
          <h2 className="mt-3 text-base font-semibold text-foreground">
            Application under review
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Your creator application has been submitted and is currently being
            reviewed by our team. We typically respond within 1–3 business days.
            You&apos;ll be notified when a decision is made.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ApprovedPanel() {
  return (
    <Card className="rounded-2xl">
      <CardContent className="flex items-start gap-3 px-6 py-6">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success-50 text-success-700">
          <Clock className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <Badge variant="success" className="w-fit">
            Approved
          </Badge>
          <h2 className="mt-3 text-base font-semibold text-foreground">
            Application approved
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Your creator application has been approved. Creator workspace access
            is still being finalized for this account. Please refresh again
            shortly or contact support if this status does not update.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

async function RejectedPanel({ userId }: { userId: string }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="space-y-5 px-6 py-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-danger-50 text-danger-600">
            <XCircle className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <Badge variant="destructive" className="w-fit">
              Rejected
            </Badge>
            <h2 className="mt-3 text-base font-semibold text-foreground">
              Application not approved
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Unfortunately your application was not approved at this time. You
              may reapply with updated information.
            </p>
          </div>
        </div>

        <Suspense fallback={<CreatorApplyRejectedFeedbackSkeleton />}>
          <RejectedFeedbackSection userId={userId} />
        </Suspense>

        <div>
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Submit a new application
          </h3>
          <CreatorApplicationForm />
        </div>
      </CardContent>
    </Card>
  );
}

async function RejectedFeedbackSection({ userId }: { userId: string }) {
  const record = await findCreatorApplicationRecord(userId);
  const reason = record?.rejectionReason;

  if (!reason) {
    return null;
  }

  return (
    <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
      <span className="font-medium">Feedback: </span>
      {reason}
    </div>
  );
}

function ApplyPanel() {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="border-b border-border-subtle pb-4">
        <CardTitle>Apply for creator access</CardTitle>
        <CardDescription>
          Fill in the details below to submit your application. Our team reviews
          applications manually and will get back to you within 1–3 business days.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 py-6">
        <CreatorApplicationForm />
      </CardContent>
    </Card>
  );
}
