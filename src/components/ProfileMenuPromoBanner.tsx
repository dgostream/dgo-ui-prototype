"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/utils/cn";
import { useTranslated } from "@/components/Translate";

/**
 * Generic account-menu display ad: wide JPEG/WebP banner + optional click URL.
 * Add a file under `public/` (e.g. `menu-banner.jpg`) and pass `imageSrc="/menu-banner.jpg"`.
 */
export type ProfileMenuAdBannerProps = {
  className?: string;
  /** Banner asset (typically a wide JPEG). */
  imageSrc?: string | null;
  /** Optional click-through (app path or `https://…`). Omit for view-only. */
  href?: string | null;
  openInNewTab?: boolean;
  onBeforeNavigate?: () => void;
  /** Accessible name when banner is clickable */
  alt?: string;
};

export function ProfileMenuPromoBanner({
  className,
  imageSrc,
  href = null,
  openInNewTab = true,
  onBeforeNavigate,
  alt,
}: ProfileMenuAdBannerProps) {
  const router = useRouter();
  const adLabel = useTranslated("Ad");
  const sponsoredLabel = useTranslated("Sponsored");
  const placementLabel = useTranslated("Account menu banner");
  const emptyLabel = useTranslated("Reserved for advertising");
  const emptyHint = useTranslated("Wide JPEG · e.g. 640×200");
  const adAlt = useTranslated("Advertisement");

  const src = imageSrc?.trim() || null;
  const target = href?.trim() || null;
  const clickable = !!src && !!target;

  const go = () => {
    if (!target) return;
    onBeforeNavigate?.();
    const external = /^https?:\/\//i.test(target);
    if (external) {
      if (openInNewTab) window.open(target, "_blank", "noopener,noreferrer");
      else window.location.assign(target);
      return;
    }
    router.push(target.startsWith("/") ? target : `/${target}`);
  };

  const bannerBody = (
    <>
      {src ? (
        <div className="relative aspect-16/5 w-full overflow-hidden bg-white/5">
          <img
            src={src}
            alt=""
            className="h-full w-full object-cover object-center"
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : (
        <div
          className={cn(
            "flex aspect-16/5 w-full flex-col items-center justify-center gap-1 border border-dashed border-white/15 bg-white/3 px-3",
            clickable && "cursor-pointer"
          )}
        >
          <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/35">{emptyLabel}</p>
          <p className="text-center text-[9px] font-medium text-white/20">{emptyHint}</p>
        </div>
      )}
    </>
  );

  return (
    <aside
      className={cn(
        "overflow-hidden rounded-xl border border-amber-500/20 bg-black/50 shadow-inner shadow-black/40",
        className
      )}
      aria-label={`${adLabel}: ${placementLabel}`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-amber-500/6 px-2.5 py-1.5">
        <span className="rounded border border-amber-500/35 bg-amber-500/10 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[0.22em] text-amber-400/95">
          {adLabel}
        </span>
        <span className="text-right text-[7px] font-bold uppercase tracking-[0.18em] text-white/40">{sponsoredLabel}</span>
      </div>

      {clickable ? (
        <button
          type="button"
          onClick={go}
          className="w-full p-0 text-left transition-opacity hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          aria-label={alt ?? adAlt}
        >
          {bannerBody}
        </button>
      ) : (
        <div className="w-full">{bannerBody}</div>
      )}
    </aside>
  );
}
