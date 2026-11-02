import { durationMonths, type SubscriptionSku } from "./subscriptionCatalog";
import { hasActiveNepalPlan, type SubscriptionSession } from "./paywall";

export type PlanChangeKind = "new" | "current" | "support-required" | "provider-upgrade" | "provider-downgrade";
export type PlanChange = { kind: PlanChangeKind; amount: number; allowed: boolean };

export function resolvePlanChange(current: SubscriptionSession | null, target: SubscriptionSku | null, manageMode: boolean): PlanChange | null {
  if (!target) return null;
  // Match Android: active Nepal subscriptions block purchases through every entry point.
  if (target.region === "nepal" && hasActiveNepalPlan(current)) {
    return { kind: current?.skuId === target.id ? "current" : "support-required", amount: 0, allowed: false };
  }
  if (!manageMode || !current || current.region !== target.region || target.region === "nepal") {
    return { kind: "new", amount: target.price, allowed: true };
  }
  if (current.skuId === target.id) return { kind: "current", amount: target.price, allowed: false };
  const downgrade = (current.tier === "plus" && target.tier === "mobile") || durationMonths(target.duration) < durationMonths(current.duration);
  return { kind: downgrade ? "provider-downgrade" : "provider-upgrade", amount: target.price, allowed: true };
}
