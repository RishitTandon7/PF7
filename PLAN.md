# SEO / AEO plan

## Audit (before)
- **Stack:** Vite 8 + React 19 single-page app, client-rendered. Host: Vercel (`vercel.json`). Head lives in `/index.html`.
- **Problem #1:** raw HTML is `<div id="root"></div>`. Title was `rishit tandon — rishit_os`. No canonical, OG, JSON-LD, robots.txt, sitemap, manifest. Crawlers and AI bots that don't run JS see nothing.
- **Lighthouse mobile baseline:** performance 50 · accessibility 95 · best-practices 96 · seo 91. LCP 4.6 s, FCP 4.3 s, CLS 0.335, TBT 170 ms. SEO fail: robots.txt. A11y fail: colour contrast. BP fails: console error (github api rate limit), missing source maps.

## Decisions (lowest risk first)
1. **No framework migration.** Instead a post-build script (`scripts/seo-build.mjs`) prerenders HTML with plain Node (no browser needed on Vercel). Homepage = the built Vite `index.html` + head, JSON-LD, a crawlable fallback in `#root`, and visible text sections after the app. Every other page (`/about`, `/skills`, `/how-its-built`, `/projects/<slug>`, `404`) is generated static HTML with a tiny stylesheet, no JS needed.
2. **One data file** (`seo/data.mjs`) feeds pages, JSON-LD, sitemap, llms.txt, OG images, so nothing can drift.
3. **Hero h1:** the visual headline becomes a `<p>`; the small line above it becomes the single `<h1>` ("Rishit Tandon — AI/ML Engineer & Full-Stack Developer"). Look is unchanged.
4. **OG images + favicons** are generated locally with Chrome (`scripts/og.mjs`) and committed to `public/`, because Vercel's build has no browser.
5. **Performance:** the 3D robot (react-three-fiber, ~1 MB) is lazy-loaded after first paint; Google Fonts load non-blocking; GitHub snapshot JSON is split out of the entry chunk; source maps on.
6. **Spelling:** facts say "Kattankulatham"; the correct spelling is **Kattankulathur** (used everywhere). Flagged in the final report.
7. **Facts discipline:** only facts from the brief and what's already on the site. Gaps are `TODO(rishit)` in HTML comments (not visible text) and listed in `SEO_TODO.md`.

## Risks
- Vercel serves `/projects/arclyth` from `projects/arclyth/index.html`; verified locally, confirm after deploy.
- `/os/` (old site) keeps its trailing-slash redirect; no `trailingSlash` setting is used because the old site uses relative asset paths.
- `rishit.site` is a separate hub project: duplicates can't be redirected from this repo, so canonicals point here.

## Phases (one commit each)
audit → meta → structured data → static files → pages/content → performance → technical SEO → verification
