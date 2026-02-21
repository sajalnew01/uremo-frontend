"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import {
  MetricsRibbon,
  DataGrid,
  Badge,
  ConfirmModal,
  type Column,
} from "@/design-system";
import { emitToast } from "@/hooks/useToast";

export default function TicketsEngine() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [inspectId, setInspectId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    msg: string;
    fn: () => Promise<unknown>;
  } | null>(null);
  const [reply, setReply] = useState("");

  /* ─── QUERIES ─── */
  const { data: ticketsData, isLoading: ticketsLoading } = useQuery({
    queryKey: ["admin-tickets", page],
    queryFn: () =>
      apiRequest<{
        tickets: Record<string, unknown>[];
        total: number;
        pages: number;
      }>(EP.ADMIN_TICKETS + `?page=${page}&limit=20`, "GET", undefined, true),
  });

  const { data: unreadData } = useQuery({
    queryKey: ["admin-tickets-unread"],
    queryFn: () =>
      apiRequest<{ count: number }>(
        EP.ADMIN_TICKETS_UNREAD,
        "GET",
        undefined,
        true,
      ),
  });

  const { data: inspected } = useQuery({
    queryKey: ["admin-ticket", inspectId],
    queryFn: () =>
      apiRequest<{ ticket: Record<string, unknown> }>(
        EP.ADMIN_TICKET_BY_ID(inspectId!),
        "GET",
        undefined,
        true,
      ),
    enabled: !!inspectId,
  });

  const { data: messagesData } = useQuery({
    queryKey: ["admin-ticket-messages", inspectId],
    queryFn: () =>
      apiRequest<{ messages: Record<string, unknown>[] }>(
        EP.ADMIN_TICKET_MESSAGES(inspectId!),
        "GET",
        undefined,
        true,
      ),
    enabled: !!inspectId,
    refetchInterval: 15000,
  });

  const { data: notesData } = useQuery({
    queryKey: ["admin-ticket-notes", inspectId],
    queryFn: () =>
      apiRequest<{ notes: Record<string, unknown>[] }>(
        EP.ADMIN_TICKET_NOTES(inspectId!),
        "GET",
        undefined,
        true,
      ),
    enabled: !!inspectId,
  });

  /* ─── MUTATIONS ─── */
  const actionMut = useMutation({
    mutationFn: async ({
      url,
      method,
      body,
    }: {
      url: string;
      method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
      body?: unknown;
    }) => apiRequest(url, method, body, true),
    onSuccess: () => {
      emitToast("Action completed", "success");
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["admin-ticket"] });
      queryClient.invalidateQueries({ queryKey: ["admin-ticket-messages"] });
      queryClient.invalidateQueries({ queryKey: ["admin-ticket-notes"] });
      setConfirmAction(null);
      setReply("");
    },
    onError: (err: Error) => emitToast(err.message, "error"),
  });

  const metrics = [
    { label: "Total Tickets", value: ticketsData?.total ?? "—" },
    {
      label: "Unread",
      value: unreadData?.count ?? 0,
      color: "var(--color-warning)",
    },
    {
      label: "Open",
      value:
        ticketsData?.tickets?.filter((t) => t.status === "open").length ?? 0,
      color: "var(--color-brand)",
    },
  ];

  const cols: Column<Record<string, unknown>>[] = [
    { key: "subject", header: "Subject", sortable: true },
    { key: "category", header: "Category" },
    {
      key: "priority",
      header: "Priority",
      render: (r) => <Badge status={String(r.priority)} />,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge status={String(r.status)} />,
    },
    {
      key: "user",
      header: "User",
      render: (r) => {
        const u = r.userId as Record<string, unknown> | undefined;
        return u?.name ? String(u.name) : "—";
      },
    },
    {
      key: "createdAt",
      header: "Date",
      render: (r) => new Date(String(r.createdAt)).toLocaleDateString(),
    },
  ];

  return (
    <div style={{ padding: "var(--space-5)" }}>
      <h1 className="u-heading-1" style={{ marginBottom: "var(--space-4)" }}>
        Tickets Engine
      </h1>

      <MetricsRibbon metrics={metrics} loading={ticketsLoading} />

      <div
        style={{
          display: "flex",
          gap: "var(--space-4)",
          marginTop: "var(--space-4)",
        }}
      >
        {/* Grid */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <DataGrid
            columns={cols}
            data={(ticketsData?.tickets ?? []) as Record<string, unknown>[]}
            loading={ticketsLoading}
            page={page}
            totalPages={ticketsData?.pages ?? 1}
            onPageChange={setPage}
            rowKey={(r) => String(r._id)}
            onRowClick={(r) => setInspectId(String(r._id))}
          />
        </div>

        {/* Inspector */}
        {inspectId && inspected?.ticket && (
          <aside style={inspectorStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "var(--space-4)",
              }}
            >
              <h3 className="u-heading-3">Ticket Detail</h3>
              <button
                className="u-btn u-btn-ghost u-btn-sm"
                onClick={() => setInspectId(null)}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-3)",
              }}
            >
              <IR label="Subject" value={String(inspected.ticket.subject)} />
              <IR
                label="Status"
                value={<Badge status={String(inspected.ticket.status)} />}
              />
              <IR
                label="Priority"
                value={<Badge status={String(inspected.ticket.priority)} />}
              />
              <IR label="Category" value={String(inspected.ticket.category)} />

              {/* Status actions */}
              <div
                style={{
                  display: "flex",
                  gap: "var(--space-2)",
                  flexWrap: "wrap",
                }}
              >
                {inspected.ticket.status !== "closed" && (
                  <button
                    className="u-btn u-btn-danger u-btn-sm"
                    onClick={() =>
                      setConfirmAction({
                        title: "Close Ticket",
                        msg: "Close this ticket?",
                        fn: () =>
                          actionMut.mutateAsync({
                            url: EP.ADMIN_TICKET_CLOSE(inspectId!),
                            method: "PUT",
                          }),
                      })
                    }
                  >
                    Close
                  </button>
                )}
                {["open", "in_progress", "resolved"].map((s) => (
                  <button
                    key={s}
                    className="u-btn u-btn-secondary u-btn-sm"
                    onClick={() =>
                      actionMut.mutateAsync({
                        url: EP.ADMIN_TICKET_STATUS(inspectId!),
                        method: "PUT",
                        body: { status: s },
                      })
                    }
                  >
                    {s.replace(/_/g, " ")}
                  </button>
                ))}
              </div>

              {/* Messages */}
              <div style={{ marginTop: "var(--space-3)" }}>
                <h4
                  style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--weight-medium)",
                    marginBottom: "var(--space-2)",
                  }}
                >
                  Messages
                </h4>
                <div
                  style={{
                    maxHeight: 240,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-2)",
                  }}
                >
                  {messagesData?.messages?.map((m, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "var(--space-2) var(--space-3)",
                        borderRadius: "var(--radius-md)",
                        background:
                          m.senderRole === "admin"
                            ? "var(--color-brand-muted)"
                            : "var(--color-bg-elevated)",
                        fontSize: "var(--text-sm)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "var(--text-xs)",
                          color: "var(--color-text-tertiary)",
                          marginBottom: 2,
                        }}
                      >
                        {String(m.senderRole)} ·{" "}
                        {new Date(String(m.createdAt)).toLocaleString()}
                      </div>
                      {String(m.message || m.content || "")}
                    </div>
                  )) ?? (
                    <div
                      style={{
                        color: "var(--color-text-tertiary)",
                        fontSize: "var(--text-sm)",
                      }}
                    >
                      No messages
                    </div>
                  )}
                </div>
              </div>

              {/* Reply */}
              {inspected.ticket.status !== "closed" && (
                <div style={{ marginTop: "var(--space-2)" }}>
                  <textarea
                    className="u-input"
                    rows={3}
                    placeholder="Reply..."
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                  />
                  <button
                    className="u-btn u-btn-primary u-btn-sm"
                    style={{ marginTop: "var(--space-2)" }}
                    disabled={!reply.trim() || actionMut.isPending}
                    onClick={() =>
                      actionMut.mutateAsync({
                        url: EP.ADMIN_TICKET_REPLY(inspectId!),
                        method: "POST",
                        body: { message: reply },
                      })
                    }
                  >
                    Send Reply
                  </button>
                </div>
              )}

              {/* Notes */}
              {notesData?.notes && notesData.notes.length > 0 && (
                <div style={{ marginTop: "var(--space-3)" }}>
                  <h4
                    style={{
                      fontSize: "var(--text-sm)",
                      fontWeight: "var(--weight-medium)",
                      marginBottom: "var(--space-2)",
                    }}
                  >
                    Internal Notes
                  </h4>
                  {notesData.notes.map((n, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "var(--space-2)",
                        background: "var(--color-bg-elevated)",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "var(--text-xs)",
                        marginBottom: "var(--space-1)",
                      }}
                    >
                      {String(n.content || n.note || "")}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.title ?? ""}
        message={confirmAction?.msg ?? ""}
        onConfirm={() => confirmAction?.fn() ?? Promise.resolve()}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}

function IR({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: "var(--text-xs)",
          color: "var(--color-text-tertiary)",
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: "var(--text-sm)" }}>{value}</div>
    </div>
  );
}

const inspectorStyle: React.CSSProperties = {
  width: 380,
  flexShrink: 0,
  borderLeft: "1px solid var(--color-border)",
  background: "var(--color-bg-secondary)",
  padding: "var(--space-4)",
  overflowY: "auto",
  maxHeight: "calc(100vh - 140px)",
  borderRadius: "var(--radius-lg)",
};
