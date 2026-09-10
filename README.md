# DGO Prototype

A high-fidelity, clickable prototype of the DGO streaming platform, built with Next.js 15 and Sanity CMS. This is a **demo-only build** — no real authentication, payments, or live rights checks are wired up. It is designed for stakeholder walkthroughs, ad-sales demonstrations, and UX validation.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| CMS | Sanity v3 (hosted Studio at `/studio`) |
| Icons | Lucide React |
| QR codes | react-qr-code |
| DOM-to-image export | html-to-image |
| Translation API | Google Translate (optional) / MyMemory (free fallback) |
| Language | TypeScript |

---

## Project structure

```
src/
├── app/
│   ├── page.tsx                  # Home — tabs, hero, content rows, ad slots
│   ├── details/[id]/             # Title detail page
│   ├── watch/[id]/               # Player / watch experience
│   ├── join/                     # Subscription & PVOD checkout
│   ├── admin/                    # Internal admin dashboard
│   │   ├── content/              # CMS content browser
│   │   ├── settings/             # Ad settings manager
│   │   ├── live/                 # Live stream management
│   │   └── login/                # Admin auth
│   ├── api/
│   │   ├── translate/            # Translation proxy endpoint
│   │   └── admin/                # Admin API routes
│   └── studio/[[...tool]]/       # Embedded Sanity Studio
│
├── components/
│   ├── Navigation.tsx            # Desktop top nav + account dropdown
│   ├── MobileBottomNav.tsx       # Mobile bottom bar + sheet panels
│   ├── AccountMenuPanel.tsx      # Account/more menu (shared desktop + mobile)
│   ├── Hero.tsx                  # Default hero carousel
│   ├── HomeSubscribeDrive.tsx    # Home subscribe / active-plan strip
│   ├── SponsorSpot.tsx           # Reusable sponsor/ad strip component
│   ├── ProfileMenuPromoBanner.tsx# Account menu display-ad slot
│   ├── CountryFlag.tsx           # Country flag via flagcdn.com
│   ├── DetailModal.tsx           # Title detail modal overlay
│   ├── LanguageSwitcher.tsx      # EN / NP switcher
│   ├── Translate.tsx             # useTranslated hook + <T> component
│   ├── Splash.tsx                # First-visit splash screen
│   ├── JuniorSplash.tsx          # Junior tab entry screen
│   ├── ScrollGradient.tsx        # Gradient scroll helper
│   ├── AppProviders.tsx          # Context providers wrapper
│   └── UserAchievementBadges.tsx # Gamification badge UI
│
├── contexts/
│   └── TranslationContext.tsx    # App-wide translation state + cache
│
├── hooks/
│   └── useSubscriptionSession.ts # Active plan session hook
│
├── i18n/
│   └── siteWidePhrases.ts        # All English source strings for translation
│
├── utils/
│   ├── content.ts                # Sanity fetch helpers + ad settings
│   ├── paywall.ts                # Session-storage paywall flags + helpers
│   ├── subscriptionCatalog.ts    # Mobile / Plus SKUs and pricing
│   └── cn.ts                     # Tailwind class merge utility
│
└── sanity/
    ├── lib/                      # Sanity client, image URL helpers
    └── schemaTypes/              # CMS schema definitions
        ├── content.ts
        ├── movie.ts
        ├── series.ts
        ├── sports.ts
        ├── special.ts
        ├── liveChannel.ts
        ├── heroCarousel.ts
        ├── sectionStack.ts
        ├── verticalSettings.ts
        └── adSettings.ts
```

---

## Getting started

**Step-by-step checklist (clone → env → run → smoke test):** see [`LOCAL_SETUP_CHECKLIST.md`](./LOCAL_SETUP_CHECKLIST.md).

### Prerequisites

- Node.js 20 or later
- A Sanity project (free tier is enough for prototype use)

### 1. Clone and install

```bash
git clone https://github.com/Wingsuiter101/Dgo-prototype.git
cd Dgo-prototype
npm install
```

### 2. Set environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

```env
# Required — Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production

# Optional — enables admin write operations
SANITY_API_WRITE_TOKEN=your_write_token

# Optional — custom admin password (defaults to open in dev)
ADMIN_PASSWORD=your_password

# Optional — use Google Translate instead of MyMemory free tier
GOOGLE_TRANSLATE_API_KEY=your_google_key
```

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The **Sanity Studio** is embedded at [http://localhost:3000/studio](http://localhost:3000/studio).

---

## Home tabs

The home page is organised into vertical tabs. The active tab drives the hero, content rows, and which ad slots are visible.

| Tab | What it shows |
|-----|--------------|
| **Home** | Default hero, partner rails, subscribe drive |
| **JioHotstar / OSR** | Partner rails |
| **Sports** | Sports-focused content rows, standard hero carousel |
| **Entertainment** | General movies & series, standard hero carousel |
| **Specials** | PVOD (one-off purchase) titles |
| **Junior** | Kids content with dedicated splash screen |

---

## Key user flows

### Browsing
Open the home page → switch tabs → scroll content rows → tap a poster to open the **detail page** → tap **Watch** to go to the **player**.

### Joining / subscribing (`/join`)
The join flow offers **Mobile** and **Plus** plans (1 / 3 / 12 months), with Nepal wallets or Stripe for rest-of-world. Completing the flow sets a **session flag** so paywalled sections behave as unlocked. Nothing is charged.

### Watching (`/watch/[id]`)
The player page shows the video player with pre-roll ad slots, an in-stream overlay ad, and a sponsor watermark — all driven by Sanity ad settings.

### Detail page (`/details/[id]`)
Shows metadata, cast, season/episode lists for series, and a watch CTA.

---

## Demo state and resetting

All "you're subscribed" and "you have the pass" states are stored in **sessionStorage** for the current browser tab. They are not persisted across tabs or sessions.

| Flag | Set by | Cleared by |
|------|--------|-----------|
| Subscription unlock | Completing `/join` | Sign out |
| PVOD unlock | Completing `/join` (specials) | Sign out |
| Splash shown | First home visit | Closing tab / clearing site data |
| Language choice | Language switcher | Clearing site data |
| Translation cache | Any translated page | Closing tab / clearing site data |

**Sign out** (account/more menu → Sign out) is the main demo reset. It clears subscription and PVOD flags so the next walkthrough starts clean. It does **not** clear language or splash state — close the tab or clear site data for a full reset.

---

## Ad slots

| Slot | Location | Format |
|------|----------|--------|
| In-feed sponsored card | Home content row | Poster-style card injected in carousel |
| Footer banner | Home — bottom of all tabs | 4:1 image (Sanity `footerBannerAd`) |
| Background takeover | Home — full-page background | Sanity `homeBackgroundAd` |
| Account menu banner | Account / More menu | 16:5 wide JPEG slot |
| In-player overlay | Watch page — during playback | Image strip (Sanity `inStreamAd`) |
| In-player sponsor mark | Watch page — corner watermark | Small logo (Sanity `sponsorLogo`) |

All Sanity-driven slots are managed in **Ad Settings** at `/admin/settings` or directly in the Studio.

---

## CMS content types (Sanity)

| Type | Purpose |
|------|---------|
| `content` | Generic content item |
| `movie` | Film with metadata |
| `series` | TV series with seasons/episodes |
| `sports` | Sports event or programme |
| `special` | PVOD / premium special |
| `liveChannel` | Live channel / stream |
| `heroCarousel` | Home hero carousel slides |
| `sectionStack` | Tab-level content row configuration |
| `verticalSettings` | Per-tab feature flags and overrides |
| `adSettings` | All ad/sponsor slot images and videos |

Access the Studio at `/studio` (requires Sanity project credentials).

---

## Admin panel (`/admin`)

A lightweight internal dashboard for managing content and ad settings without going into the full Studio.

| Section | Path | Purpose |
|---------|------|---------|
| Dashboard | `/admin` | Document counts overview |
| Content | `/admin/content` | Browse and filter all CMS documents |
| Ad Settings | `/admin/settings` | Upload and configure ad/sponsor assets |
| Live | `/admin/live` | Live stream management |

Access requires the `ADMIN_PASSWORD` environment variable (or is open in development if not set).

---

## Localisation

The app supports **English** and **Nepali (NP)**. Switch language from the language switcher in the navigation.

- All UI strings are wrapped with `useTranslated()` or `<T>` and listed in `src/i18n/siteWidePhrases.ts`.
- Translations are fetched via the `/api/translate` proxy — **Google Translate** if `GOOGLE_TRANSLATE_API_KEY` is set, otherwise the free **MyMemory** API.
- Translated strings are cached in `sessionStorage` (key `dgo_translate_cache_v1`) for the session to avoid repeat API calls.

---

## Public assets

Place images and videos used by the prototype in the `/public` folder. Key files referenced in code:

| File | Used by |
|------|---------|
| `/Backgrounds/dgo-home-hero.jpg` | Home hero |
| `/khalti-by-ime.png` | Khalti payment icon |
| `/esewa-icon-large.webp` | eSewa payment icon |
| `/connectips.png` | ConnectIPS payment icon |
| `/fonepay.webp` | Fonepay payment icon |

---

## Available scripts

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Run production build locally
npm run lint     # Run ESLint
```

---

## Demo walkthrough order (recommended)

1. **Start fresh** — sign out if anything was previously unlocked, or open a new tab.
2. **Home** — hero, partner rails, subscribe drive.
3. **`/join`** — pick Mobile or Plus, Nepal wallets or Stripe, confirm.
4. **Account menu** — active plan, add time (Nepal) or manage/cancel (Stripe).
5. Optionally show the **admin/settings** screen to explain how ad slots are managed.

---

## Notes

- This is a **prototype** — no real authentication, billing, or content licensing is in place.
- Checkout flows are visual only; all payment fields are decorative.
- Country flags in the language switcher are served via `flagcdn.com` (CDN, no account needed).
