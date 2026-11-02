"use client";

import { useEffect, useState } from "react";
import {
  getSubscriptionSession,
  SUBSCRIPTION_EVENT,
  type SubscriptionSession,
} from "@/utils/paywall";

export function useSubscriptionSession(): SubscriptionSession | null {
  const [session, setSession] = useState<SubscriptionSession | null>(null);

  useEffect(() => {
    let expiryTimer: ReturnType<typeof setTimeout> | undefined;
    const read = () => {
      clearTimeout(expiryTimer);
      const current = getSubscriptionSession();
      setSession(current);
      const expires = current?.region === "nepal" ? Date.parse(current.paidThrough) : NaN;
      if (Number.isFinite(expires) && expires > Date.now()) {
        expiryTimer = setTimeout(read, Math.min(expires - Date.now() + 1, 2_147_483_647));
      }
    };
    read();
    window.addEventListener(SUBSCRIPTION_EVENT, read);
    window.addEventListener("storage", read);
    window.addEventListener("focus", read);
    return () => {
      clearTimeout(expiryTimer);
      window.removeEventListener(SUBSCRIPTION_EVENT, read);
      window.removeEventListener("storage", read);
      window.removeEventListener("focus", read);
    };
  }, []);

  return session;
}
