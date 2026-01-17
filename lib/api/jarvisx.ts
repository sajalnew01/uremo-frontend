import { ApiError, apiRequest } from "@/lib/api";

export type JarvisXMode = "public" | "admin";

export type JarvisXChatRequest = {
  message: string;
  mode: JarvisXMode;
  meta?: Record<string, unknown>;
  quickReply?: string;
  sessionId?: string;
};

export type JarvisXChatResponse = {
  ok?: boolean;
  message?: string;
  reply: string;
  intent?: string;
  quickReplies?: string[];
  usedSources?: string[];
  suggestedActions?: Array<{ label: string; url: string }>;
  leadCapture?: { requestId?: string; step?: string };
  didCreateRequest?: boolean;
  maintenance?: boolean;
  error?: { message?: string };
};

function toErrorMessage(error: unknown): string {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

export const jarvisxApi = {
  sendMessage: async (data: JarvisXChatRequest): Promise<JarvisXChatResponse> => {
    try {
      const call = () =>
        apiRequest<JarvisXChatResponse>(
          "/api/jarvisx/chat",
          "POST",
          data,
          data.mode === "admin",
          false,
          { timeoutMs: 20_000 }
        );

      let res: JarvisXChatResponse;
      try {
        res = await call();
      } catch {
        // one retry only
        await new Promise((r) => setTimeout(r, 350));
        res = await call();
      }

      const reply = String(res?.reply || res?.message || "").trim();
      return {
        ...res,
        ok: res?.ok ?? true,
        reply: reply || "Service temporarily unavailable",
      };
    } catch (error) {
      return {
        ok: false,
        reply: "Network error — please try again.",
        quickReplies: [],
        error: { message: toErrorMessage(error) },
      };
    }
  },
};
