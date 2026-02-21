"use client";

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { ServiceCard } from "@/components";
import type { Service } from "@/types";

export default function DealsPage() {
  const { data, isLoading, error } = useQuery<{ services: Service[] }>({
    queryKey: ["deals"],
    queryFn: () => apiRequest(EP.SERVICES_DEALS),
  });

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Deals</h1>
        <p className="page-subtitle">
          Limited-time offers and discounted services.
        </p>
      </div>

      {isLoading ? (
        <div className="page-loading">
          <div className="u-spinner" /> Loading deals...
        </div>
      ) : error ? (
        <div className="page-empty">Failed to load deals.</div>
      ) : !data?.services?.length ? (
        <div className="page-empty">No deals available right now. Check back soon!</div>
      ) : (
        <div className="u-grid u-grid-3">
          {data.services.map((svc) => (
            <ServiceCard key={svc._id} service={svc} />
          ))}
        </div>
      )}
    </div>
  );
}
