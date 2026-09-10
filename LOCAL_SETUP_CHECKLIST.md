# Local setup checklist — DGO prototype

Use this when cloning the repo on a new machine or onboarding another team. Work top to bottom; most failures are fixed by **Node version**, **`.env.local`**, and **Sanity project ID + dataset**.

---

## 1. Machine prerequisites

- [ ] **Node.js 20+** installed (`node -v` shows v20.x or higher).
- [ ] **npm** available (`npm -v`; comes with Node).
- [ ] **Git** installed (`git --version`).
- [ ] Stable internet (first `npm install` and Sanity fetches need network).

---

## 2. Get the code

- [ ] Clone the repository (HTTPS or SSH — whichever your org allows).
- [ ] `cd` into the project root (folder that contains `package.json`).

---

## 3. Install dependencies

- [ ] From project root, run: `npm install`
- [ ] Command finishes with **no** `ERESOLVE` / hard errors. (Warnings like `EBADENGINE` may appear on some Node minors; try Node 20 LTS if install fails.)

---

## 4. Environment file (critical)

- [ ]  From the template: **`cp .env.example create .env.local`** 
- [ ] File **`.env.local`** exists in the **project root** (same level as `package.json`).  
  **Note:** `.env.local` is gitignored — it is **not** in the repo; every developer must create it.

### 4a. Required for app + CMS to work

NEXT_PUBLIC_SANITY_PROJECT_ID=xt7epabe
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-02-05
SANITY_API_WRITE_TOKEN=sk4KGJIvJH3nmL52uAxnplrfz8ekOTX3utj8xhM1Q15u7O7ZLD6AixQbsu4DzMzjnuj7IT3DBmo4YLmUgTbVWiLEpliUBSaBTf7S8vW6aaNpBhIa5mzfKBqyCgksyODunDruXyTdzYL17XnAlkFP7PodYUlSBwJe1IdqpbxJagJRzlgjmT7I


- [ ] Save `.env.local` and **restart** `npm run dev` after any change (Next.js reads env at startup).



## 6. Verify install (optional but recommended)

- [ ] `npx tsc --noEmit` completes with exit code 0 (catches type errors without a full build).
- [ ] Or run `npm run build` — confirms production build; may take a few minutes.

---

## 7. Run the dev server

- [ ] From project root: `npm run dev`
- [ ] Terminal shows **“Ready”** and a URL (default `http://localhost:3000` CORS Origin is only enabled for this URL).
- [ ] Open **http://localhost:3000** — home loads without a white-screen crash.
- [ ] Open **http://localhost:3000/studio** — Sanity Studio loads (may prompt login to Sanity if required by your org).

---

## 8. Quick smoke test (5 minutes)

- [ ] Home: tabs visible (Home, JioHotstar, OSR, Sports, Entertainment, etc.).
- [ ] Switch at least two tabs — content or layout changes (empty rows may mean CMS has no content yet; that is OK).
- [ ] Open **More** / account menu (mobile) or **user** menu (desktop) — menu opens.
- [ ] Visit **`/join`** — plan picker and checkout render.

---

## 9. Assets and public files

- [ ] Repo includes **`public/`** with images referenced by the app (hero, checkout banners, icons, etc.). If `public` was incomplete (e.g. bad zip), restore from git or re-clone.
- [ ] If your organisation wraps this repo with **Git LFS** for large binaries, run **`git lfs pull`** after clone (vanilla clone from GitHub usually does not need this).

---

## 10. Common problems (quick fixes)

| Symptom | Likely cause | What to do |
|--------|----------------|------------|
| Blank home / no rows | No CMS content or wrong Sanity project | Check 4a; add content in Studio or use the correct project. |
| Studio or build complains about **project / config / metadata** | Missing `NEXT_PUBLIC_SANITY_*` | Fill `.env.local`, restart dev server. |
| `npm install` fails | Wrong Node / lockfile | Use Node 20 LTS; delete `node_modules` and `package-lock.json` only if your lead approves, then `npm install` again. |
| Port 3000 in use | Another app running | `npx next dev -p 3001` or stop the other process. |
| Translation errors | Network or API limits | Optional: add `GOOGLE_TRANSLATE_API_KEY`; or stay on English. |

---

## 11. Demo reset (for testers, not install)

- [ ] After testing checkout or “unlock” flows, use **Sign out** in the account menu to clear **session** demo flags (subscription / pass).  
- [ ] For a fully clean browser state: clear **site data** for `localhost` or use a private window.

---

## 12. Handoff checklist (for the team lead)

- [ ] Documented **Sanity project ID** (and whether dataset is `production` or other) in a secure internal place — not in git.
- [ ] Confirmed **`.env.example`** is up to date with any new variables.
- [ ] Shared **this checklist** + link to main **README.md** with new developers.

---

**Done when:** sections 1–4 and 7 are satisfied, and the home page loads in the browser.
