"use client";

import { useState, useEffect, useRef, use, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX,
  Settings, Maximize, ArrowLeft, SkipForward, Subtitles,
  ExternalLink, X, Info, Plus, ChevronRight, Users, Zap
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/utils/cn";
import { getContentById, ContentItem, getAdSettings, DEMO_FALLBACK_VIDEO } from "@/utils/content";
import {
  canWatchLiveSports,
  hasPvodUnlock,
  hasSubscriptionUnlock,
  inferPaywallTabFromContent,
  isPaywallExemptTab,
  isPvodTab,
  isSubscriptionTab,
} from "@/utils/paywall";

type AdState = "pre-roll" | "playing" | "paused" | "mid-roll";

type AdSettingsState = Awaited<ReturnType<typeof getAdSettings>>;

function WatchPageInner({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id } = use(params);
  const fromTab = searchParams.get("fromTab");
  const episodeParam = searchParams.get("episode");

  const [content, setContent] = useState<ContentItem | null>(null);
  const [adSettings, setAdSettings] = useState<AdSettingsState>(null);
  const [watchAllowed, setWatchAllowed] = useState(false);

  const [adState, setAdState] = useState<AdState>("pre-roll");
  const videoRef = useRef<HTMLVideoElement>(null);
  const adVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [data, ads] = await Promise.all([getContentById(id), getAdSettings()]);
      if (!mounted) return;
      if (data) setContent(data);
      setAdSettings(ads ?? null);
      if (!ads?.prerollVideo) {
        setAdState((s) => (s === "pre-roll" ? "playing" : s));
      }

      const effectiveTab =
        (fromTab && fromTab.trim()) || inferPaywallTabFromContent(data);
      const returnQs = new URLSearchParams();
      if (episodeParam) returnQs.set("episode", episodeParam);
      if (effectiveTab) {
        returnQs.set("fromTab", effectiveTab);
      }
      const returnQuery = returnQs.toString();
      const returnPath = returnQuery ? `/watch/${id}?${returnQuery}` : `/watch/${id}`;

      if (isPaywallExemptTab(effectiveTab)) {
        setWatchAllowed(true);
        return;
      }
      if (isSubscriptionTab(effectiveTab)) {
        if (hasSubscriptionUnlock()) {
          if (effectiveTab === "sports" && !canWatchLiveSports()) {
            router.replace(`/join?return=${encodeURIComponent(returnPath)}`);
            return;
          }
          setWatchAllowed(true);
          return;
        }
        router.replace(`/join?return=${encodeURIComponent(returnPath)}`);
        return;
      }
      if (isPvodTab(effectiveTab)) {
        if (hasPvodUnlock() || hasSubscriptionUnlock()) {
          setWatchAllowed(true);
          return;
        }
        router.replace(`/join?return=${encodeURIComponent(returnPath)}`);
        return;
      }
      setWatchAllowed(true);
    })();
    return () => {
      mounted = false;
    };
  }, [id, fromTab, episodeParam, router]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [adCountdown, setAdCountdown] = useState(5);
  /** Pre/mid-roll ad audio — starts muted; user can unmute */
  const [adMuted, setAdMuted] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  /** Portrait / narrow viewport: letterbox video; landscape: fill like a TV */
  const [isLandscapeLayout, setIsLandscapeLayout] = useState(false);

  useEffect(() => {
    const update = () => {
      if (typeof window === "undefined") return;
      const landscapeMq = window.matchMedia("(orientation: landscape)");
      setIsLandscapeLayout(window.innerWidth > window.innerHeight || landscapeMq.matches);
    };
    update();
    const mq = typeof window !== "undefined" ? window.matchMedia("(orientation: landscape)") : null;
    mq?.addEventListener("change", update);
    window.addEventListener("resize", update);
    document.addEventListener("fullscreenchange", update);
    return () => {
      mq?.removeEventListener("change", update);
      window.removeEventListener("resize", update);
      document.removeEventListener("fullscreenchange", update);
    };
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  /** After entering fullscreen while playing, start the shorter hide timer */
  useEffect(() => {
    if (!isFullscreen || !isPlaying || adState !== "playing") return;
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 1000);
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isFullscreen, isPlaying, adState]);

  useEffect(() => {
    if (adState === "pre-roll" || adState === "mid-roll") {
      setAdMuted(true);
    }
  }, [adState]);

  /** Controls overlay fade: quicker in fullscreen */
  const controlsFadeS = isFullscreen ? 0.18 : 0.38;

  // Mid-roll (off for now — set MID_ROLL_ADS_ENABLED true to restore)
  const MID_ROLL_ADS_ENABLED = false;
  const midRollPoints = MID_ROLL_ADS_ENABLED ? ([30, 75] as const) : ([] as const);
  const [playedMidRolls, setPlayedMidRolls] = useState<number[]>([]);

  // Video Event Handlers
  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      if (total) {
        const percent = (current / total) * 100;
        setProgress(percent);

        // Check for mid-roll
        if (adState === 'playing') {
          const hitMidRoll = midRollPoints.find(p => Math.abs(percent - p) < 1 && !playedMidRolls.includes(p));
          if (hitMidRoll) {
            videoRef.current.pause();
            setIsPlaying(false);
            setAdState("mid-roll");
            setAdCountdown(5);
            setPlayedMidRolls(prev => [...prev, hitMidRoll]);
          }
        }
      }
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    // Maybe show post-roll or suggest next video
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Ad Video Logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if ((adState === "pre-roll" || adState === "mid-roll")) {
      // Small delay to ensure the video element is ready
      const playTimeout = setTimeout(() => {
        if (adVideoRef.current) {
          adVideoRef.current.play().catch((err) => { 
            console.error("Ad video play failed:", err);
          });
        }
      }, 100);
      
      // Reset countdown for each new ad
      setAdCountdown(5);
      
      timer = setInterval(() => {
        setAdCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timer) clearInterval(timer);
        clearTimeout(playTimeout);
      };
    } else if (adState === "playing" && videoRef.current) {
      videoRef.current.play().catch(() => { });
      setIsPlaying(true);
    }
  }, [adState]);

  const skipAd = () => {
    if (adVideoRef.current) adVideoRef.current.pause();
    setAdState("playing");
  };

  // Handle auto-hiding controls
  const handleMouseMove = () => {
    if (adState === "pre-roll" || adState === "mid-roll") return;
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    const delay =
      typeof document !== "undefined" && document.fullscreenElement ? 1000 : 3000;
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, delay);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  if (!watchAllowed || !content) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-3 text-white px-6 text-center">
        <p className="text-sm text-white/60">{!watchAllowed ? "Checking access…" : "Loading…"}</p>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    if (!seconds) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const portrait = !isLandscapeLayout;

  return (
    <main
      className="fixed inset-0 bg-black overflow-hidden group"
      onMouseMove={handleMouseMove}
      style={{ cursor: showControls || adState === "pre-roll" || adState === "mid-roll" ? 'default' : 'none' }}
    >
        {/* ACTUAL VIDEO PLAYER — portrait: letterboxed stage with safe area; landscape: edge-to-edge */}
      <div
        className={cn(
          "absolute inset-0 flex min-h-0 min-w-0 items-center justify-center bg-black",
          portrait &&
            "box-border pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
        )}
      >
        <video
          ref={videoRef}
          src={content.video || DEMO_FALLBACK_VIDEO}
          poster={content.img}
          className={cn(
            "max-h-full max-w-full shrink-0",
            portrait ? "h-auto w-full max-h-full object-contain" : "h-full w-full object-cover"
          )}
          onTimeUpdate={handleVideoTimeUpdate}
          onEnded={handleVideoEnded}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={() => {
            console.error("Main video failed to load");
          }}
          playsInline
          muted={isMuted}
        />

        {/* In-Stream Overlay Ad (L-Bar) */}
        <AnimatePresence>
          {adState === "playing" && isPlaying && adSettings?.inStreamAd && (
            <motion.div
              initial={{ opacity: 0, x: -40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -40, scale: 0.95 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "absolute z-40 pointer-events-none max-w-[min(24rem,calc(100vw-2rem))]",
                portrait
                  ? "bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] left-4 right-4 w-auto"
                  : "bottom-32 left-12 w-64 md:w-96"
              )}
            >
              <div className="relative group overflow-hidden rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] glass-dark">
                <img src={adSettings.inStreamAd} alt="Overlay Ad" className="w-full h-auto object-cover opacity-90" />
                
                {/* Subtle Gradient Overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
                
                {/* Sponsored Tag */}
                <div className="absolute top-3 right-3">
                  <div className="bg-black/60 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded text-[6px] md:text-[7px] font-black uppercase tracking-[0.2em] text-white/70">
                    Sponsored
                  </div>
                </div>

                {/* Animated Shine Effect */}
                <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Sponsor Logo (Watermark) */}
        {adSettings?.globalSponsorLogo && (
          <div
            className={cn(
              "absolute z-40 pointer-events-none opacity-60 transition-opacity hover:opacity-100",
              portrait
                ? "top-[max(0.5rem,env(safe-area-inset-top))] right-[max(0.5rem,env(safe-area-inset-right))]"
                : "top-12 right-12"
            )}
          >
            <img
              src={adSettings.globalSponsorLogo}
              alt="Sponsor"
              className={cn("w-auto object-contain drop-shadow-lg", portrait ? "h-6" : "h-8 md:h-12")}
            />
          </div>
        )}

        {/* AD LAYER (PRE-ROLL & MID-ROLL) */}
        <AnimatePresence>
          {(adState === "pre-roll" || adState === "mid-roll") && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-100 bg-black flex flex-col items-center justify-center"
            >
              {adSettings?.prerollVideo || adSettings?.midrollVideo ? (
                <video
                  ref={adVideoRef}
                  src={adState === 'pre-roll' ? adSettings.prerollVideo : adSettings.midrollVideo}
                  className={cn(
                    "absolute inset-0 max-h-full max-w-full shrink-0",
                    portrait ? "h-auto w-full max-h-full object-contain" : "h-full w-full object-cover"
                  )}
                  autoPlay
                  muted={adMuted}
                  playsInline
                  onEnded={skipAd}
                />
              ) : (
                // Fallback if no video configured
                <div className="absolute inset-0 bg-gray-900" />
              )}

              <div
                className={cn(
                  "absolute z-20 flex items-center justify-between gap-3",
                  portrait
                    ? "left-3 right-3 top-[max(0.5rem,env(safe-area-inset-top))]"
                    : "left-12 right-12 top-12 gap-4"
                )}
              >
                <div className="flex min-w-0 items-center gap-2 sm:gap-4">
                  <div
                    className={cn(
                      "flex shrink-0 items-center justify-center rounded-full bg-black/50 backdrop-blur",
                      portrait ? "h-10 w-10" : "h-12 w-12"
                    )}
                  >
                    <Play size={portrait ? 18 : 20} className="text-white" />
                  </div>
                  <span className="truncate rounded bg-black/50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-white sm:text-xs">
                    {adState === "mid-roll" ? "Ad Break" : "Ad"}
                  </span>
                </div>
                {(adSettings?.prerollVideo || adSettings?.midrollVideo) && (
                  <button
                    type="button"
                    onClick={() => setAdMuted((m) => !m)}
                    className={cn(
                      "flex shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur transition-colors hover:bg-white/10",
                      portrait ? "h-10 w-10" : "h-12 w-12"
                    )}
                    aria-label={adMuted ? "Unmute ad" : "Mute ad"}
                  >
                    {adMuted ? <VolumeX size={portrait ? 20 : 22} /> : <Volume2 size={portrait ? 20 : 22} />}
                  </button>
                )}
              </div>

              {/* Only show branding if no video, otherwise video covers it */}
              {(!adSettings?.prerollVideo && !adSettings?.midrollVideo) && (
                <div className="text-center space-y-8 max-w-2xl px-6 relative z-10">
                  <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">
                    {adState === "mid-roll" ? "Recharging Your Content" : "Support Nepali Creators"}
                  </h2>
                </div>
              )}

              <div
                className={cn(
                  "absolute z-20",
                  portrait
                    ? "bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 w-[min(100%,20rem)] -translate-x-1/2"
                    : "bottom-20 right-20"
                )}
              >
                {adCountdown > 0 ? (
                  <div
                    className={cn(
                      "rounded-2xl border border-white/10 bg-black/50 text-center font-black uppercase tracking-widest text-white backdrop-blur",
                      portrait ? "px-6 py-3 text-xs" : "px-12 py-5"
                    )}
                  >
                    Skip in {adCountdown}
                  </div>
                ) : (
                  <button
                    onClick={skipAd}
                    className={cn(
                      "glass flex w-full items-center justify-center gap-3 rounded-2xl border border-white/20 text-white transition-all group hover:bg-white/10",
                      portrait ? "px-6 py-3.5" : "gap-4 px-12 py-5"
                    )}
                  >
                    <span className={cn("font-black uppercase tracking-widest", portrait ? "text-xs" : "text-sm")}>
                      Skip Ad
                    </span>
                    <ChevronRight size={portrait ? 18 : 20} className="transition-transform group-hover:translate-x-1" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PAUSE AD LAYER */}
        <AnimatePresence>
          {!isPlaying && adState === "playing" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-150 bg-black/80 backdrop-blur-sm"
            >
              {/* FULL SCREEN BACKGROUND IMAGE */}
              <div className="absolute inset-0">
                <img
                  src={adSettings?.pauseAdImage || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop"}
                  alt="Brand Background"
                  className={cn(
                    "h-full w-full opacity-60",
                    portrait ? "object-contain object-center" : "object-cover"
                  )}
                />
                <div className="absolute inset-0 bg-linear-to-r from-black via-black/20 to-transparent" />
              </div>

              {/* Poster card — centered on portrait, left-aligned on landscape */}
              <div
                className={cn(
                  "absolute inset-0 flex items-center",
                  portrait
                    ? "justify-center px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
                    : "justify-start px-24"
                )}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, x: portrait ? 0 : -50 }}
                  animate={{ scale: 1, opacity: 1, x: 0 }}
                  onClick={togglePlay}
                  className={cn(
                    "relative aspect-2/3 cursor-pointer overflow-hidden rounded-4xl border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] group",
                    portrait ? "w-full max-w-[min(22rem,calc(100vw-2rem))]" : "w-[400px]"
                  )}
                >
                  {/* Poster Image */}
                  {content.img ? (
                    <img
                      src={content.img}
                      alt={content.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-brand-secondary flex items-center justify-center">
                      <img src="/ios-icon.png" alt="DGO" className="w-2/5 h-auto object-contain opacity-[0.07]" />
                    </div>
                  )}

                  {/* Content Overlay */}
                  <div
                    className={cn(
                      "absolute inset-x-0 bottom-0 bg-linear-to-t from-black via-black/40 to-transparent",
                      portrait ? "p-5 pt-16" : "p-8 pt-24"
                    )}
                  >
                    <div className={cn(portrait ? "space-y-4" : "space-y-6")}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-4">
                          <div className="w-1.5 h-4 bg-brand-gradient rounded-full" />
                          <img src="/dgo-logo-new.png" alt="DGO" className="h-4 w-auto object-contain brightness-0 invert opacity-60" />
                          <span className="text-white font-black text-[10px] uppercase tracking-[0.2em]">{content.type === 'movie' ? 'Film' : 'Series'}</span>
                        </div>
                        <h4
                          className={cn(
                            "font-black text-white italic uppercase tracking-tighter",
                            portrait ? "line-clamp-2 text-2xl leading-tight" : "text-4xl"
                          )}
                        >
                          {content.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                          <Play size={20} fill="black" className="ml-1 text-black" />
                        </div>
                        <div>
                          <div className="text-white font-bold text-xs uppercase truncate max-w-[200px]">
                            Resume
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Close — top right with safe area */}
              <div
                className={cn(
                  "absolute flex items-center gap-4",
                  portrait
                    ? "right-[max(0.75rem,env(safe-area-inset-right))] top-[max(0.75rem,env(safe-area-inset-top))]"
                    : "right-12 top-12"
                )}
              >
                <button
                  onClick={togglePlay}
                  className={cn(
                    "glass flex items-center justify-center rounded-full border-white/10 text-white/40 transition-colors hover:text-white",
                    portrait ? "h-10 w-10" : "h-12 w-12"
                  )}
                >
                  <X size={portrait ? 20 : 24} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {(showControls || !isPlaying) && adState === "playing" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: controlsFadeS, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
              "pointer-events-none absolute inset-0 z-50 flex flex-col justify-between bg-linear-to-t from-black/80 via-transparent to-black/60",
              portrait
                ? "p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] pt-[max(0.5rem,env(safe-area-inset-top))]"
                : "p-12"
            )}
          >
            {/* TOP BAR */}
            <div
              className={cn(
                "pointer-events-auto flex items-start justify-between gap-3",
                portrait && "flex-col"
              )}
            >
              <button
                onClick={() => router.back()}
                className={cn(
                  "flex min-w-0 text-left text-white/70 transition-colors group hover:text-white",
                  portrait ? "w-full items-center gap-3" : "items-center gap-4"
                )}
              >
                <div
                  className={cn(
                    "glass shrink-0 rounded-full transition-colors group-hover:bg-white/10",
                    portrait ? "p-2.5" : "p-3"
                  )}
                >
                  <ArrowLeft size={portrait ? 20 : 24} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-[9px] font-black uppercase tracking-[0.3em] text-white/40 sm:text-[10px]">
                    Back to Browse
                  </span>
                  <span
                    className={cn(
                      "block font-black italic uppercase tracking-tighter",
                      portrait ? "truncate text-base leading-tight" : "text-xl"
                    )}
                  >
                    {content.title}
                  </span>
                </div>
              </button>

              <div className={cn("flex shrink-0 items-center gap-3", portrait && "w-full justify-between")}>
                <div
                  className={cn(
                    "glass flex items-center gap-2 rounded-2xl",
                    portrait ? "px-2.5 py-1.5" : "gap-3 px-4 py-2"
                  )}
                >
                  <div className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-brand-gradient md:h-2 md:w-2" />
                  <span
                    className={cn(
                      "font-black uppercase tracking-widest",
                      portrait ? "max-w-[140px] truncate text-[9px] sm:max-w-none sm:text-xs" : "text-xs"
                    )}
                  >
                    {content.type === "live" ? "Live" : "4K"} • Nepali Audio
                  </span>
                </div>
                <button
                  className={cn(
                    "glass rounded-full text-white/70 transition-colors hover:text-white",
                    portrait ? "p-2.5" : "p-3"
                  )}
                >
                  <Settings size={portrait ? 20 : 24} />
                </button>
              </div>
            </div>

            {/* CENTER CONTROLS (Pause/Seek) */}
            <div
              className={cn(
                "pointer-events-auto absolute left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center",
                portrait ? "top-[46%] gap-8" : "top-1/2 gap-16"
              )}
            >
              <button
                className="text-white/20 transition-colors hover:text-white"
                onClick={() => {
                  if (videoRef.current) videoRef.current.currentTime -= 10;
                }}
              >
                <RotateCcw size={portrait ? 36 : 48} strokeWidth={1.5} />
              </button>
              <button
                onClick={togglePlay}
                className={cn(
                  "flex items-center justify-center rounded-full bg-white text-black shadow-[0_0_50px_rgba(255,255,255,0.3)] transition-transform hover:scale-110",
                  portrait ? "h-16 w-16" : "h-24 w-24"
                )}
              >
                {isPlaying ? (
                  <Pause size={portrait ? 28 : 40} fill="currentColor" />
                ) : (
                  <Play size={portrait ? 28 : 40} fill="currentColor" className="ml-1" />
                )}
              </button>
              <button
                className="text-white/20 transition-colors hover:text-white"
                onClick={() => {
                  if (videoRef.current) videoRef.current.currentTime += 10;
                }}
              >
                <RotateCw size={portrait ? 36 : 48} strokeWidth={1.5} />
              </button>
            </div>

            {/* BOTTOM CONTROLS */}
            <div className={cn("pointer-events-auto", portrait ? "space-y-4" : "space-y-8")}>
              {/* Progress Bar */}
              <div className={cn(portrait ? "space-y-2" : "space-y-4")}>
                <div
                  className={cn(
                    "flex items-center justify-between font-black uppercase tracking-widest text-white/60 px-2",
                    portrait ? "text-[10px]" : "text-xs"
                  )}
                >
                  <span className="tabular-nums">
                    {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
                  </span>
                  <span className="max-w-[45%] truncate text-end text-brand-purple">{content.tag}</span>
                </div>
                <div
                  className="relative h-2 bg-white/10 rounded-full group/progress cursor-pointer overflow-hidden"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const newTime = (x / rect.width) * duration;
                    if (videoRef.current) videoRef.current.currentTime = newTime;
                  }}
                >
                  {/* Ad Markers */}
                  {midRollPoints.map(point => (
                    <div
                      key={point}
                      style={{ left: `${point}%` }}
                      className="absolute top-0 bottom-0 w-1 bg-yellow-400 z-10"
                    />
                  ))}

                  <div
                    style={{ width: `${progress}%`, backgroundColor: content.accent }}
                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-100"
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full scale-0 group-hover/progress:scale-100 transition-transform shadow-lg" />
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  "flex items-center justify-between gap-3",
                  portrait && "flex-wrap"
                )}
              >
                <div className={cn("flex items-center", portrait ? "gap-4" : "gap-8")}>
                  <button
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.muted = !isMuted;
                        setIsMuted(!isMuted);
                      }
                    }}
                    className="text-white/70 transition-colors hover:text-white"
                  >
                    {isMuted ? <VolumeX size={portrait ? 22 : 24} /> : <Volume2 size={portrait ? 22 : 24} />}
                  </button>
                  <button
                    className={cn(
                      "flex items-center gap-2 font-black uppercase tracking-widest text-white/70 transition-colors hover:text-white",
                      portrait ? "text-[10px]" : "text-sm"
                    )}
                  >
                    <Subtitles size={portrait ? 18 : 20} />
                    <span className={portrait ? "hidden min-[380px]:inline" : ""}>Nepali (CC)</span>
                    {portrait && <span className="min-[380px]:hidden">CC</span>}
                  </button>
                </div>

                <button
                  onClick={toggleFullScreen}
                  className="shrink-0 text-white/70 transition-colors hover:text-white"
                >
                  <Maximize size={portrait ? 22 : 24} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function WatchPage(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <WatchPageInner {...props} />
    </Suspense>
  );
}
