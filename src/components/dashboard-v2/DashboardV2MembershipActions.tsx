"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/design-system";
import { useToast } from "@/design-system/primitives/useToast";
import { routes } from "@/lib/routes";

type DashboardV2MembershipActionsProps = {
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  canCancelSubscription: boolean;
  cancellationScheduled: boolean;
  subscriptionState?: string | null;
};

export function DashboardV2MembershipActions({
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  canCancelSubscription,
  cancellationScheduled,
  subscriptionState,
}: DashboardV2MembershipActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isCancelling, setIsCancelling] = useState(false);
  const normalizedSubscriptionState = useMemo(
    () => subscriptionState?.toLowerCase() ?? null,
    [subscriptionState],
  );

  useEffect(() => {
    if (normalizedSubscriptionState !== "success") {
      return;
    }

    toast.success("Membership updated.");
    router.replace(routes.dashboardV2Membership);
  }, [normalizedSubscriptionState, router, toast]);

  async function handleCancelRenewal() {
    if (!canCancelSubscription) return;

    setIsCancelling(true);

    try {
      const response = await fetch("/api/subscriptions", {
        method: "DELETE",
      });
      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(json.error || "Could not cancel renewal.");
      }

      toast.success("Renewal will end at period close.");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not cancel renewal.",
      );
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild size="sm">
        <Link href={primaryHref}>{primaryLabel}</Link>
      </Button>
      <Button asChild size="sm" variant="secondary">
        <Link href={secondaryHref}>{secondaryLabel}</Link>
      </Button>
      {canCancelSubscription ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          leftIcon={isCancelling ? <Loader2 className="size-4 animate-spin" /> : null}
          loading={isCancelling}
          onClick={() => {
            void handleCancelRenewal();
          }}
        >
          Cancel renewal
        </Button>
      ) : null}
      {!canCancelSubscription && cancellationScheduled ? (
        <p className="text-caption font-medium text-muted-foreground">
          Renewal ends at period close.
        </p>
      ) : null}
    </div>
  );
}
