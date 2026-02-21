import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://uremo-backend.onrender.com";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization");

    const res = await fetch(`${API_BASE}/api/jarvisx/ping`, {
      headers: {
        ...(token ? { Authorization: token } : {}),
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "JarvisX ping proxy error" }, { status: 500 });
  }
}
