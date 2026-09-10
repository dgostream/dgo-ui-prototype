"use client";

import { motion } from "framer-motion";
import { useEffect, useState, use, useMemo, Suspense } from "react";
import {
   Play, Plus, Share2, Star, Clock, Flame,
   ArrowLeft, ChevronRight, Download, ThumbsUp, Zap
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/utils/cn";
import { getContentById, ContentItem } from "@/utils/content";

function watchTabForContent(content: ContentItem, fromTabParam: string | null): string {
   if (fromTabParam) return fromTabParam;
   if (content.genres?.some((g) => /kids|junior|child/i.test(g))) return "junior";
   switch (content.type) {
      case "sports":
         return "sports";
      case "series":
         return "entertainment";
      case "special":
         return "specials";
      case "live":
         return "entertainment";
      default:
         return "entertainment";
   }
}

function DetailsPageInner({ params }: { params: Promise<{ id: string }> }) {
   const router = useRouter();
   const searchParams = useSearchParams();
   const fromTabParam = searchParams.get("fromTab");
   const { id } = use(params);
   const [content, setContent] = useState<ContentItem | null>(null);
   const [activeSeason, setActiveSeason] = useState(1);

   useEffect(() => {
      let mounted = true;
      getContentById(id).then(data => {
         if (mounted && data) {
            setContent(data);
         }
      });
      return () => { mounted = false; };
   }, [id]);

   const watchTab = useMemo(
      () => (content ? watchTabForContent(content, fromTabParam) : "entertainment"),
      [content, fromTabParam]
   );

   if (!content) {
      return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
   }

   const episodes = content.episodes || [
      { id: 1, title: "The Feature Presentation", duration: content.duration || "2h", desc: content.desc },
   ];

   return (
      <main className="min-h-screen bg-black">
         {/* Top Navigation Bar */}
         <nav className="fixed top-0 left-0 right-0 z-50 p-8 max-md:p-4 flex items-center justify-between pointer-events-none">
            <button
               onClick={() => router.back()}
               className="pointer-events-auto flex items-center gap-3 text-white/60 font-black uppercase tracking-[0.2em] text-xs px-6 py-3 max-md:px-4 max-md:py-2 glass rounded-full hover:bg-white/10 hover:text-white transition-all group border border-white/5"
            >
               <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform max-md:w-3 max-md:h-3" />
               <span className="max-md:text-[10px]">Back to Browse</span>
            </button>

            {/* Optional: Brand logo on the right for context */}
            <div className="flex items-center">
               <img src="/dgo-logo-new.png" alt="DGO" className="h-8 max-md:h-5 w-auto object-contain opacity-40 grayscale" />
            </div>
         </nav>

         {/* HERO HEADER */}
         <section className="relative h-[70vh] max-md:h-[60vh] w-full flex items-end pb-20 px-16 max-md:px-8">
            <div className="absolute inset-0 -z-10">
               <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent z-10" />
               <div className="absolute inset-0 bg-linear-to-r from-black via-transparent to-transparent z-10" />
               {content.detailsHeroImg || content.heroImg || content.img ? (
                  <img
                     src={content.detailsHeroImg || content.heroImg || content.img}
                     alt={content.title}
                     className="w-full h-full object-cover opacity-60"
                  />
               ) : (
                  <div className="w-full h-full bg-brand-secondary flex items-center justify-center">
                     <img src="/ios-icon.png" alt="DGO" className="w-1/5 h-auto object-contain opacity-[0.06]" />
                  </div>
               )}
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.05 }}
                  className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
               >
                  <img src="/dgo-logo-new.png" alt="DGO" className="w-[40vw] h-auto object-contain opacity-20 grayscale brightness-0 invert" />
               </motion.div>
            </div>

            <div className="max-w-4xl space-y-6 relative z-20">
               <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
               >
                  <div className="flex items-center gap-4 mb-4">
                     <span className="px-3 py-1 bg-white/10 border border-white/20 rounded text-[10px] font-black text-white uppercase tracking-widest">
                        {content.tag}
                     </span>
                     {content.rating && (
                        <div className="flex items-center gap-2 text-white/40 text-[10px] font-black uppercase tracking-widest">
                           <Star size={12} className="text-yellow-500 fill-yellow-500" />
                           <span>{content.rating} Rating</span>
                        </div>
                     )}
                  </div>

                  <h1 className="text-6xl font-black text-white italic tracking-tighter leading-tight uppercase max-md:text-4xl">
                     {content.title} <br /> <span className="text-brand-purple text-glow not-italic">{content.subtitle}</span>
                  </h1>

                  <p className="mt-6 text-lg text-white/50 max-w-2xl font-geist leading-relaxed line-clamp-3 max-md:text-sm">
                     {content.desc}
                  </p>
               </motion.div>

               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="flex items-center gap-6"
               >
                  {content.isPPV ? (
                     <button
                        type="button"
                        onClick={() => {
                           const ret = `/watch/${content.id}`;
                           router.push(`/join?flow=pvod&return=${encodeURIComponent(ret)}`);
                        }}
                        className="flex items-center gap-3 px-12 py-5 max-md:px-8 max-md:py-4 bg-amber-500 text-black font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all text-sm"
                     >
                        <Zap fill="currentColor" size={20} /> Buy Ticket {content.price}
                     </button>
                  ) : (
                     <button
                        type="button"
                        onClick={() =>
                           router.push(
                              `/watch/${content.id}?fromTab=${encodeURIComponent(watchTab)}`
                           )
                        }
                        className="flex items-center gap-3 px-12 py-5 max-md:px-8 max-md:py-4 bg-brand-gradient text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-brand-purple/20 hover:scale-105 active:scale-95 transition-all text-sm"
                     >
                        <Play fill="currentColor" size={20} /> Watch Now
                     </button>
                  )}
                  <button className="p-5 max-md:p-4 glass rounded-2xl text-white/70 hover:bg-white/10 transition-colors">
                     <Plus size={24} className="max-md:w-5 max-md:h-5" />
                  </button>
                  <button className="p-5 max-md:p-4 glass rounded-2xl text-white/70 hover:bg-white/10 transition-colors">
                     <Share2 size={24} className="max-md:w-5 max-md:h-5" />
                  </button>
               </motion.div>
            </div>
         </section>

         {/* CONTENT SECTIONS */}
         <section className="px-16 max-md:px-8 py-16 grid grid-cols-1 lg:grid-cols-3 gap-24 max-md:gap-12">
            {/* LEFT: EPISODES & INFO */}
            <div className="lg:col-span-2 space-y-16">
               <div className="flex items-center gap-12 border-b border-white/10 pb-8">
                  <button
                     className={cn(
                        "text-2xl font-black uppercase tracking-tighter transition-all",
                        activeSeason === 1 ? "text-white scale-110" : "text-white/20 hover:text-white/40"
                     )}
                     onClick={() => setActiveSeason(1)}
                  >
                     {content.type === 'series' ? 'Episodes' : 'Overview'}
                  </button>
               </div>

               <div className="space-y-6">
                  {episodes.map((ep, i) => (
                     <motion.div
                        key={ep.id}
                        whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                        className="group flex gap-8 p-6 rounded-3xl border border-transparent hover:border-white/5 transition-all cursor-pointer"
                        onClick={() =>
                           !content.isPPV &&
                           router.push(
                              `/watch/${content.id}?episode=${encodeURIComponent(String(ep.id))}&fromTab=${encodeURIComponent(watchTab)}`
                           )
                        }
                     >
                        <div className="w-48 h-28 max-md:w-32 max-md:h-20 bg-[#111] rounded-2xl shrink-0 relative overflow-hidden flex items-center justify-center">
                           {ep.thumbnail ? (
                              <img src={ep.thumbnail} alt={ep.title} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                           ) : (
                              <img src="/ios-icon.png" alt="DGO" className="w-8 h-8 object-contain opacity-[0.1]" />
                           )}
                           <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Play size={32} fill="white" className="text-white" />
                           </div>
                        </div>
                        <div className="flex-1 space-y-2">
                           <div className="flex justify-between items-center">
                              <h4 className="text-lg font-black text-white uppercase tracking-tight">
                                 {content.type === 'series' ? `${ep.id}. ${ep.title}` : 'Full Presentation'}
                              </h4>
                              <span className="text-xs font-bold text-white/30 uppercase tracking-widest">{ep.duration}</span>
                           </div>
                           <p className="text-sm text-white/40 font-medium leading-relaxed max-w-xl">{ep.desc}</p>
                        </div>
                     </motion.div>
                  ))}
               </div>
            </div>

            {/* RIGHT: CAST & METADATA */}
            <div className="space-y-12">
               <div className="glass p-10 rounded-[2.5rem] space-y-8">
                  <div className="space-y-4">
                     <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.3em]">The Creators</h3>
                     {content.director && <p className="text-white font-bold tracking-tight">Directed by: <span className="text-white/60">{content.director}</span></p>}
                     {content.cast && <p className="text-white font-bold tracking-tight">Starring: <span className="text-white/60">{content.cast.join(", ")}</span></p>}
                  </div>

                  <div className="space-y-4 pt-8 border-t border-white/5">
                     <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.3em]">Details</h3>
                     <div className="grid grid-cols-2 gap-y-4">
                        <div>
                           <span className="block text-[10px] text-white/30 uppercase font-black">Genre</span>
                           <span className="text-sm text-white font-bold">{content.genres?.join(", ") || "Unknown"}</span>
                        </div>
                        <div>
                           <span className="block text-[10px] text-white/30 uppercase font-black">Year</span>
                           <span className="text-sm text-white font-bold">{content.year || "2026"}</span>
                        </div>
                        <div>
                           <span className="block text-[10px] text-white/30 uppercase font-black">Audio</span>
                           <span className="text-sm text-white font-bold">Nepali, English</span>
                        </div>
                        <div>
                           <span className="block text-[10px] text-white/30 uppercase font-black">Subtitles</span>
                           <span className="text-sm text-white font-bold">English, Hindi</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </section>
      </main>
   );
}

export default function DetailsPage(props: { params: Promise<{ id: string }> }) {
   return (
      <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>}>
         <DetailsPageInner {...props} />
      </Suspense>
   );
}
