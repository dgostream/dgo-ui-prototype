"use client";

import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";
import { PRICE_REGIONS, type PriceRegion } from "@/utils/subscriptionCatalog";
import { findSku } from "@/utils/subscriptionCatalog";
import {
  DEV_EXCLUSIVE_EVENT,
  DEV_REGION_EVENT,
  SUBSCRIPTION_EVENT,
  clearEventPasses,
  getDevRegion,
  getExclusiveEnabled,
  getSubscriptionSession,
  sessionFromSku,
  setDevRegion,
  setExclusiveEnabled,
  setSubscriptionSession,
} from "@/utils/paywall";

function seedSession(region: PriceRegion) {
  const current = getSubscriptionSession();
  const sku = findSku(region, current?.tier ?? "plus", current?.duration ?? "03M");
  if (sku) setSubscriptionSession(sessionFromSku(sku));
}

/** Prototype-only overlay. Not a consumer control. */
export function GeoDevToggle({ className }: { className?: string }) {
  const [region, setRegion] = useState<PriceRegion>("nepal");
  const [subscribed, setSubscribed] = useState(false);
  const [exclusive, setExclusive] = useState(true);

  useEffect(() => {
    const sync = () => {
      setRegion(getDevRegion());
      setSubscribed(getSubscriptionSession() !== null);
      setExclusive(getExclusiveEnabled());
    };
    sync();
    window.addEventListener(DEV_REGION_EVENT, sync);
    window.addEventListener(SUBSCRIPTION_EVENT, sync);
    window.addEventListener(DEV_EXCLUSIVE_EVENT, sync);
    return () => {
      window.removeEventListener(DEV_REGION_EVENT, sync);
      window.removeEventListener(SUBSCRIPTION_EVENT, sync);
      window.removeEventListener(DEV_EXCLUSIVE_EVENT, sync);
    };
  }, []);

  return (
    <div className={cn("fixed bottom-3 left-3 z-80 font-mono text-[10px] leading-none", className)}>
      <div className="rounded border border-lime-400/40 bg-black/85 px-2 py-1.5 shadow-[0_0_0_1px_rgba(0,0,0,0.6)]">
        <div className="mb-1 flex items-center gap-1.5 text-lime-300/90">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-lime-400 animate-pulse" />
          <span className="uppercase tracking-wider">DEV · geo / state</span>
        </div>
        <div className="flex max-w-[min(100vw-1.5rem,28rem)] flex-wrap items-center gap-1.5">
          {PRICE_REGIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                setDevRegion(opt.id);
                if (getSubscriptionSession()) seedSession(opt.id);
              }}
              className={cn(
                "min-w-9 rounded px-2 py-1 uppercase tracking-wider",
                region === opt.id
                  ? "bg-lime-400 text-black"
                  : "bg-white/5 text-lime-200/70 hover:bg-white/10"
              )}
            >
              {opt.label}
            </button>
          ))}
          <span className="mx-0.5 h-3 w-px bg-lime-400/25" />
          {(
            [
              { on: false, label: "OFF" },
              { on: true, label: "SUB" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => {
                if (opt.on) seedSession(getDevRegion());
                else {
                  setSubscriptionSession(null);
                  clearEventPasses();
                }
              }}
              className={cn(
                "min-w-9 rounded px-2 py-1 uppercase tracking-wider",
                subscribed === opt.on
                  ? "bg-lime-400 text-black"
                  : "bg-white/5 text-lime-200/70 hover:bg-white/10"
              )}
            >
              {opt.label}
            </button>
          ))}
          <span className="mx-0.5 h-3 w-px bg-lime-400/25" />
          <button
            type="button"
            onClick={() => setExclusiveEnabled(!exclusive)}
            className={cn(
              "min-w-9 rounded px-2 py-1 uppercase tracking-wider",
              exclusive ? "bg-lime-400 text-black" : "bg-white/5 text-lime-200/70 hover:bg-white/10"
            )}
          >
            PPV
          </button>
        </div>
      </div>
    </div>
  );
}
