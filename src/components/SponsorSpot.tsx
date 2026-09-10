"use client";

import { useState } from "react";
import { cn } from "@/utils/cn";

const DEFAULT_SPONSOR_NAME = "Khalti IME";
const DEFAULT_SPONSOR_LOGO = "/khalti-ime-full.png";

type Variant = "slim" | "card" | "compact" | "hero";

interface SponsorSpotProps {
  variant?: Variant;
  className?: string;
  /** e.g. "Official banking partner" */
  label?: string;
  /** Display name next to logo mark */
  partnerName?: string;
  /** Short initials inside the mark (hero fallback if logo fails to load) */
  partnerInitials?: string;
  /** Hero variant logo URL */
  heroLogoSrc?: string;
  /** When set, replaces label + mark + name with a full-width 4:1 banner */
  bannerImageSrc?: string;
  bannerAlt?: string;
}

export default function SponsorSpot({
  variant = "slim",
  className,
  label = "Official partner",
  partnerName = DEFAULT_SPONSOR_NAME,
  partnerInitials = "KI",
  heroLogoSrc,
  bannerImageSrc,
  bannerAlt = "",
}: SponsorSpotProps) {
  const [heroLogoFailed, setHeroLogoFailed] = useState(false);
  const heroLogoUrl = heroLogoSrc ?? DEFAULT_SPONSOR_LOGO;

  if (bannerImageSrc) {
    return (
      <div
        className={cn(
          "w-full overflow-hidden rounded-xl border border-white/8 bg-[#06060c]",
          className
        )}
      >
        <div className="relative aspect-4/1 w-full">
          <img
            src={bannerImageSrc}
            alt={bannerAlt}
            className="absolute inset-0 h-full w-full object-contain object-center"
          />
        </div>
      </div>
    );
  }

  const mark = (
    <div
      className={cn(
        "rounded-xl border border-white/12 bg-white/5 flex items-center justify-center font-black text-white/90 shrink-0",
        variant === "card" ? "w-14 h-14 text-sm" : "w-10 h-10 text-[10px]"
      )}
      aria-hidden
    >
      {partnerInitials}
    </div>
  );

  if (variant === "hero") {
    return (
      <div
        className={cn(
          "flex w-full max-w-full flex-row flex-wrap items-center justify-center gap-x-3 gap-y-1 py-1 px-4 max-md:gap-x-3.5 sm:gap-x-4 sm:px-8 md:gap-x-6 md:py-2 md:px-10",
          className
        )}
      >
        <span className="text-[10px] font-light uppercase leading-none text-white/50 max-md:tracking-[0.38em] whitespace-nowrap sm:text-xs sm:tracking-[0.42em] md:text-sm">
          {label}
        </span>
        {!heroLogoFailed ? (
          <img
            src={heroLogoUrl}
            alt=""
            width={360}
            height={84}
            className="h-10 w-auto max-w-[min(58vw,15rem)] object-contain object-center brightness-0 invert sm:h-12 sm:max-w-[min(52vw,19rem)] md:h-14 md:max-w-[min(46vw,24rem)]"
            onError={() => setHeroLogoFailed(true)}
          />
        ) : (
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-brand-purple/90 to-brand-pink/80 text-[9px] font-semibold tracking-wide text-white md:size-10 md:text-[10px]"
            aria-hidden
          >
            {partnerInitials}
          </span>
        )}
        <span className="sr-only">{partnerName}</span>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-white/8 bg-white/2",
          className
        )}
      >
        <span className="text-[8px] font-black uppercase tracking-[0.25em] text-white/35">{label}</span>
        <span className="w-1 h-1 rounded-full bg-white/15" />
        <span className="text-[10px] font-black text-white/55 tracking-tight">{partnerName}</span>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div
        className={cn(
          "flex items-center gap-4 p-4 md:p-5 rounded-2xl border border-brand-purple/15 bg-brand-purple/4",
          className
        )}
      >
        {mark}
        <div className="min-w-0">
          <p className="text-[8px] font-black uppercase tracking-[0.35em] text-brand-purple/70 mb-0.5">{label}</p>
          <p className="text-sm md:text-base font-black text-white tracking-tight">{partnerName}</p>
          <p className="text-[10px] text-white/30 mt-0.5">Supporting the DGO streaming experience</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-white/6 bg-white/2",
        className
      )}
    >
      <span className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.3em] text-white/30">{label}</span>
      {mark}
      <span className="text-[10px] md:text-xs font-black text-white/50">{partnerName}</span>
    </div>
  );
}
