"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Plus, Share2, Info, Star, Clock, Flame, Users, TrendingUp, Zap } from "lucide-react";
import { cn } from "@/utils/cn";

import { useRouter } from "next/navigation";
import { getContentById } from "@/utils/content";
import { useEffect, useState } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Active home tab — drives subscription vs PVOD paywall on watch */
  fromTab: string;
  content: {
    id: string;
    title: string;
    accent: string;
    type: string;
    stats?: string;
    [key: string]: any; // Allow other props
  };
}

export default function DetailModal({ isOpen, onClose, fromTab, content: initialContent }: ModalProps) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const isPPV = content.isPPV || content.type === 'special';

  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
      getContentById(initialContent.id).then(dbContent => {
        if (dbContent) setContent(dbContent);
      });
    }
  }, [isOpen, initialContent]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] md:p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/95 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          className={cn(
            "relative flex w-full flex-col overflow-hidden border bg-black shadow-2xl transition-colors duration-500",
            "max-md:mx-auto max-md:max-h-[min(85dvh,calc(100svh-2rem))] max-md:max-w-sm max-md:rounded-2xl",
            "max-w-5xl md:h-[min(80vh,900px)] md:max-h-[85vh] md:flex-row md:rounded-4xl",
            isPPV ? "border-amber-500/30" : "border-white/10"
          )}
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-50 rounded-full border border-white/10 bg-black/60 p-2.5 backdrop-blur-md transition-colors hover:bg-white/10 md:right-6 md:top-6 md:p-3"
            aria-label="Close"
          >
            <X size={20} className="md:h-6 md:w-6" />
          </button>

          {/* Hero art — desktop only; mobile uses small 2:3 thumb in panel */}
          <div
            className={cn(
              "relative hidden w-3/5 shrink-0 overflow-hidden bg-brand-secondary md:block md:h-full md:min-h-0"
            )}
          >
            {content.img ? (
              <img
                src={content.img}
                alt=""
                className="h-full w-full object-cover object-[center_20%] opacity-90 md:absolute md:inset-0 md:opacity-60"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <img src="/ios-icon.png" alt="DGO" className="w-1/3 h-auto object-contain opacity-[0.07]" />
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent md:bg-linear-to-r md:from-black md:via-transparent md:to-transparent" />
            {/* Title on hero — desktop only at large size; mobile uses copy in scroll pane */}
            <div className="absolute bottom-0 left-0 right-0 hidden p-6 md:block md:bottom-10 md:left-10 md:p-0">
              <div className="mb-4 flex flex-wrap items-center gap-2 md:mb-6 md:gap-4">
                {isPPV ? (
                  <span className="rounded-full bg-amber-500 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-black shadow-lg shadow-amber-500/20 md:px-4 md:py-1.5 md:text-[10px]">
                    Limited Ticket Event
                  </span>
                ) : (
                  <span className="rounded-full border border-brand-purple/40 bg-brand-purple/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] shadow-[0_0_18px_rgba(138,63,252,0.15)] md:px-4 md:text-[10px]">
                    <span className="text-gradient">Trending #1</span>
                  </span>
                )}
                <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-white/40 md:text-[10px]">
                  <Users size={12} />
                  <span>{isPPV ? "Exclusive Access" : "2.4M Watching"}</span>
                </div>
              </div>
              <h2 className="font-geist text-3xl font-black uppercase italic leading-[0.95] tracking-tighter text-white drop-shadow-2xl sm:text-5xl lg:text-7xl">
                {content.title}
              </h2>
            </div>
          </div>

          {/* Info + actions */}
          <div
            className={cn(
              "flex min-h-0 w-full flex-1 flex-col justify-between overflow-y-auto overscroll-contain md:w-2/5",
              "px-4 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] md:p-12 md:pt-10",
              isPPV ? "bg-linear-to-b from-[#111] to-[#050505]" : "bg-[#050505]"
            )}
          >
            {/* Mobile: compact 2:3 poster + title (no full-width hero) */}
            <div className="mb-4 flex gap-3 md:mb-0 md:hidden">
              {content.img ? (
                <div className="relative aspect-2/3 w-18 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-brand-secondary shadow-inner sm:w-20">
                  <img
                    src={content.img}
                    alt=""
                    className="h-full w-full object-cover object-[center_20%]"
                  />
                </div>
              ) : (
                <div className="flex aspect-2/3 w-18 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 sm:w-20">
                  <img src="/ios-icon.png" alt="" className="h-8 w-8 opacity-20" />
                </div>
              )}
              <div className="min-w-0 flex-1 pr-9 pt-0.5">
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                  {isPPV ? (
                    <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[7px] font-black uppercase tracking-widest text-black">
                      Limited Ticket
                    </span>
                  ) : (
                    <span className="rounded-full border border-brand-purple/40 bg-brand-purple/10 px-2 py-0.5 text-[7px] font-black uppercase tracking-widest shadow-[0_0_12px_rgba(138,63,252,0.12)]">
                      <span className="text-gradient">Trending</span>
                    </span>
                  )}
                  <span className="text-[7px] font-bold uppercase tracking-widest text-white/35">
                    {isPPV ? "Exclusive" : "2.4M watching"}
                  </span>
                </div>
                <h2 className="font-geist text-base font-black uppercase italic leading-snug tracking-tight text-white">
                  {content.title}
                </h2>
              </div>
            </div>
            <div className="space-y-4 md:space-y-10">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                {isPPV ? (
                  <span className="flex items-center gap-2 text-amber-500 font-black"><Zap size={14} fill="currentColor" /> PPV ACCESS</span>
                ) : (
                  <span className="text-gradient flex items-center gap-2">
                    <Star size={14} className="shrink-0 fill-current" /> 9.8 Rating
                  </span>
                )}
                <span>2026</span>
                <span className="border border-white/20 px-2 rounded-sm text-white">4K UHD</span>
              </div>

              <div className="space-y-2 md:space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.28em] text-white/90 md:text-xs">The Opportunity</h3>
                <p className="text-xs font-light leading-relaxed text-white/50 md:text-sm line-clamp-4 md:line-clamp-none">
                  {isPPV
                    ? "Own this exclusive event. Purchase your digital ticket now to unlock unlimited access to this premier Nepali special."
                    : "Join the millions currently experiencing this masterpiece. Recognized globally for its groundbreaking narrative."}
                </p>
              </div>

              <div className="flex flex-col gap-3 md:gap-6">
                {isPPV ? (
                  <div className="space-y-2 rounded-3xl border border-amber-500/20 bg-amber-500/5 p-4 md:space-y-3 md:p-6">
                    <div className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest">Pricing</div>
                    <div className="text-3xl font-black text-white">रू 499 <span className="text-xs text-white/20 font-medium">/ Ticket</span></div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5 md:p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-gradient/90 shadow-md shadow-brand-purple/25">
                      <TrendingUp size={20} className="text-white" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">Social Proof</div>
                      <div className="text-xs font-bold text-white">Trending in 42 countries today</div>
                    </div>
                  </div>
                )}

                <div
                  className={cn(
                    "flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.2em]",
                    isPPV ? "text-amber-500" : "text-gradient"
                  )}
                >
                  <Flame size={18} className={isPPV ? undefined : "shrink-0 fill-current"} />
                  <span>{isPPV ? "One-Time Broadcast" : "Limited Access Premier"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 pt-4 md:space-y-4 md:pt-12">
              {isPPV ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    const ret = `/watch/${content.id}`;
                    router.push(`/join?flow=pvod&return=${encodeURIComponent(ret)}`);
                  }}
                  style={{ backgroundColor: '#f59e0b' }}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-xs font-black uppercase tracking-[0.2em] text-black shadow-2xl shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95 md:py-6"
                >
                  <Zap size={18} fill="currentColor" /> Buy Ticket Now
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push(
                      `/watch/${content.id}?fromTab=${encodeURIComponent(fromTab)}`
                    );
                  }}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-brand-gradient py-4 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-brand-purple/30 transition-all hover:brightness-110 active:scale-95 md:py-6"
                >
                  <Play size={18} fill="currentColor" /> Stream Now
                </button>
              )}
              <div className="flex gap-3 md:gap-4">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push(
                      `/details/${content.id}?fromTab=${encodeURIComponent(fromTab)}`
                    );
                  }}
                  className="glass-dark flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 py-4 text-[10px] font-black uppercase tracking-widest text-white/70 transition-colors hover:bg-white/5 md:py-5"
                >
                  <Info size={16} /> Full Details
                </button>
                <button
                  type="button"
                  className="glass-dark rounded-2xl border border-white/10 p-4 text-white/70 transition-colors hover:bg-white/5 md:p-5"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
