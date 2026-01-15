"use client";

import { useMemo, useState } from "react";

type FileType = "image" | "pdf" | "raw";

function detectFileType(url: string, type?: FileType) {
  if (type === "raw" || type === "pdf") return "pdf" as const;
  const lower = String(url || "").toLowerCase();
  if (lower.includes(".pdf") || lower.includes("/raw/upload/"))
    return "pdf" as const;
  return "image" as const;
}

export default function FilePreview(props: {
  url?: string | null;
  label?: string;
  type?: FileType;
}) {
  const url = props.url || "";
  const label = props.label || "Open";
  const resolved = useMemo(
    () => detectFileType(url, props.type),
    [url, props.type]
  );

  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  if (!url) return null;

  const onOpen = () => {
    if (resolved === "pdf") {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    setZoom(1);
    setOpen(true);
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onOpen}
          className="px-3 py-2 text-sm rounded bg-white/5 border border-white/10 text-white hover:bg-white/10"
        >
          {label}
        </button>

        <a
          href={url}
          download
          target="_blank"
          rel="noreferrer"
          className="px-3 py-2 text-sm rounded bg-white/5 border border-white/10 text-white hover:bg-white/10"
        >
          Download
        </a>
      </div>

      {open && resolved === "image" && (
        <div
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl max-h-[90vh] rounded-2xl border border-white/15 bg-[#0a0f1a] shadow-[0_30px_80px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fixed header with close */}
            <div className="sticky top-0 z-10 flex items-center justify-between gap-2 px-4 py-3 border-b border-white/10 bg-[#0a0f1a]">
              <p className="text-sm text-white font-semibold">Preview</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))
                  }
                  className="px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition"
                >
                  −
                </button>
                <span className="text-xs text-slate-400 min-w-[3rem] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))))
                  }
                  className="px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="ml-2 px-3 py-1.5 text-xs rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 hover:bg-red-500/30 transition font-medium"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div
              className="flex-1 overflow-auto p-4"
              style={{ maxHeight: "calc(90vh - 60px)" }}
            >
              <div className="flex items-center justify-center min-h-[200px]">
                <img
                  src={url}
                  alt="Preview"
                  className="max-w-full h-auto rounded-lg border border-white/10"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: "center center",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export { detectFileType };
