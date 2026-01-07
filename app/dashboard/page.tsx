"use client";

import Card from "@/components/Card";
import Link from "next/link";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-[#9CA3AF]">
          Manage services, payments, and applications
        </p>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card title="Buy a Service">
          <p className="text-sm text-[#9CA3AF] mb-4">
            Access verified digital services with manual security checks.
          </p>
          <Link
            href="/buy-service"
            className="inline-block text-sm text-[#3B82F6]"
          >
            Go →
          </Link>
        </Card>

        <Card title="My Orders">
          <p className="text-sm text-[#9CA3AF] mb-4">
            Track order status and payment verification.
          </p>
          <Link href="/orders" className="inline-block text-sm text-[#3B82F6]">
            View →
          </Link>
        </Card>

        <Card title="Payments">
          <p className="text-sm text-[#9CA3AF] mb-4">
            Submit payment proofs for manual verification.
          </p>
          <Link href="/payment" className="inline-block text-sm text-[#3B82F6]">
            Pay →
          </Link>
        </Card>

        <Card title="Apply to Work">
          <p className="text-sm text-[#9CA3AF] mb-4">
            Apply to work with UREMO and get manually approved.
          </p>
          <Link
            href="/apply-to-work"
            className="inline-block text-sm text-[#3B82F6]"
          >
            Apply →
          </Link>
        </Card>
      </div>

      {/* Trust Block */}
      <Card>
        <p className="text-sm text-[#9CA3AF]">
          ⚠️ UREMO is a human-verified platform. All payments, services, and
          applications are reviewed manually to ensure security and quality.
        </p>
      </Card>
    </div>
  );
}
