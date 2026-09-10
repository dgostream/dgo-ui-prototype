"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Crown, ChevronRight, Tv2, Clapperboard, Sparkles } from "lucide-react";
import { useSubscriptionSession } from "@/hooks/useSubscriptionSession";
import { DURATION_LABELS, TIER_META } from "@/utils/subscriptionCatalog";

const MARQUEE = [
  "Special Ops",
  "Prem Geet",
  "The Family Man",
  "Buhari",
  "Aarya",
  "Prasad 2",
  "12th Fail",
  "Jhingedaau",
  "The Night Manager",
  "Prem Geet 3",
  "Stree 2",
  "Behuli from Meghauli",
];

export function HomeSubscribeDrive() {
  const router = useRouter();
  const session = useSubscriptionSession();
  const goJoin = () =>
    router.push(
      session
        ? session.billingMode === "recurring"
          ? "/join?mode=manage"
          : "/join?mode=renew"
        : "/join"
    );

  if (session) {
    return (
      <section className="px-5 sm:px-8 md:px-24 -mt-2 md:-mt-6 mb-10 md:mb-16">
        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#08050f] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Your plan</p>
            <p className="mt-1 text-lg font-black text-white">
              {TIER_META[session.tier].name}
              <span className="ml-2 text-sm font-semibold text-white/45">{DURATION_LABELS[session.duration]}</span>
            </p>
            <p className="mt-0.5 text-xs text-white/40">
              {session.status === "canceling"
                ? "Cancellation scheduled · access remains active"
                : session.billingMode === "prepaid"
                  ? session.liveSports
                    ? "Access active · live sports included"
                    : "Access active · ready to watch"
                  : session.liveSports
                    ? "Auto-renewing · live sports included"
                    : "Auto-renewing · no live sports on this term"}
            </p>
          </div>
          <button
            type="button"
            onClick={goJoin}
            className="shrink-0 rounded-xl border border-white/12 px-4 py-2 text-xs font-bold text-white/70 hover:bg-white/6"
          >
            {session.billingMode === "recurring" ? "Manage plan" : "Add time or upgrade"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="px-5 sm:px-8 md:px-24 -mt-2 md:-mt-6 mb-10 md:mb-16">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[1.75rem] md:rounded-[2rem] border border-white/12 bg-[#08050f]"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#0B5FFF]/35 blur-[90px]" />
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-[#E10600]/28 blur-[80px]" />
          <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-[#8a3ffc]/30 blur-[80px]" />
        </div>

        <div className="relative border-b border-white/8 bg-black/25 py-2.5 overflow-hidden">
          <div className="flex w-max animate-[home-marquee_28s_linear_infinite] gap-8 pr-8">
            {[...MARQUEE, ...MARQUEE].map((title, i) => (
              <span key={`${title}-${i}`} className="flex items-center gap-8 text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
                {title}
                <span className="h-1 w-1 rounded-full bg-white/25" />
              </span>
            ))}
          </div>
        </div>

        <div className="relative grid gap-8 p-6 md:grid-cols-[1.2fr_0.8fr] md:items-center md:p-10 lg:p-12">
          <div>
            <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.42em] text-white/40 mb-3">
              One membership
            </p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-[0.95] mb-3">
              Two houses.
              <br />
              <span className="text-gradient">The whole catalogue.</span>
            </h2>
            <p className="text-white/50 text-sm md:text-base max-w-lg leading-relaxed mb-6">
              JioHotstar Specials and movies. OSR Digital&apos;s Nepali film library. DGO originals. Pick Mobile or Plus — then just watch.
            </p>

            <div className="flex flex-wrap gap-2 mb-7">
              {[
                { icon: Tv2, label: "JioHotstar", color: "#0B5FFF" },
                { icon: Clapperboard, label: "OSR Digital", color: "#E10600" },
                { icon: Sparkles, label: "DGO catalogue", color: "#8a3ffc" },
              ].map(({ icon: Icon, label, color }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold"
                  style={{ borderColor: `${color}55`, backgroundColor: `${color}14`, color: "#fff" }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color }} />
                  {label}
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={goJoin}
              className="inline-flex items-center gap-3 rounded-2xl bg-brand-gradient px-7 py-4 text-sm font-black uppercase tracking-[0.14em] text-white shadow-xl shadow-brand-purple/30 transition-transform hover:scale-[1.03] active:scale-95"
            >
              <Crown className="h-4 w-4" />
              See plans
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-3">
            <button
              type="button"
              onClick={goJoin}
              className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left transition-colors hover:border-[#0B5FFF]/45 hover:bg-[#0B5FFF]/10"
            >
              <p className="text-[9px] font-black uppercase tracking-widest text-[#7EB6FF] mb-1">DGO Mobile</p>
              <p className="text-xl font-black text-white">720p · phones & tablets</p>
              <p className="text-xs text-white/40 mt-1">The library in your pocket. From रू 199 / $3.99</p>
            </button>
            <button
              type="button"
              onClick={goJoin}
              className="group rounded-2xl border border-brand-pink/25 bg-brand-pink/8 p-5 text-left transition-colors hover:border-brand-pink/50"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-brand-pink">DGO Plus</p>
                <span className="rounded-full bg-brand-pink/20 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-brand-pink">Best for TV</span>
              </div>
              <p className="text-xl font-black text-white">1080p · TV & 3 streams</p>
              <p className="text-xs text-white/40 mt-1">Casting, profiles, living-room. From रू 299 / $5.99</p>
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
