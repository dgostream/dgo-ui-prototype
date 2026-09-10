"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AppLocale } from "@/components/LanguageSwitcher";
import { readStoredLocale } from "@/components/LanguageSwitcher";
import { SITE_WIDE_PHRASES } from "@/i18n/siteWidePhrases";

const CACHE_STORAGE = "dgo_translate_cache_v1";
const MAX_CACHE_KEYS = 400;

type TranslationContextValue = {
  locale: AppLocale;
  translate: (text: string) => Promise<string>;
  translateMany: (texts: string[]) => Promise<string[]>;
};

const TranslationContext = createContext<TranslationContextValue | null>(null);

function loadDiskCache(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(CACHE_STORAGE);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function persistCache(map: Record<string, string>) {
  if (typeof window === "undefined") return;
  try {
    const keys = Object.keys(map);
    let next = map;
    if (keys.length > MAX_CACHE_KEYS) {
      next = {};
      keys.slice(-MAX_CACHE_KEYS).forEach((k) => {
        next[k] = map[k];
      });
    }
    sessionStorage.setItem(CACHE_STORAGE, JSON.stringify(next));
  } catch {
    /* quota / private mode */
  }
}

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<AppLocale>("en");
  const cacheRef = useRef<Record<string, string>>({});

  useEffect(() => {
    cacheRef.current = loadDiskCache();
    setLocale(readStoredLocale());
    const onChange = (e: Event) => {
      const d = (e as CustomEvent<AppLocale>).detail;
      if (d === "en" || d === "np") setLocale(d);
    };
    window.addEventListener("dgo-locale-change", onChange);
    return () => window.removeEventListener("dgo-locale-change", onChange);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "np" ? "ne" : "en";
  }, [locale]);

  const cacheKey = useCallback((text: string) => `${locale}::${text.trim()}`, [locale]);

  const translateMany = useCallback(
    async (texts: string[]): Promise<string[]> => {
      if (locale === "en") return texts;
      const results = [...texts];
      const pending: string[] = [];
      const pendingIdx: number[] = [];

      texts.forEach((raw, i) => {
        const t = raw.trim();
        const key = `${locale}::${t}`;
        const hit = cacheRef.current[key];
        if (hit) results[i] = hit;
        else {
          pending.push(t);
          pendingIdx.push(i);
        }
      });

      if (pending.length === 0) return results;

      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texts: pending,
          sourceLang: "en",
          targetLang: locale,
        }),
      });

      let data: { translations?: string[] } = {};
      try {
        data = (await res.json()) as { translations?: string[] };
      } catch {
        /* ignore */
      }
      const translated =
        Array.isArray(data.translations) && data.translations.length === pending.length
          ? data.translations
          : pending;

      pendingIdx.forEach((origIndex, j) => {
        const tr = translated[j] ?? texts[origIndex];
        results[origIndex] = tr;
        cacheRef.current[cacheKey(pending[j])] = tr;
      });
      persistCache(cacheRef.current);
      return results;
    },
    [locale, cacheKey]
  );

  const translate = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || locale === "en") return text;
      const key = cacheKey(trimmed);
      const hit = cacheRef.current[key];
      if (hit) return hit;
      const [out] = await translateMany([trimmed]);
      return out ?? text;
    },
    [locale, cacheKey, translateMany]
  );

  /** Warm cache for common UI copy when switching to Nepali */
  useEffect(() => {
    if (locale !== "np") return;
    void translateMany(SITE_WIDE_PHRASES);
  }, [locale, translateMany]);

  const value = useMemo(
    () => ({ locale, translate, translateMany }),
    [locale, translate, translateMany]
  );

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(TranslationContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within TranslationProvider");
  }
  return ctx;
}

/** Safe no-op when provider missing (e.g. admin routes if ever shared) */
export function useTranslationOptional() {
  return useContext(TranslationContext);
}
