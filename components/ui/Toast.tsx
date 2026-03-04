"use client";
// Toast is powered by Sonner — this is a thin re-export with PSIQUE styling
import { Toaster, toast as sonnerToast } from "sonner";

export function Toast() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: "var(--card2)",
          border: "1px solid var(--border2)",
          color: "var(--text)",
          fontFamily: "var(--fs)",
          fontSize: "13px",
        },
        classNames: {
          success: "!border-[rgba(82,183,136,.4)]",
          error: "!border-[rgba(184,84,80,.4)]",
          warning: "!border-[rgba(196,163,90,.4)]",
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
