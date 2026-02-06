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
  const url = `${backend}/api/jarvisx/admin/health`;

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

  const contentType = upstream.headers.get("content-type") || "";
  const raw = await upstream.text();

  let payload: any = null;
  if (contentType.includes("application/json")) {
    try {
      payload = raw ? JSON.parse(raw) : null;
    } catch {
      payload = null;
    }
  }

  if (!upstream.ok) {
    return NextResponse.json(
      payload || { message: raw || "Health report unavailable" },
      { status: upstream.status, headers: { "Cache-Control": "no-store" } },
    );
  }

  const generatedAt = String(payload?.timestamp || new Date().toISOString());
  const provider = String(payload?.llm?.provider || "");
  const model = String(payload?.llm?.model || "");
  const configured = Boolean(payload?.llm?.configured);

  return NextResponse.json(
    { generatedAt, llm: { configured, provider, model } },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
