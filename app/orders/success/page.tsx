"use client";

/**
 * PATCH_40: Order Success Confirmation Page
 * Displays order confirmation with next steps
 */

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/api";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    apiRequest(`/api/orders/${orderId}`, "GET", null, true)
      .then((data) => {
        setOrder(data);
      })
      .catch(() => {
        // Order might not be accessible, still show success
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orderId]);

  if (!orderId) {
    return (
      <div className="u-container max-w-2xl py-16">
        <div className="card text-center">
          <p className="text-slate-400">No order ID provided</p>
          <Link href="/orders" className="btn-primary mt-4 inline-block">
            View My Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="u-container max-w-2xl py-16"
    >
      <div className="card text-center">
        {/* Success Icon */}
        <div className="mx-auto w-24 h-24 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-6">
          <span className="text-5xl">✓</span>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Order Created!</h1>

        <p className="text-lg text-emerald-400 font-medium mb-4">
          Your order has been successfully submitted
        </p>

        {/* Order ID */}
        <div className="inline-block rounded-xl bg-white/5 border border-white/10 px-6 py-3 mb-6">
          <p className="text-xs text-slate-400 uppercase tracking-wide">
            Order ID
          </p>
          <p className="text-lg font-mono text-white mt-1">
            #{orderId.slice(-8).toUpperCase()}
          </p>
        </div>

        {/* Service Info */}
        {order?.serviceId && (
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 mb-6 text-left">
            <p className="text-sm text-slate-400">Service</p>
            <p className="text-lg text-white font-medium">
              {order.serviceId.title || "Service"}
            </p>
            {order.serviceId.price && (
              <p className="text-emerald-400 font-bold mt-1">
                ${order.serviceId.price}
              </p>
            )}
          </div>
        )}

        {/* Next Steps */}
        <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-6 mb-6 text-left">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            What Happens Next
          </h3>
          <ol className="space-y-3 text-sm text-slate-200">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">
                1
              </span>
              <span>Complete payment to confirm your order</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span>Admin will review and start processing shortly</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">
                3
              </span>
              <span>You'll receive updates via your dashboard</span>
            </li>
          </ol>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {orderId && (
            <Link href={`/payment/${orderId}`} className="btn-primary">
              Complete Payment →
            </Link>
          )}
          <Link href="/orders" className="btn-secondary">
            View My Orders
          </Link>
        </div>

        {/* Help Text */}
        <p className="mt-6 text-xs text-slate-500">
          Need help? Contact support or use the chat on your order page.
        </p>
      </div>
    </motion.div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="u-container max-w-2xl py-16">
          <div className="card text-center">
            <div className="h-24 w-24 mx-auto rounded-full bg-white/5 animate-pulse" />
            <div className="mt-6 h-8 w-48 mx-auto rounded bg-white/5 animate-pulse" />
          </div>
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
