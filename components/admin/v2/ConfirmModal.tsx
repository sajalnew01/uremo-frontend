"use client";

/**
 * PATCH_66: UX Safety Layer
 * Confirmation Modal for all destructive/state-changing actions
 */

import { useEffect, useRef } from "react";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  preview?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info" | "success";
  loading?: boolean;
  // Optional input field for note/reason
  inputLabel?: string;
  inputPlaceholder?: string;
  inputValue?: string;
  onInputChange?: (value: string) => void;
  inputRequired?: boolean;
}

const variantStyles = {
  danger: {
    icon: "🚨",
    confirmBg: "bg-red-600 hover:bg-red-500",
    border: "border-red-500/30",
    iconBg: "bg-red-500/20",
  },
  warning: {
    icon: "⚠️",
    confirmBg: "bg-amber-600 hover:bg-amber-500",
    border: "border-amber-500/30",
    iconBg: "bg-amber-500/20",
  },
  info: {
    icon: "ℹ️",
    confirmBg: "bg-blue-600 hover:bg-blue-500",
    border: "border-blue-500/30",
    iconBg: "bg-blue-500/20",
  },
  success: {
    icon: "✅",
    confirmBg: "bg-emerald-600 hover:bg-emerald-500",
    border: "border-emerald-500/30",
    iconBg: "bg-emerald-500/20",
  },
};

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  preview,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "warning",
  loading = false,
  inputLabel,
  inputPlaceholder,
  inputValue,
  onInputChange,
  inputRequired = false,
}: ConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const style = variantStyles[variant];

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      modalRef.current?.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`relative w-full max-w-md bg-[#0a0d14] border ${style.border} rounded-2xl shadow-2xl overflow-hidden`}
      >
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-xl ${style.iconBg} flex items-center justify-center text-2xl flex-shrink-0`}
            >
              {style.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              {description && (
                <p className="text-sm text-slate-400 mt-1">{description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        {preview && (
          <div className="mx-6 p-4 bg-white/5 border border-white/10 rounded-xl mb-4">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
              Preview of Changes
            </div>
            {preview}
          </div>
        )}

        {/* Optional Input Field */}
        {inputLabel && onInputChange && (
          <div className="mx-6 mb-4">
            <label className="block text-sm text-slate-400 mb-2">
              {inputLabel}
              {inputRequired && <span className="text-red-400 ml-1">*</span>}
            </label>
            <textarea
              className="w-full rounded-lg border border-white/10 bg-[#020617] px-3 py-2 text-sm text-white placeholder:text-[#64748B] min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder={inputPlaceholder}
              value={inputValue || ""}
              onChange={(e) => onInputChange(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-6 pt-2 border-t border-white/5">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || (inputRequired && !inputValue?.trim())}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${style.confirmBg} transition-colors disabled:opacity-50 flex items-center gap-2`}
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
