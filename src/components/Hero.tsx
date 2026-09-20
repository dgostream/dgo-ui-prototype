"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Play, Info, Volume2, VolumeX, ChevronLeft, ChevronRight, Crown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/utils/cn";
import { publicUrl } from "@/utils/asset";
import { getHeroContent, ContentItem, isFifaLabeled } from "@/utils/content";
import { useTranslated } from "@/components/Translate";
import { isPartnerTab, PARTNER_BRANDS } from "@/utils/partnerBrands";
import { useSubscriptionSession } from "@/hooks/useSubscriptionSession";

export interface HeroProps {
  tab: string;
  items: ContentItem[];
  headerAd?: any;
}

export default function Hero({ tab, items, headerAd }: HeroProps) {
  const router = useRouter();
  const watchNowLabel = useTranslated("Watch Now");
  const watchLiveLabel = useTranslated("Watch Live");
  const moreInfoLabel = useTranslated("More Info");
  const [isMuted, setIsMuted] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const content = items[currentIndex] || items[0];
  
  // Calculate if the current slide should be the sponsored ad
  const adOrder = headerAd?.order || 2;
  const skipAd = isFifaLabeled(headerAd?.title);
  const isSponsoredSlide = !skipAd && headerAd?.active && headerAd.image && (currentIndex === (adOrder - 1));
  const partner = isPartnerTab(tab) ? PARTNER_BRANDS[tab] : null;
  const subscribed = !!useSubscriptionSession();

  useEffect(() => {
    setCurrentIndex(0);
  }, [tab]);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [items.length, currentIndex]);

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % items.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);

  return (
    <section className="relative w-full min-h-[52vh] h-[58vh] md:h-auto md:min-h-0 md:aspect-video flex items-end pb-10 md:pb-24 px-5 sm:px-8 md:px-24 pt-[calc(5.25rem+env(safe-area-inset-top,0px))] md:pt-0">
      {content && (
        <>
          <AnimatePresence initial={false} mode="sync">
            {isSponsoredSlide ? (
              <motion.div
                key={`ad-${tab}`}
                initial={{ opacity: 0, scale: 1.01 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.995 }}
                transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 -z-10 cursor-pointer group rounded-b-3xl md:rounded-b-[3rem] overflow-hidden"
                onClick={() => {
                  if (headerAd.link) window.open(headerAd.link, '_blank');
                }}
              >
                <img
                  src={headerAd.image}
                  alt="Sponsored"
                  className="w-full h-full object-cover opacity-100 transition-opacity duration-700"
                />
                {/* Integrated UI Overlays for Ads */}
                <div className="absolute inset-0 bg-linear-to-t from-black/50 via-black/10 to-black/5" />
                <div className="absolute inset-0 bg-linear-to-r from-black/38 via-transparent to-transparent" />
                
                {/* Subtle Interactive Shine */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none">
                  <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[2000ms] ease-in-out" />
                </div>
              </motion.div>
            ) : (
            <motion.div
              key={currentIndex + tab}
              initial={{ opacity: 0, scale: 1.01 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.995 }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 -z-10"
              style={{
                maskImage: 'linear-gradient(to bottom, black 0%, black 70%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 70%, transparent 100%)'
              }}
            >
              {/* Brand ambience — stronger wash on partner hubs so they read as banners */}
              <div className="absolute inset-0 z-[5] pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[min(90vw,520px)] h-[320px] rounded-full blur-[100px] opacity-[0.22]" style={{ backgroundColor: partner?.from ?? "#8a3ffc" }} />
                <div className="absolute bottom-0 right-0 w-[min(80vw,420px)] h-[280px] rounded-full blur-[100px] opacity-[0.16]" style={{ backgroundColor: partner?.to ?? "#ff00bd" }} />
                <div className="absolute top-1/2 right-1/4 w-[300px] h-[200px] rounded-full blur-[90px] opacity-[0.12]" style={{ backgroundColor: partner?.via ?? "#ff4d00" }} />
                {partner ? (
                  <div
                    className="absolute inset-0 opacity-40"
                    style={{
                      background: `linear-gradient(115deg, ${partner.from}55 0%, transparent 42%, ${partner.to}28 100%)`,
                    }}
                  />
                ) : null}
              </div>
              <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/35 to-transparent z-10" />
              
              {content.heroVideo ? (
                <video
                  src={content.heroVideo}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover opacity-80"
                />
              ) : content.heroImg || content.img ? (
                <picture>
                  {content.img && content.heroImg && content.img !== content.heroImg ? (
                    <source media="(max-width: 767px)" srcSet={publicUrl(content.img)} />
                  ) : null}
                  <motion.img
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 10, ease: "linear" }}
                    src={publicUrl(content.heroImg || content.img)}
                    alt={content.title}
                    className="w-full h-full object-cover opacity-80"
                  />
                </picture>
              ) : (
                <div className="w-full h-full bg-brand-secondary flex items-center justify-center">
                  <img src={publicUrl("/ios-icon.png")} alt="DGO" className="w-[12%] h-auto object-contain opacity-[0.06]" />
                </div>
              )}
            </motion.div>
            )}
          </AnimatePresence>

          <div className="relative z-20 mb-8 md:mb-12 min-h-[28px] md:min-h-[36px]">
            <AnimatePresence initial={false} mode="wait">
              {isSponsoredSlide ? (
                <motion.div
                  key={`${tab}-${currentIndex}-ad-disclaimer`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="flex items-center gap-2 opacity-60">
                    <div className="px-1.5 py-0.5 border border-white/30 rounded text-[7px] md:text-[8px] font-bold tracking-widest uppercase text-white bg-black/20 backdrop-blur-sm">
                      Sponsored
                    </div>
                    <span className="text-[7px] md:text-[8px] font-medium text-white tracking-widest uppercase drop-shadow-md">
                      Advertisement • {headerAd.title || "Featured Partner"}
                    </span>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={`${tab}-${currentIndex}-content-copy`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className="max-w-4xl space-y-4 md:space-y-8 relative z-20"
                >
                  <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                    <div
                      className={cn(
                        "px-2 py-0.5 border border-brand-purple/40 bg-brand-purple/15 text-white backdrop-blur-md text-[8px] md:text-[10px] font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(138,63,252,0.15)]",
                        tab === "junior" ? "rounded-full border-2 border-brand-purple/45" : "rounded-lg"
                      )}
                    >
                      {content.tag}
                    </div>
                    <div className="h-3 md:h-4 w-px bg-linear-to-b from-transparent via-brand-purple/40 to-transparent" />
                    <span className="text-[10px] md:text-sm font-medium text-white/75 tracking-widest uppercase">
                      {tab === "junior" ? (
                        <>
                          <span className="text-gradient font-black">Junior</span>
                          <span className="text-white/50"> · Fun · Safe</span>
                        </>
                      ) : partner ? (
                        <>
                          <span className="font-black" style={{ color: partner.from }}>{partner.name}</span>
                          <span className="text-white/50"> · on DGO</span>
                        </>
                      ) : (
                        <>
                          <span className="text-gradient font-black">DGO</span>
                          <span className="text-white/50"> · 4K · Dolby Atmos</span>
                        </>
                      )}
                    </span>
                  </div>

                  <h1 className="text-4xl sm:text-6xl md:text-8xl leading-[0.95] drop-shadow-2xl font-black font-geist tracking-tighter text-white">
                    {content.title}
                  </h1>
                  <h2 className="text-lg sm:text-2xl md:text-3xl text-white drop-shadow-md font-bold mt-2 md:mt-4">
                    {content.subtitle}
                  </h2>

                  <p className={cn(
                    "mt-4 md:mt-8 text-sm md:text-xl text-white/80 max-w-2xl leading-relaxed drop-shadow-lg line-clamp-2 md:line-clamp-none",
                    tab === 'junior' ? "font-bold font-geist" : "font-light font-geist"
                  )}>
                    {content.desc}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 md:gap-6 mt-8">
                    <motion.button
                      key={currentIndex + tab + "play"}
                      onClick={() =>
                        router.push(
                          `/watch/${content.id || "1"}?fromTab=${encodeURIComponent(tab)}`
                        )
                      }
                      whileHover={{ scale: 1.05, rotate: tab === "junior" ? -2 : 0 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "flex items-center gap-2 md:gap-3 px-6 md:px-10 py-3 md:py-4 text-white font-bold text-sm md:text-lg transition-all border border-white/10",
                        !partner && "bg-brand-gradient shadow-xl shadow-brand-purple/30",
                        tab === "junior" ? "rounded-3xl border-2 md:border-4 border-white/25" : "rounded-full"
                      )}
                      style={
                        partner
                          ? {
                              backgroundImage: `linear-gradient(90deg, ${partner.from}, ${partner.to})`,
                              boxShadow: `0 18px 36px ${partner.from}40`,
                            }
                          : undefined
                      }
                    >
                      <Play fill="currentColor" className="w-[18px] md:w-6 h-[18px] md:h-6" />
                      {tab === "sports" ? watchLiveLabel : watchNowLabel}
                    </motion.button>

                    {tab === "home" && !subscribed ? (
                      <motion.button
                        onClick={() => router.push("/join")}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 md:gap-3 px-6 md:px-10 py-3 md:py-4 text-white font-bold text-sm md:text-lg rounded-full border border-white/15 bg-white/10 backdrop-blur-md"
                      >
                        <Crown className="w-[18px] md:w-6 h-[18px] md:h-6" />
                        Subscribe
                      </motion.button>
                    ) : null}

                    <motion.button
                      onClick={() =>
                        router.push(
                          `/details/${content.id || "1"}?fromTab=${encodeURIComponent(tab)}`
                        )
                      }
                      whileHover={{ scale: 1.05, backgroundColor: "rgba(138,63,252,0.12)", rotate: tab === "junior" ? 2 : 0 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "flex items-center gap-2 md:gap-3 px-6 md:px-10 py-3 md:py-4 text-white font-medium text-sm md:text-lg transition-all border border-brand-purple/25 bg-black/25 backdrop-blur-md hover:border-brand-purple/45",
                        tab === "junior" ? "rounded-3xl border-2" : "rounded-full"
                      )}
                    >
                      <Info className="w-[18px] md:w-6 h-[18px] md:h-6" />
                      {moreInfoLabel}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="absolute bottom-3 right-3 z-30 flex flex-col items-end gap-3 pb-[max(0.25rem,env(safe-area-inset-bottom,0px))] pr-[max(0.25rem,env(safe-area-inset-right,0px))] md:bottom-40 md:right-16 md:gap-6 md:pb-0 md:pr-0">
            {items.length > 1 && (
              <div className="mb-0 hidden gap-4 md:mb-4 md:flex">
                <button
                  type="button"
                  onClick={prevSlide}
                  className="p-3 rounded-full border border-brand-purple/20 bg-black/30 backdrop-blur-md hover:bg-brand-purple/15 hover:border-brand-purple/40 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  className="p-3 rounded-full border border-brand-purple/20 bg-black/30 backdrop-blur-md hover:bg-brand-purple/15 hover:border-brand-purple/40 transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-brand-purple/20 bg-black/30 backdrop-blur-md flex items-center justify-center hover:bg-brand-purple/15 transition-colors"
            >
              {isMuted ? <VolumeX className="w-[18px] md:w-5 h-[18px] md:h-5" /> : <Volume2 className="w-[18px] md:w-5 h-[18px] md:h-5" />}
            </button>
            <div className="mt-1 flex gap-2 md:mt-4" role="tablist" aria-label="Hero slides">
              {items.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === currentIndex}
                  onClick={() => setCurrentIndex(i)}
                  className={cn(
                    "h-1 rounded-full transition-all duration-500 md:h-1.5",
                    i === currentIndex ? "w-6 bg-brand-gradient md:w-8" : "w-1.5 bg-white/20 md:w-2"
                  )}
                />
              ))}
            </div>
          </div>
        </>
      )}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-brand-purple/30 to-transparent pointer-events-none" />
    </section>
  );
}
