/* ─── API REQUEST HELPER ─── */
// Single source of truth for all backend calls.
// Mirrors backend CORS + auth contract exactly.

const BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://uremo-backend.onrender.com";

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions {
  /** Override default 30s timeout (ms) */
  timeout?: number;
  /** Extra headers */
  headers?: Record<string, string>;
  /** Abort signal */
  signal?: AbortSignal;
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
  body?: unknown,
  auth = false,
  isFormData = false,
  options: RequestOptions = {}
): Promise<T> {
  const url = `${BASE}${endpoint}`;
  const timeout = options.timeout ?? 30_000;

  const headers: Record<string, string> = { ...options.headers };

  if (auth) {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  if (!isFormData && body) {
    headers["Content-Type"] = "application/json";
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      method,
      headers,
      credentials: "include",
      body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
      signal: options.signal ?? controller.signal,
    });

    if (res.status === 401) {
      clearAuthSession();
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new ApiError(
        res.status,
        (data as Record<string, string>).message ||
          (data as Record<string, string>).error ||
          `Request failed (${res.status})`,
        data
      );
    }

    const contentType = res.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return (await res.json()) as T;
    }
    return (await res.text()) as unknown as T;
  } finally {
    clearTimeout(timer);
  }
}

/* ─── SSE HELPER ─── */
export function createSSEStream(
  endpoint: string,
  onMessage: (data: unknown) => void,
  onError?: (e: Event) => void
) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : "";
  const url = `${BASE}${endpoint}${endpoint.includes("?") ? "&" : "?"}token=${token}`;

  const source = new EventSource(url);
  source.onmessage = (e) => {
    try {
      onMessage(JSON.parse(e.data));
    } catch {
      onMessage(e.data);
    }
  };
  source.onerror = (e) => {
    onError?.(e);
  };
  return source;
}

/* ─── AUTH SESSION HELPERS ─── */
export function clearAuthSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getStoredUser(): { id: string; role: string; name: string; email: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAuthSession(token: string, user: Record<string, unknown>) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export { BASE as API_BASE };
