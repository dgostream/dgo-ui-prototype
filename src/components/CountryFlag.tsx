"use client";

import { cn } from "@/utils/cn";

/**
 * ISO 3166-1 alpha-2 (lowercase), or `eng` / `sct` for England / Scotland.
 * `null` / `tbd` / `xx` shows a neutral placeholder.
 */
export type CountryFlagCode = string | null | undefined;

/** UK home nations — SVG (emoji regional flags render poorly on Windows). */
const HOME_NATION_SVG: Record<string, string> = {
  eng: "https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.2.3/flags/4x3/gb-eng.svg",
  sct: "https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.2.3/flags/4x3/gb-sct.svg",
};

const PLACEHOLDER_KEYS = new Set(["tbd", "xx", "playoff", "play-off", "play-off d"]);

/** flagcdn.com only serves these widths; any other value (e.g. w36) returns 404. */
const FLAGCDN_WIDTHS = [20, 40, 80, 160, 320, 640, 1280, 2560] as const;

function pickFlagcdnWidth(displayPx: number): number {
  const need = Math.max(20, Math.ceil(displayPx * 2));
  for (const w of FLAGCDN_WIDTHS) {
    if (w >= need) return w;
  }
  return FLAGCDN_WIDTHS[FLAGCDN_WIDTHS.length - 1];
}

type CountryFlagProps = {
  code: CountryFlagCode;
  size?: number;
  className?: string;
  title?: string;
};

export function CountryFlag({ code, size = 20, className, title }: CountryFlagProps) {
  const key = (code ?? "").toLowerCase().trim();
  if (!key || PLACEHOLDER_KEYS.has(key)) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center shrink-0 rounded border border-white/15 bg-white/8 text-white/45",
          className
        )}
        style={{ width: size, height: Math.round(size * 0.72) }}
        title={title ?? "TBD"}
        aria-hidden
      >
        <span className="text-[0.5em] leading-none select-none">⚽</span>
      </span>
    );
  }

  const svgSrc = HOME_NATION_SVG[key];
  if (svgSrc) {
    return (
      <img
        src={svgSrc}
        crossOrigin="anonymous"
        alt=""
        width={size}
        height={Math.round((size * 3) / 4)}
        className={cn(
          "inline-block shrink-0 object-cover rounded-[2px] shadow-sm ring-1 ring-black/30 bg-black/20",
          className
        )}
        style={{ width: size, height: "auto" }}
        draggable={false}
        title={title}
        loading="lazy"
      />
    );
  }

  const iso = key;
  const cdnW = pickFlagcdnWidth(size);
  return (
    <img
      src={`https://flagcdn.com/w${cdnW}/${iso}.png`}
      crossOrigin="anonymous"
      alt=""
      width={size}
      height={Math.round(size * 0.67)}
      className={cn(
        "inline-block shrink-0 object-cover rounded-[2px] shadow-sm ring-1 ring-black/30 bg-black/20",
        className
      )}
      style={{ width: size, height: "auto" }}
      draggable={false}
      title={title}
      loading="lazy"
    />
  );
}
