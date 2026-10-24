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

## Results (after)
| | before | after |
|---|---|---|
| Lighthouse mobile, homepage: performance | 50 | **94–95** (98–99 under `vite preview`) |
| accessibility | 95 | **100** |
| best practices | 96 | **100** |
| seo | 91 | **100** |
| LCP / FCP | 4.6 s / 4.3 s | 2.6 s / 1.5 s |
| CLS | 0.335 | 0.065 |
| TBT | 170 ms | 20–90 ms |
| static pages (`/about`, `/skills`, `/how-its-built`, `/projects/*`): all four | n/a (did not exist) | **100 / 100 / 100 / 100** |
| raw html a crawler sees at `/` | empty `<div id="root">` | title, meta, JSON-LD graph, h1, intro and 8 text sections |

Verification: `node scripts/seo-verify.mjs [base-url]` runs 785 checks (title/description lengths and uniqueness, canonical, robots meta, OG/Twitter tags and image files, one h1 per page, img alt + dimensions, JSON-LD parse + required fields per type, visible FAQ == schema word for word, internal links resolve, 300+ words per project page, 400+ on /about, robots.txt bots, sitemap urls, llms files, manifest icons). It passes against `dist/` and over HTTP against a static server.

## Things tried and rolled back
- Lazy-loading lenis + scrolltrigger after first paint: homepage score went *down* a point or two (the work just moved into the measurement window) and it broke the "crash → reboot" flow. Reverted.
- Manual vendor chunks for react / three: put react's runtime inside the 3d chunk, so the entry downloaded ~1 MB of three.js. Removed; the bundler's own splitting along lazy imports is correct.

## Judgment calls (also in SEO_TODO.md)
Kattankulathur spelling · NeuroVibe "rover" vs "wheelchair" · 58-char home title · AgentHub vs Agent Marketplace · no DGTL mention · SplitFair links to a GitHub search · `vite preview` can't serve the static pages (it falls back to the SPA), so verification uses a static file server.

## Round 2 (corrections + content pages)
- Hero H1, perf target (85+; home measures 93–95), TODOs only in HTML comments, rishit.site untouched: already how the build works; `seo-verify` now fails if `TODO` appears outside a comment.
- The text blocks under the app are now `rishit_os` windows (`about.md`, `skills.json`, `projects.log`, `wins.txt`, `research.md`, `experience.log`, `faq.txt`, `contact.sh`) with a lowercase line after the plain facts. Visible FAQ still equals the JSON-LD word for word (13 entries).
- Facts: campus is "SRM Institute of Science and Technology, Kattankulathur" everywhere; availability string is one constant (`AVAIL`); JSON-LD and llms.txt say "9,000+ contributions in 2026" (static), the live count stays on the page only.
- New pages: `/how-its-built` (1,700+ words, Article + HowTo, 6 real screenshots from `scripts/built-shots.mjs`) and `/portfolio-design-tips` (10 tips, Article + FAQPage). Both prerendered, in the sitemap and llms.txt, own OG image, link to home and projects.
- Project pages are never padded: the 300-word target is now a note, not a failure (all nine are still 300+).
- Home measured: perf 93, a11y/bp/seo 100. New pages 100 ×4. `seo-verify`: 956 checks.

## Round 3
Old site removed (301 to dev.rishit.site), "100+ public" → "100+ repositories" with a checker guard, text windows moved into a closed `<details id="text-version">` at the page end plus a `readme` terminal command, NeuroVibe rewritten as the current rover. `seo-verify`: 1,024 checks. Home Lighthouse mobile: 93 / 100 / 100 / 100.
