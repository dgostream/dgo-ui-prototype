"use client";

import type { ReactNode } from "react";
import { TranslationProvider } from "@/contexts/TranslationContext";
import { GeoDevToggle } from "@/components/GeoDevToggle";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <TranslationProvider>
      {children}
      <GeoDevToggle />
    </TranslationProvider>
  );
}
