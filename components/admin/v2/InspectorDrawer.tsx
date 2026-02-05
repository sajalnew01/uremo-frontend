"use client";

/**
 * PATCH_63: MASTER ADMIN REBUILD
 * InspectorDrawer - Right-side detail panel for entity inspection
 */

import { useEffect, useRef } from "react";

interface InspectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: "sm" | "md" | "lg";
}

const widthClasses = {
  sm: "w-80",
  md: "w-96",
  lg: "w-[480px]",
};

export default function InspectorDrawer({
  isOpen,
  onClose,
  title,
  children,
  width = "md",
}: InspectorDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed right-0 top-0 h-full ${widthClasses[width]} bg-[#0a0d14] border-l border-white/10 z-50 
                    transform transition-transform duration-300 ease-out
                    ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-white/5">
          <h2 className="text-white font-semibold truncate">
            {title || "Details"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-56px)] overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </>
  );
}

/**
 * Inspector Section - Group content in the drawer
 */
export function InspectorSection({
  title,
  children,
  collapsible = false,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-4">
      <button
        onClick={() => collapsible && setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full text-left mb-2 
                   ${collapsible ? "cursor-pointer" : "cursor-default"}`}
      >
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
          {title}
        </h3>
        {collapsible && (
          <span
            className={`text-slate-500 text-xs transition-transform ${isOpen ? "rotate-180" : ""}`}
          >
            ▼
          </span>
        )}
      </button>
      {isOpen && (
        <div className="bg-white/5 rounded-lg p-3 border border-white/5">
          {children}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";

/**
 * Inspector Field - Display key-value data
 */
export function InspectorField({
  label,
  value,
  type = "text",
  warning = false,
  copyable = false,
}: {
  label: string;
  value: React.ReactNode;
  type?: "text" | "badge" | "status" | "money" | "date";
  warning?: boolean;
  copyable?: boolean;
}) {
  const handleCopy = () => {
    if (typeof value === "string") {
      navigator.clipboard.writeText(value);
    }
  };

  const renderValue = () => {
    if (value === null || value === undefined || value === "") {
      return <span className="text-slate-600 italic">—</span>;
    }

    switch (type) {
      case "badge":
        return (
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium 
                           ${warning ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"}`}
          >
            {value}
          </span>
        );
      case "status":
        const statusColors: Record<string, string> = {
          pending: "bg-amber-500/20 text-amber-400",
          approved: "bg-emerald-500/20 text-emerald-400",
          rejected: "bg-red-500/20 text-red-400",
          completed: "bg-emerald-500/20 text-emerald-400",
          active: "bg-emerald-500/20 text-emerald-400",
          inactive: "bg-slate-500/20 text-slate-400",
        };
        const color =
          statusColors[String(value).toLowerCase()] ||
          "bg-slate-500/20 text-slate-400";
        return (
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>
            {String(value).toUpperCase()}
          </span>
        );
      case "money":
        return <span className="text-emerald-400 font-mono">${value}</span>;
      case "date":
        return (
          <span className="text-slate-300">{formatDate(String(value))}</span>
        );
      default:
        return (
          <span className={warning ? "text-amber-400" : "text-white"}>
            {value}
          </span>
        );
    }
  };

  return (
    <div className="flex items-start justify-between py-1.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <div className="flex items-center gap-2">
        {renderValue()}
        {copyable && typeof value === "string" && (
          <button
            onClick={handleCopy}
            className="text-slate-600 hover:text-slate-400 text-xs"
            title="Copy"
          >
            📋
          </button>
        )}
      </div>
    </div>
  );
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}
