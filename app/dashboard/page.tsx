"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/login");
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border p-4 rounded">
          <h3 className="font-medium">Buy Service</h3>
          <a href="/buy-service" className="underline mt-2 inline-block">
            Continue →
          </a>
        </div>

        <div className="border p-4 rounded">
          <h3 className="font-medium">My Orders</h3>
          <a href="/orders" className="underline mt-2 inline-block">
            View →
          </a>
        </div>

        <div className="border p-4 rounded">
          <h3 className="font-medium">Apply to Work</h3>
          <a href="/apply-to-work" className="underline mt-2 inline-block">
            Apply →
          </a>
        </div>
      </div>
    </div>
  );
}
