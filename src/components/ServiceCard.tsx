import Link from "next/link";
import type { Service, Intent } from "@/types";

const INTENT_COLORS: Record<string, { bg: string; color: string }> = {
  buy: { bg: "var(--color-intent-buy)20", color: "var(--color-intent-buy)" },
  earn: { bg: "var(--color-intent-earn)20", color: "var(--color-intent-earn)" },
  rent: { bg: "var(--color-intent-rent)20", color: "var(--color-intent-rent)" },
  deal: { bg: "var(--color-intent-deal)20", color: "var(--color-intent-deal)" },
};

function getIntents(svc: Service): Intent[] {
  const intents: Intent[] = [];
  if (svc.allowedActions?.buy) intents.push("buy");
  if (svc.allowedActions?.apply) intents.push("earn");
  if (svc.allowedActions?.rent) intents.push("rent");
  if (svc.allowedActions?.deal) intents.push("deal");
  return intents;
}

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const intents = getIntents(service);
  const imgSrc = service.images?.[0] || service.imageUrl || "";

  return (
    <Link href={`/services/${service._id}`} className="svc-card">
      {imgSrc ? (
        <img src={imgSrc} alt={service.title} className="svc-card-img" loading="lazy" />
      ) : (
        <div className="svc-card-img" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-tertiary)", fontSize: "var(--text-sm)" }}>
          No image
        </div>
      )}
      <div className="svc-card-body">
        <div className="svc-card-title">{service.title}</div>
        <div className="svc-card-meta">
          <span className="svc-card-price">
            ${service.price?.toFixed(2) || "0.00"}
          </span>
          <span className="svc-card-cat">{service.category?.replace(/_/g, " ")}</span>
        </div>
        <div className="svc-card-intents">
          {intents.map((intent) => (
            <span
              key={intent}
              className="svc-card-intent"
              style={{
                background: INTENT_COLORS[intent]?.bg,
                color: INTENT_COLORS[intent]?.color,
              }}
            >
              {intent}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
