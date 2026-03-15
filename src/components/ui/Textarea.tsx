import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const textareaBase =
  "w-full min-h-[120px] resize-y rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-neutral-400 outline-none transition duration-150 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-0";

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(textareaBase, className)}
      {...props}
    />
  );
}

