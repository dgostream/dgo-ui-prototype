"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Smile, Star, Heart, Cloud, Rocket } from "lucide-react";

const RocketSVG = () => (
  <motion.svg
    width="160"
    height="160"
    viewBox="0 0 24 24"
    fill="none"
    stroke="url(#rocket-gradient)"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]"
    initial={{ y: 100, opacity: 0 }}
    animate={{ 
      y: [-10, 10, -10],
      opacity: 1
    }}
    transition={{
      y: { repeat: Infinity, duration: 2, ease: "easeInOut" },
      opacity: { duration: 0.5 }
    }}
  >
    <defs>
      <linearGradient id="rocket-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8a3ffc" />
        <stop offset="45%" stopColor="#ff00bd" />
        <stop offset="100%" stopColor="#22d3ee" />
      </linearGradient>
    </defs>
    
    <motion.path
      d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"
      initial={{ pathLength: 0, fill: "rgba(244,114,182,0)" }}
      animate={{ pathLength: 1, fill: "rgba(244,114,182,0.2)" }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
    />
    <motion.path
      d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"
      initial={{ pathLength: 0, fill: "rgba(34,211,238,0)" }}
      animate={{ pathLength: 1, fill: "rgba(34,211,238,0.2)" }}
      transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
    />
    <motion.path
      d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1, ease: "easeInOut", delay: 0.4 }}
    />
    <motion.path
      d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1, ease: "easeInOut", delay: 0.6 }}
    />
    
    {/* Soft Exhaust Bubbles */}
    {[
      { cx: 6, cy: 18, r: 2, delay: 1 },
      { cx: 8, cy: 20, r: 1.5, delay: 1.1 },
      { cx: 5, cy: 21, r: 1, delay: 1.2 },
    ].map((bubble, idx) => (
      <motion.circle
        key={`bubble-${idx}`}
        cx={bubble.cx}
        cy={bubble.cy}
        r={bubble.r}
        fill="#facc15"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: [0, 1.5, 0],
          y: [0, 5, 10],
          opacity: [0, 0.8, 0]
        }}
        transition={{
          duration: 1.2,
          delay: bubble.delay,
          repeat: Infinity,
          ease: "easeOut"
        }}
      />
    ))}
    
    {/* Star bursts around rocket */}
    {[
      { d: "M3 3l1 2", delay: 1.2, color: "#f472b6" },
      { d: "M19 5l2-1", delay: 1.3, color: "#22d3ee" },
      { d: "M20 18l1 1", delay: 1.4, color: "#facc15" },
    ].map((star, idx) => (
      <motion.path
        key={idx}
        d={star.d}
        stroke={star.color}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: [0, 1, 0] }}
        transition={{ delay: star.delay, duration: 1, repeat: Infinity, repeatDelay: 0.5 }}
      />
    ))}
  </motion.svg>
);

export default function JuniorSplash({ onComplete }: { onComplete: () => void }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onComplete, 800);
    }, 2800); // slightly longer to enjoy the animation

    return () => clearTimeout(timer);
  }, [onComplete]);

  const loadingText = "Loading Fun...".split("");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-100 flex items-center justify-center bg-[#0a1529] overflow-hidden"
    >
      {/* Background Shapes */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000) + 500,
            scale: Math.random() * 0.5 + 0.5
          }}
          animate={{ 
            y: -200,
            rotate: 360,
          }}
          transition={{ 
            duration: 3 + Math.random() * 3, 
            ease: "linear",
            delay: Math.random() * 1,
            repeat: Infinity
          }}
          className="absolute opacity-50"
        >
          {i % 4 === 0 && <Star size={40} className="text-yellow-400 fill-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />}
          {i % 4 === 1 && <Heart size={40} className="text-pink-500 fill-pink-500 drop-shadow-[0_0_10px_rgba(244,114,182,0.8)]" />}
          {i % 4 === 2 && <Cloud size={40} className="text-cyan-400 fill-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />}
          {i % 4 === 3 && <Smile size={40} className="text-green-400 fill-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]" />}
        </motion.div>
      ))}

      <div className="relative z-10 flex flex-col items-center">
        
        {/* Animated Rocket */}
        <div className="mb-6">
          <RocketSVG />
        </div>

        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
          className="flex items-center gap-4 relative"
        >
          <motion.img 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", delay: 0.5 }}
            src="/dgo-logo-new.png" 
            alt="DGO" 
            className="h-16 md:h-20 w-auto object-contain brightness-0 invert" 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            className="px-6 md:px-8 py-2 bg-brand-gradient rounded-3xl text-4xl md:text-6xl font-black text-white shadow-xl shadow-brand-purple/25 transform -rotate-3 border-4 border-white/25"
          >
            JUNIOR
          </motion.div>
        </motion.div>
        
        <motion.div
          className="mt-12 flex text-xl md:text-3xl font-black text-white font-geist uppercase tracking-widest"
        >
          {loadingText.map((char, index) => (
            <motion.span
              key={index}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: [0, -15, 0], opacity: 1 }}
              transition={{
                duration: 0.8,
                delay: index * 0.05 + 0.8,
                repeat: Infinity,
                repeatDelay: 1.5,
                ease: "easeOut"
              }}
              className={char !== " " ? "text-transparent bg-clip-text bg-linear-to-br from-brand-purple via-brand-pink to-brand-orange drop-shadow-sm" : ""}
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}



