"use client";

import { PARTNER_BRANDS, type PartnerId } from "@/utils/partnerBrands";

export function PartnerRailBanner({ partner }: { partner: PartnerId }) {
  const brand = PARTNER_BRANDS[partner];
  return (
    <div className="px-5 sm:px-8 md:px-24 -mt-4 md:-mt-8 mb-8 md:mb-12">
      <div
        className="relative overflow-hidden rounded-2xl border border-white/10 px-5 py-4 md:px-7 md:py-5"
        style={{ backgroundColor: brand.surface }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background: `radial-gradient(80% 120% at 0% 50%, ${brand.from}55, transparent 55%), radial-gradient(70% 100% at 100% 50%, ${brand.to}40, transparent 50%)`,
          }}
        />
        <div className="relative flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.35em] text-white/40">{brand.eyebrow}</p>
            <p
              className="text-lg md:text-2xl font-black tracking-tight bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(90deg, ${brand.from}, ${brand.via}, ${brand.to})` }}
            >
              {brand.name}
            </p>
          </div>
          <p className="max-w-md text-xs md:text-sm text-white/50 leading-relaxed">{brand.tagline}</p>
        </div>
      </div>
    </div>
  );
}
