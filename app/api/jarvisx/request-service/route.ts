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
  const url = `${backend}/api/jarvisx/request-service`;

  const bodyText = await req.text();

  const headers: Record<string, string> = {
    "Content-Type": req.headers.get("content-type") || "application/json",
  };

  const auth = req.headers.get("authorization");
  if (auth) headers.Authorization = auth;

  const cookie = req.headers.get("cookie");
  if (cookie) headers.Cookie = cookie;

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers,
      body: bodyText,
      cache: "no-store",
    });

    const setCookie = upstream.headers.get("set-cookie");
    const contentType = upstream.headers.get("content-type") || "";
    const raw = await upstream.text();

    const res = new NextResponse(raw, {
      status: upstream.status,
      headers: {
        "Content-Type": contentType || "application/json",
        "Cache-Control": "no-store",
      },
    });

    if (setCookie) res.headers.set("set-cookie", setCookie);
    return res;
  } catch {
    return NextResponse.json(
      { success: false, message: "Unable to create request" },
      { status: 200 }
    );
  }
}
