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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border border-zinc-800 p-6 rounded-lg hover:border-zinc-700 transition">
          <h3 className="font-medium text-lg mb-3">Buy Service</h3>
          <p className="text-sm text-zinc-400 mb-4">
            Browse and purchase services
          </p>
          <a
            href="/buy-service"
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            Browse Services →
          </a>
        </div>

        <div className="border border-zinc-800 p-6 rounded-lg hover:border-zinc-700 transition">
          <h3 className="font-medium text-lg mb-3">My Orders</h3>
          <p className="text-sm text-zinc-400 mb-4">
            Track your service orders
          </p>
          <a
            href="/orders"
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            View Orders →
          </a>
        </div>

        <div className="border border-zinc-800 p-6 rounded-lg hover:border-zinc-700 transition">
          <h3 className="font-medium text-lg mb-3">Apply to Work</h3>
          <p className="text-sm text-zinc-400 mb-4">
            Join as a service provider
          </p>
          <a
            href="/apply-to-work"
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            Apply Now →
          </a>
        </div>
      </div>
    </Container>
  );
}
