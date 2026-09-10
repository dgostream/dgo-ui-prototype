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
    const read = () => setSession(getSubscriptionSession());
    read();
    window.addEventListener(SUBSCRIPTION_EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(SUBSCRIPTION_EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, []);

  return session;
}
