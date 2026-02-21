"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { useAuthStore } from "@/store";
import { Badge, RentalPlanSelector, ConfirmModal } from "@/design-system";
import { emitToast } from "@/hooks/useToast";
import type { Service, RentalPlan } from "@/types";

interface ServiceDetailResponse {
  service: Service;
}

export default function ServiceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoggedIn } = useAuthStore();
  const [selectedPlanIdx, setSelectedPlanIdx] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    action: string;
    title: string;
    message: string;
  } | null>(null);

  const { data, isLoading, error } = useQuery<ServiceDetailResponse>({
    queryKey: ["service", id],
    queryFn: () => apiRequest(EP.SERVICE_BY_ID(id)),
    enabled: !!id,
  });

  const service = data?.service;

  // Buy / Place Order
  const buyMutation = useMutation<{ order?: { _id: string } }, Error>({
    mutationFn: () =>
      apiRequest(EP.ORDERS, "POST", { serviceId: id, orderType: "buy" }, true),
    onSuccess: (res: { order?: { _id: string } }) => {
      emitToast("Order placed successfully!", "success");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      if (res.order?._id) router.push(`/orders/${res.order._id}`);
    },
    onError: (err: Error) => emitToast(err.message, "error"),
  });

  // Deal order
  const dealMutation = useMutation<{ order?: { _id: string } }, Error>({
    mutationFn: () =>
      apiRequest(EP.ORDERS_DEAL, "POST", { serviceId: id }, true),
    onSuccess: (res: { order?: { _id: string } }) => {
      emitToast("Deal order placed!", "success");
      if (res.order?._id) router.push(`/orders/${res.order._id}`);
    },
    onError: (err: Error) => emitToast(err.message, "error"),
  });

  // Rent
  const selectedPlan = selectedPlanIdx !== null ? service?.rentalPlans?.[selectedPlanIdx] : null;
  const rentMutation = useMutation<{ rental?: { _id: string } }, Error>({
    mutationFn: () =>
      apiRequest(EP.RENTALS_CREATE, "POST", {
        serviceId: id,
        planIndex: selectedPlanIdx,
      }, true),
    onSuccess: (res: { rental?: { _id: string } }) => {
      emitToast("Rental created!", "success");
      if (res.rental?._id) router.push(`/rentals`);
    },
    onError: (err: Error) => emitToast(err.message, "error"),
  });

  // Apply to work
  const applyMutation = useMutation({
    mutationFn: () =>
      apiRequest(EP.APPLY_WORK, "POST", { serviceId: id }, true),
    onSuccess: () => {
      emitToast("Application submitted!", "success");
      router.push("/workspace");
    },
    onError: (err: Error) => emitToast(err.message, "error"),
  });

  const handleAction = (action: string) => {
    if (!isLoggedIn) {
      router.push(`/login?next=/services/${id}`);
      return;
    }
    switch (action) {
      case "buy":
        setConfirmAction({
          action: "buy",
          title: "Place Order",
          message: `Purchase "${service?.title}" for $${service?.price?.toFixed(2)}?`,
        });
        break;
      case "deal":
        setConfirmAction({
          action: "deal",
          title: "Claim Deal",
          message: `Claim deal for "${service?.title}"?`,
        });
        break;
      case "rent":
        if (selectedPlanIdx === null || !selectedPlan) {
          emitToast("Please select a rental plan first", "error");
          return;
        }
        setConfirmAction({
          action: "rent",
          title: "Start Rental",
          message: `Rent "${service?.title}" — ${selectedPlan.label} ($${selectedPlan.price})?`,
        });
        break;
      case "apply":
        setConfirmAction({
          action: "apply",
          title: "Apply to Work",
          message: `Apply to work on "${service?.title}"?`,
        });
        break;
    }
  };

  const confirmHandler = async () => {
    switch (confirmAction?.action) {
      case "buy": await buyMutation.mutateAsync(); break;
      case "deal": await dealMutation.mutateAsync(); break;
      case "rent": await rentMutation.mutateAsync(); break;
      case "apply": await applyMutation.mutateAsync(); break;
    }
  };

  if (isLoading) {
    return (
      <div className="page-content">
        <div className="page-loading"><div className="u-spinner" /> Loading...</div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="page-content">
        <div className="page-empty">Service not found.</div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="detail-grid">
        {/* Main Content */}
        <div>
          {/* Images */}
          {(service.images?.length > 0 || service.imageUrl) && (
            <div style={{ marginBottom: "var(--space-6)" }}>
              <img
                src={service.images?.[0] || service.imageUrl || ""}
                alt={service.title}
                style={{
                  width: "100%",
                  maxHeight: 400,
                  objectFit: "cover",
                  borderRadius: "var(--radius-lg)",
                  background: "var(--color-bg-tertiary)",
                }}
              />
              {service.images?.length > 1 && (
                <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-3)", overflowX: "auto" }}>
                  {service.images.slice(1).map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt=""
                      style={{
                        width: 80,
                        height: 60,
                        objectFit: "cover",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--color-border)",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <h1 className="page-title">{service.title}</h1>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
            <Badge status={service.status} />
            <Badge status={service.deliveryType} />
            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-tertiary)" }}>
              {service.category?.replace(/_/g, " ")}
            </span>
          </div>

          {/* Description */}
          <div className="page-section">
            <h3 className="u-heading-3" style={{ marginBottom: "var(--space-3)" }}>Description</h3>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: "var(--leading-relaxed)", whiteSpace: "pre-wrap" }}>
              {service.description}
            </p>
          </div>

          {/* Requirements */}
          {service.requirements && (
            <div className="page-section">
              <h3 className="u-heading-3" style={{ marginBottom: "var(--space-3)" }}>Requirements</h3>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", whiteSpace: "pre-wrap" }}>
                {service.requirements}
              </p>
            </div>
          )}

          {/* Countries */}
          {service.countries && service.countries.length > 0 && (
            <div className="page-section">
              <h3 className="u-heading-3" style={{ marginBottom: "var(--space-3)" }}>Available Countries</h3>
              <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
                {service.countries.map((c) => (
                  <Badge key={c} status={c} size="sm" />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="detail-sidebar">
          {/* Price Card */}
          <div className="u-card">
            <div style={{ fontSize: "var(--text-3xl)", fontWeight: "var(--weight-bold)", color: "var(--color-brand)", marginBottom: "var(--space-4)" }}>
              ${service.price?.toFixed(2)}
            </div>
            {service.currency && service.currency !== "USD" && (
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
                Currency: {service.currency}
              </span>
            )}

            {/* Action Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
              {service.allowedActions?.buy && (
                <button
                  className="u-btn u-btn-primary u-btn-lg"
                  onClick={() => handleAction("buy")}
                  disabled={buyMutation.isPending}
                  style={{ width: "100%" }}
                >
                  {buyMutation.isPending ? "Processing..." : "Buy Now"}
                </button>
              )}
              {service.allowedActions?.deal && (
                <button
                  className="u-btn u-btn-secondary u-btn-lg"
                  onClick={() => handleAction("deal")}
                  disabled={dealMutation.isPending}
                  style={{ width: "100%", borderColor: "var(--color-intent-deal)", color: "var(--color-intent-deal)" }}
                >
                  {dealMutation.isPending ? "Processing..." : "Claim Deal"}
                </button>
              )}
              {service.allowedActions?.apply && (
                <button
                  className="u-btn u-btn-secondary u-btn-lg"
                  onClick={() => handleAction("apply")}
                  disabled={applyMutation.isPending}
                  style={{ width: "100%", borderColor: "var(--color-intent-earn)", color: "var(--color-intent-earn)" }}
                >
                  {applyMutation.isPending ? "Processing..." : "Apply to Work"}
                </button>
              )}
            </div>
          </div>

          {/* Rental Plans */}
          {service.allowedActions?.rent && service.rentalPlans?.length > 0 && (
            <div className="u-card">
              <h3 className="u-heading-3" style={{ marginBottom: "var(--space-4)" }}>Rental Plans</h3>
              <RentalPlanSelector
                plans={service.rentalPlans}
                selected={selectedPlanIdx}
                onSelect={setSelectedPlanIdx}
              />
              <button
                className="u-btn u-btn-primary u-btn-lg"
                onClick={() => handleAction("rent")}
                disabled={selectedPlanIdx === null || rentMutation.isPending}
                style={{ width: "100%", marginTop: "var(--space-4)" }}
              >
                {rentMutation.isPending ? "Processing..." : "Rent Now"}
              </button>
            </div>
          )}

          {/* Quick Info */}
          <div className="u-card">
            <h4 style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", marginBottom: "var(--space-3)" }}>Quick Info</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)" }}>
                <span style={{ color: "var(--color-text-tertiary)" }}>Delivery</span>
                <span>{service.deliveryType}</span>
              </div>
              {service.platform && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)" }}>
                  <span style={{ color: "var(--color-text-tertiary)" }}>Platform</span>
                  <span>{service.platform}</span>
                </div>
              )}
              {service.payRate != null && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)" }}>
                  <span style={{ color: "var(--color-text-tertiary)" }}>Pay Rate</span>
                  <span>${service.payRate}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.title || ""}
        message={confirmAction?.message || ""}
        onConfirm={confirmHandler}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
