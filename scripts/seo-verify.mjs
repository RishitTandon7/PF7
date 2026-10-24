// verifies the production build the way a crawler sees it: raw html only, no javascript.
// usage: npm run build && node scripts/seo-verify.mjs          (reads dist/)
//        node scripts/seo-verify.mjs http://localhost:4173     (also fetches over http, like curl)
import { readFileSync, existsSync } from 'node:fs'
import { SITE, ALL_PAGES, PROJECTS, FAQ } from '../seo/data.mjs'

const DIST = new URL('../dist/', import.meta.url)
const base = process.argv[2]
let fails = 0, checks = 0
const ok = (cond, msg) => { checks++; if (!cond) { fails++; console.log('  FAIL', msg) } }
const fileFor = (path) => (path === '/' ? 'index.html' : path === '/404' ? '404.html' : path.slice(1) + '/index.html')
const read = async (path) => (base ? await (await fetch(base + (path === '/404' ? '/nope-404' : path))).text() : readFileSync(new URL(fileFor(path), DIST), 'utf8'))
const one = (html, re) => (html.match(re) || [])[1]
const text = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/\s+/g, ' ')

// minimal structural schema.org checks (required properties per type)
const REQ = { Person: ['name', 'url'], WebSite: ['url', 'name'], ProfilePage: ['mainEntity'], FAQPage: ['mainEntity'], Question: ['name', 'acceptedAnswer'], Answer: ['text'], ItemList: ['itemListElement'], ListItem: ['position'], BreadcrumbList: ['itemListElement'], CreativeWork: ['name'], SoftwareSourceCode: ['name'], AboutPage: ['name'], WebPage: ['name'], ImageObject: ['url'], CollegeOrUniversity: ['name'], PostalAddress: [] }
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
for (const id of ['about', 'skills', 'projects', 'wins', 'research', 'experience', 'faq', 'contact']) ok(new RegExp(`<section id="${id}"`).test(home), `home section #${id}`)
const ldHome = [...home.matchAll(/application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]))[0]['@graph']
const types = ldHome.map((n) => n['@type']); for (const t of ['Person', 'WebSite', 'ProfilePage', 'FAQPage', 'ItemList']) ok(types.includes(t), `home @graph missing ${t}`)
const faqLd = ldHome.find((n) => n['@type'] === 'FAQPage').mainEntity
ok(faqLd.length >= 8 && faqLd.length <= 10, `faq has ${faqLd.length} entries (want 8-10)`)
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
for (const q of faqLd) ok(home.includes(`<dt>${esc(q.name)}</dt><dd>${esc(q.acceptedAnswer.text)}</dd>`), `visible faq != schema: ${q.name}`)
ok(ldHome.find((n) => n['@type'] === 'ItemList').itemListElement.length === PROJECTS.length, 'item list size')
ok(ldHome.find((n) => n['@type'] === 'Person').sameAs.length >= 3, 'Person.sameAs')

// project pages: 300+ words
for (const p of PROJECTS) { const w = text(await read('/projects/' + p.slug)).split(' ').length; ok(w >= 300, `/projects/${p.slug}: ${w} words`) }
const about = text(await read('/about')); ok(about.split(' ').length >= 400, `/about words ${about.split(' ').length}`)

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
