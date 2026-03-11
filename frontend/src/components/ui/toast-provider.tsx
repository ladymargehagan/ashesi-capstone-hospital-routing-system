"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";

// ---- Types ----

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  title?: string;
}

interface ToastContextValue {
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

// ---- Context ----

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

// ---- Toast config by variant ----

const VARIANT_CONFIG: Record<
  ToastVariant,
  { icon: React.FC<{ className?: string }>; bg: string; border: string; iconColor: string }
> = {
  success: {
    icon: ({ className }) => <CheckCircle2 className={className} />,
    bg: "bg-white",
    border: "border-l-4 border-l-green-500",
    iconColor: "text-green-500",
  },
  error: {
    icon: ({ className }) => <XCircle className={className} />,
    bg: "bg-white",
    border: "border-l-4 border-l-red-500",
    iconColor: "text-red-500",
  },
  warning: {
    icon: ({ className }) => <AlertTriangle className={className} />,
    bg: "bg-white",
    border: "border-l-4 border-l-yellow-500",
    iconColor: "text-yellow-500",
  },
  info: {
    icon: ({ className }) => <Info className={className} />,
    bg: "bg-white",
    border: "border-l-4 border-l-blue-500",
    iconColor: "text-blue-500",
  },
};

const DEFAULT_TITLES: Record<ToastVariant, string> = {
  success: "Success",
  error: "Error",
  warning: "Warning",
  info: "Info",
};

// ---- Individual Toast ----

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const cfg = VARIANT_CONFIG[toast.variant];
  const Icon = cfg.icon;
  const title = toast.title ?? DEFAULT_TITLES[toast.variant];

  return (
    <div
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border shadow-lg ${cfg.bg} ${cfg.border} px-4 py-3 animate-in slide-in-from-bottom-5 fade-in duration-300`}
      role="alert"
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${cfg.iconColor}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="mt-0.5 text-sm text-gray-600 leading-snug">{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}

// ---- Provider ----

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timerRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timerRefs.current[id]) {
      clearTimeout(timerRefs.current[id]);
      delete timerRefs.current[id];
    }
  }, []);

  const addToast = useCallback(
    (message: string, variant: ToastVariant, title?: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, message, variant, title }]);

      // Auto-dismiss after 5 seconds
      timerRefs.current[id] = setTimeout(() => dismiss(id), 5000);
    },
    [dismiss]
  );

  const ctx: ToastContextValue = {
    success: (msg, title) => addToast(msg, "success", title),
    error: (msg, title) => addToast(msg, "error", title),
    warning: (msg, title) => addToast(msg, "warning", title),
    info: (msg, title) => addToast(msg, "info", title),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {/* Toast container — bottom-right */}
      <div
        className="pointer-events-none fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
