"use client";

// Toast is powered by Sonner — this is a thin re-export with PSIQUE styling
import { Toaster, toast as sonnerToast } from "sonner";

export function Toast() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "border border-border-strong bg-surface-hover text-text-primary font-[family-name:var(--font-sans)] text-[13px]",
          success: "!border-[rgba(82,183,136,.4)]",
          error: "!border-[rgba(248,113,113,.4)]",
          warning: "!border-[rgba(251,191,36,.4)]",
        },
      }}
    />
  );
}

export const toast = {
  success: (msg: string) => sonnerToast.success(msg),
  error: (msg: string) => sonnerToast.error(msg),
  info: (msg: string) => sonnerToast.info(msg),
  warning: (msg: string) => sonnerToast.warning(msg),
  loading: (msg: string) => sonnerToast.loading(msg),
  promise: sonnerToast.promise,
  dismiss: sonnerToast.dismiss,
};
