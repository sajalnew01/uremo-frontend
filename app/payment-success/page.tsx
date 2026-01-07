"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Payment Successful ✅</h1>
      {orderId && <p>Order ID: {orderId}</p>}
      <p>
        Thank you for your payment. Our team will process your order shortly.
      </p>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<p>Loading payment details...</p>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
