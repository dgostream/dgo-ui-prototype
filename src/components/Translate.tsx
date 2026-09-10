"use client";

import { useEffect, useState } from "react";
import { useTranslationOptional } from "@/contexts/TranslationContext";

/**
 * Machine-translated text (MyMemory by default; set GOOGLE_TRANSLATE_API_KEY for Google).
 * Pass English source string as children.
 */
export function T({ children }: { children: string }) {
  const text = useTranslated(children);
  return <>{text}</>;
}

/**
 * Returns English immediately, then replaces with translation when locale is `np` and the API responds.
 */
export function useTranslated(source: string): string {
  const ctx = useTranslationOptional();
  const [text, setText] = useState(source);

  useEffect(() => {
    setText(source);
    if (!ctx || ctx.locale === "en") return;

    let cancelled = false;
    void ctx.translate(source).then((t) => {
      if (!cancelled) setText(t);
    });
    return () => {
      cancelled = true;
    };
  }, [source, ctx, ctx?.locale]);

  return text;
}
