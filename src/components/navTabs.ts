import { Film, Star, Clapperboard, Smile, Tv2, Sparkles, Home, type LucideIcon } from "lucide-react";

export type NavTab = {
  id: string;
  label: string;
  icon: LucideIcon;
  iconSrc?: string;
  color: string;
  secondaryColor: string;
  multi?: boolean;
};

/** Home first, then partner rails, then core verticals */
export const tabs: NavTab[] = [
  { id: "home", label: "Home", icon: Home, color: "#8a3ffc", secondaryColor: "#ff00bd" },
  {
    id: "hotstar",
    label: "JioHotstar",
    icon: Tv2,
    iconSrc: "/hotstar-icon.svg",
    color: "#0B5FFF",
    secondaryColor: "#FF4D9A",
  },
  { id: "osr", label: "OSR", icon: Sparkles, color: "#E10600", secondaryColor: "#F5C518" },
  { id: "sports", label: "Sports", icon: Clapperboard, color: "#8a3ffc", secondaryColor: "#ff4d00" },
  { id: "entertainment", label: "Entertainment", icon: Film, color: "#8a3ffc", secondaryColor: "#ff00bd" },
  { id: "specials", label: "Specials", icon: Star, color: "#8a3ffc", secondaryColor: "#ff00bd" },
  { id: "junior", label: "Junior", icon: Smile, color: "#8a3ffc", secondaryColor: "#22d3ee", multi: true },
];

export const DEFAULT_HOME_TAB = "home";
