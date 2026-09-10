import { client } from "@/sanity/lib/client";
import { urlForImage } from "@/sanity/lib/image";

export interface ContentItem {
  id: string;
  title: string;
  subtitle: string;
  desc: string;
  tag: string;
  accent: string;
  img: string;
  heroImg?: string;
  detailsHeroImg?: string;
  heroVideo?: string;
  type: 'movie' | 'series' | 'sports' | 'special' | 'live';
  year?: string;
  rating?: string;
  duration?: string;
  price?: string;
  isPPV?: boolean;
  cast?: string[];
  director?: string;
  genres?: string[];
  episodes?: { id: number; title: string; duration: string; desc: string; thumbnail?: string; video?: string }[];
  video?: string;
}

const toSanityFileUrl = (fileValue: any): string | undefined => {
  if (!fileValue) return undefined;

  // When dereferenced (asset->), Sanity returns a direct CDN URL.
  if (typeof fileValue?.url === "string") return fileValue.url;
  if (typeof fileValue === "string" && fileValue.startsWith("http")) return fileValue;

  const ref =
    fileValue?.asset?._ref ||
    fileValue?.asset?._id ||
    fileValue?._ref ||
    fileValue?._id ||
    (typeof fileValue === "string" ? fileValue : undefined);

  if (!ref || typeof ref !== "string") return undefined;
  if (ref.startsWith("http")) return ref;

  const cleaned = ref.replace(/^file-/, "");
  const match = cleaned.match(/^(.+)-([a-z0-9]+)$/i);
  if (!match) return undefined;

  return `https://cdn.sanity.io/files/${client.config().projectId}/${client.config().dataset}/${match[1]}.${match[2]}`;
};

const mapSanityToContentItem = (data: any): ContentItem => {
  if (!data) return {} as ContentItem;

  return {
    id: data.slug?.current || data._id,
    title: data.title,
    subtitle: data.subtitle || "",
    desc: data.desc || "",
    tag: data.tag || "",
    accent: data.accent || (data._type === 'sports' ? '#1d4ed8' : '#8a3ffc'),
    img: data.img ? urlForImage(data.img).url() : "",
    heroImg: data.heroImg ? urlForImage(data.heroImg).url() : undefined,
    detailsHeroImg: data.detailsHeroImg ? urlForImage(data.detailsHeroImg).url() : undefined,
    heroVideo: toSanityFileUrl(data.heroVideo),
    type: data._type === 'special' ? 'special' :
      data._type === 'liveChannel' ? 'live' :
        data._type === 'sports' ? 'sports' :
          data._type || 'movie',
    year: data.year,
    rating: data.rating,
    duration: data.duration,
    price: data.price,
    isPPV: data.isPPV || data.monetization === 'ppv' || data.monetization === 'pvod',
    cast: data.cast,
    director: data.director,
    genres: data.genres,
    episodes: data.episodes?.map((ep: any) => ({
      ...ep,
      thumbnail: ep.thumbnail ? urlForImage(ep.thumbnail).url() : undefined,
      video: toSanityFileUrl(ep.video)
    })),
    video: toSanityFileUrl(data.video)
  };
};

export async function getAdSettings() {
  try {
    const query = `*[_type == "adSettings"][0]{
      prerollVideo,
      midrollVideo,
      pauseAdImage,
      heroCarouselAd,
      homeBackgroundAd,
      feedAd,
      sponsorLogo,
      footerBannerAd,
      matchHubBannerAd,
      inStreamAd,
      "globalSponsorLogo": sponsorLogo.asset->url
    }`;
    const data = await client.fetch(query);
    if (!data) return null;

    return {
      prerollVideo: toSanityFileUrl(data.prerollVideo),
      midrollVideo: toSanityFileUrl(data.midrollVideo),
      pauseAdImage: data.pauseAdImage ? urlForImage(data.pauseAdImage).url() : undefined,
      heroCarouselAd: data.heroCarouselAd ? { ...data.heroCarouselAd, image: data.heroCarouselAd.image ? urlForImage(data.heroCarouselAd.image).url() : null } : null,
      homeBackgroundAd: data.homeBackgroundAd ? urlForImage(data.homeBackgroundAd).url() : null,
      feedAd: data.feedAd ? { ...data.feedAd, image: data.feedAd.image ? urlForImage(data.feedAd.image).url() : null } : null,
      sponsorLogo: data.sponsorLogo ? urlForImage(data.sponsorLogo).url() : null,
      footerBannerAd: data.footerBannerAd ? urlForImage(data.footerBannerAd).url() : null,
      matchHubBannerAd: data.matchHubBannerAd ? urlForImage(data.matchHubBannerAd).url() : null,
      inStreamAd: data.inStreamAd ? urlForImage(data.inStreamAd).url() : null,
      globalSponsorLogo: data.globalSponsorLogo
    };
  } catch (e) {
    console.error("Sanity fetch error:", e);
    return null;
  }
}

export async function getContentById(id: string): Promise<ContentItem | null> {
  try {
    const query = `*[_type in ["movie", "series", "sports", "special", "content"] && (slug.current == $id || _id == $id)][0] {
      ...,
      "video": video.asset->,
      "episodes": episodes[] {
        ...,
        "video": video.asset->
      }
    }`;
    const data = await client.fetch(query, { id });
    if (data) return mapSanityToContentItem(data);
    const fallback = resolveHardcodedContentById(id);
    if (fallback) return fallback;
    return null;
  } catch (e) {
    console.error("Sanity fetch error:", e);
    const fallback = resolveHardcodedContentById(id);
    if (fallback) return fallback;
    return null;
  }
}

function hardcodedHeroForTab(tab: string): ContentItem[] {
  const slides = HERO_SLIDES[tab];
  if (slides?.length) {
    return dropBlockedItems(slides.map((item) => mapHardcodedToContentItem(item, `${tab}-hero`)));
  }
  const rows = HARDCODED_SECTIONS[tab];
  if (!rows?.length) return [];
  return dropBlockedItems(rows[0].items.map((item: any) => mapHardcodedToContentItem(item, rows[0].title)));
}

export async function getHeroContent(tab: string): Promise<ContentItem[]> {
  const fromHardcoded = () => hardcodedHeroForTab(tab);

  if (tab === "home" || tab === "hotstar" || tab === "osr") {
    const local = fromHardcoded();
    if (local.length > 0) return local;
  }

  try {
    const heroTab = tab === "home" ? undefined : tab;

    if (heroTab) {
      const toggleQuery = `*[_type in ["movie", "series", "sports", "special"] && isHero == true && targetTab == $tab] | order(_updatedAt desc)[0...8]`;
      const toggleData = await client.fetch(toggleQuery, { tab: heroTab });
      const fromToggle = dropBlockedItems((toggleData || []).map(mapSanityToContentItem));
      if (fromToggle.length > 0) return fromToggle;

      const carouselQuery = `*[_type == "heroCarousel" && vertical == $tab][0]{
        items[]->{ ..., "slug": slug.current }
      }`;
      const carouselData = await client.fetch(carouselQuery, { tab: heroTab });
      const fromCarousel = dropBlockedItems((carouselData?.items || []).map(mapSanityToContentItem));
      if (fromCarousel.length > 0) return fromCarousel;
    }

    let filter = `_type in ["movie", "series", "sports", "special"] && targetTab == $tab`;
    if (tab === "home") filter = `_type in ["movie", "series", "sports", "special"] && targetTab != "fifa"`;
    else if (tab === "sports") filter = `_type == "sports" && targetTab != "fifa"`;
    else if (tab === "hotstar" || tab === "osr") filter = `_type in ["movie", "series", "sports", "special"] && targetTab == $tab`;
    else if (tab === "junior") filter = `(_type == "movie" || _type == "series") && (isJunior == true || targetTab == "junior" || "Kids" in genres || "Junior" in genres)`;
    else if (tab === "specials") filter = `_type == "special"`;

    const fallbackQuery = `*[${filter}] | order(_createdAt desc)[0...10]`;
    const fallbackData = await client.fetch(fallbackQuery, { tab });
    const fromCms = dropBlockedItems((fallbackData || []).map(mapSanityToContentItem));
    if (fromCms.length > 0) return fromCms;
    return fromHardcoded();
  } catch (e) {
    console.error("Sanity fetch error:", e);
    return fromHardcoded();
  }
}

// Hardcoded data from Excel
const HARDCODED_SECTIONS: Record<string, any[]> = {
  entertainment: [
    {
      title: "Hindi Dubbed",
      items: [
        { title: "After Math", tag: "Action", year: "2016", rating: "5.3", duration: "1h 30m" },
        { title: "24 Hours To Live", tag: "Thriller", year: "2017", rating: "5.8", duration: "1h 33m" },
        { title: "Imitation Game", tag: "Drama", year: "2014", rating: "8.0", duration: "1h 54m" },
        { title: "Killing Them Softly", tag: "Crime", year: "2012", rating: "6.2", duration: "1h 37m" },
        { title: "47 Meters Down", tag: "Horror", year: "2017", rating: "5.6", duration: "1h 29m" },
      ]
    },
    {
      title: "Nepali Movies",
      items: [
        { title: "Kalo Barsa", tag: "Drama", year: "2018", rating: "7.1", duration: "2h 10m" },
        { title: "Mann Manai Manparaye", tag: "Romance", year: "2019", rating: "6.5", duration: "2h 5m" },
        { title: "Bhagya Aa Afno", tag: "Family", year: "2016", rating: "6.8", duration: "2h 0m" },
        { title: "Hasideu Ek Fera", tag: "Comedy", year: "2020", rating: "7.0", duration: "1h 55m" },
        { title: "Teen Ghumti", tag: "Classic", year: "2015", rating: "7.5", duration: "2h 15m" },
      ]
    },
    {
      title: "Korean Drama",
      items: [
        { title: "Bad Papa", tag: "Drama", year: "2018", rating: "7.8", duration: "16 Eps" },
        { title: "Hospital Ship", tag: "Medical", year: "2017", rating: "7.5", duration: "40 Eps" },
        { title: "Kill Me Heal Me", tag: "Romance", year: "2015", rating: "8.3", duration: "20 Eps" },
        { title: "Sweet Revenge", tag: "Teen", year: "2017", rating: "7.2", duration: "22 Eps" },
        { title: "Two Cops", tag: "Fantasy", year: "2017", rating: "7.3", duration: "32 Eps" },
      ]
    }
  ],
  sports: [
    {
      title: "Live & highlights",
      icon: "Trophy",
      items: [
        { title: "Asia Cup Tonight", tag: "Cricket", year: "2026", duration: "Live" },
        { title: "Premier League Weekend", tag: "Football", year: "2026", duration: "90 min" },
        { title: "Kabaddi Nationals", tag: "Kabaddi", year: "2025", duration: "2h 10m" },
        { title: "NSL Matchday", tag: "Football", year: "2025", duration: "Live" },
        { title: "Court Side", tag: "Basketball", year: "2026", duration: "Highlights" },
      ]
    }
  ],
  junior: [
    {
      title: "Kids Choice",
      items: [
        { title: "Sir Billi", tag: "Animation", year: "2012", rating: "4.5", duration: "1h 20m" },
        { title: "Atomicron", tag: "Action", year: "2014", rating: "6.0", duration: "1h 10m" },
        { title: "Dinofroz The Origin", tag: "Adventure", year: "2015", rating: "6.5", duration: "1h 15m" },
        { title: "Boonie Bears Homeward Journey", tag: "Family", year: "2013", rating: "7.0", duration: "1h 08m" },
        { title: "Felix All Around The World", tag: "Adventure", year: "2005", rating: "5.8", duration: "1h 22m" },
      ]
    }
  ],
  specials: [
    {
      title: "Exclusive Specials",
      items: [
        { title: "Comedy Night Live", tag: "Comedy", year: "2024", rating: "8.5", duration: "1h 30m" },
        { title: "Music Awards 2024", tag: "Music", year: "2024", rating: "9.0", duration: "3h 00m" },
        { title: "Documentary: The Himalayas", tag: "Documentary", year: "2023", rating: "9.2", duration: "1h 45m" }
      ]
    }
  ],
  home: [
    {
      title: "From OSR Digital",
      icon: "Film",
      items: [
        { title: "Prem Geet", tag: "Romance", year: "2016", rating: "8.4", duration: "2h 17m", subtitle: "Pooja Sharma, Pradeep Khadka" },
        { title: "Prasad 2", tag: "Drama", year: "2026", rating: "8.1", duration: "2h 10m", subtitle: "Bipin Karki, Keki Adhikari" },
        { title: "Jhingedaau", tag: "Comedy", year: "2026", rating: "7.8", duration: "2h 05m" },
        { title: "Behuli from Meghauli", tag: "Drama", year: "2025", rating: "8.0", duration: "2h 12m" },
        { title: "Prem Geet 2", tag: "Romance", year: "2018", rating: "8.0", duration: "2h 20m" },
        { title: "Prem Geet 3", tag: "Romance", year: "2022", rating: "7.6", duration: "2h 22m" },
        { title: "Buhari", tag: "OSR Serial", year: "2026", rating: "8.6", duration: "290+ Eps" },
      ]
    },
    {
      title: "JioHotstar on DGO",
      icon: "Tv",
      items: [
        { title: "Special Ops", tag: "Hotstar Specials", year: "2024", rating: "8.6", duration: "Eps", subtitle: "Kay Kay Menon" },
        { title: "The Night Manager", tag: "Thriller", year: "2023", rating: "8.2", duration: "Eps" },
        { title: "Aarya", tag: "Crime", year: "2024", rating: "8.3", duration: "Eps" },
        { title: "The Family Man", tag: "Spy", year: "2021", rating: "8.7", duration: "Eps" },
        { title: "12th Fail", tag: "Drama", year: "2023", rating: "8.8", duration: "2h 27m" },
        { title: "Stree 2", tag: "Horror-Comedy", year: "2024", rating: "7.5", duration: "2h 27m" },
      ]
    },
    {
      title: "Serials people finish",
      icon: "Tv",
      items: [
        { title: "Buhari", tag: "OSR Serial", year: "2026", rating: "8.6", duration: "290+ Eps" },
        { title: "Juthe", tag: "OSR Serial", year: "2026", rating: "8.1", duration: "S2" },
        { title: "Aarya", tag: "Hotstar Specials", year: "2024", rating: "8.3", duration: "Eps" },
        { title: "Kill Me Heal Me", tag: "K-Drama", year: "2015", rating: "8.3", duration: "20 Eps" },
        { title: "Hospital Ship", tag: "Medical", year: "2017", rating: "7.5", duration: "40 Eps" },
      ]
    },
    {
      title: "Movies tonight",
      icon: "Clapperboard",
      items: [
        { title: "Prem Geet", tag: "OSR", year: "2016", rating: "8.4", duration: "2h 17m" },
        { title: "12th Fail", tag: "JioHotstar", year: "2023", rating: "8.8", duration: "2h 27m" },
        { title: "Prasad", tag: "OSR", year: "2018", rating: "8.2", duration: "2h 15m" },
        { title: "Fighter", tag: "JioHotstar", year: "2024", rating: "7.4", duration: "2h 46m" },
        { title: "Imitation Game", tag: "Drama", year: "2014", rating: "8.0", duration: "1h 54m" },
        { title: "Captain", tag: "OSR", year: "2019", rating: "7.4", duration: "2h 08m" },
      ]
    },
    {
      title: "New this week",
      icon: "Star",
      items: [
        { title: "Gobar Ganesh", tag: "OSR · Coming", year: "2026", duration: "Trailer" },
        { title: "Prasad 2", tag: "OSR Movies", year: "2026", rating: "8.1", duration: "2h 10m" },
        { title: "Jhingedaau", tag: "Comedy", year: "2026", rating: "7.8", duration: "2h 05m" },
        { title: "Special Ops", tag: "Hotstar Specials", year: "2024", rating: "8.6", duration: "Eps" },
        { title: "Comedy Night Live", tag: "Special", year: "2024", rating: "8.5", duration: "1h 30m" },
      ]
    }
  ],
  hotstar: [
    {
      title: "Hotstar Specials",
      icon: "Star",
      items: [
        { title: "Special Ops", tag: "Thriller", year: "2020", rating: "8.6", duration: "Eps", subtitle: "Kay Kay Menon", desc: "A wounded agency, a vanishing asset, and the flagship Hotstar Specials thriller — now on DGO." },
        { title: "The Night Manager", tag: "Spy", year: "2023", rating: "8.2", duration: "Eps", subtitle: "Anil Kapoor, Aditya Roy Kapur" },
        { title: "Aarya", tag: "Crime", year: "2020", rating: "8.3", duration: "Eps", subtitle: "Sushmita Sen" },
        { title: "Human", tag: "Drama", year: "2022", rating: "8.0", duration: "Eps", subtitle: "Shefali Shah" },
        { title: "Criminal Justice", tag: "Courtroom", year: "2019", rating: "8.1", duration: "Eps", subtitle: "Vikrant Massey" },
        { title: "Hostages", tag: "Thriller", year: "2019", rating: "7.4", duration: "Eps" },
        { title: "The Freelancer", tag: "Action", year: "2023", rating: "7.2", duration: "Eps", subtitle: "Mohammed Zeeshan Ayyub" },
      ]
    },
    {
      title: "Binge now",
      icon: "Flame",
      items: [
        { title: "The Family Man", tag: "Spy", year: "2021", rating: "8.7", duration: "Eps", subtitle: "Manoj Bajpayee" },
        { title: "Scam 1992", tag: "Drama", year: "2020", rating: "9.3", duration: "Eps", subtitle: "Pratik Gandhi" },
        { title: "Aarya", tag: "Crime", year: "2024", rating: "8.3", duration: "S3" },
        { title: "Special OPS 1.5", tag: "Thriller", year: "2021", rating: "8.4", duration: "Eps" },
        { title: "Out of Love", tag: "Drama", year: "2019", rating: "7.6", duration: "Eps" },
        { title: "Hundred", tag: "Crime", year: "2020", rating: "7.3", duration: "Eps" },
      ]
    },
    {
      title: "Movies on JioHotstar",
      icon: "Film",
      items: [
        { title: "12th Fail", tag: "Drama", year: "2023", rating: "8.8", duration: "2h 27m", subtitle: "Vidhu Vinod Chopra" },
        { title: "Fighter", tag: "Action", year: "2024", rating: "7.4", duration: "2h 46m", subtitle: "Hrithik Roshan, Deepika Padukone" },
        { title: "Stree 2", tag: "Horror-Comedy", year: "2024", rating: "7.5", duration: "2h 27m" },
        { title: "Jawan", tag: "Action", year: "2023", rating: "7.1", duration: "2h 49m" },
        { title: "Pathaan", tag: "Action", year: "2023", rating: "6.9", duration: "2h 26m" },
        { title: "Animal", tag: "Action", year: "2023", rating: "6.8", duration: "3h 21m" },
        { title: "Super 30", tag: "Drama", year: "2019", rating: "7.9", duration: "2h 34m" },
      ]
    },
    {
      title: "Star originals",
      icon: "Sparkles",
      items: [
        { title: "Rookies", tag: "Coming of age", year: "2024", rating: "7.8", duration: "Eps" },
        { title: "Tamasha", tag: "Romance", year: "2015", rating: "7.3", duration: "2h 19m" },
        { title: "Dil Dhadakne Do", tag: "Family", year: "2015", rating: "6.7", duration: "2h 50m" },
        { title: "Yeh Jawaani Hai Deewani", tag: "Romance", year: "2013", rating: "7.2", duration: "2h 40m" },
        { title: "Zindagi Na Milegi Dobara", tag: "Drama", year: "2011", rating: "8.2", duration: "2h 35m" },
      ]
    }
  ],
  osr: [
    {
      title: "OSR superhits",
      icon: "Film",
      items: [
        { title: "Prem Geet", tag: "Romance", year: "2016", rating: "8.4", duration: "2h 17m", subtitle: "Pooja Sharma, Pradeep Khadka", desc: "The romance that made OSR Digital a household name — still the jewel of the library." },
        { title: "Prem Geet 2", tag: "Romance", year: "2018", rating: "8.0", duration: "2h 20m", subtitle: "Pradeep Khadka, Aaslesha Thakuri" },
        { title: "Prem Geet 3", tag: "Romance", year: "2022", rating: "7.6", duration: "2h 22m", subtitle: "Pradeep Khadka, Chencho Dorjee" },
        { title: "Prasad", tag: "Drama", year: "2018", rating: "8.2", duration: "2h 15m", subtitle: "Bipin Karki, Namrata Shrestha" },
        { title: "Prasad 2", tag: "Drama", year: "2026", rating: "8.1", duration: "2h 10m", subtitle: "Bipin Karki, Keki Adhikari, Arpan Thapa" },
        { title: "Jhingedaau", tag: "Comedy", year: "2026", rating: "7.8", duration: "2h 05m", subtitle: "Keki Adhikari, Aanchal Sharma" },
        { title: "Behuli from Meghauli", tag: "Drama", year: "2025", rating: "8.0", duration: "2h 12m", subtitle: "Swastima Khadka, Nischal Basnet" },
      ]
    },
    {
      title: "New on OSR Movies",
      icon: "Star",
      items: [
        { title: "Gobar Ganesh", tag: "Coming soon", year: "2026", duration: "Trailer", subtitle: "Barsha Siwakoti" },
        { title: "Pahad", tag: "Drama", year: "2026", rating: "7.9", duration: "2h 08m" },
        { title: "Prasad 2", tag: "Drama", year: "2026", rating: "8.1", duration: "2h 10m" },
        { title: "Jhingedaau", tag: "Comedy", year: "2026", rating: "7.8", duration: "2h 05m" },
        { title: "Bar & Badhu", tag: "Drama", year: "2024", rating: "7.5", duration: "Feature" },
        { title: "The Break Up", tag: "Romance", year: "2019", rating: "7.1", duration: "2h 05m" },
      ]
    },
    {
      title: "OSR Movies library",
      icon: "Clapperboard",
      items: [
        { title: "Captain", tag: "Action", year: "2019", rating: "7.4", duration: "2h 08m" },
        { title: "The Break Up", tag: "Romance", year: "2019", rating: "7.1", duration: "2h 05m" },
        { title: "Sushree Sampati", tag: "Drama", year: "2018", rating: "7.3", duration: "2h 12m" },
        { title: "Homework", tag: "Drama", year: "2016", rating: "7.0", duration: "1h 58m" },
        { title: "Pahad", tag: "Drama", year: "2026", rating: "7.9", duration: "2h 08m" },
        { title: "Prasad", tag: "Drama", year: "2018", rating: "8.2", duration: "2h 15m" },
        { title: "Prem Geet 3", tag: "Romance", year: "2022", rating: "7.6", duration: "2h 22m" },
        { title: "Behuli from Meghauli", tag: "Drama", year: "2025", rating: "8.0", duration: "2h 12m" },
      ]
    },
    {
      title: "Romance on OSR",
      icon: "Heart",
      items: [
        { title: "Prem Geet", tag: "Romance", year: "2016", rating: "8.4", duration: "2h 17m" },
        { title: "Prem Geet 2", tag: "Romance", year: "2018", rating: "8.0", duration: "2h 20m" },
        { title: "Prem Geet 3", tag: "Romance", year: "2022", rating: "7.6", duration: "2h 22m" },
        { title: "The Break Up", tag: "Romance", year: "2019", rating: "7.1", duration: "2h 05m" },
        { title: "Sushree Sampati", tag: "Drama", year: "2018", rating: "7.3", duration: "2h 12m" },
        { title: "Behuli from Meghauli", tag: "Drama", year: "2025", rating: "8.0", duration: "2h 12m" },
      ]
    },
    {
      title: "OSR serials",
      icon: "Tv",
      items: [
        { title: "Buhari", tag: "Serial", year: "2026", rating: "8.6", duration: "290+ Eps", subtitle: "कथा चेलीको", desc: "OSR Digital's flagship sentimental serial — hundreds of episodes, millions of weekly views." },
        { title: "Juthe", tag: "Serial", year: "2026", rating: "8.1", duration: "S2", subtitle: "Marichman Shrestha, Rabi Giri" },
        { title: "Katha Cheliko", tag: "Serial", year: "2025", rating: "7.8", duration: "Eps" },
        { title: "OSR Reality", tag: "Reality", year: "2025", rating: "7.6", duration: "Eps" },
      ]
    },
    {
      title: "OSR Reality & music",
      icon: "Radio",
      items: [
        { title: "Timi Sanga", tag: "Music", year: "2024", duration: "5 min", subtitle: "Aanchal Sharma, Bibek Karmacharya" },
        { title: "New Nepali Songs", tag: "Music", year: "2026", duration: "Playlist" },
        { title: "OSR Movies Cuts", tag: "Highlights", year: "2026", duration: "8 min" },
        { title: "OSR Reality", tag: "Reality", year: "2025", rating: "7.6", duration: "Eps" },
        { title: "Jhumki Haraye", tag: "Music", year: "2018", duration: "5 min", subtitle: "Sushree Sampati" },
      ]
    }
  ]
};

const HERO_HOME = "/Backgrounds/dgo-home-hero.jpg";
const HERO_HOTSTAR = "/Backgrounds/hotstar-hero.jpg";
const HERO_OSR = "/Backgrounds/osr-hero.jpg";

const HERO_SLIDES: Record<string, any[]> = {
  home: [
    {
      title: "Prem Geet",
      tag: "OSR Digital",
      subtitle: "The film that defined Nepali YouTube",
      desc: "Pooja Sharma and Pradeep Khadka — the crown jewel of the OSR Digital library, now in your DGO plan.",
      year: "2016",
      rating: "8.4",
      duration: "2h 17m",
      img: HERO_OSR,
    },
    {
      title: "Special Ops",
      tag: "JioHotstar",
      subtitle: "Kay Kay Menon · Hotstar Specials",
      desc: "The flagship thriller from JioHotstar — shows and movies, included with Mobile and Plus.",
      year: "2020",
      rating: "8.6",
      duration: "Eps",
      img: HERO_HOTSTAR,
    },
    {
      title: "Buhari",
      tag: "OSR Serial",
      subtitle: "कथा चेलीको · 290+ episodes",
      desc: "Nepal's most-watched sentimental serial. New episodes drop on OSR Digital.",
      year: "2026",
      rating: "8.6",
      duration: "Eps",
      img: HERO_HOME,
    },
  ],
  hotstar: [
    {
      title: "Special Ops",
      tag: "Hotstar Specials",
      subtitle: "Kay Kay Menon",
      desc: "A wounded agency and a vanishing asset — the flagship JioHotstar thriller, ad-free on DGO.",
      year: "2020",
      rating: "8.6",
      duration: "Eps",
      img: HERO_HOTSTAR,
    },
    {
      title: "The Family Man",
      tag: "Binge now",
      subtitle: "Manoj Bajpayee",
      desc: "Middle-class spy, nation-sized stakes. The show people finish in a weekend — on JioHotstar via DGO.",
      year: "2021",
      rating: "8.7",
      duration: "Eps",
      img: HERO_HOTSTAR,
    },
    {
      title: "12th Fail",
      tag: "Movies",
      subtitle: "Vidhu Vinod Chopra",
      desc: "The crowd-pleaser that travelled the JioHotstar movie hub. Watch in 1080p on Plus.",
      year: "2023",
      rating: "8.8",
      duration: "2h 27m",
      img: HERO_HOTSTAR,
    },
  ],
  osr: [
    {
      title: "Prem Geet",
      tag: "OSR Digital",
      subtitle: "Pooja Sharma · Pradeep Khadka",
      desc: "The most-viewed Nepali film on YouTube. Distributed by OSR Digital Entertaining the Nation.",
      year: "2016",
      rating: "8.4",
      duration: "2h 17m",
      img: HERO_OSR,
    },
    {
      title: "Prasad 2",
      tag: "New on OSR Movies",
      subtitle: "Bipin Karki · Keki Adhikari · Arpan Thapa",
      desc: "The 2026 follow-up audiences queued for on OSR Movies — full film, now in the DGO OSR hub.",
      year: "2026",
      rating: "8.1",
      duration: "2h 10m",
      img: HERO_OSR,
    },
    {
      title: "Buhari",
      tag: "OSR Serial",
      subtitle: "कथा चेलीको",
      desc: "OSR Digital's flagship serial. Hundreds of episodes, millions of weekly views from Dillibazar to the diaspora.",
      year: "2026",
      rating: "8.6",
      duration: "290+ Eps",
      img: HERO_OSR,
    },
  ],
};

const PARTNER_SECTIONS = new Set([
  "Hotstar Specials",
  "Binge now",
  "Movies on JioHotstar",
  "Star originals",
  "OSR superhits",
  "New on OSR Movies",
  "OSR Movies library",
  "Romance on OSR",
  "OSR serials",
  "OSR Reality & music",
  "From OSR Digital",
  "JioHotstar on DGO",
  "Movies tonight",
]);

const BLOCKED_LABEL =
  /fifa|world\s*cup|wc\s*26|wc26|season\s*pass|semi-?final|quarter-?final|round of 16|group [a-h]\b|hat-trick|hand of god|conmebol|concacaf|lift the trophy|match centre|ncell csr|\bnpl\b|nepal premier league|janakpur bolts|biratnagar kings|chitwan rhinos|karnali yaks|pokhara avengers|kathmandu gurkhas/i;

export function isFifaLabeled(value: unknown): boolean {
  if (!value || typeof value !== "string") return false;
  return BLOCKED_LABEL.test(value);
}

function dropBlockedItems(items: ContentItem[]): ContentItem[] {
  return items.filter(
    (item) =>
      !isFifaLabeled(item.title) &&
      !isFifaLabeled(item.subtitle) &&
      !isFifaLabeled(item.tag) &&
      !isFifaLabeled(item.desc)
  );
}

function dropFifaSections(sections: any[]): any[] {
  return sections
    .filter((section) => !isFifaLabeled(section?.title) && !/npl/i.test(section?.title || ""))
    .map((section) => ({
      ...section,
      items: dropBlockedItems(section.items || []),
    }))
    .filter((section) => (section.items || []).length > 0);
}

/** Public default when no CMS video */
export const DEMO_FALLBACK_VIDEO = "/DGO Splash v4.mp4";

/** Stable demo trailer slug for /watch */
export const DEMO_TRAILER_CONTENT_ID = "dgo-demo-trailer";

const partnerAccentForSection = (sectionTitle: string) => {
  const key = sectionTitle.toLowerCase();
  if (key.includes("osr")) return "#E10600";
  if (key.includes("hotstar") || key.includes("binge") || key.includes("star original")) return "#0B5FFF";
  return "#8a3ffc";
};

const mapHardcodedToContentItem = (data: any, sectionTitle: string): ContentItem => ({
  id: data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ""),
  title: data.title,
  subtitle: data.subtitle || data.tag,
  desc: data.desc || `Watch ${data.title} on DGO.`,
  tag: data.tag,
  accent: PARTNER_SECTIONS.has(sectionTitle) || sectionTitle.endsWith("-hero")
    ? partnerAccentForSection(sectionTitle)
    : sectionTitle === "Live & highlights" ? "#1d4ed8"
    : "#8a3ffc",
  img: typeof data.img === "string" ? data.img : "",
  heroImg: typeof data.img === "string" ? data.img : undefined,
  type: /^(live|cricket|football|kabaddi)$/i.test(data.tag || "") ? "sports" : "movie",
  year: data.year,
  rating: data.rating,
  duration: data.duration,
  isPPV: false
});

/** Landing-page hardcoded rows (no Sanity doc) — used so /watch/[slug] can still play */
function resolveHardcodedContentById(id: string): ContentItem | null {
  if (id === DEMO_TRAILER_CONTENT_ID) {
    return {
      id: DEMO_TRAILER_CONTENT_ID,
      title: "DGO — Featured Trailer",
      subtitle: "Featured",
      desc: "Featured trailer on DGO.",
      tag: "Featured",
      accent: "#8a3ffc",
      img: "/dgo-logo-new.png",
      type: "movie",
      year: "2026",
      duration: "2 min",
      video: DEMO_FALLBACK_VIDEO,
      isPPV: false,
    };
  }
  for (const sections of Object.values(HARDCODED_SECTIONS)) {
    for (const section of sections) {
      const sectionTitle = section.title as string;
      for (const item of section.items) {
        const mapped = mapHardcodedToContentItem(item, sectionTitle);
        if (mapped.id === id) {
          return {
            ...mapped,
            video: DEMO_FALLBACK_VIDEO,
          };
        }
      }
    }
  }
  return null;
}

export async function getLandingPageSections(tab: string): Promise<any[]> {
  const fromHardcoded = () => {
    if (!HARDCODED_SECTIONS[tab]) return [];
    return dropFifaSections(
      HARDCODED_SECTIONS[tab].map((section) => ({
        title: section.title,
        items: section.items.map((item: any) => mapHardcodedToContentItem(item, section.title)),
        icon: section.icon || "Star",
      }))
    );
  };

  if (tab === "home" || tab === "hotstar" || tab === "osr") {
    const local = fromHardcoded();
    if (local.length > 0) return local;
  }

  try {
    let sanitySections: any[] = [];

    // 1. Try Sanity
    // Fetch vertical settings which define the sections
    const settingsQuery = `*[_type == "verticalSettings" && tabId == $tab][0] {
      sections[] {
        title,
        icon,
        queryRowName,
        fomoType,
        "items": *[_type in ["movie", "series", "sports", "special"] && targetTab == ^.^.tabId && rowName == ^.queryRowName] | order(_updatedAt desc) {
          ...,
          "slug": slug.current
        }
      }
    }`;
    const settingsData = await client.fetch(settingsQuery, { tab });

    if (settingsData?.sections && settingsData.sections.length > 0) {
      sanitySections = settingsData.sections.map((section: any) => ({
        title: section.title,
        icon: section.icon,
        fomo: section.fomoType,
        items: section.items?.map(mapSanityToContentItem) || []
      }));
    } else {
      // Fallback: Legacy sectionStack documents
      const stackQuery = `*[_type == "sectionStack" && vertical == $tab] | order(_createdAt asc){
        title,
        icon,
        fomoType,
        items[]->{ ..., "slug": slug.current }
      }`;
      const stackData = await client.fetch(stackQuery, { tab });

      if (stackData && stackData.length > 0) {
        sanitySections = stackData.map((section: any) => ({
          title: section.title,
          icon: section.icon,
          fomo: section.fomoType,
          items: section.items?.map(mapSanityToContentItem) || []
        }));
      }
    }

    // Final Fallback: Group by rowName for the current tab (only if no sections defined yet)
    if (sanitySections.length === 0) {
      const autoQuery = `*[_type in ["movie", "series", "sports", "special"] && targetTab == $tab && defined(rowName)] {
        rowName,
        ...
      } | order(_createdAt desc)`;
      const autoData = await client.fetch(autoQuery, { tab });

      if (autoData && autoData.length > 0) {
        const grouped = autoData.reduce((acc: any, item: any) => {
          const row = item.rowName || "More Content";
          if (!acc[row]) acc[row] = [];
          acc[row].push(mapSanityToContentItem(item));
          return acc;
        }, {});

        sanitySections = Object.keys(grouped).map(row => ({
          title: row,
          items: grouped[row]
        }));
      }
    }

    // Mix in Hardcoded data
    // 1. Start with any Sanity sections that match titles in Hardcoded list
    // 2. Append any Sanity sections that are NOT in Hardcoded list
    // 3. Append any Hardcoded sections that were NOT in Sanity list

    if (HARDCODED_SECTIONS[tab]) {
      const hardcodedList = HARDCODED_SECTIONS[tab];
      let finalSections: any[] = [];

      // Map of sanity sections by title for easy lookup
      const sanityMap = new Map(sanitySections.map(s => [s.title, s]));

      // Iterate through expected hardcoded sections (ensures order)
      hardcodedList.forEach(hSection => {
        const sanitySection = sanityMap.get(hSection.title);

        if (sanitySection) {
          // MERGE: Sanity items + Hardcoded items
          // Filter hardcoded items that might duplicate Sanity items (by title)
          const sanityTitles = new Set(sanitySection.items.map((i: any) => i.title));
          const uniqueHardcodedItems = hSection.items.filter((i: any) => !sanityTitles.has(i.title));

          finalSections.push({
            ...sanitySection,
            items: [...sanitySection.items, ...uniqueHardcodedItems.map((item: any) => mapHardcodedToContentItem(item, hSection.title))]
          });

          // Remove from map so we know it's handled
          sanityMap.delete(hSection.title);
        } else {
          // ADD MISSING: Add pure hardcoded section
          finalSections.push({
            title: hSection.title,
            items: hSection.items.map((item: any) => mapHardcodedToContentItem(item, hSection.title)),
            icon: hSection.icon || 'Star'
          });
        }
      });

      // Append any remaining Sanity sections (that weren't in hardcoded list)
      sanityMap.forEach((section) => {
        finalSections.push(section);
      });

      return dropFifaSections(finalSections);
    }

    return dropFifaSections(sanitySections);
  } catch (e) {
    console.error("Sanity fetch error:", e);
    // On error, return hardcoded if available
    if (HARDCODED_SECTIONS[tab]) {
      return HARDCODED_SECTIONS[tab].map(section => ({
        title: section.title,
        items: section.items.map((item: any) => mapHardcodedToContentItem(item, section.title)),
        icon: section.icon || 'Star'
      }));
    }
    return [];
  }
}

