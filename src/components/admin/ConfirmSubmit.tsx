"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "danger";

/**
 * Button mit Bestätigungsdialog. Bestätigt der Nutzer, wird die übergebene
 * Server-Action mit den Hidden-Feldern abgesendet.
 */
export function ConfirmSubmit({
  action,
  fields,
  label,
  title,
  confirmLabel,
  variant = "primary",
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  fields: Record<string, string>;
  label: string;
  title: string;
  confirmLabel: string;
  variant?: Variant;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const triggerCls =
    variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-700"
      : "bg-accent-500 text-brand-900 hover:bg-accent-400";
  const confirmCls =
    variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-700"
      : "bg-brand-700 text-white hover:bg-brand-800";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition focus-ring",
          triggerCls,
        )}
      >
        {label}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-card bg-white p-6 shadow-card-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-ink">{title}</h3>
            {children ? (
              <div className="mt-3 max-h-72 overflow-auto text-sm text-ink-muted">
                {children}
              </div>
            ) : null}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-brand-100 px-5 py-2.5 text-sm font-semibold text-ink hover:bg-brand-50"
              >
                Abbrechen
              </button>
              <form action={action}>
                {Object.entries(fields).map(([k, v]) => (
                  <input key={k} type="hidden" name={k} value={v} />
                ))}
                <button
                  type="submit"
                  className={cn(
                    "rounded-full px-5 py-2.5 text-sm font-semibold transition",
                    confirmCls,
                  )}
                >
                  {confirmLabel}
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
