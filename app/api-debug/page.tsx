"use client";

import { useEffect, useMemo, useState } from "react";

type DebugState = {
  token: string | null;
  userRaw: string | null;
  userParsed: unknown;
  cookies: string;
};

const IS_PRODUCTION = process.env.NODE_ENV === "production";

export default function ApiDebugPage() {
  const [state, setState] = useState<DebugState>({
    token: null,
    userRaw: null,
    userParsed: null,
    cookies: "",
  });

  useEffect(() => {
    if (IS_PRODUCTION) return;
    const token = localStorage.getItem("token");
    const userRaw = localStorage.getItem("user");

    let userParsed: unknown = null;
    try {
      userParsed = userRaw ? JSON.parse(userRaw) : null;
    } catch {
      userParsed = { error: "Failed to parse localStorage.user", userRaw };
    }

    setState({
      token,
      userRaw,
      userParsed,
      cookies: document.cookie || "(no cookies)",
    });
  }, []);

  const role = useMemo(() => {
    if (!state.userParsed || typeof state.userParsed !== "object") return null;
    const record = state.userParsed as Record<string, unknown>;
    return typeof record.role === "string" ? record.role : null;
  }, [state.userParsed]);

  if (IS_PRODUCTION) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p className="text-slate-400">This page is not available.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-4">
      <h1 className="text-2xl font-bold">Auth Debug</h1>
      <p className="text-slate-400">
        This page shows what the frontend stored after login/signup.
      </p>

      <div className="border border-[#1F2937] rounded-lg bg-[#0F172A] p-4 space-y-2">
        <div>
          <span className="text-slate-400">Detected role:</span>{" "}
          <span className="font-semibold">{role || "(none)"}</span>
        </div>
        <div>
          <span className="text-slate-400">Token present:</span>{" "}
          <span className="font-semibold">{state.token ? "yes" : "no"}</span>
        </div>
      </div>

      <details className="border border-[#1F2937] rounded-lg bg-[#0F172A] p-4">
        <summary className="cursor-pointer font-semibold">Raw values</summary>
        <pre className="text-xs overflow-auto mt-3 whitespace-pre-wrap">
          {JSON.stringify(state, null, 2)}
        </pre>
      </details>
    </div>
  );
}
