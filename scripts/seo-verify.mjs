// verifies the production build the way a crawler sees it: raw html only, no javascript.
// usage: npm run build && node scripts/seo-verify.mjs          (reads dist/)
//        node scripts/seo-verify.mjs http://localhost:4173     (also fetches over http, like curl)
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { SITE, ALL_PAGES, PROJECTS, FAQ, TEMPLATE_REPO, FEATURED } from '../seo/data.mjs'

const DIST = new URL('../dist/', import.meta.url)
const base = process.argv[2]
let fails = 0, checks = 0
const ok = (cond, msg) => { checks++; if (!cond) { fails++; console.log('  FAIL', msg) } }
const fileFor = (path) => (path === '/' ? 'index.html' : path === '/404' ? '404.html' : path.slice(1) + '/index.html')
const read = async (path) => (base ? await (await fetch(base + (path === '/404' ? '/nope-404' : path))).text() : readFileSync(new URL(fileFor(path), DIST), 'utf8'))
const one = (html, re) => (html.match(re) || [])[1]
const text = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/\s+/g, ' ')

// minimal structural schema.org checks (required properties per type)
const REQ = { Person: ['name', 'url'], WebSite: ['url', 'name'], ProfilePage: ['mainEntity'], FAQPage: ['mainEntity'], Question: ['name', 'acceptedAnswer'], Answer: ['text'], ItemList: ['itemListElement'], ListItem: ['position'], BreadcrumbList: ['itemListElement'], CreativeWork: ['name'], SoftwareSourceCode: ['name'], AboutPage: ['name'], WebPage: ['name'], ImageObject: ['url'], CollegeOrUniversity: ['name'], PostalAddress: [], Article: ['headline', 'author', 'datePublished', 'image'], HowTo: ['name', 'step'], HowToStep: ['name', 'text'] }
const typesOf = (o) => [].concat(o['@type'] || [])
function checkNode(o, path, ids) {
  if (!o || typeof o !== 'object') return
  if (Array.isArray(o)) return o.forEach((x, i) => checkNode(x, path + '[' + i + ']', ids))
  for (const t of typesOf(o)) {
    ok(t in REQ, `${path}: unexpected @type ${t}`)
    for (const k of REQ[t] || []) ok(o[k] !== undefined && o[k] !== '' && o[k] !== null, `${path}: ${t} missing "${k}"`)
  }
  // a node with an @id AND a @type is a definition (must be unique within the page); a bare {"@id"} is just a reference to one
  if (o['@id'] && o['@type']) { ok(!ids.has(o['@id']), `${path}: duplicate definition of ${o['@id']}`); ids.add(o['@id']) }
  for (const [k, v] of Object.entries(o)) if (typeof v === 'object') checkNode(v, path + '.' + k, ids)
}

console.log(`verifying ${base ? base : 'dist/'} ...`)
const pages = ALL_PAGES().concat([{ path: '/404', kind: '404', title: '' }])
const seenTitles = new Set(), seenDesc = new Set(), seenCanon = new Set()
for (const pg of pages) {
  const html = await read(pg.path)
  const tag = pg.path.padEnd(32)
  const title = one(html, /<title>([\s\S]*?)<\/title>/), desc = one(html, /<meta name="description" content="([^"]*)"/), canon = one(html, /<link rel="canonical" href="([^"]*)"/)
  console.log(`${tag} title ${(title || '').length}c | desc ${(desc || '').length}c | h1 ${(html.match(/<h1[\s>]/g) || []).length} | json-ld ${(html.match(/application\/ld\+json/g) || []).length} | words ${text(html).split(' ').length}`)
  ok(title && title.length <= 66, `${pg.path}: title missing or too long (${title?.length})`)
  if (pg.kind === '404') { ok(/noindex/.test(html), '404 should be noindex'); continue }
  ok(desc && desc.length >= 120 && desc.length <= 160, `${pg.path}: description length ${desc?.length}`)
  ok(canon === (pg.path === '/' ? SITE : SITE + pg.path), `${pg.path}: canonical ${canon}`)
  ok(!seenTitles.has(title) && !seenDesc.has(desc) && !seenCanon.has(canon), `${pg.path}: title/description/canonical not unique`); seenTitles.add(title); seenDesc.add(desc); seenCanon.add(canon)
  ok(/name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"/.test(html), `${pg.path}: robots meta`)
  ok(/<html lang="en"/.test(html), `${pg.path}: html lang`)
  ok(/property="og:image" content="https:\/\/portfolio\.rishit\.site\/og\/[a-z-]+\.png"/.test(html) && /name="twitter:card" content="summary_large_image"/.test(html), `${pg.path}: og/twitter tags`)
  const og = one(html, /property="og:image" content="[^"]*(\/og\/[^"]+)"/); ok(og && existsSync(new URL(og.slice(1), DIST)), `${pg.path}: og image file missing ${og}`)
  ok((html.match(/<h1[\s>]/g) || []).length === 1, `${pg.path}: expected exactly one h1`)
  // images: alt + dimensions
  for (const m of html.matchAll(/<img\b[^>]*>/g)) ok(/ alt="[^"]+"/.test(m[0]) && / width="\d+"/.test(m[0]) && / height="\d+"/.test(m[0]), `${pg.path}: img without alt/size: ${m[0].slice(0, 80)}`)
  // todo markers live in html comments only: never in visible text, meta or json-ld
  ok(!/TODO/.test(html.replace(/<!--[\s\S]*?-->/g, '')), `${pg.path}: TODO marker outside an html comment`)
  // json-ld: parse + structural checks
  const ids = new Set()
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { let j; try { j = JSON.parse(m[1]) } catch (e) { ok(false, `${pg.path}: json-ld does not parse`); continue } checkNode(j, pg.path + ' json-ld', ids); ok(j['@context'] === 'https://schema.org', `${pg.path}: @context`) }
  if (pg.kind !== 'home') ok(/BreadcrumbList/.test(html), `${pg.path}: breadcrumb schema`)
  // internal links resolve to a real page or file
  for (const m of html.matchAll(/href="(\/[^"#?]*)(?:[#?][^"]*)?"/g)) { const p = m[1]; if (p === '/') continue; const f = p.endsWith('/') ? p.slice(1) + 'index.html' : p.slice(1); ok(existsSync(new URL(f, DIST)) || existsSync(new URL(f + '/index.html', DIST)), `${pg.path}: broken internal link ${p}`) }
}

// homepage specifics: content and schema in the raw html, faq matches word for word
const home = await read('/')
const homeText = text(home)
ok(/<h1[^>]*>Rishit Tandon — AI\/ML Engineer &amp; Full-Stack Developer<\/h1>/.test(home), 'home h1 text')
for (const w of ['SRM Institute of Science and Technology', '12+ hackathon', 'Arclyth', 'DocuMind', 'GLOF', 'AgentHub', 'LinkedOut Pro', 'SplitFair', 'NeuroVibe']) ok(homeText.includes(w), `home raw html missing "${w}"`)
const first100 = homeText.split(' ').slice(0, 140).join(' ')
ok(/Rishit Tandon/.test(first100) && /AI agents/.test(first100) && /SRM/.test(first100), 'intro (who/what/where) not in the first ~100 words')
for (const id of ['about', 'skills', 'projects', 'wins', 'research', 'experience', 'faq', 'contact']) ok(new RegExp(`<section class="win" id="${id}"`).test(home), `home section #${id}`)
const ldHome = [...home.matchAll(/application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]))[0]['@graph']
const types = ldHome.map((n) => n['@type']); for (const t of ['Person', 'WebSite', 'ProfilePage', 'FAQPage', 'ItemList']) ok(types.includes(t), `home @graph missing ${t}`)
const faqLd = ldHome.find((n) => n['@type'] === 'FAQPage').mainEntity
ok(faqLd.length >= 8 && faqLd.length <= 14, `faq has ${faqLd.length} entries (want 8-14)`)
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
for (const q of faqLd) ok(home.includes(`<dt>${esc(q.name)}</dt><dd>${esc(q.acceptedAnswer.text)}</dd>`), `visible faq != schema: ${q.name}`)
ok(ldHome.find((n) => n['@type'] === 'ItemList').itemListElement.length === PROJECTS.length, 'item list size')
ok(ldHome.find((n) => n['@type'] === 'Person').sameAs.length >= 3, 'Person.sameAs')

// project pages: 300+ words
for (const p of PROJECTS) { const w = text(await read('/projects/' + p.slug)).split(' ').length; ok(w >= 150, `/projects/${p.slug}: ${w} words`) } // short pages are fine (never padded), but not empty
const about = text(await read('/about')); ok(about.split(' ').length >= 400, `/about words ${about.split(' ').length}`)

// new content pages
const rdf = (f) => readFileSync(new URL(f, DIST), 'utf8')
const stripC = (h) => h.replace(/<!--[\s\S]*?-->/g, '')
const graph = (h) => JSON.parse(h.match(/application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph']
const built = await read('/how-its-built'); ok(text(built).split(' ').length >= 1200, '/how-its-built needs 1200+ words')
ok(['Article', 'HowTo'].every((t) => graph(built).some((n) => n['@type'] === t)), '/how-its-built needs Article + HowTo')
const tips = await read('/portfolio-design-tips'); ok((tips.match(/<h2>\d+\. /g) || []).length === 10, '/portfolio-design-tips needs exactly 10 tips')
ok(['Article', 'FAQPage'].every((t) => graph(tips).some((n) => n['@type'] === t)), '/portfolio-design-tips needs Article + FAQPage')
const llmsTxt = rdf('llms.txt')
for (const [path, h] of [['/how-its-built', built], ['/portfolio-design-tips', tips]]) {
  ok(h.includes('href="/"') && h.includes('href="/projects/'), path + ' links to home and projects')
  ok(llmsTxt.includes('](' + SITE + path + ')'), path + ' listed in llms.txt')
}
// old site is gone: no /os in dist, no links to it, redirect lives in vercel.json, the new home is dev.rishit.site
// google search console verification: permanent, in the raw head of the homepage, before <body>
ok(/<head>[\s\S]*<meta name="google-site-verification" content="9RZWFfbKbt_VfXhatXDDBvK7jhRCqkVQawYc3SHBPwU" \/>[\s\S]*<\/head>\s*<body/.test(home), 'google-site-verification tag missing from the homepage head')
ok(!existsSync(new URL('os/', DIST)), 'dist/os must not exist')
for (const f of ['index.html', 'how-its-built/index.html', 'llms.txt', 'llms-full.txt', 'sitemap.xml']) ok(!/(href="|\]\()\/os\b|portfolio\.rishit\.site\/os\b/.test(rdf(f)), f + ' links to /os')
ok(built.includes('href="https://dev.rishit.site"') && llmsTxt.includes('https://dev.rishit.site'), 'old portfolio links to dev.rishit.site')
const vj = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')).redirects
ok(['/os', '/os/:path*'].every((src) => vj.some((r) => r.source === src && r.destination === 'https://dev.rishit.site' && r.permanent)), 'vercel.json: /os and /os/* 301 to dev.rishit.site')
// "100+ public" must not appear anywhere in the build output (text files and js, not source maps)
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(new URL(e.name + '/', d)) : [new URL(e.name, d)]))
let scanned = 0
for (const u of walk(DIST)) if (/\.(html|txt|xml|json|js|css|webmanifest)$/.test(u.pathname)) { scanned++; ok(!/100\+\s+public/i.test(readFileSync(u, 'utf8')), 'found "100+ public" in ' + u.pathname) }
ok(scanned > 10, 'scanned dist files')
// the plain-text version: one section at the very end, a closed <details>, real server-rendered html, nothing hidden by css
const tv = home.match(/<section id="text-version">[\s\S]*<\/section>/)
ok(tv && home.trimEnd().match(/<\/section>\s*(<script[\s\S]*)?<\/body>/) !== null, 'text-version missing or not at the end of the page')
ok(tv && /^<section id="text-version"><details><summary>\$ cat readme\.txt  \(plain text version for screen readers, search engines and the curious\)<\/summary>/.test(tv[0]) && !/<details[^>]* open/.test(tv[0]), 'text-version details/summary wrong or open by default')
ok(tv && !/style="[^"]*(display|visibility|opacity|position|left|text-indent)/.test(tv[0]), 'inline hiding css inside text-version')
const idx = home.match(/<style>[\s\S]*?<\/style>/g).join('')
ok(!/#text-version[^{]*\{[^}]*(display:\s*none|visibility:\s*hidden|opacity:\s*0\b|left:\s*-|text-indent:\s*-)/.test(idx), 'css hides text-version')
ok(['about.md', 'skills.json', 'projects.log', 'wins.txt', 'research.md', 'experience.log', 'faq.txt', 'contact.sh'].every((n) => tv && tv[0].includes('<span>' + n + '</span>')), 'all eight windows inside text-version')
ok(TEMPLATE_REPO || !/open source: get the template/.test(stripC(home)), 'template badge visible before the repo is public')
ok(FEATURED.length || !/featured on/.test(stripC(home)), 'featured-on badge visible before it is real')
ok(!/Kattankulatham/.test(home), 'misspelled campus')
ok(home.includes('Technology, Kattankulathur') && home.toLowerCase().includes('open to internships now and full-time sde / ai/ml engineer roles from 2027'), 'campus + availability wording')
ok(llmsTxt.includes('9,000+ contributions in 2026') && !/9,\d{3} contributions/.test(llmsTxt.replace('9,000+ contributions', '')), 'static contribution phrasing in llms.txt')

// static files
const rd = (f) => readFileSync(new URL(f, DIST), 'utf8')
const robots = rd('robots.txt')
for (const bot of ['GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'ClaudeBot', 'Claude-SearchBot', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended', 'CCBot']) ok(new RegExp(`User-agent: ${bot}\\s+Allow: /`).test(robots), `robots.txt missing ${bot}`)
ok(/Sitemap: https:\/\/portfolio\.rishit\.site\/sitemap\.xml/.test(robots), 'robots.txt sitemap line')
const sm = rd('sitemap.xml'); const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
ok(urls.length === pages.length - 1, `sitemap has ${urls.length} urls`); ok(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/.test(sm), 'sitemap lastmod')
for (const u of urls) ok(existsSync(new URL(fileFor(u.replace(SITE, '') || '/'), DIST)), `sitemap url has no page: ${u}`)
const llms = rd('llms.txt'); ok(/^# Rishit Tandon/.test(llms) && /^> /m.test(llms) && /## Key pages/.test(llms) && /## Projects/.test(llms) && /## Skills/.test(llms) && /## Contact/.test(llms), 'llms.txt structure')
const full = rd('llms-full.txt'); for (const p of PROJECTS) ok(full.includes('### ' + p.name), `llms-full.txt missing ${p.name}`)
const man = JSON.parse(rd('site.webmanifest')); ok(man.icons.every((i) => existsSync(new URL(i.src.slice(1), DIST))), 'manifest icons exist')
for (const f of ['favicon.svg', 'favicon.ico', 'favicon-32.png', 'apple-touch-icon.png', 'humans.txt', 'sitemap.xml', 'llms.txt']) ok(existsSync(new URL(f, DIST)), `missing ${f}`)

console.log(`\n${checks - fails}/${checks} checks passed${fails ? `, ${fails} FAILED` : ''}`)
process.exit(fails ? 1 : 0)
