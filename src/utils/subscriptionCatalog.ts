/**
 * DGO Product & Entitlement Spec v2.5 — sellable SKUs for the prototype checkout.
 * Two tiers (Mobile / Plus) × three durations × Nepal | Rest of World (Zone A USD).
 */

export type PriceRegion = "nepal" | "row";
export type PlanTier = "mobile" | "plus";
export type PlanDuration = "01M" | "03M" | "12M";

export type SubscriptionSku = {
  id: string;
  region: PriceRegion;
  tier: PlanTier;
  duration: PlanDuration;
  price: number;
  currency: "NPR" | "USD";
  entitlement: "EP-MOBILE" | "EP-PLUS";
  liveSports: boolean;
};

/** Nepal NPR + Rest of World (Zone A — India & Middle East USD) for the region toggle. */
export const SUBSCRIPTION_SKUS: SubscriptionSku[] = [
  // Nepal
  { id: "DGO-NP-MOB-01M", region: "nepal", tier: "mobile", duration: "01M", price: 199, currency: "NPR", entitlement: "EP-MOBILE", liveSports: false },
  { id: "DGO-NP-PLS-01M", region: "nepal", tier: "plus", duration: "01M", price: 299, currency: "NPR", entitlement: "EP-PLUS", liveSports: false },
  { id: "DGO-NP-MOB-03M", region: "nepal", tier: "mobile", duration: "03M", price: 549, currency: "NPR", entitlement: "EP-MOBILE", liveSports: true },
  { id: "DGO-NP-PLS-03M", region: "nepal", tier: "plus", duration: "03M", price: 799, currency: "NPR", entitlement: "EP-PLUS", liveSports: true },
  { id: "DGO-NP-MOB-12M", region: "nepal", tier: "mobile", duration: "12M", price: 1799, currency: "NPR", entitlement: "EP-MOBILE", liveSports: true },
  { id: "DGO-NP-PLS-12M", region: "nepal", tier: "plus", duration: "12M", price: 2699, currency: "NPR", entitlement: "EP-PLUS", liveSports: true },
  // Rest of World (Zone A)
  { id: "DGO-ZA-MOB-01M", region: "row", tier: "mobile", duration: "01M", price: 3.99, currency: "USD", entitlement: "EP-MOBILE", liveSports: false },
  { id: "DGO-ZA-PLS-01M", region: "row", tier: "plus", duration: "01M", price: 5.99, currency: "USD", entitlement: "EP-PLUS", liveSports: false },
  { id: "DGO-ZA-MOB-03M", region: "row", tier: "mobile", duration: "03M", price: 9.99, currency: "USD", entitlement: "EP-MOBILE", liveSports: true },
  { id: "DGO-ZA-PLS-03M", region: "row", tier: "plus", duration: "03M", price: 14.99, currency: "USD", entitlement: "EP-PLUS", liveSports: true },
  { id: "DGO-ZA-MOB-12M", region: "row", tier: "mobile", duration: "12M", price: 35.99, currency: "USD", entitlement: "EP-MOBILE", liveSports: true },
  { id: "DGO-ZA-PLS-12M", region: "row", tier: "plus", duration: "12M", price: 50.99, currency: "USD", entitlement: "EP-PLUS", liveSports: true },
];

export const TIER_META: Record<
  PlanTier,
  {
    name: string;
    slogan: string;
    quality: string;
    streams: string;
    bullets: string[];
    accent: string;
    border: string;
  }
> = {
  mobile: {
    name: "DGO Mobile",
    slogan: "Phones, tablets & mobile web.",
    quality: "720p HD · 1 stream",
    streams: "1 concurrent",
    bullets: [
      "Android / iOS / mobile web",
      "Full paid VOD catalogue",
      "Ad-free except live sports & events",
      "No casting / TV platforms",
    ],
    accent: "#8a3ffc",
    border: "rgba(138,63,252,0.35)",
  },
  plus: {
    name: "DGO Plus",
    slogan: "TV, casting & more screens.",
    quality: "1080p Full HD · 3 streams",
    streams: "3 concurrent",
    bullets: [
      "Mobile + desktop + smart TVs",
      "Casting permitted",
      "Up to 4 profiles (incl. kids)",
      "Same catalogue — higher quality",
    ],
    accent: "#ff00bd",
    border: "rgba(255,0,189,0.35)",
  },
};

export const DURATION_LABELS: Record<PlanDuration, string> = {
  "01M": "1 month",
  "03M": "3 months",
  "12M": "12 months",
};

export function skusForRegion(region: PriceRegion): SubscriptionSku[] {
  return SUBSCRIPTION_SKUS.filter((s) => s.region === region);
}

export function findSku(
  region: PriceRegion,
  tier: PlanTier,
  duration: PlanDuration
): SubscriptionSku | undefined {
  return SUBSCRIPTION_SKUS.find(
    (s) => s.region === region && s.tier === tier && s.duration === duration
  );
}

export function formatSkuPrice(sku: SubscriptionSku): string {
  if (sku.currency === "NPR") {
    return `रू ${sku.price.toLocaleString("en-NP")}`;
  }
  return `$${sku.price.toFixed(2)}`;
}

export function formatMoney(amount: number, currency: "NPR" | "USD"): string {
  if (currency === "NPR") return `रू ${amount.toLocaleString("en-NP")}`;
  return `$${amount.toFixed(2)}`;
}

export function durationMonths(duration: PlanDuration): number {
  if (duration === "03M") return 3;
  if (duration === "12M") return 12;
  return 1;
}

export function formatMonthlyRate(sku: SubscriptionSku): string {
  const per = sku.price / durationMonths(sku.duration);
  if (sku.currency === "NPR") return `रू ${Math.round(per).toLocaleString("en-NP")}/mo`;
  return `$${per.toFixed(2)}/mo`;
}

export function billingCadenceLabel(duration: PlanDuration, region?: PriceRegion): string {
  if (region === "nepal") return "One-time payment";
  if (duration === "12M") return "Billed annually";
  if (duration === "03M") return "Billed monthly for 3 months";
  return "Billed monthly";
}

/** Amount saved vs buying the 1-month SKU for the same term. */
export function savingsVsMonthly(
  region: PriceRegion,
  tier: PlanTier,
  duration: PlanDuration
): { amount: number; percent: number; label: string } | null {
  if (duration === "01M") return null;
  const monthly = findSku(region, tier, "01M");
  const picked = findSku(region, tier, duration);
  if (!monthly || !picked) return null;
  const amount = monthly.price * durationMonths(duration) - picked.price;
  if (amount <= 0) return null;
  const percent = Math.round((amount / (monthly.price * durationMonths(duration))) * 100);
  return { amount, percent, label: formatMoney(amount, picked.currency) };
}
