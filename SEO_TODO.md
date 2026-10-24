# SEO_TODO.md — what only you can do

Everything below needs your accounts, your decisions, or facts I don't have. Code-side SEO is done (see `PLAN.md`).

## 0. Right after you push / deploy
- [ ] Open https://portfolio.rishit.site/projects/arclyth and https://portfolio.rishit.site/about **without a trailing slash** and confirm they load (I verified locally with a static file server; Vercel should serve `projects/arclyth/index.html` the same way, but I couldn't test Vercel itself).
- [ ] Hard-refresh once, because assets are now cached for a year.
- [ ] `https://portfolio.rishit.site/does-not-exist` should show the custom 404 page.
- [ ] In Vercel → Analytics, make sure Web Analytics is enabled (the script is already on every page, but only loads on `*.rishit.site` / `*.vercel.app`).

## 1. Search Console + Bing (the single most important step)
- [ ] Google Search Console → add property `https://portfolio.rishit.site` (URL-prefix is fine). Choose the **HTML tag** method, copy the `<meta name="google-site-verification" ...>` tag.
- [ ] Paste it into `scripts/seo-build.mjs`, in the `head()` function, replacing the commented placeholder (and the Bing `msvalidate.01` tag the same way), then redeploy and click Verify.
- [ ] Submit `https://portfolio.rishit.site/sitemap.xml` in Search Console and in Bing Webmaster Tools (Bing can import straight from Search Console).
- [ ] **Request Indexing** (URL Inspection → Request indexing) for the homepage and each of these:
  `/`, `/about`, `/skills`, `/how-its-built`, `/projects/arclyth`, `/projects/aisgr-smart-glasses`, `/projects/documind`, `/projects/glof-early-warning`, `/projects/agenthub`, `/projects/linkedout-pro`, `/projects/splitfair`, `/projects/slam-drone`, `/projects/neurovibe-bci`
- [ ] Test structured data at https://search.google.com/test/rich-results and https://validator.schema.org on the homepage and one project page. My checker validates structure and required fields offline, but Google's tools are the real authority.
- [ ] Share-preview check: paste the homepage into https://www.opengraph.xyz (or LinkedIn Post Inspector) to confirm the OG image shows.

## 2. Make "Rishit Tandon" mean one person everywhere
- [ ] Use the exact name **Rishit Tandon** and the same short bio on GitHub, LinkedIn, Devpost, Medium, X, YouTube, Peerlist, Read.cv and Wellfound, each linking to `https://portfolio.rishit.site`. Suggested bio (all facts from your brief):
  > Final-year B.Tech CSE at SRM IST (Chennai, 2027). I build AI agents, autonomous drones, smart glasses and full-stack products. 12+ hackathon wins, 6 firsts. Open to SDE and AI/ML roles from 2027.
- [ ] GitHub profile README and the top 10 repo READMEs: add a link to the portfolio and to the matching project page (e.g. the DocuMind README → `/projects/documind`).
- [ ] Link the portfolio from the `rishit.site` hub, and link the hub back. (A redirect from `rishit.site` isn't possible from this repo, it's a separate Vercel project; canonicals already point here, so they don't compete.)
- [ ] Add a real **headshot** at `public/headshot.webp`, then set it as the `image` of the Person schema in `scripts/seo-build.mjs` (search for `TODO(rishit): swap for a real headshot`). A face photo helps the knowledge panel.

## 3. Backlinks (these win the "good portfolio design" queries)
- [ ] Submit to: Awwwards, CSS Design Awards, Godly, Siteinspire, Dribbble, Behance, Product Hunt, Peerlist, and a r/webdev "Showoff Saturday" post.
- [ ] Use `/how-its-built` as the link target for design galleries (it's written for that audience), and `/` for everything else.
- [ ] Publish 3–5 posts on dev.to / Medium (Arclyth, DocuMind, GLOF, "how I built my portfolio") with backlinks to the matching project pages.
- [ ] Ask SRM, NIDM and the hackathon organisers to list your wins/projects with a link, where they have winner pages.
- [ ] Record a short YouTube demo per major project: keyword-rich title ("Arclyth: 3-drone disaster relief swarm | national hackathon winner"), project page in the description. You already have Drive demos for JARVIS and NeuroVibe.

## 4. Weekly tracking
- [ ] Search Console → Performance: watch impressions/clicks/position for `rishit tandon`, `rishit tandon srm`, `rishit tandon hackathon`, `rishit tandon github`, then `ai ml engineer portfolio`, `drone swarm disaster relief project`, `agentic document intelligence rag`, `glof early warning machine learning`.
- [ ] Ask ChatGPT / Perplexity / Claude / Gemini "who is Rishit Tandon?" once a month and note what they say; fix whatever is wrong in `seo/data.mjs`.

## 5. Facts I could not verify — marked `TODO(rishit)` in the page source (HTML comments, never visible text)
Open each page's source and search `TODO(rishit)`, or edit `seo/data.mjs` (the `todo:` field of each project). Adding these makes the pages stronger and the AI answers more accurate:
- **Arclyth** (/projects/arclyth): which national hackathon, flight controller, drone hardware, comms link, number of people on the team, GitHub repo link, screenshots/photos
- **A.I.S.G.R. Smart Glasses** (/projects/aisgr-smart-glasses): exact hardware (camera module, board, display, battery), which models run on-device vs in the cloud, battery life, what Jarvis can do on the glasses
- **DocuMind** (/projects/documind): OCR engine used, graph database, embedding/LLM models, accuracy or latency numbers, live demo URL, screenshots
- **GLOF Early-Warning Pipeline** (/projects/glof-early-warning): model type, features and datasets, how latency was measured (before/after), the sensors involved, any publication or report link, supervisor names if public
- **AgentHub** (/projects/agenthub): auth and billing approach, how agents are hosted, number of agents listed, screenshots
- **LinkedOut Pro** (/projects/linkedout-pro): which LLM provider, how posting/scheduling works, the number of users, screenshots
- **SplitFair** (/projects/splitfair): exact repo link, live URL, how debts are simplified, database and auth, screenshots
- **Autonomous SLAM Drone** (/projects/slam-drone): SLAM method and sensor (lidar, depth camera, monocular), flight controller and compute board, results on mapping accuracy, repo or video link, photos
- **NeuroVibe BCI Rover** (/projects/neurovibe-bci): EEG headset, classifier and accuracy, command latency, the rover vs wheelchair relationship (the portfolio previously called it a BCI wheelchair), photos
- **About page / Person schema:** one line on what you personally lead at the ISD Lab; a headshot.
- **Skills page:** proficiency levels or years, if you want them shown.
- **Screenshots:** only A.I.S.G.R. and the GLOF page have real images; the other project pages use a generated card. Drop real screenshots into `public/media/` and set `img:` in `seo/data.mjs`.

## 6. Decisions I made that you may want to change
- **"Kattankulathur", not "Kattankulatham".** Your facts spell it "Kattankulatham"; the correct name of the SRM campus town is Kattankulathur, so that's what's used everywhere (typos in a place name hurt search matching).
- **NeuroVibe is a "BCI rover" on the SEO pages, as in your facts**, but the interactive site (hero line, project card, repo name `NeuroVibe-Wheelchair`) still says "wheelchair". Decide which is correct and I'll make the whole site consistent.
- **Home title is 58 characters:** "Rishit Tandon | AI/ML Engineer & Full-Stack Dev Portfolio". "Developer" would push it to 63 and risk truncation in results.
- **"AgentHub" on SEO pages, "Agent Marketplace" on the interactive site.** The SEO page mentions both names.
- **DGTL Innovations internship is not mentioned anywhere**, because the IDE world was removed earlier. Say if you want it back in the Experience list.
- **The `SplitFair` page links to a GitHub search**, not a repo, because I couldn't tell which of your `Splits*` repos it is.
- **Lighthouse scores:** the homepage scores 94–95 mobile performance on a plain static server (98–99 under `vite preview`), the static pages score 100 in all four categories. The WebGL home page can't reach 100 because React alone is ~190 KB, but the 3D (≈900 KB) is now loaded after the first paint.
- The GitHub API is only called after a visitor first interacts (until then the page uses the cached/snapshot numbers), so a rate-limited API can never slow or break the first load.
