import type { ContentItem } from "@/utils/content";
import type { PlanDuration, PlanTier, PriceRegion, SubscriptionSku } from "@/utils/subscriptionCatalog";
import { findSku } from "@/utils/subscriptionCatalog";

export const DEV_REGION_KEY = "dgo_dev_region";
export const DEV_REGION_EVENT = "dgo-region-change";
export const SUBSCRIPTION_EVENT = "dgo-subscription-change";
export const SESSION_SUBSCRIPTION = "dgo_unlock_subscription";
export const SESSION_PVOD = "dgo_unlock_pvod";
export const SESSION_PASSES = "dgo_event_passes";
export const DEV_EXCLUSIVE_KEY = "dgo_dev_exclusive";
export const DEV_EXCLUSIVE_EVENT = "dgo-exclusive-change";

export type SubscriptionSession = {
  skuId: string;
  tier: PlanTier;
  duration: PlanDuration;
  region: PriceRegion;
  liveSports: boolean;
  entitlement: "EP-MOBILE" | "EP-PLUS";
  billingMode: "prepaid" | "recurring";
  status: "active" | "canceling";
  paidThrough: string;
  nextBillingDate: string | null;
  pendingPlan?: {
    skuId: string;
    tier: PlanTier;
    duration: PlanDuration;
    effectiveDate: string;
  };
};

function addUtcMonths(months: number): string {
  const date = new Date();
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString();
}

function durationMonths(duration: PlanDuration): number {
  if (duration === "12M") return 12;
  if (duration === "03M") return 3;
  return 1;
}

function recurringIntervalMonths(duration: PlanDuration): number {
  return duration === "12M" ? 12 : 1;
}

export function getDevRegion(): PriceRegion {
  if (typeof window === "undefined") return "nepal";
  try {
    const stored = window.localStorage.getItem(DEV_REGION_KEY);
    if (stored === "za" || stored === "zb" || stored === "zc" || stored === "nepal") return stored;
    if (stored === "row") return "za";
    return "nepal";
  } catch {
    return "nepal";
  }
}

export function setDevRegion(region: PriceRegion): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DEV_REGION_KEY, region);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(DEV_REGION_EVENT));
}

export function sessionFromSku(sku: SubscriptionSku): SubscriptionSession {
  const billingMode = sku.region === "nepal" ? "prepaid" : "recurring";
  const paidThroughMonths =
    billingMode === "prepaid" ? durationMonths(sku.duration) : recurringIntervalMonths(sku.duration);
  return {
    skuId: sku.id,
    tier: sku.tier,
    duration: sku.duration,
    region: sku.region,
    liveSports: sku.liveSports,
    entitlement: sku.entitlement,
    billingMode,
    status: "active",
    paidThrough: addUtcMonths(paidThroughMonths),
    nextBillingDate: billingMode === "recurring" ? addUtcMonths(recurringIntervalMonths(sku.duration)) : null,
  };
}

export function getSubscriptionSession(): SubscriptionSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_SUBSCRIPTION);
    if (!raw) return null;
    if (raw === "1") {
      const sku = findSku(getDevRegion(), "plus", "03M");
      return sku ? sessionFromSku(sku) : null;
    }
    const parsed = JSON.parse(raw) as SubscriptionSession;
    if (!parsed?.skuId || !parsed.tier || !parsed.duration) return null;
    const fallbackSku = findSku(parsed.region ?? getDevRegion(), parsed.tier, parsed.duration);
    const fallback = fallbackSku ? sessionFromSku(fallbackSku) : null;
    return {
      ...(fallback ?? {}),
      ...parsed,
      billingMode: parsed.billingMode ?? (parsed.region === "nepal" ? "prepaid" : "recurring"),
      status: parsed.status ?? "active",
      paidThrough: parsed.paidThrough ?? fallback?.paidThrough ?? addUtcMonths(1),
      nextBillingDate:
        parsed.nextBillingDate ??
        (parsed.region === "nepal" ? null : fallback?.nextBillingDate ?? addUtcMonths(1)),
    };
  } catch {
    return null;
  }
}

export function setSubscriptionSession(session: SubscriptionSession | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!session) window.sessionStorage.removeItem(SESSION_SUBSCRIPTION);
    else window.sessionStorage.setItem(SESSION_SUBSCRIPTION, JSON.stringify(session));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(SUBSCRIPTION_EVENT));
}

export function canWatchLiveSports(): boolean {
  return getSubscriptionSession()?.liveSports === true;
}

export function cancelSubscriptionAtPeriodEnd(): void {
  const session = getSubscriptionSession();
  if (!session || session.billingMode !== "recurring") return;
  setSubscriptionSession({ ...session, status: "canceling" });
}

export function resumeSubscription(): void {
  const session = getSubscriptionSession();
  if (!session || session.billingMode !== "recurring") return;
  setSubscriptionSession({ ...session, status: "active" });
}

/** Home tabs that require an active DGO subscription to watch */
export const PAYWALL_SUBSCRIPTION_TABS = [
  "home",
  "hotstar",
  "osr",
  "entertainment",
  "sports",
  "junior",
] as const;
export type PaywallSubscriptionTab = (typeof PAYWALL_SUBSCRIPTION_TABS)[number];

/** Home tab for premium one-off (PVOD) titles */
export const PAYWALL_PVOD_TAB = "specials";

export function isSubscriptionTab(tab: string | null | undefined): boolean {
  if (!tab) return false;
  return (PAYWALL_SUBSCRIPTION_TABS as readonly string[]).includes(tab);
}

export function isPvodTab(tab: string | null | undefined): boolean {
  return tab === PAYWALL_PVOD_TAB;
}

/** No catalogue tab bypasses the subscription / PVOD gates. */
export function isPaywallExemptTab(_tab: string | null | undefined): boolean {
  return false;
}

/**
 * When `fromTab` is missing (e.g. bookmark), infer gate from CMS type.
 * Unknown / missing CMS doc defaults to entertainment (subscription gate), not open access.
 */
export function inferPaywallTabFromContent(content: ContentItem | null): string {
  if (!content) return "entertainment";
  if (content.type === "special" || content.isPPV) return PAYWALL_PVOD_TAB;
  if (content.type === "sports") return "sports";
  if (content.genres?.some((g) => /kids|junior|child/i.test(g))) return "junior";
  return "entertainment";
}

/** Prototype switch for the Exclusive / event-pass tab. On by default, same as Android. */
export function getExclusiveEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(DEV_EXCLUSIVE_KEY) !== "0";
  } catch {
    return true;
  }
}

export function setExclusiveEnabled(on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DEV_EXCLUSIVE_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(DEV_EXCLUSIVE_EVENT));
}

export function getOwnedPasses(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(SESSION_PASSES);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((key) => typeof key === "string") : [];
  } catch {
    return [];
  }
}

export function addEventPass(key: string): void {
  if (typeof window === "undefined") return;
  const next = Array.from(new Set([...getOwnedPasses(), key]));
  try {
    window.sessionStorage.setItem(SESSION_PASSES, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(SUBSCRIPTION_EVENT));
}

export function clearEventPasses(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(SESSION_PASSES);
    window.sessionStorage.removeItem(SESSION_PVOD);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(SUBSCRIPTION_EVENT));
}

/** Call on sign-out (or demo reset) so the subscription / event-pass paywall shows again. */
export function clearPaywallUnlocks(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(SESSION_SUBSCRIPTION);
    window.sessionStorage.removeItem(SESSION_PVOD);
    window.sessionStorage.removeItem(SESSION_PASSES);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(SUBSCRIPTION_EVENT));
}

export function hasSubscriptionUnlock(): boolean {
  return getSubscriptionSession() !== null;
}

export function hasPvodUnlock(): boolean {
  if (typeof window === "undefined") return false;
  if (getOwnedPasses().length > 0) return true;
  return window.sessionStorage.getItem(SESSION_PVOD) === "1";
}
