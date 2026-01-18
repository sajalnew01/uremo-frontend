import { NextResponse } from "next/server";

const DEFAULT_BACKEND = "https://uremo-backend.onrender.com";

function getBackendBase(): string {
  const raw =
    process.env.JARVISX_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    DEFAULT_BACKEND;
  return String(raw || DEFAULT_BACKEND).replace(/\/+$/, "");
}

export const runtime = "nodejs";

export async function GET(req: Request) {
  const backend = getBackendBase();
  const url = `${backend}/api/jarvisx/write/health`;

  const headers: Record<string, string> = {};

  const auth = req.headers.get("authorization");
  if (auth) headers.Authorization = auth;

  const cookie = req.headers.get("cookie");
  if (cookie) headers.Cookie = cookie;

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { llm: { configured: false, provider: "groq", model: "" } },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }

  const raw = await upstream.text();
  let payload: any = null;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    payload = null;
  }

  // Backend shape: { provider, model, configured, ... }
  const provider = String(payload?.provider || "groq");
  const model = String(payload?.model || "");
  const configured = Boolean(payload?.configured);

  return NextResponse.json(
    { llm: { configured, provider, model } },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
