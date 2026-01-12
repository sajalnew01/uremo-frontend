"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function PaymentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Payment error:", error);
  }, [error]);

  return (
    <div className="u-container max-w-2xl py-20">
      <div className="card">
        <p className="text-sm text-[#9CA3AF]">Error</p>
        <h1 className="text-2xl font-bold text-white mt-2">
          Payment page error
        </h1>
        <p className="text-slate-300 mt-3">
          We encountered an issue loading your payment page. Your order may have
          expired or been removed. Please check your orders.
        </p>

        <div className="mt-6 flex gap-3 flex-wrap">
          <button onClick={reset} className="btn-primary">
            Retry
          </button>
          <Link href="/orders" className="btn-secondary">
            View orders
          </Link>
          <Link href="/" className="btn-secondary">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
