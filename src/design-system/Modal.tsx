"use client";

import { useState, type ReactNode } from "react";

/* ─── CONFIRM MODAL ─── */
interface ModalProps {
  open: boolean;
  title: string;
  message: string | ReactNode;
  confirmLabel?: string;
  confirmVariant?: "primary" | "danger";
  variant?: "primary" | "danger";
  onConfirm: () => void | Promise<void | unknown>;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  confirmVariant,
  variant,
  onConfirm,
  onCancel,
}: ModalProps) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: "var(--z-modal)" as unknown as number,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onCancel}
    >
      <div
        className="u-card"
        style={{
          maxWidth: 420,
          width: "90%",
          boxShadow: "var(--shadow-lg)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="u-heading-3" style={{ marginBottom: "var(--space-3)" }}>
          {title}
        </h3>
        <div style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-5)" }}>
          {message}
        </div>
        <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end" }}>
          <button className="u-btn u-btn-secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button
            className={`u-btn u-btn-${confirmVariant ?? variant ?? "primary"}`}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? <span className="u-spinner" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
