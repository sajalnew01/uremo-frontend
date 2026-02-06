"use client";

/**
 * PATCH_66: UX Safety Layer
 * Undo Toast with countdown timer
 */

import { useEffect, useState, useCallback } from "react";

interface UndoToastProps {
  message: string;
  duration?: number; // seconds
  onUndo: () => void;
  onExpire: () => void;
  show: boolean;
}

export default function UndoToast({
  message,
  duration = 8,
  onUndo,
  onExpire,
  show,
}: UndoToastProps) {
  const [remaining, setRemaining] = useState(duration);

  useEffect(() => {
    if (!show) {
      setRemaining(duration);
      return;
    }

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [show, duration, onExpire]);

  if (!show) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in">
      <div className="bg-[#0a0d14] border border-white/10 rounded-xl shadow-2xl p-4 flex items-center gap-4 min-w-[320px]">
        {/* Progress Ring */}
        <div className="relative w-10 h-10 flex-shrink-0">
          <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="3"
            />
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeDasharray={100}
              strokeDashoffset={(1 - remaining / duration) * 100}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
            {remaining}
          </span>
        </div>

        {/* Message */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium truncate">{message}</p>
          <p className="text-xs text-slate-500">Click undo to reverse</p>
        </div>

        {/* Undo Button */}
        <button
          onClick={onUndo}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors flex-shrink-0"
        >
          Undo
        </button>
      </div>
    </div>
  );
}

// Hook for managing undo toast state
export function useUndoToast() {
  const [state, setState] = useState<{
    show: boolean;
    message: string;
    undoFn: (() => void) | null;
    expireFn: (() => void) | null;
  }>({
    show: false,
    message: "",
    undoFn: null,
    expireFn: null,
  });

  const showUndo = useCallback(
    (message: string, undoFn: () => void, expireFn?: () => void) => {
      setState({
        show: true,
        message,
        undoFn,
        expireFn: expireFn || null,
      });
    },
    [],
  );

  const handleUndo = useCallback(() => {
    state.undoFn?.();
    setState((prev) => ({ ...prev, show: false }));
  }, [state.undoFn]);

  const handleExpire = useCallback(() => {
    state.expireFn?.();
    setState((prev) => ({ ...prev, show: false }));
  }, [state.expireFn]);

  const hide = useCallback(() => {
    setState((prev) => ({ ...prev, show: false }));
  }, []);

  return {
    show: state.show,
    message: state.message,
    showUndo,
    handleUndo,
    handleExpire,
    hide,
  };
}
