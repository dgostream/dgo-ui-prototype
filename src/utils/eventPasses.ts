import type { PriceRegion } from "@/utils/subscriptionCatalog";

/** One-time event passes. Rest-of-world prices match Android Zone A. */
export type EventPass = {
  key: string;
  league: string;
  title: string;
  subtitle: string;
  window: string;
  accessUntil: string;
  includes: string[];
  prices: Record<PriceRegion, number>;
  accent: string;
  coveredBy?: string;
};

export const EVENT_PASSES: EventPass[] = [
  {
    key: "EURO28-ALL",
    league: "UEFA",
    title: "EURO 2028",
    subtitle: "Full tournament pass",
    window: "Jun – Jul 2028",
    accessUntil: "2028-07-31T23:59:59Z",
    includes: ["All 51 matches live", "Replays & highlights", "Phone, TV & web"],
    prices: { nepal: 999, za: 9.99, zb: 24.99, zc: 12.99 },
    accent: "#3B82F6",
  },
  {
    key: "EURO28-KO",
    league: "UEFA",
    title: "EURO 2028",
    subtitle: "Knockout stage pass",
    window: "Round of 16 to the final",
    accessUntil: "2028-07-31T23:59:59Z",
    includes: ["15 knockout matches live", "Replays & highlights", "Phone, TV & web"],
    prices: { nepal: 499, za: 5.99, zb: 14.99, zc: 7.99 },
    accent: "#FF00BD",
    coveredBy: "EURO28-ALL",
  },
];

export type PassOwnership = "owned" | "included";

export function findEvent(key: string): EventPass | undefined {
  return EVENT_PASSES.find((event) => event.key === key);
}

export function eventPrice(event: EventPass, region: PriceRegion): number {
  return event.prices[region];
}

export function passOwnership(event: EventPass, owned: readonly string[]): PassOwnership | null {
  if (owned.includes(event.key)) return "owned";
  if (event.coveredBy && owned.includes(event.coveredBy)) return "included";
  return null;
}
