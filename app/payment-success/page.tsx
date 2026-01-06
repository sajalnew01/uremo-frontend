"use client";

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function PaymentSuccessInner() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div style={{ padding: "40px" }}>
      <h1>Payment Successful 🎉</h1>
      <p>Your payment was completed successfully.</p>
      {orderId && (
        <p>
          <strong>Order ID:</strong> {orderId}
        </p>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSuccessInner />
    </Suspense>
  );
}
