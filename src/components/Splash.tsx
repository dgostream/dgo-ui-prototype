"use client";

import { motion } from "framer-motion";
import { publicUrl } from "@/utils/asset";
import { useEffect, useState, useRef } from "react";

const SPLASH_LANDSCAPE = "/DGO Splash v4.mp4";
const SPLASH_PORTRAIT = "/Dgo-splash-sound-vertical.mp4";

export default function Splash({ onComplete }: { onComplete: () => void }) {
  const [isExiting, setIsExiting] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const activeSrc = publicUrl(isPortrait ? SPLASH_PORTRAIT : SPLASH_LANDSCAPE);

  useEffect(() => {
    const mq = window.matchMedia("(orientation: portrait)");
    const sync = () => setIsPortrait(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (!isExiting) {
        setIsExiting(true);
        setTimeout(onComplete, 1000);
      }
    }, 12_000);

    return () => clearTimeout(fallbackTimer);
  }, [isExiting, onComplete]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const playWithSoundPreferred = async () => {
      v.muted = false;
      v.defaultMuted = false;
      v.volume = 1;
      try {
        await v.play();
      } catch {
        v.muted = true;
        try {
          await v.play();
        } catch {
          /* autoplay fully blocked */
        }
      }
    };

    void playWithSoundPreferred();

    const onCanPlayOnce = () => {
      void playWithSoundPreferred();
      v.removeEventListener("canplay", onCanPlayOnce);
    };
    v.addEventListener("canplay", onCanPlayOnce);
    return () => v.removeEventListener("canplay", onCanPlayOnce);
  }, [activeSrc]);

  const handleVideoEnd = () => {
    setIsExiting(true);
    setTimeout(onComplete, 800);
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-100 flex items-center justify-center overflow-hidden bg-black"
    >
      <div className="relative flex h-full w-full items-center justify-center">
        <video
          key={activeSrc}
          ref={videoRef}
          autoPlay
          playsInline
          preload="auto"
          onEnded={handleVideoEnd}
          className="h-full w-full object-cover"
        >
          <source src={activeSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        <div className="pointer-events-none absolute inset-0 bg-black/5" />
      </div>
    </motion.div>
  );
}
