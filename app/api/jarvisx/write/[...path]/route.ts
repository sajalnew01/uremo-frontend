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

type RouteParams = { path?: string[] };
type RouteContext = { params: Promise<RouteParams> };

async function proxyWrite(req: Request, params: RouteParams) {
  const backend = getBackendBase();
  const tail = Array.isArray(params?.path) ? params.path.join("/") : "";
  const url = `${backend}/api/jarvisx/write/${tail}`.replace(/\/+$/, "");

  const headers: Record<string, string> = {
    "Content-Type": req.headers.get("content-type") || "application/json",
  };

  const auth = req.headers.get("authorization");
  if (auth) headers.Authorization = auth;

  const cookie = req.headers.get("cookie");
  if (cookie) headers.Cookie = cookie;

  const bodyText =
    req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined;

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: req.method,
      headers,
      body: bodyText,
      cache: "no-store",
    });
  } catch (err) {
    console.error("[JARVISX_WRITE_PROXY_NETWORK_ERROR]", {
      method: req.method,
      tail,
      message: (err as any)?.message,
    });
    return NextResponse.json(
      { ok: false, message: "Network error — please try again." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  const contentType = upstream.headers.get("content-type") || "";
  const setCookie = upstream.headers.get("set-cookie");
  const raw = await upstream.text();

  let payload: any = null;
  if (contentType.includes("application/json")) {
    try {
      payload = raw ? JSON.parse(raw) : null;
    } catch {
      payload = null;
    }
  } else {
    payload = raw;
  }

  if (!upstream.ok) {
    console.error("[JARVISX_WRITE_PROXY_UPSTREAM_ERROR]", {
      method: req.method,
      tail,
      status: upstream.status,
      bodySnippet: typeof raw === "string" ? raw.slice(0, 300) : "",
    });
  }

  const res = NextResponse.json(payload ?? null, {
    status: upstream.status,
    headers: { "Cache-Control": "no-store" },
  });

  if (setCookie) res.headers.set("set-cookie", setCookie);
  return res;
}

export async function GET(req: Request, ctx: RouteContext) {
  const params = await ctx.params;
  return proxyWrite(req, params);
}

export async function POST(req: Request, ctx: RouteContext) {
  const params = await ctx.params;
  return proxyWrite(req, params);
}

export async function PUT(req: Request, ctx: RouteContext) {
  const params = await ctx.params;
  return proxyWrite(req, params);
}

export async function PATCH(req: Request, ctx: RouteContext) {
  const params = await ctx.params;
  return proxyWrite(req, params);
}

export async function DELETE(req: Request, ctx: RouteContext) {
  const params = await ctx.params;
  return proxyWrite(req, params);
}
