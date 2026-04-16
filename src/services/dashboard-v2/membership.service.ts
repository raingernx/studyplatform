import { formatDate } from "@/lib/format";
import { routes } from "@/lib/routes";
import {
  getUserMembershipOverview,
  getUserSubscription,
} from "@/services/subscriptions/subscription.service";

type DashboardV2MembershipBadgeVariant = "success" | "warning" | "neutral";

export interface DashboardV2MembershipSummaryCard {
  label: string;
  value: string;
  detail: string;
  badgeLabel?: string;
  badgeVariant?: DashboardV2MembershipBadgeVariant;
}

export interface DashboardV2MembershipData {
  state: "ready" | "error";
  badgeLabel: string;
  badgeVariant: DashboardV2MembershipBadgeVariant;
  status: string;
  title: string;
  detail: string;
  support: string;
  primaryCtaHref: string;
  primaryCtaLabel: string;
  secondaryCtaHref: string;
  secondaryCtaLabel: string;
  canCancelSubscription: boolean;
  cancellationScheduled: boolean;
  summaryCards: DashboardV2MembershipSummaryCard[];
  errorTitle?: string;
  errorDescription?: string;
}

function humanizePlan(plan: string | null | undefined) {
  if (!plan) {
    return "Free";
  }

  return plan
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function normalizeStatus(status: string | null | undefined) {
  return status?.toUpperCase() ?? "INACTIVE";
}

function getStatusBadge(status: string): {
  label: string;
  variant: DashboardV2MembershipBadgeVariant;
} {
  switch (status) {
    case "ACTIVE":
      return { label: "Active", variant: "success" };
    case "TRIALING":
      return { label: "Trial", variant: "success" };
    case "PAST_DUE":
      return { label: "Action needed", variant: "warning" };
    case "CANCELED":
      return { label: "Ending", variant: "warning" };
    default:
      return { label: "Free", variant: "neutral" };
  }
}

export async function getDashboardV2MembershipData(input: {
  userId: string;
  fallbackSubscriptionStatus?: string | null;
}): Promise<DashboardV2MembershipData> {
  try {
    const [overview, subscription] = await Promise.all([
      getUserMembershipOverview(input.userId),
      getUserSubscription(input.userId),
    ]);

    if (!overview && !subscription) {
      return {
        state: "error",
        badgeLabel: "Unavailable",
        badgeVariant: "warning",
        status: "UNAVAILABLE",
        title: "Membership unavailable",
        detail: "We could not find your membership profile.",
        support: "Try refreshing this page or signing in again.",
        primaryCtaHref: routes.dashboardV2Membership,
        primaryCtaLabel: "Retry",
        secondaryCtaHref: routes.dashboardV2Purchases,
        secondaryCtaLabel: "View purchases",
        canCancelSubscription: false,
        cancellationScheduled: false,
        summaryCards: [],
        errorTitle: "Could not load membership",
        errorDescription:
          "Your account is still intact, but this route could not read the current membership state.",
      };
    }

    const normalizedStatus = normalizeStatus(
      subscription?.subscriptionStatus ??
        overview?.subscriptionStatus ??
        input.fallbackSubscriptionStatus,
    );
    const badge = getStatusBadge(normalizedStatus);
    const planName = humanizePlan(
      subscription?.subscriptionPlan ?? overview?.subscriptionPlan,
    );
    const purchaseCount = overview?.purchases.length ?? 0;
    const currentPeriodEnd =
      subscription?.currentPeriodEnd ?? overview?.currentPeriodEnd ?? null;
    const hasStripeSubscription = Boolean(subscription?.stripeSubscriptionId);
    const hasPaidAccess =
      normalizedStatus === "ACTIVE" ||
      normalizedStatus === "TRIALING" ||
      normalizedStatus === "CANCELED";
    const canCancelSubscription =
      hasStripeSubscription &&
      (normalizedStatus === "ACTIVE" ||
        normalizedStatus === "TRIALING" ||
        normalizedStatus === "PAST_DUE");
    const cancellationScheduled =
      hasStripeSubscription && normalizedStatus === "CANCELED";

    const title = hasPaidAccess
      ? `${planName} membership`
      : normalizedStatus === "PAST_DUE"
        ? `${planName} membership needs attention`
        : "Free plan";

    const detail =
      normalizedStatus === "ACTIVE" && currentPeriodEnd
        ? `Unlimited access is active. Renews ${formatDate(currentPeriodEnd)}.`
        : normalizedStatus === "TRIALING" && currentPeriodEnd
          ? `Trial access is active. Trial ends ${formatDate(currentPeriodEnd)}.`
          : normalizedStatus === "PAST_DUE"
            ? "Membership access is limited until billing is updated."
            : normalizedStatus === "CANCELED" && currentPeriodEnd
              ? `Membership stays available until ${formatDate(currentPeriodEnd)}.`
              : `${purchaseCount} owned resource${
                  purchaseCount === 1 ? "" : "s"
                } remain available on the free plan.`;

    const support = normalizedStatus === "ACTIVE" || normalizedStatus === "TRIALING"
      ? "Use Library for unlimited access and Purchases for invoice history."
      : normalizedStatus === "CANCELED"
        ? "Your membership is set to end at the close of the current billing period."
      : normalizedStatus === "PAST_DUE"
        ? "Review plans from the membership page, then check purchases if you need past receipts."
        : "You can keep purchasing resources individually or move to a membership plan later.";

    const renewalValue =
      normalizedStatus === "ACTIVE" && currentPeriodEnd
        ? formatDate(currentPeriodEnd)
        : normalizedStatus === "TRIALING" && currentPeriodEnd
          ? formatDate(currentPeriodEnd)
          : normalizedStatus === "CANCELED" && currentPeriodEnd
            ? formatDate(currentPeriodEnd)
            : "No renewal scheduled";

    const renewalDetail =
      normalizedStatus === "ACTIVE"
        ? "Next billing date"
        : normalizedStatus === "TRIALING"
          ? "Trial end date"
          : normalizedStatus === "CANCELED"
            ? "Access end date"
            : "Free plan or no active subscription";

    const billingValue = hasStripeSubscription
      ? normalizedStatus === "PAST_DUE"
        ? "Payment update needed"
        : normalizedStatus === "CANCELED"
          ? "Cancellation scheduled"
          : "Subscription on file"
      : "No billing record";

    const billingDetail = hasStripeSubscription
      ? "Private billing data stays behind your authenticated account."
      : "Upgrade from the public membership page when you need unlimited access.";

    const primaryCtaHref = hasPaidAccess
      ? routes.dashboardV2Library
      : routes.membership;
    const primaryCtaLabel = hasPaidAccess ? "Open library" : "Explore plans";

    return {
      state: "ready",
      badgeLabel: badge.label,
      badgeVariant: badge.variant,
      status: normalizedStatus,
      title,
      detail,
      support,
      primaryCtaHref,
      primaryCtaLabel,
      secondaryCtaHref: routes.dashboardV2Purchases,
      secondaryCtaLabel: "View purchases",
      canCancelSubscription,
      cancellationScheduled,
      summaryCards: [
        {
          label: "Current plan",
          value: hasPaidAccess || normalizedStatus === "PAST_DUE"
            ? planName
            : "Free",
          detail: normalizedStatus === "ACTIVE" || normalizedStatus === "TRIALING"
            ? "Unlimited library access"
            : normalizedStatus === "PAST_DUE"
              ? "Billing attention required"
              : normalizedStatus === "CANCELED"
                ? "Access stays live until period end"
                : "Buy resources one at a time",
          badgeLabel: badge.label,
          badgeVariant: badge.variant,
        },
        {
          label: "Renewal",
          value: renewalValue,
          detail: renewalDetail,
        },
        {
          label: "Billing",
          value: billingValue,
          detail: billingDetail,
        },
      ],
    };
  } catch {
    return {
      state: "error",
      badgeLabel: "Unavailable",
      badgeVariant: "warning",
      status: "UNAVAILABLE",
      title: "Membership unavailable",
      detail: "This route could not load your subscription state.",
      support: "Try refreshing this page. Your account data is still preserved.",
      primaryCtaHref: routes.dashboardV2Membership,
      primaryCtaLabel: "Retry",
      secondaryCtaHref: routes.dashboardV2Purchases,
      secondaryCtaLabel: "View purchases",
      canCancelSubscription: false,
      cancellationScheduled: false,
      summaryCards: [],
      errorTitle: "Could not load membership",
      errorDescription:
        "Try refreshing this page. Billing and access state are still protected behind your authenticated account.",
    };
  }
}
