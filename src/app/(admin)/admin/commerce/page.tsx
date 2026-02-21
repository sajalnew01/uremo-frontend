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
import type { Order, Service, Rental } from "@/types";

type Tab = "orders" | "services" | "rentals";

export default function CommerceEngine() {
  const [tab, setTab] = useState<Tab>("orders");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  /* ─── Inspector ─── */
  const [inspectId, setInspectId] = useState<string | null>(null);
  const [inspectType, setInspectType] = useState<Tab>("orders");
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    msg: string;
    fn: () => Promise<unknown>;
  } | null>(null);

  /* ─── METRICS ─── */
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["admin-orders", page],
    queryFn: () =>
      apiRequest<{ orders: Order[]; total: number; pages: number }>(
        EP.ADMIN_ORDERS + `?page=${page}&limit=20`,
        "GET",
        undefined,
        true,
      ),
    enabled: tab === "orders",
  });

  const { data: rejOrders } = useQuery({
    queryKey: ["admin-orders-rejected"],
    queryFn: () =>
      apiRequest<{ orders: Order[] }>(
        EP.ADMIN_ORDERS_REJECTED,
        "GET",
        undefined,
        true,
      ),
    enabled: tab === "orders",
  });

  const { data: servicesData, isLoading: servicesLoading } = useQuery({
    queryKey: ["admin-services"],
    queryFn: () =>
      apiRequest<{ services: Service[] }>(
        EP.ADMIN_SERVICES_LIST,
        "GET",
        undefined,
        true,
      ),
    enabled: tab === "services",
  });

  const { data: rentalsData, isLoading: rentalsLoading } = useQuery({
    queryKey: ["admin-rentals"],
    queryFn: () =>
      apiRequest<{ rentals: Rental[] }>(
        EP.ADMIN_RENTALS,
        "GET",
        undefined,
        true,
      ),
    enabled: tab === "rentals",
  });

  const { data: rentalMetrics } = useQuery({
    queryKey: ["admin-rentals-metrics"],
    queryFn: () =>
      apiRequest<{
        totalRentals: number;
        activeRentals: number;
        revenue: number;
      }>(EP.ADMIN_RENTALS_METRICS, "GET", undefined, true),
    enabled: tab === "rentals",
  });

  /* ─── MUTATIONS ─── */
  const mutation = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      queryClient.invalidateQueries({ queryKey: ["admin-rentals"] });
      setConfirmAction(null);
    },
    onError: (err: Error) => emitToast(err.message, "error"),
  });

  /* ─── METRICS RIBBON ─── */
  const metrics =
    tab === "orders"
      ? [
          { label: "Total Orders", value: ordersData?.total ?? "—" },
          {
            label: "Rejected",
            value: rejOrders?.orders?.length ?? 0,
            color: "var(--color-error)",
          },
        ]
      : tab === "services"
        ? [
            {
              label: "Total Services",
              value: servicesData?.services?.length ?? "—",
            },
            {
              label: "Active",
              value:
                servicesData?.services?.filter((s) => s.status === "active")
                  .length ?? 0,
              color: "var(--color-success)",
            },
          ]
        : [
            {
              label: "Total Rentals",
              value: rentalMetrics?.totalRentals ?? "—",
            },
            {
              label: "Active",
              value: rentalMetrics?.activeRentals ?? 0,
              color: "var(--color-success)",
            },
            {
              label: "Revenue",
              value: `$${rentalMetrics?.revenue?.toFixed(2) ?? "0"}`,
              color: "var(--color-brand)",
            },
          ];

  /* ─── COLUMNS ─── */
  const orderCols: Column<Record<string, unknown>>[] = [
    { key: "orderNumber", header: "Order #", sortable: true },
    {
      key: "orderType",
      header: "Type",
      render: (r) => <Badge status={String(r.orderType)} />,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge status={String(r.status)} />,
    },
    {
      key: "paymentStatus",
      header: "Payment",
      render: (r) => <Badge status={String(r.paymentStatus)} />,
    },
    {
      key: "totalAmount",
      header: "Amount",
      render: (r) => `$${Number(r.totalAmount || 0).toFixed(2)}`,
    },
    {
      key: "createdAt",
      header: "Date",
      sortable: true,
      render: (r) => new Date(String(r.createdAt)).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div style={{ display: "flex", gap: "var(--space-1)" }}>
          <button
            className="u-btn u-btn-ghost u-btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              setInspectId(String(r._id));
              setInspectType("orders");
            }}
          >
            👁
          </button>
          {r.paymentStatus === "pending_verification" && (
            <button
              className="u-btn u-btn-primary u-btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmAction({
                  title: "Verify Payment",
                  msg: `Verify payment for order ${r.orderNumber}?`,
                  fn: () =>
                    mutation.mutateAsync({
                      url: EP.ADMIN_ORDER_VERIFY(String(r._id)),
                      method: "PUT",
                    }),
                });
              }}
            >
              Verify
            </button>
          )}
        </div>
      ),
    },
  ];

  const serviceCols: Column<Record<string, unknown>>[] = [
    { key: "title", header: "Title", sortable: true },
    { key: "category", header: "Category", sortable: true },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge status={String(r.status)} />,
    },
    {
      key: "price",
      header: "Price",
      render: (r) => `$${Number(r.price || 0).toFixed(2)}`,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div style={{ display: "flex", gap: "var(--space-1)" }}>
          <button
            className="u-btn u-btn-ghost u-btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              setInspectId(String(r._id));
              setInspectType("services");
            }}
          >
            👁
          </button>
          {r.status === "active" ? (
            <button
              className="u-btn u-btn-secondary u-btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmAction({
                  title: "Deactivate",
                  msg: `Deactivate "${r.title}"?`,
                  fn: () =>
                    mutation.mutateAsync({
                      url: EP.ADMIN_SERVICE_DEACTIVATE(String(r._id)),
                      method: "PATCH",
                    }),
                });
              }}
            >
              Deactivate
            </button>
          ) : r.status === "draft" ? (
            <button
              className="u-btn u-btn-primary u-btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmAction({
                  title: "Activate",
                  msg: `Activate "${r.title}"?`,
                  fn: () =>
                    mutation.mutateAsync({
                      url: EP.ADMIN_SERVICE_ACTIVATE(String(r._id)),
                      method: "PATCH",
                    }),
                });
              }}
            >
              Activate
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  const rentalCols: Column<Record<string, unknown>>[] = [
    {
      key: "service",
      header: "Service",
      render: (r) => {
        const svc = r.service as Record<string, unknown> | undefined;
        return svc?.title ? String(svc.title) : String(r.service || "—");
      },
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge status={String(r.status)} />,
    },
    { key: "plan", header: "Plan" },
    {
      key: "expiresAt",
      header: "Expires",
      render: (r) =>
        r.expiresAt ? new Date(String(r.expiresAt)).toLocaleDateString() : "—",
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div style={{ display: "flex", gap: "var(--space-1)" }}>
          {r.status === "pending" && (
            <button
              className="u-btn u-btn-primary u-btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmAction({
                  title: "Activate Rental",
                  msg: "Activate this rental?",
                  fn: () =>
                    mutation.mutateAsync({
                      url: EP.ADMIN_RENTAL_ACTIVATE(String(r._id)),
                      method: "PUT",
                    }),
                });
              }}
            >
              Activate
            </button>
          )}
          {r.status === "active" && (
            <button
              className="u-btn u-btn-danger u-btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmAction({
                  title: "Cancel Rental",
                  msg: "Cancel this rental?",
                  fn: () =>
                    mutation.mutateAsync({
                      url: EP.ADMIN_RENTAL_CANCEL(String(r._id)),
                      method: "PUT",
                    }),
                });
              }}
            >
              Cancel
            </button>
          )}
        </div>
      ),
    },
  ];

  /* ─── INSPECTOR ─── */
  const { data: inspectedOrder } = useQuery({
    queryKey: ["admin-order", inspectId],
    queryFn: () =>
      apiRequest<{ order: Order }>(
        EP.ADMIN_ORDER_BY_ID(inspectId!),
        "GET",
        undefined,
        true,
      ),
    enabled: !!inspectId && inspectType === "orders",
  });

  const { data: inspectedService } = useQuery({
    queryKey: ["admin-service", inspectId],
    queryFn: () =>
      apiRequest<{ service: Service }>(
        EP.ADMIN_SERVICE_BY_ID(inspectId!),
        "GET",
        undefined,
        true,
      ),
    enabled: !!inspectId && inspectType === "services",
  });

  return (
    <div style={{ padding: "var(--space-5)" }}>
      <h1 className="u-heading-1" style={{ marginBottom: "var(--space-4)" }}>
        Commerce Engine
      </h1>

      <MetricsRibbon
        metrics={metrics}
        loading={ordersLoading || servicesLoading || rentalsLoading}
      />

      {/* Tabs */}
      <div className="tab-bar" style={{ marginTop: "var(--space-4)" }}>
        {(["orders", "services", "rentals"] as Tab[]).map((t) => (
          <button
            key={t}
            className={`tab-bar-item ${tab === t ? "tab-bar-item--active" : ""}`}
            onClick={() => {
              setTab(t);
              setPage(1);
              setInspectId(null);
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          gap: "var(--space-4)",
          marginTop: "var(--space-4)",
        }}
      >
        {/* Grid */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {tab === "orders" && (
            <DataGrid
              columns={orderCols}
              data={
                (ordersData?.orders ?? []) as unknown as Record<
                  string,
                  unknown
                >[]
              }
              loading={ordersLoading}
              page={page}
              totalPages={ordersData?.pages ?? 1}
              onPageChange={setPage}
              rowKey={(r) => String(r._id)}
              onRowClick={(r) => {
                setInspectId(String(r._id));
                setInspectType("orders");
              }}
            />
          )}
          {tab === "services" && (
            <DataGrid
              columns={serviceCols}
              data={
                (servicesData?.services ?? []) as unknown as Record<
                  string,
                  unknown
                >[]
              }
              loading={servicesLoading}
              rowKey={(r) => String(r._id)}
              onRowClick={(r) => {
                setInspectId(String(r._id));
                setInspectType("services");
              }}
            />
          )}
          {tab === "rentals" && (
            <DataGrid
              columns={rentalCols}
              data={
                (rentalsData?.rentals ?? []) as unknown as Record<
                  string,
                  unknown
                >[]
              }
              loading={rentalsLoading}
              rowKey={(r) => String(r._id)}
            />
          )}
        </div>

        {/* Inspector Panel */}
        {inspectId && (
          <aside style={inspectorStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "var(--space-4)",
              }}
            >
              <h3 className="u-heading-3">
                {inspectType === "orders" ? "Order Detail" : "Service Detail"}
              </h3>
              <button
                className="u-btn u-btn-ghost u-btn-sm"
                onClick={() => setInspectId(null)}
              >
                ✕
              </button>
            </div>

            {inspectType === "orders" && inspectedOrder?.order && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-3)",
                }}
              >
                <InspectorRow
                  label="Order #"
                  value={inspectedOrder.order.orderNumber}
                />
                <InspectorRow
                  label="Status"
                  value={<Badge status={inspectedOrder.order.status} />}
                />
                <InspectorRow
                  label="Payment"
                  value={<Badge status={inspectedOrder.order.paymentStatus} />}
                />
                <InspectorRow
                  label="Type"
                  value={inspectedOrder.order.orderType}
                />
                <InspectorRow
                  label="Amount"
                  value={`$${inspectedOrder.order.totalAmount?.toFixed(2)}`}
                />
                <InspectorRow
                  label="Created"
                  value={new Date(
                    inspectedOrder.order.createdAt,
                  ).toLocaleString()}
                />
                {inspectedOrder.order.adminNotes && (
                  <InspectorRow
                    label="Notes"
                    value={inspectedOrder.order.adminNotes}
                  />
                )}
                <div
                  style={{
                    display: "flex",
                    gap: "var(--space-2)",
                    flexWrap: "wrap",
                    marginTop: "var(--space-3)",
                  }}
                >
                  {inspectedOrder.order.paymentStatus ===
                    "pending_verification" && (
                    <button
                      className="u-btn u-btn-primary u-btn-sm"
                      onClick={() =>
                        setConfirmAction({
                          title: "Verify Payment",
                          msg: "Verify payment?",
                          fn: () =>
                            mutation.mutateAsync({
                              url: EP.ADMIN_ORDER_VERIFY(inspectId!),
                              method: "PUT",
                            }),
                        })
                      }
                    >
                      Verify Payment
                    </button>
                  )}
                </div>
              </div>
            )}

            {inspectType === "services" && inspectedService?.service && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-3)",
                }}
              >
                <InspectorRow
                  label="Title"
                  value={inspectedService.service.title}
                />
                <InspectorRow
                  label="Status"
                  value={<Badge status={inspectedService.service.status} />}
                />
                <InspectorRow
                  label="Category"
                  value={inspectedService.service.category}
                />
                <InspectorRow
                  label="Price"
                  value={`$${inspectedService.service.price?.toFixed(2)}`}
                />
                <InspectorRow
                  label="Delivery"
                  value={inspectedService.service.deliveryType}
                />
                {inspectedService.service.description && (
                  <InspectorRow
                    label="Description"
                    value={inspectedService.service.description}
                  />
                )}
              </div>
            )}
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

function InspectorRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
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
  width: 340,
  flexShrink: 0,
  borderLeft: "1px solid var(--color-border)",
  background: "var(--color-bg-secondary)",
  padding: "var(--space-4)",
  overflowY: "auto",
  maxHeight: "calc(100vh - 180px)",
  borderRadius: "var(--radius-lg)",
};
