"use client";

import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";
import { CountryFlag } from "@/components/CountryFlag";

const STORAGE_KEY = "dgo_lang";

export type AppLocale = "en" | "np";

export function readStoredLocale(): AppLocale {
  if (typeof window === "undefined") return "en";
  const s = sessionStorage.getItem(STORAGE_KEY);
  return s === "np" ? "np" : "en";
}

const LOCALE_ROWS: { locale: AppLocale; flagCode: string; label: string; aria: string }[] = [
  { locale: "en", flagCode: "us", label: "EN", aria: "English" },
  { locale: "np", flagCode: "np", label: "NP", aria: "Nepali" },
];

export default function LanguageSwitcher({ className }: { className?: string }) {
  const [lang, setLang] = useState<AppLocale>("en");

  useEffect(() => {
    setLang(readStoredLocale());
  }, []);

  const select = (l: AppLocale) => {
    setLang(l);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, l);
      window.dispatchEvent(new CustomEvent("dgo-locale-change", { detail: l }));
    }
  };

  return (
    <div
      className={cn(
        "flex rounded-full border border-white/12 bg-black/50 backdrop-blur-md p-0.5",
        className
      )}
      role="group"
      aria-label="Language"
    >
      {LOCALE_ROWS.map(({ locale: l, flagCode, label, aria }) => (
        <button
          key={l}
          type="button"
          aria-label={aria}
          aria-pressed={lang === l}
          onClick={() => select(l)}
          className={cn(
            "flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all min-w-[2.75rem]",
            lang === l
              ? "bg-brand-gradient text-white shadow-md shadow-brand-purple/20"
              : "text-white/40 hover:text-white/70"
          )}
        >
          <CountryFlag code={flagCode} size={16} className="rounded-sm" title={aria} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
