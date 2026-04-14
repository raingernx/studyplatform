import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { routes } from "@/lib/routes";

interface SetupStep {
  done: boolean;
  label: string;
  description: string;
  href: string;
  cta: string;
  requiresCanCreate?: boolean;
}

interface CreatorSetupChecklistProps {
  steps: {
    profileComplete: boolean;
    firstResourceCreated: boolean;
    firstResourcePublished: boolean;
  };
  canCreate: boolean;
}

export function CreatorSetupChecklist({ steps, canCreate }: CreatorSetupChecklistProps) {
  const items: SetupStep[] = [
    {
      done: steps.profileComplete,
      label: "Complete your creator profile",
      description:
        "Add a display name and public slug so buyers can find and trust your listings.",
      href: routes.dashboardV2CreatorProfile,
      cta: "Go to profile",
    },
    {
      done: steps.firstResourceCreated,
      label: "Create your first resource",
      description:
        "Upload a PDF or document, set a price, and write a compelling description.",
      href: routes.dashboardV2CreatorNewResource,
      cta: "Create resource",
      requiresCanCreate: true,
    },
    {
      done: steps.firstResourcePublished,
      label: "Publish to the marketplace",
      description:
        "When your listing looks good, publish it so buyers can discover and purchase it.",
      href: routes.dashboardV2CreatorResources,
      cta: "Open resource manager",
    },
  ];

  const completedCount = items.filter((s) => s.done).length;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h3 className="text-sm font-semibold text-foreground">Setup checklist</h3>
        <span className="text-xs font-medium text-muted-foreground">
          {completedCount} / {items.length} complete
        </span>
      </div>

      <ul className="divide-y divide-border/60 px-6">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-4 py-4">
            <span className="mt-0.5 shrink-0">
              {item.done ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/50" />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <p
                className={`text-sm font-medium ${
                  item.done ? "text-muted-foreground line-through" : "text-foreground"
                }`}
              >
                {item.label}
              </p>
              {!item.done && (
                <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
              )}
            </div>

            {!item.done && (!item.requiresCanCreate || canCreate) && (
              <Link
                href={item.href}
                className="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                {item.cta} →
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
