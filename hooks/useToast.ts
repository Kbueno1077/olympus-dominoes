"use client";

import { toast } from "@/lib/toast";
import { useCallback } from "react";

export type ToastVariant = "success" | "error" | "warning" | "info" | "default";

type ToastOptions = {
  detail?: string;
};

/**
 * Site toasts. Pass `detail` on errors so the snackbar says what happened
 * and what to try next, not only a one-word failure.
 */
export default function useToast() {
  return useCallback(
    (message: string, type: ToastVariant = "default", options?: ToastOptions) => {
      const description = options?.detail;

      switch (type) {
        case "success":
          toast.success(message, { description });
          return;
        case "error":
          toast.error(message, { description });
          return;
        case "warning":
          toast.warning(message, { description });
          return;
        case "info":
          toast.info(message, { description });
          return;
        case "default":
          toast(message, { description });
          return;
        default: {
          const _exhaustive: never = type;
          return _exhaustive;
        }
      }
    },
    []
  );
}
