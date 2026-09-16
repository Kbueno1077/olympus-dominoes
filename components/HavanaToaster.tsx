"use client";

import { Toaster } from "@/lib/toast";
import Portal from "@mui/material/Portal";

/**
 * Scorepad toasts: bone paper, espresso type, a pip-coloured stripe on the
 * left (Havana green / terracotta / ochre / Malecon blue). The layer is
 * portaled onto `document.body` so it stacks above MUI dialogs.
 */
export default function HavanaToaster() {
  return (
    <Portal>
      <div className="olympus-toaster-layer">
        <Toaster
          theme="light"
          position="bottom-right"
          visibleToasts={3}
          closeButton
          richColors={false}
          offset={24}
          gap={10}
          duration={6000}
          toastOptions={{
            className: "olympus-toast",
          }}
        />
      </div>
    </Portal>
  );
}
