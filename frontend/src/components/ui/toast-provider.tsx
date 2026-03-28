"use client";

import { Toaster, toast } from "sonner";

// Re-export a useToast hook that wraps sonner's toast API
// so existing components don't need to change their imports.
export function useToast() {
  return {
    success: (message: string, title?: string) =>
      toast.success(title || "Success", { description: message }),
    error: (message: string, title?: string) =>
      toast.error(title || "Error", { description: message }),
    warning: (message: string, title?: string) =>
      toast.warning(title || "Warning", { description: message }),
    info: (message: string, title?: string) =>
      toast.info(title || "Info", { description: message }),
  };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          duration: 5000,
          style: {
            fontSize: "14px",
          },
        }}
      />
    </>
  );
}
