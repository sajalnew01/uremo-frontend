"use client";

import { useRef, useEffect, useCallback } from "react";
import type { OrderMessage } from "@/types";
import { createSSEStream } from "@/lib/api";
import { EP } from "@/lib/api/endpoints";

interface UseChatStreamOptions {
  orderId: string;
  onMessage: (msg: OrderMessage) => void;
  enabled?: boolean;
}

export function useChatStream({ orderId, onMessage, enabled = true }: UseChatStreamOptions) {
  const sourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!orderId || !enabled) return;

    sourceRef.current?.close();
    sourceRef.current = createSSEStream(
      EP.ORDER_MESSAGES_STREAM(orderId),
      (data) => onMessage(data as OrderMessage),
      () => {
        // Reconnect after 3s on error
        setTimeout(() => connect(), 3000);
      }
    );
  }, [orderId, onMessage, enabled]);

  useEffect(() => {
    connect();
    return () => {
      sourceRef.current?.close();
    };
  }, [connect]);

  return {
    disconnect: () => sourceRef.current?.close(),
    reconnect: connect,
  };
}
