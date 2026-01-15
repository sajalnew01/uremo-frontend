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
  reply: string;
  intent?: string;
  quickReplies?: string[];
  usedSources?: string[];
  suggestedActions?: Array<{ label: string; url: string }>;
  leadCapture?: { requestId?: string; step?: string };
  didCreateRequest?: boolean;
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
      const res = await apiRequest<JarvisXChatResponse>(
        "/api/jarvisx/chat",
        "POST",
        data,
        data.mode === "admin"
      );

      const reply = String(res?.reply || "").trim();
      return {
        ...res,
        ok: res?.ok ?? true,
        reply: reply || "Service temporarily unavailable",
      };
    } catch (error) {
      return {
        ok: false,
        reply: "Service temporarily unavailable",
        quickReplies: [],
        error: { message: toErrorMessage(error) },
      };
    }
  },
};
