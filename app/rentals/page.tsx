"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
// PATCH_52: Centralized status system
import { getStatusLabel, getStatusColor } from "@/lib/statusConfig";

interface Rental {
  _id: string;
  service: {
    _id: string;
    title: string;
    imageUrl?: string;
  };
  rentalType: "days" | "months";
  duration: number;
  price: number;
  startDate: string | null;
  endDate: string | null;
  status: "pending" | "active" | "expired" | "cancelled" | "renewed";
  isActive: boolean;
  daysRemaining: number;
  accessDetails?: string;
  createdAt: string;
}

export default function MyRentalsPage() {
  const { toast } = useToast();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRentals();
  }, []);

  const loadRentals = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/api/rentals/my", "GET", null, true);
      setRentals(Array.isArray(data?.rentals) ? data.rentals : []);
    } catch (err: any) {
      toast(err?.message || "Failed to load rentals", "error");
    } finally {
      setLoading(false);
    }
  };

  const cancelRental = async (rentalId: string) => {
    if (!confirm("Are you sure you want to cancel this rental?")) return;

    try {
      await apiRequest(`/api/rentals/${rentalId}/cancel`, "PUT", null, true);
      toast("Rental cancelled", "success");
      loadRentals();
    } catch (err: any) {
      toast(err?.message || "Failed to cancel rental", "error");
    }
  };

  const renewRental = async (rentalId: string) => {
    try {
      const res = await apiRequest(
        `/api/rentals/${rentalId}/renew`,
        "POST",
        null,
        true,
      );
      const orderId = res?.order?._id || res?.orderId;
      if (orderId) {
        toast("Renewal order created. Redirecting to payment...", "success");
        window.location.href = `/payment/${orderId}`;
      } else {
        toast("Rental renewed", "success");
        loadRentals();
      }
    } catch (err: any) {
      toast(err?.message || "Failed to renew rental", "error");
    }
  };

  // PATCH_52: Use centralized status from statusConfig
  const getStatusBadge = (status: string) => {
    const base = "px-2 py-1 rounded-full text-xs font-medium border ";
    return base + getStatusColor(status);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="u-container max-w-5xl">
        <h1 className="text-3xl font-bold mb-6">My Rentals</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-6 w-48 bg-white/10 rounded" />
              <div className="h-4 w-32 bg-white/10 rounded mt-2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="u-container max-w-5xl"
    >
      <PageHeader
        title="My Rentals"
        description="Manage your active subscriptions and rental services"
        actionLabel="Find Work & Services"
        actionHref="/explore-services"
      />

      {rentals.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="🔄"
            title="No active rentals"
            description="Rent premium services on a subscription basis for ongoing access."
            ctaText="Find Work & Services"
            ctaHref="/explore-services"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {rentals.map((rental, idx) => (
            <motion.div
              key={rental._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="card"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  {rental.service?.imageUrl ? (
                    <img
                      src={rental.service.imageUrl}
                      alt={rental.service.title}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">🔄</span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-white">
                      {rental.service?.title || "Unknown Service"}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {rental.duration} {rental.rentalType} • ${rental.price}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={getStatusBadge(rental.status)}>
                        {getStatusLabel(rental.status)}
                      </span>
                      {rental.isActive &&
                        rental.daysRemaining !== undefined && (
                          <span className="text-xs text-slate-400">
                            {rental.daysRemaining} days remaining
                          </span>
                        )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="text-right text-sm">
                    <p className="text-slate-400">
                      Start:{" "}
                      <span className="text-slate-200">
                        {formatDate(rental.startDate)}
                      </span>
                    </p>
                    <p className="text-slate-400">
                      End:{" "}
                      <span className="text-slate-200">
                        {formatDate(rental.endDate)}
                      </span>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {rental.status === "active" && (
                      <>
                        <button
                          onClick={() => renewRental(rental._id)}
                          className="text-xs px-3 py-1 bg-purple-500/20 text-purple-300 rounded hover:bg-purple-500/30"
                        >
                          Renew
                        </button>
                        <button
                          onClick={() => cancelRental(rental._id)}
                          className="text-xs px-3 py-1 bg-red-500/20 text-red-300 rounded hover:bg-red-500/30"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {rental.status === "pending" && (
                      <Link
                        href={`/orders`}
                        className="text-xs px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded hover:bg-yellow-500/30"
                      >
                        Complete Payment
                      </Link>
                    )}
                    {rental.status === "expired" && (
                      <button
                        onClick={() => renewRental(rental._id)}
                        className="text-xs px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded hover:bg-emerald-500/30"
                      >
                        Renew Subscription
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {rental.accessDetails && (
                <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-slate-400 mb-1">Access Details</p>
                  <p className="text-sm text-white whitespace-pre-wrap">
                    {rental.accessDetails}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
