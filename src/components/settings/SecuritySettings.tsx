"use client";

import { useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { Button, FormSection } from "@/design-system";

export function SecuritySettings() {
  const [isChanging, setIsChanging] = useState(false);

  function handleChangePassword() {
    setIsChanging(true);
    // Mock API for now
    setTimeout(() => {
      console.log("Change password clicked");
      setIsChanging(false);
    }, 500);
  }

  return (
    <FormSection
      title="Security"
      description="Manage your password and login security."
      footer={
        <Button
          size="sm"
          variant="secondary"
          loading={isChanging}
          onClick={handleChangePassword}
        >
          Change password
        </Button>
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <p className="flex items-center gap-2 text-[13px] font-medium text-zinc-900">
            <Lock className="h-4 w-4 text-zinc-400" />
            Password
          </p>
          <p className="text-[12px] text-zinc-500">
            Keep your account secure by using a strong, unique password.
          </p>
          <p className="mt-1 flex items-center gap-1 text-[11px] text-zinc-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Password last updated: <span className="font-medium">—</span>
          </p>
        </div>
      </div>
    </FormSection>
  );
}
