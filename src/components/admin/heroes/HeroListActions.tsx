"use client";

import { useState } from "react";
import { Pencil, Power, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { routes } from "@/lib/routes";
import { RowActions, RowActionButton } from "@/design-system";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface HeroListActionsProps {
  heroId: string;
  heroName: string;
  isActive: boolean;
  isFallback?: boolean;
}

export function HeroListActions(props: HeroListActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<"toggle" | "delete" | null>(null);

  const { heroId, heroName, isActive, isFallback = false } = props;

  if (!heroId) {
    return null;
  }

  function handleEdit() {
    router.push(routes.adminHero(heroId));
  }

  async function handleToggle() {
    setBusyAction("toggle");
    try {
      const res = await fetch(`/api/admin/heroes/${heroId}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: !isActive,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.error ?? "Failed to update hero.");
        return;
      }

      toast.success(isActive ? "Hero disabled." : "Hero enabled.");
      router.refresh();
    } catch {
      toast.error("Failed to update hero.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDelete() {
    setBusyAction("delete");
    try {
      const res = await fetch(`/api/admin/heroes/${heroId}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.error ?? "Failed to delete hero.");
        return;
      }

      toast.success("Hero deleted.");
      router.refresh();
    } catch {
      toast.error("Failed to delete hero.");
    } finally {
      setBusyAction(null);
    }
  }

    return (
    <>
      <RowActions className="flex-wrap">
        <RowActionButton
          type="button"
          onClick={handleEdit}
        >
          <Pencil className="h-4 w-4" />
          Edit
        </RowActionButton>
        <RowActionButton
          type="button"
          onClick={handleToggle}
          disabled={isFallback}
          loading={busyAction === "toggle"}
        >
          <Power className="h-4 w-4" />
          {isFallback ? "Always active" : isActive ? "Disable" : "Enable"}
        </RowActionButton>
        <RowActionButton
          type="button"
          tone="danger"
          disabled={isFallback}
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
          {isFallback ? "Protected" : "Delete"}
        </RowActionButton>
      </RowActions>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete "${heroName}"?`}
        description="This permanently removes the hero. If no campaign hero qualifies, the protected fallback hero will keep the homepage populated."
        confirmLabel="Delete Hero"
        onConfirm={handleDelete}
        loading={busyAction === "delete"}
      />
    </>
  );
}
