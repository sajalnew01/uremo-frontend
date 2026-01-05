"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Success() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const orderId = params.get("orderId");
    if (orderId) {
      localStorage.setItem("orderId", orderId);
      router.push("/upload");
    }
  }, []);

  return <p className="p-8">Redirecting…</p>;
}
