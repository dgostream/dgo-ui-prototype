"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Search,
  Download,
  ListVideo,
  Menu,
  LayoutGrid,
  X,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { clearPaywallUnlocks } from "@/utils/paywall";
import { tabs, DEFAULT_HOME_TAB } from "@/components/navTabs";
import { AccountMenuPanel } from "@/components/AccountMenuPanel";
import { useTranslated } from "@/components/Translate";

type Panel = "none" | "search" | "downloads" | "mylist" | "user";

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (id: string) => void;
  onHome: () => void;
}

/** Bottom offset for sheets: icon row only (~4.75rem) + safe area */
const BAR_BOTTOM = "calc(4.85rem + env(safe-area-inset-bottom, 0px))";

function MobileMenuLabel({ text, className }: { text: string; className?: string }) {
  const t = useTranslated(text);
  return <span className={className}>{t}</span>;
}

function SearchSuggestionRow({ text }: { text: string }) {
  const t = useTranslated(text);
  return (
    <button
      type="button"
      className="w-full flex items-center justify-between py-3 border-b border-white/5 text-left text-white/80 text-sm font-medium"
    >
      {t}
      <ChevronRight className="w-4 h-4 text-white/20" />
    </button>
  );
}

export default function MobileBottomNav({ activeTab, onTabChange, onHome }: MobileBottomNavProps) {
  const [panel, setPanel] = useState<Panel>("none");
  const [browseTabsOpen, setBrowseTabsOpen] = useState(false);

  const tSearch = useTranslated("Search");
  const tSearchPh = useTranslated("Movies, series, sports…");
  const tPopular = useTranslated("Popular");
  const tDownloads = useTranslated("Downloads");
  const tNoDownloads = useTranslated("No downloads yet");
  const tSaveOffline = useTranslated("Save titles offline when available.");
  const tMyList = useTranslated("My List");
  const tListEmpty = useTranslated("Your list is empty");
  const tListHint = useTranslated("Tap + on any title to add it here.");
  const tMore = useTranslated("More");
  const tChooseCategory = useTranslated("Choose category");
  const closePanel = () => setPanel("none");

  const openOrToggle = (p: Exclude<Panel, "none">) => {
    setBrowseTabsOpen(false);
    setPanel((cur) => (cur === p ? "none" : p));
  };

  const selectTab = (id: string) => {
    onTabChange(id);
    setPanel("none");
    setBrowseTabsOpen(false);
  };

  useEffect(() => {
    const onOpenSearch = () => {
      setBrowseTabsOpen(false);
      setPanel("search");
    };
    window.addEventListener("dgo-mobile-search-open", onOpenSearch);
    return () => window.removeEventListener("dgo-mobile-search-open", onOpenSearch);
  }, []);

  const toggleBrowse = useCallback(() => {
    setPanel("none");
    setBrowseTabsOpen((o) => !o);
  }, []);

  const homeActive = panel === "none" && activeTab === DEFAULT_HOME_TAB && !browseTabsOpen;
  const navItem = (key: "downloads" | "mylist" | "user") => panel === key;

  return (
    <>
      <AnimatePresence>
        {panel !== "none" && (
          <motion.button
            type="button"
            aria-label="Close panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePanel}
            className="fixed inset-0 z-58 bg-black/70 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {panel === "search" && (
          <Sheet key="search" title={tSearch} onClose={closePanel} barBottom={BAR_BOTTOM}>
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input
                type="search"
                placeholder={tSearchPh}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/25 focus:outline-none focus:border-brand-purple/50 focus:ring-1 focus:ring-brand-purple/30"
                autoFocus
              />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">{tPopular}</p>
            {["Prem Geet", "Buhari", "Special Ops", "Asur"].map((s) => (
              <SearchSuggestionRow key={s} text={s} />
            ))}
          </Sheet>
        )}

        {panel === "downloads" && (
          <Sheet key="downloads" title={tDownloads} onClose={closePanel} barBottom={BAR_BOTTOM}>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Download className="w-14 h-14 text-brand-purple/20 mb-4" />
              <p className="text-white font-bold">{tNoDownloads}</p>
              <p className="text-white/40 text-sm mt-1 max-w-xs">{tSaveOffline}</p>
            </div>
          </Sheet>
        )}

        {panel === "mylist" && (
          <Sheet key="mylist" title={tMyList} onClose={closePanel} barBottom={BAR_BOTTOM}>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ListVideo className="w-14 h-14 text-brand-purple/20 mb-4" />
              <p className="text-white font-bold">{tListEmpty}</p>
              <p className="text-white/40 text-sm mt-1 max-w-xs">{tListHint}</p>
            </div>
          </Sheet>
        )}

        {panel === "user" && (
          <Sheet key="user" title={tMore} onClose={closePanel} tall barBottom={BAR_BOTTOM}>
            <AccountMenuPanel
              variant="mobile"
              onDismiss={closePanel}
              onSignOut={() => {
                clearPaywallUnlocks();
                closePanel();
              }}
            />
          </Sheet>
        )}
      </AnimatePresence>

      <nav
        className="fixed bottom-0 left-0 right-0 z-60 md:hidden border-t border-white/10 bg-black/95 backdrop-blur-xl"
        style={{ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom, 0px))" }}
      >
        {/* Sliding browse panel — above icon row */}
        <AnimatePresence initial={false}>
          {browseTabsOpen && (
            <motion.div
              key="browse-strip"
              initial={{ height: 0, opacity: 1 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 1 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-b border-white/10 bg-black/90"
            >
              <motion.div
                initial={{ y: -28, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 32, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="px-3 pt-3 pb-2.5"
              >
                <p className="text-[8px] font-black uppercase tracking-[0.35em] text-white/30 mb-2 px-1">
                  {tChooseCategory}
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory">
                  {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => selectTab(tab.id)}
                        className={cn(
                          "shrink-0 snap-start px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-wide whitespace-nowrap transition-all border",
                          isActive
                            ? "bg-brand-gradient text-white border-transparent shadow-lg shadow-brand-purple/25"
                            : "bg-white/6 text-white/45 border-white/10 active:scale-95"
                        )}
                      >
                        <MobileMenuLabel text={tab.label} />
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-stretch justify-around max-w-lg mx-auto pt-1 px-1">
          <BottomItem
            label="Home"
            active={homeActive}
            onClick={() => {
              setBrowseTabsOpen(false);
              setPanel("none");
              onHome();
            }}
            icon={Home}
          />
          <BottomItem
            label="Browse"
            active={browseTabsOpen}
            onClick={toggleBrowse}
            icon={LayoutGrid}
          />
          <BottomItem
            label="Downloads"
            active={navItem("downloads")}
            onClick={() => openOrToggle("downloads")}
            icon={Download}
          />
          <BottomItem
            label="My List"
            active={navItem("mylist")}
            onClick={() => openOrToggle("mylist")}
            icon={ListVideo}
          />
          <BottomItem
            label="More"
            active={navItem("user")}
            onClick={() => openOrToggle("user")}
            icon={Menu}
          />
        </div>
      </nav>
    </>
  );
}

function BottomItem({
  label,
  active,
  onClick,
  icon: Icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
}) {
  const t = useTranslated(label);
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-1 py-2 min-w-0 rounded-xl transition-transform active:scale-95",
        active ? "text-brand-purple" : "text-white/75"
      )}
    >
      <Icon
        className={cn("w-6 h-6", active && "drop-shadow-[0_0_10px_rgba(138,63,252,0.45)]")}
        size={24}
        strokeWidth={active ? 2.5 : 2}
      />
      <span
        className={cn(
          "text-[10px] font-bold leading-none truncate w-full text-center max-w-18",
          active ? "text-gradient font-black" : "text-white/65"
        )}
      >
        {t}
      </span>
    </button>
  );
}

function Sheet({
  children,
  title,
  onClose,
  tall,
  barBottom,
}: {
  children: ReactNode;
  title: ReactNode;
  onClose: () => void;
  tall?: boolean;
  barBottom: string;
}) {
  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 320 }}
      className={cn(
        "fixed left-0 right-0 z-59 md:hidden rounded-t-[1.75rem] border border-white/10 border-b-0 bg-[#0c0c0c] shadow-2xl flex flex-col overflow-hidden",
        tall ? "max-h-[min(82vh,calc(100dvh-5.5rem))]" : "max-h-[min(68vh,calc(100dvh-5.5rem))]"
      )}
      style={{ bottom: barBottom }}
    >
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/15 z-10" />
      <div className="flex items-center justify-between px-5 pt-6 pb-2 shrink-0 border-b border-white/5">
        <h2 className="text-lg font-black text-gradient tracking-tight">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="px-5 py-4 overflow-y-auto scrollbar-none flex-1 min-h-0">{children}</div>
    </motion.div>
  );
}
