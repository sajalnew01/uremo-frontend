"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Container from "@/components/Container";

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/login");
  }, []);

  return (
    <Container>
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a
          href="/buy-service"
          className="border border-zinc-800 p-8 rounded-lg hover:border-white transition cursor-pointer"
        >
          <div className="text-4xl mb-3">🛒</div>
          <h3 className="font-bold text-xl mb-2">Buy Service</h3>
          <p className="text-sm text-zinc-400">
            Browse and purchase verified services
          </p>
        </a>

        <a
          href="/orders"
          className="border border-zinc-800 p-8 rounded-lg hover:border-white transition cursor-pointer"
        >
          <div className="text-4xl mb-3">📦</div>
          <h3 className="font-bold text-xl mb-2">My Orders</h3>
          <p className="text-sm text-zinc-400">
            Track your service orders & payments
          </p>
        </a>

        <a
          href="/apply-to-work"
          className="border border-zinc-800 p-8 rounded-lg hover:border-white transition cursor-pointer"
        >
          <div className="text-4xl mb-3">💼</div>
          <h3 className="font-bold text-xl mb-2">Apply to Work</h3>
          <p className="text-sm text-zinc-400">
            Join as a verified service provider
          </p>
        </a>

        <a
          href="/payment"
          className="border border-zinc-800 p-8 rounded-lg hover:border-white transition cursor-pointer"
        >
          <div className="text-4xl mb-3">💳</div>
          <h3 className="font-bold text-xl mb-2">Payments</h3>
          <p className="text-sm text-zinc-400">
            Submit payment proof for verification
          </p>
        </a>
      </div>
    </Container>
  );
}
