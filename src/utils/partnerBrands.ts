/** Partner rail visual tokens — JioHotstar (Spark) and OSR Digital (Nepali cinema). */

export type PartnerId = "hotstar" | "osr";

export const PARTNER_BRANDS: Record<
  PartnerId,
  {
    name: string;
    eyebrow: string;
    tagline: string;
    from: string;
    via: string;
    to: string;
    surface: string;
  }
> = {
  hotstar: {
    name: "JioHotstar",
    eyebrow: "Partner hub",
    tagline: "Hotstar Specials, binge series and movies — the Spark catalogue on DGO.",
    from: "#0B5FFF",
    via: "#7B2CBF",
    to: "#FF4D9A",
    surface: "#0F1014",
  },
  osr: {
    name: "OSR Digital",
    eyebrow: "Partner hub",
    tagline: "Nepali films, music, serials and reality from OSR Digital.",
    from: "#E10600",
    via: "#C41E3A",
    to: "#F5C518",
    surface: "#140404",
  },
};

export function isPartnerTab(tab: string | null | undefined): tab is PartnerId {
  return tab === "hotstar" || tab === "osr";
}
