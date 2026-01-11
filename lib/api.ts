export async function apiRequest<T = any>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body: any = null,
  auth: boolean = false,
  isFormData: boolean = false
): Promise<T> {
  const baseUrl = (
    process.env.NEXT_PUBLIC_API_URL || "https://uremo-backend.onrender.com"
  ).replace(/\/+$/, "");

  const headers: Record<string, string> = {};

  const isBodyAllowed = method !== "GET" && method !== "DELETE";

  if (!isFormData && isBodyAllowed) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      throw new Error("Authentication required");
    }

    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutMs = 30_000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    const requestInit: RequestInit = {
      method,
      headers,
      signal: controller.signal,
    };

    // ✅ Only attach body for POST/PUT (never for GET/DELETE)
    if (isBodyAllowed && body !== null && body !== undefined) {
      requestInit.body = isFormData ? (body as BodyInit) : JSON.stringify(body);
    }

    res = await fetch(`${baseUrl}${endpoint}`, requestInit);
  } catch (err: unknown) {
    const maybeError = err as { name?: string };
    if (maybeError?.name === "AbortError") {
      throw new Error(
        "Request timed out (server may be waking up). Please try again."
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  // If auth fails, clear potentially stale tokens to prevent repeated bad state.
  if (typeof window !== "undefined" && (res.status === 401 || res.status === 403)) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "role=; Path=/; Max-Age=0; SameSite=Lax";
    window.dispatchEvent(new Event("auth-changed"));
  }

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload: unknown = isJson
    ? await res.json().catch(() => null)
    : await res.text();

  const extractMessage = (value: unknown): string | null => {
    if (!value || typeof value !== "object") return null;
    const record = value as Record<string, unknown>;
    return typeof record.message === "string" ? record.message : null;
  };

  if (!res.ok) {
    const message =
      (isJson ? extractMessage(payload) : null) ||
      (typeof payload === "string" && payload.trim() ? payload : null) ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }

  return payload as T;
}
