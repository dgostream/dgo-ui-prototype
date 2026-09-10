"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, Bell, X, User } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/utils/cn";
import { clearPaywallUnlocks } from "@/utils/paywall";
import { tabs, DEFAULT_HOME_TAB } from "./navTabs";
import LanguageSwitcher from "./LanguageSwitcher";
import { AccountMenuPanel } from "./AccountMenuPanel";
import { useTranslated } from "./Translate";

export { tabs, DEFAULT_HOME_TAB };

interface NavigationProps {
  activeTab: string;
  onTabChange: (id: string) => void;
}

function NavTabLabel({ text, className }: { text: string; className?: string }) {
  const t = useTranslated(text);
  return <span className={className}>{t}</span>;
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const searchPlaceholder = useTranslated("Movies, series, sports, live channels…");
  const notifTitle = useTranslated("Notifications");
  const notifBody = useTranslated("You're all caught up. Match alerts will appear here.");
  const closeLabel = useTranslated("Close");
  const [searchOpen, setSearchOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const closeOverlays = useCallback(() => {
    setSearchOpen(false);
    setUserOpen(false);
    setNotifOpen(false);
  }, []);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeOverlays();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [closeOverlays]);

  useEffect(() => {
    if (!searchOpen) return;
    const t = window.setTimeout(() => {
      document.getElementById("dgo-desktop-search-input")?.focus();
    }, 100);
    return () => window.clearTimeout(t);
  }, [searchOpen]);

  const toggleSearch = () => {
    setUserOpen(false);
    setNotifOpen(false);
    setSearchOpen((v) => !v);
  };

  const toggleUser = () => {
    setSearchOpen(false);
    setNotifOpen(false);
    setUserOpen((v) => !v);
  };

  const toggleNotif = () => {
    setSearchOpen(false);
    setUserOpen(false);
    setNotifOpen((v) => !v);
  };

  const overlayOpen = searchOpen || userOpen || notifOpen;

  return (
    <>
      {/* Desktop: dim background when overlays open */}
      <AnimatePresence>
        {overlayOpen && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            aria-label="Dismiss"
            onClick={closeOverlays}
            className="hidden md:fixed inset-0 z-[48] bg-black/55 backdrop-blur-[2px]"
          />
        )}
      </AnimatePresence>

      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 glass-dark"
      >
        {/* Mobile: logo + language only */}
        <div className="flex md:hidden w-full items-center justify-between gap-3 px-4 py-3.5 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <motion.div
            onClick={() => onTabChange(DEFAULT_HOME_TAB)}
            whileTap={{ scale: 0.97 }}
            className="cursor-pointer shrink-0"
          >
            <img src="/dgo-logo-new.png" alt="DGO" className="h-9 w-auto object-contain" />
          </motion.div>
          <div className="flex items-center gap-2 shrink-0">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("dgo-mobile-search-open"));
                }
              }}
              className="p-2.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors border border-white/10"
              aria-label="Search"
            >
              <Search className="w-[22px] h-[22px]" strokeWidth={2.25} />
            </button>
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden md:block relative z-[51]">
          <div className="flex items-center justify-between px-8 lg:px-24 py-4 lg:py-5 w-full">
            <div className="flex items-center gap-6 lg:gap-12">
              <motion.div
                onClick={() => onTabChange(DEFAULT_HOME_TAB)}
                whileHover={{ scale: 1.05 }}
                className="cursor-pointer"
              >
                <img src="/dgo-logo-new.png" alt="DGO" className="h-10 lg:h-14 w-auto object-contain" />
              </motion.div>

              <div className="flex items-center gap-1">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.icon;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => onTabChange(tab.id)}
                      className={cn(
                        "relative flex items-center gap-2 px-4 py-2 group transition-all duration-300",
                        tab.id === "junior" && isActive ? "rounded-3xl bg-brand-purple/10 border border-brand-purple/30" : "",
                        isActive ? "text-white" : "text-white/60 hover:text-white/90"
                      )}
                    >
                      <Icon size={16} className={cn("transition-colors", isActive ? "text-white" : "text-white/60")} />
                      <NavTabLabel
                        text={tab.label}
                        className={cn(
                          "text-sm font-bold tracking-tight relative z-10 uppercase",
                          tab.id === "junior" ? "font-black tracking-normal" : "font-geist"
                        )}
                      />

                  {isActive && tab.id !== "junior" && (
                        <motion.div
                          layoutId="active-tab-pill"
                          className="absolute inset-0 bg-brand-purple/10 rounded-full border border-brand-purple/25 shadow-[0_0_20px_rgba(138,63,252,0.12)] -z-10"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                  )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-4">
              <LanguageSwitcher />
              <button
                type="button"
                onClick={toggleSearch}
                aria-expanded={searchOpen}
                aria-label="Search"
                className={cn(
                  "p-2 rounded-full transition-colors",
                  searchOpen ? "text-white bg-white/15" : "text-white/70 hover:text-white hover:bg-white/5"
                )}
              >
                <Search className="w-5 lg:w-[22px] h-5 lg:h-[22px]" strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={toggleNotif}
                aria-expanded={notifOpen}
                aria-label="Notifications"
                className={cn(
                  "p-2 rounded-full transition-colors relative",
                  notifOpen ? "text-white bg-white/15" : "text-white/70 hover:text-white hover:bg-white/5"
                )}
              >
                <Bell size={22} strokeWidth={2.5} />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-brand-gradient rounded-full border border-black" />
              </button>
              <motion.button
                type="button"
                onClick={toggleUser}
                aria-expanded={userOpen}
                aria-label="Account menu"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "w-8 h-8 lg:w-10 lg:h-10 rounded-full border overflow-hidden transition-colors",
                  userOpen ? "border-brand-purple/50 ring-2 ring-brand-purple/25" : "border-white/20 from-white/10 to-white/5 bg-linear-to-br"
                )}
              >
                <img src="https://ui-avatars.com/api/?name=User&background=8a3ffc&color=fff" alt="" className="w-full h-full object-cover" />
              </motion.button>
            </div>
          </div>

          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden border-t border-white/10 bg-black/80 backdrop-blur-xl"
              >
                <div className="px-8 lg:px-24 py-4 flex items-center gap-3">
                  <Search className="w-5 h-5 text-white/30 shrink-0" />
                  <input
                    id="dgo-desktop-search-input"
                    type="search"
                    placeholder={searchPlaceholder}
                    className="flex-1 bg-transparent text-white placeholder:text-white/25 text-sm outline-none min-w-0"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={closeOverlays}
                    className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                    aria-label="Close search"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      {/* Desktop: user dropdown — outside nav so it layers above backdrop */}
      <AnimatePresence>
        {userOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="hidden md:block fixed z-[52] top-[calc(4.75rem+env(safe-area-inset-top,0px))] right-8 lg:right-24 w-[min(100vw-2rem,22.5rem)] max-h-[min(92vh,calc(100dvh-5rem))] overflow-y-auto rounded-2xl border border-white/10 bg-[#0c0c0c] shadow-2xl scrollbar-none"
          >
            <div className="p-3 pb-4">
              <AccountMenuPanel
                variant="desktop"
                onDismiss={closeOverlays}
                onSignOut={() => {
                  clearPaywallUnlocks();
                  closeOverlays();
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop: notifications popover */}
      <AnimatePresence>
        {notifOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="hidden md:block fixed z-[52] top-[calc(4.75rem+env(safe-area-inset-top,0px))] right-32 lg:right-44 w-[min(100vw-2rem,20rem)] rounded-2xl border border-white/10 bg-[#0c0c0c] shadow-2xl p-5"
          >
            <p className="text-xs font-black text-white mb-1">{notifTitle}</p>
            <p className="text-sm text-white/40">{notifBody}</p>
            <button
              type="button"
              onClick={closeOverlays}
              className="mt-4 w-full py-2.5 rounded-xl bg-white/5 text-xs font-bold text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              {closeLabel}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
