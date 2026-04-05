import { CheckCircle2 } from "lucide-react";

interface Step {
  number: number;
  label: string;
  description: string;
}

const STEPS: Step[] = [
  {
    number: 1,
    label: "Basic info",
    description: "Title & description",
  },
  {
    number: 2,
    label: "Pricing",
    description: "Status & price",
  },
  {
    number: 3,
    label: "Delivery",
    description: "File & previews",
  },
];

interface CreatorResourceProgressProps {
  /** 1-indexed step that is currently active. Defaults to 1. */
  activeStep?: number;
}

export function CreatorResourceProgress({ activeStep = 1 }: CreatorResourceProgressProps) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, index) => {
        const isDone = step.number < activeStep;
        const isActive = step.number === activeStep;
        const isLast = index === STEPS.length - 1;

        return (
          <div key={step.number} className="flex flex-1 items-center">
            {/* Step node */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  isDone
                    ? "bg-emerald-100 text-emerald-700"
                    : isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  step.number
                )}
              </div>
              <div className="text-center">
                <p
                  className={`text-[11px] font-semibold ${
                    isActive ? "text-foreground" : isDone ? "text-emerald-600" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </p>
                <p className="hidden text-[10px] text-muted-foreground sm:block">{step.description}</p>
              </div>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className={`mx-2 h-px flex-1 transition-colors ${
                  isDone ? "bg-emerald-200" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
