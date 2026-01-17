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

export async function POST(req: Request) {
  const backend = getBackendBase();
  const url = `${backend}/api/jarvisx/chat`;

  const bodyText = await req.text();

  const headers: Record<string, string> = {
    "Content-Type": req.headers.get("content-type") || "application/json",
  };

  const auth = req.headers.get("authorization");
  if (auth) headers.Authorization = auth;

  const cookie = req.headers.get("cookie");
  if (cookie) headers.Cookie = cookie;

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: "POST",
      headers,
      body: bodyText,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { ok: false, reply: "Network error — please try again." },
      { status: 200 }
    );
  }

  const contentType = upstream.headers.get("content-type") || "";
  const setCookie = upstream.headers.get("set-cookie");
  const raw = await upstream.text();

  // JSON guard: upstream/proxies sometimes return HTML/text. Keep client stable.
  let payload: any = null;
  if (contentType.includes("application/json")) {
    try {
      payload = raw ? JSON.parse(raw) : null;
    } catch {
      payload = null;
    }
  } else {
    try {
      payload = raw ? JSON.parse(raw) : null;
    } catch {
      payload = null;
    }
  }

  const isAuthFailure = upstream.status === 401 || upstream.status === 403;
  const status = isAuthFailure ? upstream.status : upstream.ok ? 200 : 200;

  const res = NextResponse.json(
    payload && typeof payload === "object"
      ? payload
      : {
          ok: false,
          reply: upstream.ok
            ? "Service temporarily unavailable"
            : "Service temporarily unavailable",
        },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );

  if (setCookie) res.headers.set("set-cookie", setCookie);
  return res;
}
