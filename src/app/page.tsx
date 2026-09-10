"use client";

import React, { useState } from "react";
import Splash from "@/components/Splash";
import JuniorSplash from "@/components/JuniorSplash";
import Navigation, { tabs, DEFAULT_HOME_TAB } from "@/components/Navigation";
import MobileBottomNav from "@/components/MobileBottomNav";
import Hero from "@/components/Hero";
import { PartnerRailBanner } from "@/components/PartnerRailBanner";
import { isPartnerTab } from "@/utils/partnerBrands";
import DetailModal from "@/components/DetailModal";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";
import { Play, Plus, Trophy, Flame, Star, Tv, Clock, AlertCircle, Users, TrendingUp, Heart, Globe, Zap, Radio, Video, MoreHorizontal, ChevronLeft, ChevronRight, Film, Smile, Sparkles, Clapperboard } from "lucide-react";
import { HomeSubscribeDrive } from "@/components/HomeSubscribeDrive";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense, useRef } from "react";
import { getLandingPageSections, getHeroContent, getAdSettings, ContentItem, isFifaLabeled } from "@/utils/content";
import { useTranslated } from "@/components/Translate";

// Map string icon names to Lucide components
const IconMap: Record<string, any> = {
  Trophy, Flame, Star, Tv, Clock, AlertCircle, Users, TrendingUp, Heart, Globe, Zap, Radio, Video, Film, Smile, Sparkles, Clapperboard
};

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isInitialized, setIsInitialized] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [showJuniorSplash, setShowJuniorSplash] = useState(false);
  const [activeTab, setActiveTab] = useState(DEFAULT_HOME_TAB);
  const [visibleTab, setVisibleTab] = useState(DEFAULT_HOME_TAB);
  const [sectionsByTab, setSectionsByTab] = useState<Record<string, any[]>>({});
  const [heroByTab, setHeroByTab] = useState<Record<string, ContentItem[]>>({});
  const [adSettings, setAdSettings] = useState<any>(null);

  // Initial tab and splash logic
  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const tabParam = searchParams.get("tab");
    if (tabParam && tabs.find(t => t.id === tabParam)) {
      setActiveTab(tabParam);
      setVisibleTab(tabParam);
    }

    const hasShownSplash = sessionStorage.getItem("dgo_splash_shown");
    if (!hasShownSplash) {
      setShowSplash(true);
      sessionStorage.setItem("dgo_splash_shown", "true");
    }

    setIsInitialized(true);
  }, [searchParams, router]);

  // Fetch dynamic sections and hero content from Sanity when tab changes
  useEffect(() => {
    if (!sectionsByTab[activeTab]) {
      getLandingPageSections(activeTab).then(data => {
        setSectionsByTab(prev => ({ ...prev, [activeTab]: data }));
      });
    }
    if (!heroByTab[activeTab]) {
      getHeroContent(activeTab).then(data => {
        setHeroByTab(prev => ({ ...prev, [activeTab]: data }));
      });
    }
    getAdSettings().then(data => {
      setAdSettings(data);
    });
  }, [activeTab]);

  useEffect(() => {
    // When the active tab's data is fully loaded and we're still transitioning, finish the transition
    if (activeTab !== visibleTab && sectionsByTab[activeTab] && heroByTab[activeTab]) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      setVisibleTab(activeTab);
    }
  }, [activeTab, visibleTab, sectionsByTab, heroByTab]);

  const sections = sectionsByTab[visibleTab] || [];
  const heroItems = heroByTab[visibleTab] || [];
  const pendingSections = sectionsByTab[activeTab] || [];
  const isTransitioning = activeTab !== visibleTab;

  const [modalData, setModalData] = useState<{ isOpen: boolean; id: string; title: string; accent: string; type: string }>({
    isOpen: false,
    id: "",
    title: "",
    accent: "",
    type: ""
  });

  const currentTab = tabs.find((t) => t.id === visibleTab) || tabs[0];

  const tSponsored = useTranslated("Sponsored");
  const tPrivacy = useTranslated("Privacy Policy");
  const tTerms = useTranslated("Terms of Service");
  const tHelp = useTranslated("Help Center");
  const tCopyright = useTranslated("Â© 2026 DGO GLOBAL â€¢ THE WORLD IS WATCHING");

  const handleTabChange = (id: string) => {
    if (id === activeTab) return;

    if (id === 'junior' && activeTab !== 'junior') {
      setShowJuniorSplash(true);
    }
    setActiveTab(id);
    router.push(`/?tab=${id}`, { scroll: false });
  };

  if (!isInitialized) {
    return <div className="min-h-screen bg-black" />;
  }

  const openModal = (id: string, title: string, accent: string, type: string) => {
    setModalData({ isOpen: true, id, title, accent, type });
  };

  const renderContentRow = (section: (typeof sections)[0], idx: number, rowKey: string, inFeedAd?: boolean) => (
    <div key={rowKey}>
      <motion.div
        initial={visibleTab === "junior" ? { opacity: 0, x: -30, scale: 0.95 } : { opacity: 0, y: 20 }}
        animate={visibleTab === "junior" ? { opacity: 1, x: 0, scale: 1 } : { opacity: 1, y: 0 }}
        transition={
          visibleTab === "junior"
            ? { type: "spring", stiffness: 260, damping: 20, delay: idx * 0.1 }
            : { delay: 0.12 + idx * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }
        }
      >
        <ContentRow
          title={section.title}
          accent={currentTab.color}
          tab={visibleTab}
          icon={IconMap[section.icon] || Star}
          items={section.items}
          fomo={section.fomo}
          onItemClick={(id, title) => openModal(id, title, currentTab.color, section.title)}
          inFeedAd={inFeedAd && adSettings?.feedAd?.active ? adSettings.feedAd : undefined}
        />
      </motion.div>
    </div>
  );

  return (
    <main className="min-h-screen bg-black selection:bg-brand-purple/30 selection:text-white overflow-hidden">
      <AnimatePresence mode="wait">
        {showSplash ? (
          <Splash key="splash" onComplete={() => setShowSplash(false)} />
        ) : showJuniorSplash ? (
          <JuniorSplash key="junior-splash" onComplete={() => { setShowJuniorSplash(false); setVisibleTab('junior'); }} />
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            className="relative pb-[calc(9rem+env(safe-area-inset-bottom,0px))] md:pb-0"
          >
            <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
            <MobileBottomNav
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onHome={() => {
                if (typeof window !== "undefined") {
                  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
                }
                if (activeTab !== DEFAULT_HOME_TAB) handleTabChange(DEFAULT_HOME_TAB);
              }}
            />

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`tab-${visibleTab}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: isTransitioning ? 0.6 : 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="relative z-0">
                  {adSettings?.homeBackgroundAd && (
                    <div className="fixed inset-0 -z-30">
                      <img src={adSettings.homeBackgroundAd} alt="Background Ad" className="w-full h-full object-cover opacity-30" />
                      <div className="absolute inset-0 bg-black/80" />
                    </div>
                  )}

                  <Hero
                    tab={visibleTab}
                    items={heroItems}
                    headerAd={
                      isFifaLabeled(adSettings?.heroCarouselAd?.title) ? undefined : adSettings?.heroCarouselAd
                    }
                  />
                  {isPartnerTab(visibleTab) ? <PartnerRailBanner partner={visibleTab} /> : null}
                  {visibleTab === "home" ? <HomeSubscribeDrive /> : null}

          {/* Content Sections */}
          <div className="relative z-10 min-h-screen pt-8 md:pt-16 space-y-16 md:space-y-32">
                        {sections.map((section, idx) =>
                          renderContentRow(section, idx, `${visibleTab}-${idx}`, idx === 1)
                        )}

                        {/* Global Footer Banner Ad */}
                        {adSettings?.footerBannerAd && (
                          <div className="px-6 md:px-12 lg:px-24 pt-2 md:pt-4 pb-12 md:pb-20">
                            <motion.div 
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              className="relative group cursor-pointer"
                            >
                              <div className="relative w-full aspect-4/1 rounded-3xl md:rounded-[2.5rem] overflow-hidden border border-white/10 group bg-[#050505] shadow-2xl">
                                <img 
                                  src={adSettings.footerBannerAd} 
                                  alt="Footer Ad" 
                                  className="absolute inset-0 h-full w-full object-contain object-center opacity-90 group-hover:opacity-100 transition-all duration-1000 ease-out" 
                                />
                                
                                {/* Clean UI Overlays */}
                                <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
                                
                                {/* Minimal Sponsored Tag */}
                                <div className="absolute top-4 right-6 md:top-6 md:right-10">
                                  <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-2 py-0.5 rounded text-[7px] md:text-[8px] font-black uppercase tracking-[0.2em] text-white/60">
                                    {tSponsored}
                                  </div>
                                </div>

                                {/* Interactive Edge Shine */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none">
                                  <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[2000ms] ease-in-out" />
                                </div>
                              </div>
                            </motion.div>
                            
                            {/* Premium Minimal Footer */}
                            <div className="mt-8 md:mt-12 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-white/5 pt-8 opacity-40 hover:opacity-100 transition-opacity duration-500">
                              <div className="flex items-center gap-6 text-[8px] md:text-[10px] font-bold uppercase tracking-[0.3em] text-white/60">
                                <span className="cursor-pointer hover:text-white transition-colors">{tPrivacy}</span>
                                <span className="w-1 h-1 rounded-full bg-white/20" />
                                <span className="cursor-pointer hover:text-white transition-colors">{tTerms}</span>
                                <span className="w-1 h-1 rounded-full bg-white/20" />
                                <span className="cursor-pointer hover:text-white transition-colors">{tHelp}</span>
                              </div>
                              <div className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-white/40">
                                {tCopyright}
                              </div>
                            </div>
                          </div>
                        )}
                  </div>
                </div>

                <AnimatePresence mode="popLayout">
                  {visibleTab === 'junior' ? (
                    <motion.div
                      key="junior-bg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 pointer-events-none -z-20 overflow-hidden bg-[#0a1529]"
                    >
                      {[...Array(6)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ y: 1000, x: Math.random() * 1000, scale: 0 }}
                          animate={{
                            y: -500,
                            x: Math.random() * 1500,
                            scale: [1, 1.2, 0.8, 1],
                            rotate: 360
                          }}
                          transition={{
                            duration: 15 + Math.random() * 10,
                            repeat: Infinity,
                            ease: "linear",
                            delay: i * 2
                          }}
                          className="absolute w-64 h-64 rounded-full blur-[80px] opacity-40"
                          style={{
                            backgroundColor: ["#8a3ffc", "#ff00bd", "#ff4d00", "#22d3ee"][i % 4],
                          }}
                        />
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key={visibleTab}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1 }}
                      className="fixed inset-0 pointer-events-none -z-20 overflow-hidden"
                    >
                      <div
                        className="absolute top-1/4 -left-40 w-[800px] h-[800px] rounded-full blur-[150px] opacity-[0.08]"
                        style={{ backgroundColor: "#8a3ffc" }}
                      />
                      <div
                        className="absolute top-1/2 -right-20 w-[680px] h-[680px] rounded-full blur-[150px] opacity-[0.06]"
                        style={{ backgroundColor: "#ff00bd" }}
                      />
                      <div
                        className="absolute bottom-0 left-1/3 w-[560px] h-[560px] rounded-full blur-[150px] opacity-[0.05]"
                        style={{ backgroundColor: "#ff4d00" }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>

            <DetailModal
              isOpen={modalData.isOpen}
              onClose={() => setModalData(prev => ({ ...prev, isOpen: false }))}
              content={{ id: modalData.id, title: modalData.title, accent: modalData.accent, type: modalData.type }}
              fromTab={visibleTab}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function TranslatedCardTitle({ text, className }: { text: string; className?: string }) {
  const t = useTranslated(text);
  return <h3 className={className}>{t}</h3>;
}

function ContentRow({
  title,
  accent = "#8a3ffc",
  tab,
  icon: Icon,
  items = [],
  onItemClick,
  fomo,
  inFeedAd
}: {
  title: string;
  accent?: string;
  tab?: string;
  icon?: any;
  items?: any[];
  onItemClick: (id: string, title: string) => void;
  fomo?: string;
  inFeedAd?: any;
}) {
  const titleT = useTranslated(title);
  const lastChanceT = useTranslated("Last Chance");
  const exclusiveT = useTranslated("Exclusive");
  const playT = useTranslated("Play");
  const adTagT = useTranslated("Ad");
  const feedTitleT = useTranslated(inFeedAd?.title?.trim() ? inFeedAd.title : "Sponsored Content");
  const viewportRef = useRef<HTMLDivElement>(null);
  const [windowWidth, setWindowWidth] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [index, setIndex] = useState(0);
  /** Below md: first tap reveals overlay; second tap opens modal / link */
  const [mobileExpandedId, setMobileExpandedId] = useState<string | null>(null);
  const [mobileExpandedAd, setMobileExpandedAd] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setWindowWidth(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!viewportRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width || 0;
      setViewportWidth(width);
    });
    observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, []);

  if (items.length === 0) return null;

  // More robust responsive steps:
  // mobile: 1, tablet: 2, small desktop: 3, desktop: 4, large desktop: 5
  const cardsPerView =
    windowWidth >= 1536 ? 5 :
    windowWidth >= 1280 ? 4 :
    windowWidth >= 1024 ? 3 :
    windowWidth >= 768 ? 2 : 2;
  const gap = windowWidth >= 768 ? 24 : 16;
  const cardWidth = viewportWidth > 0 ? Math.max((viewportWidth - gap * (cardsPerView - 1)) / cardsPerView, 120) : 0;
  const step = cardWidth + gap;
  /** In-feed ad is an extra leading card — must count it for scroll range. */
  const totalCards = items.length + (inFeedAd ? 1 : 0);
  const maxIndex = Math.max(0, totalCards - cardsPerView);
  const x = -(index * step);

  useEffect(() => {
    setIndex((prev) => Math.min(prev, maxIndex));
  }, [maxIndex]);

  useEffect(() => {
    setMobileExpandedId(null);
    setMobileExpandedAd(false);
  }, [index]);

  const isTouchMode = windowWidth > 0 && windowWidth < 768;

  const prev = () => setIndex((p) => Math.max(0, p - 1));
  const next = () => setIndex((p) => Math.min(maxIndex, p + 1));
  const canPrev = index > 0;
  const canNext = index < maxIndex;

  return (
    <div className="space-y-4 md:space-y-8">
      <div className="flex items-center justify-between px-8 md:px-24">
        <h2 className="text-xl md:text-3xl font-black font-geist tracking-widest flex items-center gap-3 md:gap-4 uppercase text-gradient">
          <div className="w-1 md:w-1.5 h-6 md:h-8 rounded-full bg-brand-gradient shadow-[0_0_12px_rgba(138,63,252,0.45)]" />
          <div className="flex items-center gap-2 md:gap-3">
            {Icon && <Icon className="w-5 md:w-6 h-5 md:h-6 text-brand-purple/90" />}
            {titleT}
          </div>
        </h2>
      </div>

      <div className="relative group/carousel">
        <button
          onClick={prev}
          disabled={!canPrev}
          className="absolute left-0 top-0 bottom-0 z-30 w-16 md:w-24 flex items-center justify-start pl-2 md:pl-4 opacity-100 lg:opacity-0 lg:group-hover/carousel:opacity-100 transition-opacity disabled:opacity-0"
        >
          <div className="w-10 h-10 md:w-14 md:h-14 rounded-full border border-brand-purple/25 bg-black/40 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white hover:border-brand-purple/45 hover:bg-brand-purple/10 hover:scale-110 transition-all">
            <ChevronLeft className="w-6 h-6" />
          </div>
        </button>

        <button
          onClick={next}
          disabled={!canNext}
          className="absolute right-0 top-0 bottom-0 z-30 w-16 md:w-24 flex items-center justify-end pr-2 md:pr-4 opacity-100 lg:opacity-0 lg:group-hover/carousel:opacity-100 transition-opacity disabled:opacity-0"
        >
          <div className="w-10 h-10 md:w-14 md:h-14 rounded-full border border-brand-purple/25 bg-black/40 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white hover:border-brand-purple/45 hover:bg-brand-purple/10 hover:scale-110 transition-all">
            <ChevronRight className="w-6 h-6" />
          </div>
        </button>

        <div
          ref={viewportRef}
          className="overflow-hidden pb-8 pt-4 px-6 md:px-12 lg:px-24"
          style={{
            maskImage: "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)",
          }}
        >
          <motion.div
            drag={windowWidth < 1024 ? "x" : false}
            dragElastic={0.03}
            dragMomentum={false}
            onDragEnd={(_, info) => {
              const threshold = Math.max(step * 0.2, 40);
              if (info.offset.x <= -threshold || info.velocity.x < -300) next();
              else if (info.offset.x >= threshold || info.velocity.x > 300) prev();
            }}
            animate={{ x }}
            transition={{ type: "spring", stiffness: 280, damping: 35 }}
            className="flex"
            style={{ gap: `${gap}px` }}
          >
            {/* Inject inFeedAd at the start of the row if provided */}
            {inFeedAd && (
              <motion.div
                key="in-feed-ad"
                whileHover={isTouchMode ? undefined : { y: -12, scale: 1.01 }}
                className={cn(
                  "group relative shrink-0 cursor-pointer overflow-hidden rounded-3xl border border-white/8 bg-[#080808] transition-all duration-500 md:rounded-4xl hover:border-brand-purple/25",
                  isTouchMode && mobileExpandedAd && "border-brand-purple/35 shadow-[0_0_24px_rgba(138,63,252,0.15)]"
                )}
                style={{ width: cardWidth || undefined, aspectRatio: "2/3" }}
                onClick={() => {
                  if (isTouchMode) {
                    if (mobileExpandedAd) {
                      if (inFeedAd.link) window.open(inFeedAd.link, "_blank");
                      setMobileExpandedAd(false);
                    } else {
                      setMobileExpandedAd(true);
                      setMobileExpandedId(null);
                    }
                    return;
                  }
                  if (inFeedAd.link) window.open(inFeedAd.link, "_blank");
                }}
              >
                <img src={inFeedAd.image} alt="Sponsored" className="absolute inset-0 h-full w-full object-cover" />
                <div
                  className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,transparent_48%,rgba(0,0,0,0.38)_62%,rgba(0,0,0,0.72)_78%,rgba(0,0,0,0.92)_92%,rgba(0,0,0,0.98)_100%)]"
                  aria-hidden
                />
                <div
                  className={cn(
                    "absolute inset-0 z-5 flex flex-col justify-end p-4 transition-all duration-500 md:p-6 md:opacity-0 md:group-hover:opacity-100",
                    "pointer-events-none md:group-hover:pointer-events-auto",
                    isTouchMode && (mobileExpandedAd ? "pointer-events-auto opacity-100" : "opacity-0")
                  )}
                >
                  <div
                    className={cn(
                      "space-y-2 transition-transform duration-500 ease-out md:space-y-4 md:translate-y-10 md:group-hover:translate-y-0",
                      isTouchMode ? (mobileExpandedAd ? "translate-y-0" : "translate-y-10") : undefined
                    )}
                  >
                    <div className="inline-block w-fit rounded bg-brand-gradient px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-white shadow-lg">
                      {adTagT}
                    </div>
                    <h3 className="line-clamp-2 text-sm font-bold leading-snug tracking-tight text-white drop-shadow-md md:text-lg">
                      {feedTitleT}
                    </h3>
                  </div>
                </div>
              </motion.div>
            )}

            {items.map((item) => {
              const expandedTouch = isTouchMode && mobileExpandedId === item.id;
              return (
              <motion.div
                key={item.id}
                whileHover={isTouchMode ? undefined : { y: -12, scale: 1.01 }}
                onClick={() => {
                  if (isTouchMode) {
                    if (mobileExpandedId === item.id) {
                      onItemClick(item.id, item.title);
                      setMobileExpandedId(null);
                    } else {
                      setMobileExpandedId(item.id);
                      setMobileExpandedAd(false);
                    }
                    return;
                  }
                  onItemClick(item.id, item.title);
                }}
                className={cn(
                  "group relative aspect-2/3 shrink-0 cursor-pointer overflow-hidden rounded-3xl border border-white/8 bg-[#080808] transition-all duration-500 md:rounded-4xl hover:border-brand-purple/25 hover:shadow-[0_0_32px_rgba(138,63,252,0.12)]",
                  expandedTouch && "border-brand-purple/35 shadow-[0_0_24px_rgba(138,63,252,0.15)]"
                )}
                style={{ width: cardWidth || undefined }}
              >
              {item.img ? (
                <img src={item.img} alt={item.title} className="absolute inset-0 z-0 h-full w-full object-cover" />
              ) : (
                <div
                  className="absolute inset-0 z-0"
                  style={{
                    background: `linear-gradient(165deg, ${item.accent || accent}70 0%, #090612 58%)`,
                  }}
                >
                  <p className="absolute left-4 right-4 top-[22%] text-center text-[1.35rem] md:text-[1.7rem] font-black leading-[1.05] tracking-tight text-white drop-shadow-lg">
                    {item.title}
                  </p>
                </div>
              )}

              <div
                className="pointer-events-none absolute inset-0 z-1 bg-[linear-gradient(180deg,transparent_0%,transparent_48%,rgba(0,0,0,0.38)_62%,rgba(0,0,0,0.72)_78%,rgba(0,0,0,0.92)_92%,rgba(0,0,0,0.98)_100%)]"
                aria-hidden
              />

              {fomo && fomo !== 'none' && (
                <div className="absolute top-4 md:top-8 left-4 md:left-8 z-20">
                  <div className="bg-brand-gradient px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[6px] md:text-[8px] font-black text-white uppercase tracking-widest shadow-xl">
                    {fomo === "leaving" ? lastChanceT : exclusiveT}
                  </div>
                </div>
              )}

              <div
                className={cn(
                  "absolute inset-0 z-5 flex flex-col justify-end p-6 transition-all duration-500 md:p-10 md:opacity-0 md:group-hover:opacity-100",
                  "pointer-events-none md:group-hover:pointer-events-auto",
                  isTouchMode && (expandedTouch ? "pointer-events-auto opacity-100" : "opacity-0")
                )}
              >
                <div
                  className={cn(
                    "space-y-2 transition-transform duration-500 ease-out md:space-y-4",
                    "md:translate-y-2 md:group-hover:translate-y-0",
                    isTouchMode ? (expandedTouch ? "translate-y-0" : "translate-y-1") : undefined
                  )}
                >
                  {item.img ? (
                    <TranslatedCardTitle
                      text={item.title}
                      className="text-white font-bold text-lg md:text-2xl leading-snug tracking-tight line-clamp-2 drop-shadow-md"
                    />
                  ) : null}
                  <div className="flex items-center gap-2 text-[10px] tracking-wide text-white/70 md:gap-4 md:text-xs">
                    <span className="font-bold" style={{ color: item.accent || accent }}>{item.tag}</span>
                    {item.year && <span className="opacity-70">{item.year}</span>}
                  </div>
                  <div className="flex items-center gap-2 pt-2 md:gap-4 md:pt-4">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onItemClick(item.id, item.title);
                        if (isTouchMode) setMobileExpandedId(null);
                      }}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-[8px] font-black uppercase tracking-widest text-white shadow-lg shadow-brand-purple/25 transition-all bg-brand-gradient hover:brightness-110 md:rounded-2xl md:py-4 md:text-[10px]"
                    >
                      <Play fill="currentColor" className="h-2.5 w-2.5 md:h-3 md:w-3" /> {playT}
                    </button>
                  </div>
                </div>
              </div>
              </motion.div>
            );
            })}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
