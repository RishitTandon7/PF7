// post-build prerender. runs after `vite build` (plain node, no browser, works on vercel).
//  - dist/index.html: head tags, json-ld, a crawlable fallback inside #root, visible text sections after the app
//  - dist/about, /skills, /how-its-built, /projects/<slug>, 404.html: static html pages
//  - dist/sitemap.xml, llms.txt, llms-full.txt, humans.txt
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { SITE, NAME, LINKS, INTRO, CAMPUS, AVAIL, CONTRIB, TEMPLATE_REPO, FEATURED, PUBLISHED, HOME, ABOUT, SKILLS, BUILT, TIPS_PAGE, PROJECTS, WINS, SKILL_GROUPS, FAQ, ALL_PAGES, projectUrl } from '../seo/data.mjs'
import { win, HOWTO, builtBody, TIPS, TIPS_FAQ, tipsBody } from '../seo/content.mjs'

const DIST = new URL('../dist/', import.meta.url)
const today = new Date().toISOString().slice(0, 10)
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const words = (html) => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->|<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
const write = (rel, data) => { const u = new URL(rel, DIST); mkdirSync(new URL('./', u), { recursive: true }); writeFileSync(u, data) }
const abs = (p) => (p.startsWith('http') ? p : SITE + p)
const url = (path) => SITE + (path === '/' ? '' : path)
const stats = {}

/* ------------------------------------------------------------------ head */
function head(pg) {
  const canon = url(pg.path), img = abs(pg.og)
  const isHome = pg.kind === 'home', isProject = pg.kind === 'project'
  const isArticle = isProject || pg.kind === 'built' || pg.kind === 'tips'
  const ogType = isHome || pg.kind === 'about' ? 'profile' : isArticle ? 'article' : 'website'
  return `<title>${esc(pg.title)}</title>
    <meta name="description" content="${esc(pg.desc)}" />
    <link rel="canonical" href="${canon}" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    <meta name="author" content="${NAME}" />
    <meta name="theme-color" content="#0b0b0c" />
    <meta property="og:site_name" content="${NAME} — Portfolio" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:title" content="${esc(pg.title)}" />
    <meta property="og:description" content="${esc(pg.desc)}" />
    <meta property="og:url" content="${canon}" />
    <meta property="og:image" content="${img}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${esc(pg.h1)} — ${NAME}" />
    <meta property="og:locale" content="en_IN" />${ogType === 'profile' ? `
    <meta property="profile:first_name" content="Rishit" />
    <meta property="profile:last_name" content="Tandon" />` : ''}${isArticle ? `
    <meta property="article:author" content="${LINKS.github}" />
    <meta property="article:modified_time" content="${today}" />` : ''}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(pg.title)}" />
    <meta name="twitter:description" content="${esc(pg.desc)}" />
    <meta name="twitter:image" content="${img}" />
    <meta name="twitter:image:alt" content="${esc(pg.h1)} — ${NAME}" />
    <!-- search console / bing verification: paste your tags here once you have them (see SEO_TODO.md)
    <meta name="google-site-verification" content="TODO(rishit)" />
    <meta name="msvalidate.01" content="TODO(rishit)" /> -->
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png" />
    <link rel="icon" href="/favicon.ico" sizes="48x48" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />
    <link rel="alternate" type="text/plain" href="/llms.txt" title="llms.txt" />`
}

/* --------------------------------------------------------------- json-ld */
const PERSON_ID = SITE + '/#person'
const person = () => ({
  '@type': 'Person', '@id': PERSON_ID, name: NAME, givenName: 'Rishit', familyName: 'Tandon', url: SITE + '/',
  image: SITE + '/og/home.png', // TODO(rishit): swap for a real headshot (public/headshot.webp)
  jobTitle: 'AI/ML Engineer & Full-Stack Developer',
  description: `${INTRO} ${CONTRIB} on GitHub.`,
  alumniOf: { '@type': 'CollegeOrUniversity', name: CAMPUS, url: 'https://www.srmist.edu.in', address: { '@type': 'PostalAddress', addressLocality: 'Kattankulathur, Chennai', addressCountry: 'IN' } },
  knowsAbout: ['AI', 'Machine Learning', 'Computer Vision', 'RAG', 'LLM Agents', 'Full-Stack Development', 'Embedded Systems', 'Robotics', 'Drones', 'Python', 'React', 'Next.js'],
  award: ['6 first-place finishes at hackathons and expos, including SUTD Smorphi (Singapore), CismoHack, ML Project Expo, South India Conclave, Semiconductor Expo and NWC Expo', '12+ hackathon and expo wins in total'],
  sameAs: [LINKS.github, LINKS.linkedin, LINKS.hub, SITE + '/'],
})
const ld = (o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`
function homeLd() {
  return ld({
    '@context': 'https://schema.org',
    '@graph': [
      person(),
      { '@type': 'WebSite', '@id': SITE + '/#website', url: SITE + '/', name: `${NAME} — Portfolio`, description: HOME.desc, inLanguage: 'en', publisher: { '@id': PERSON_ID }, author: { '@id': PERSON_ID } },
      { '@type': 'ProfilePage', '@id': SITE + '/#profilepage', url: SITE + '/', name: HOME.title, description: HOME.desc, inLanguage: 'en', isPartOf: { '@id': SITE + '/#website' }, mainEntity: { '@id': PERSON_ID }, dateModified: today, primaryImageOfPage: { '@type': 'ImageObject', url: SITE + HOME.og, width: 1200, height: 630 } },
      { '@type': 'FAQPage', '@id': SITE + '/#faq', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
      { '@type': 'ItemList', '@id': SITE + '/#projects', name: `Projects by ${NAME}`, itemListElement: PROJECTS.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: projectUrl(p), name: p.name })) },
    ],
  })
}
function projectLd(p) {
  const repo = p.links.find((l) => l.u.startsWith('https://github.com/RishitTandon7/') && !l.u.includes('?'))
  const crumbs = { '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
    { '@type': 'ListItem', position: 2, name: 'Projects', item: SITE + '/#projects' },
    { '@type': 'ListItem', position: 3, name: p.name, item: projectUrl(p) },
  ] }
  const work = { '@type': repo ? ['CreativeWork', 'SoftwareSourceCode'] : 'CreativeWork', '@id': projectUrl(p) + '#project', url: projectUrl(p), name: p.name, headline: p.title.replace(' | Rishit Tandon', ''), description: p.desc, about: p.about, keywords: [p.kw, p.tag, ...p.stack].join(', '), inLanguage: 'en', creator: { '@id': PERSON_ID }, author: { '@id': PERSON_ID }, dateModified: today, image: SITE + `/og/${p.slug}.png`, mainEntityOfPage: projectUrl(p), ...(repo ? { codeRepository: repo.u } : {}) }
  return ld({ '@context': 'https://schema.org', '@graph': [{ ...person(), '@id': PERSON_ID }, crumbs, work] })
}
function simpleLd(pg, crumbName) {
  return ld({ '@context': 'https://schema.org', '@graph': [
    { '@type': pg.kind === 'about' ? 'AboutPage' : 'WebPage', '@id': url(pg.path) + '#page', url: url(pg.path), name: pg.title, description: pg.desc, inLanguage: 'en', isPartOf: { '@id': SITE + '/#website' }, about: { '@id': PERSON_ID }, dateModified: today },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: crumbName, item: url(pg.path) }] },
    { ...person() },
  ] })
}

function articleLd(pg, crumbName, extra = []) {
  return ld({ '@context': 'https://schema.org', '@graph': [
    { '@type': 'Article', '@id': url(pg.path) + '#article', url: url(pg.path), mainEntityOfPage: url(pg.path), headline: pg.h1.slice(0, 110), name: pg.title, description: pg.desc, inLanguage: 'en', image: SITE + pg.og, datePublished: PUBLISHED, dateModified: today, author: { '@id': PERSON_ID }, publisher: { '@id': PERSON_ID }, isPartOf: { '@id': SITE + '/#website' } },
    ...extra,
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: crumbName, item: url(pg.path) }] },
    { ...person() },
  ] })
}
const howtoNode = () => ({ '@type': 'HowTo', '@id': url('/how-its-built') + '#howto', name: HOWTO.name, description: HOWTO.desc, step: HOWTO.steps.map(([n, t], i) => ({ '@type': 'HowToStep', position: i + 1, name: n, text: t, url: url('/how-its-built') })) })

/* ----------------------------------------------------------- page chrome */
const NAV = [['/', 'Interactive portfolio'], ['/about', 'About'], ['/skills', 'Skills'], ['/#projects', 'Projects'], ['/how-its-built', 'How it is built'], ['/portfolio-design-tips', 'Design tips']]
const header = () => `<header class="top"><a class="brand" href="/">rishit_os</a><nav aria-label="Main">${NAV.map(([h, t]) => `<a href="${h}">${t}</a>`).join('')}</nav></header>`
const footer = () => `<footer class="foot"><p>${NAME} — final-year B.Tech CSE at SRM IST, graduating 2027. ${AVAIL[0].toUpperCase() + AVAIL.slice(1)}.</p>${badges()}<p><a href="mailto:${LINKS.email}">${LINKS.email}</a> · <a href="${LINKS.github}" rel="me">GitHub</a> · <a href="${LINKS.linkedin}" rel="me">LinkedIn</a> · <a href="${LINKS.hub}" rel="me">rishit.site</a></p></footer>`
// hidden until filled in (seo/data.mjs): open-source template badge + gallery badges
const badges = () => {
  const out = []
  if (TEMPLATE_REPO) out.push(`<a class="badge" href="${TEMPLATE_REPO}" rel="noopener">open source: get the template</a>`)
  for (const f of FEATURED) out.push(`<a class="badge" href="${f.url}" rel="noopener">featured on ${esc(f.name)}</a>`)
  return out.length ? `<p class="badges">${out.join(' ')}</p>` : '<!-- TODO(rishit): open-source + featured-on badges render here once TEMPLATE_REPO / FEATURED are set in seo/data.mjs -->'
}
const li = (arr) => `<ul>${arr.map((x) => `<li>${x}</li>`).join('')}</ul>`
const projectLinks = (list) => li(list.map((p) => `<a href="/projects/${p.slug}">${esc(p.name)}</a> — ${esc(p.short)}`))

function shell(pg, bodyHtml, jsonld, { preload } = {}) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    ${head(pg)}
    ${preload ? `<link rel="preload" as="image" href="${preload}" fetchpriority="high" />` : ''}
    <link rel="stylesheet" href="/seo.css" />
    ${jsonld}
  </head>
  <body>
    ${header()}
    <main>
${bodyHtml}
    </main>
    ${footer()}
    <script>if(/(^|.)(rishit.site|vercel.app)$/.test(location.hostname)){var s=document.createElement('script');s.defer=true;s.src='/_vercel/insights/script.js';document.body.appendChild(s)}</script>
  </body>
</html>
`
}

/* -------------------------------------------------------------- the pages */
const winsHtml = () => `<ul><li><strong>6 first places:</strong> ${WINS.first.join(', ')}.</li><li><strong>2 second places:</strong> ${WINS.second.join(', ')}.</li><li><strong>Other podiums and finals:</strong> ${WINS.other.join(', ')}.</li></ul>`
const skillsHtml = () => SKILL_GROUPS.map((s) => `<div class="grp"><h3>${esc(s.g)}</h3>${li(s.items.map(esc))}</div>`).join('')
const faqHtml = () => `<dl class="faq">${FAQ.map(([q, a]) => `<dt>${esc(q)}</dt><dd>${esc(a)}</dd>`).join('')}</dl>`

function projectPage(p) {
  const pg = { path: `/projects/${p.slug}`, title: p.title, desc: p.desc, h1: p.name + ': ' + p.tag, og: `/og/${p.slug}.png`, kind: 'project' }
  const rel = p.related.map((s) => PROJECTS.find((x) => x.slug === s)).filter(Boolean)
  const img = p.img || { src: `/og/${p.slug}.png`, alt: `${p.name} — ${p.tag} by ${NAME}`, w: 1200, h: 630 }
  const body = `<article>
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/#projects">Projects</a> › <span>${esc(p.name)}</span></nav>
<h1>${esc(p.name)}: ${esc(p.tag)}</h1>
<p class="lead">${esc(p.short)} A project by <a href="/about">${NAME}</a>, final-year CSE student at SRM IST.</p>
<figure><img src="${img.src}" alt="${esc(img.alt)}" width="${img.w}" height="${img.h}" fetchpriority="high" decoding="async" /></figure>
<h2>The problem</h2>
${p.problem.map((t) => `<p>${esc(t)}</p>`).join('\n')}
<h2>The approach</h2>
${p.approach.map((t) => `<p>${esc(t)}</p>`).join('\n')}
<h2>Tech stack</h2>
${li(p.stack.map(esc))}
<h2>Results</h2>
${li(p.results.map(esc))}
${p.links.length ? `<h2>Links</h2>${li(p.links.map((l) => `<a href="${esc(l.u)}" rel="noopener">${esc(l.t)}</a>`))}` : ''}
<h2>About the builder</h2>
<p>${esc(INTRO)} Read the <a href="/about">full story</a>, see his <a href="/skills">skills</a>, or explore the <a href="/">interactive portfolio</a>.</p>
<h2>Related projects</h2>
${projectLinks(rel)}
<!-- TODO(rishit): ${p.todo} -->
</article>`
  stats[pg.path] = words(body)
  return shell(pg, body, projectLd(p), { preload: img.src })
}

function aboutPage() {
  const pg = { ...ABOUT, kind: 'about' }
  const body = `<article>
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <span>About</span></nav>
<h1>${ABOUT.h1}</h1>
<p class="lead">${esc(INTRO)}</p>
<figure><img src="/og/about.png" alt="${NAME}: AI/ML engineer and full-stack developer, SRM IST" width="1200" height="630" fetchpriority="high" decoding="async" /></figure>
<h2>Education</h2>
<p>I am in the final year of a B.Tech in Computer Science and Engineering at SRM Institute of Science and Technology, Kattankulathur (Chennai), from 2023 to 2027, with a CGPA of 9.2. Two electives mattered to me most: Metaverse, where I placed in the top 80 of my batch, and Responsible AI, top 120. Before SRM I studied at DPS Lucknow (class 12, 2023) and Jaipuria (class 10, 2021).</p>
<h2>What I build</h2>
<p>My work sits where software meets the physical world. I build AI agents and document-intelligence systems, drones and robots, smart glasses and brain-computer interfaces, and full-stack web products. A few of them:</p>
${projectLinks(PROJECTS)}
<h2>Research and leadership</h2>
<ul>
<li><strong>Research intern, SRM IST × NIDM:</strong> I worked on a machine learning early-warning pipeline for glacial lake outburst floods in the Upper Tista Basin and cut alert latency by 40%. <a href="/projects/glof-early-warning">Read the project</a>.</li>
<li><strong>Student convenor, RoboFest 2.0:</strong> I led the student team behind one of the biggest international events at SRM, and built the portal that ran judging, results, attendance and seat allocation.</li>
<li><strong>Technical lead, Intelligent System Design (ISD) Lab, SRM IST:</strong> the lab focuses on robotics, embedded systems and IoT, and AI on edge devices, with project-based learning.</li>
</ul>
<h2>Hackathons and achievements</h2>
<p>I have 12+ hackathon and expo wins, six of them first places.</p>
${winsHtml()}
<h2>Open source</h2>
<p>I have 100+ public repositories on <a href="${LINKS.github}" rel="me">GitHub</a> and ${CONTRIB}. The portfolio's GitHub world reads that data live.</p>
<h2>Looking for</h2>
<p>I am ${AVAIL}, meaning software development engineer (SDE) and AI/ML engineer roles. If you are building with AI agents, computer vision, robotics or full-stack products, I would like to hear from you.</p>
<h2>Contact</h2>
<p>Email <a href="mailto:${LINKS.email}">${LINKS.email}</a>, find me on <a href="${LINKS.linkedin}" rel="me">LinkedIn</a>, or start at <a href="${LINKS.hub}" rel="me">rishit.site</a>, where everything I make is connected.</p>
<!-- TODO(rishit): add a real headshot (public/headshot.webp) and set it as the Person image; add one line on what you lead at the ISD Lab -->
</article>`
  stats[pg.path] = words(body)
  return shell(pg, body, simpleLd(pg, 'About'), { preload: '/og/about.png' })
}

function skillsPage() {
  const pg = { ...SKILLS, kind: 'skills' }
  const body = `<article>
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <span>Skills</span></nav>
<h1>${SKILLS.h1}</h1>
<p class="lead">The tools I use across AI and machine learning, full-stack web, embedded hardware and robotics, grouped by area, with the projects where each one shows up.</p>
<h2>Skills by area</h2>
${skillsHtml()}
<h2>Where these skills show up</h2>
${li([
  '<a href="/projects/documind">DocuMind</a>: OCR, knowledge graphs, hybrid RAG and LLM agents.',
  '<a href="/projects/agenthub">AgentHub</a> and <a href="/projects/linkedout-pro">LinkedOut Pro</a>: full-stack products with AI behind them.',
  '<a href="/projects/arclyth">Arclyth</a> and <a href="/projects/slam-drone">the SLAM drone</a>: drones and autonomous flight.',
  '<a href="/projects/aisgr-smart-glasses">A.I.S.G.R.</a> and <a href="/projects/neurovibe-bci">NeuroVibe</a>: embedded hardware, vision and brain-computer interfaces.',
  '<a href="/projects/glof-early-warning">GLOF early-warning pipeline</a>: machine learning on sensor and geospatial data.',
])}
<p>See the <a href="/about">full background</a>, or the <a href="/how-its-built">tech behind this portfolio</a>.</p>
<!-- TODO(rishit): add proficiency levels or years per skill if you want them shown -->
</article>`
  stats[pg.path] = words(body)
  return shell(pg, body, simpleLd(pg, 'Skills'), { preload: null })
}

function builtPage(lh) {
  const pg = { ...BUILT, kind: 'built' }
  const body = `<article>
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <span>How it is built</span></nav>
<h1>${BUILT.h1}</h1>
${builtBody(lh)}
</article>`
  stats[pg.path] = words(body)
  return shell(pg, body, articleLd(pg, 'How it is built', [howtoNode()]), { preload: null })
}

function tipsPage() {
  const pg = { ...TIPS_PAGE, kind: 'tips' }
  const faqLd = { '@type': 'FAQPage', '@id': url(pg.path) + '#faq', mainEntity: TIPS_FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }
  const body = `<article>
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <span>Design tips</span></nav>
<h1>${TIPS_PAGE.h1}</h1>
${tipsBody()}
</article>`
  stats[pg.path] = words(body)
  return shell(pg, body, articleLd(pg, 'Design tips', [faqLd]), { preload: null })
}

function notFound() {
  const pg = { path: '/404', title: 'Page not found | Rishit Tandon', desc: 'That page does not exist. Go back to the Rishit Tandon portfolio or one of his projects.', h1: 'Page not found', og: '/og/home.png', kind: 'website' }
  const body = `<article>
<h1>404: this page is not in the room</h1>
<p class="lead">The link may be old, or mistyped. Here is where you probably wanted to go:</p>
${li(['<a href="/">The interactive portfolio</a>', '<a href="/about">About Rishit Tandon</a>', '<a href="/skills">Skills</a>', ...PROJECTS.slice(0, 5).map((p) => `<a href="/projects/${p.slug}">${esc(p.name)}</a>`)])}
</article>`
  return shell(pg, body, '').replace('index, follow', 'noindex, follow').replace(`<link rel="canonical" href="${SITE}/404" />`, '')
}

/* ------------------------------------------------------------- home page */
function home() {
  const idx = readFileSync(new URL('index.html', DIST), 'utf8')
  let html = idx
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta name="description"[^>]*>/, '')
    .replace(/<meta name="theme-color"[^>]*>/, '')
    .replace(/<link rel="icon" href="data:[^>]*>/, '')
    .replace('<!--SEO_HEAD-->', head({ ...HOME, kind: 'home' }) + '\n    ' + homeLd())
  const fallback = `<div class="ssr"><h1>${esc(HOME.h1)}</h1><p>${esc(INTRO)}</p><nav aria-label="Main"><a href="/about">About</a> · <a href="/skills">Skills</a> · <a href="/#projects">Projects</a> · <a href="${LINKS.github}">GitHub</a> · <a href="${LINKS.linkedin}">LinkedIn</a></nav></div>`
  const sections = `<div id="seo-home" role="region" aria-label="About Rishit Tandon, in plain text">
${win('about.md', `<h2>About Rishit Tandon</h2><p>${esc(INTRO)} <a href="/about">Read the full story</a>.</p><p class="v">that is the plain version. the fun version is everything above this.</p>${badges()}`, 'about')}
${win('skills.json', `<h2>Skills</h2><div class="cols">${skillsHtml()}</div><p class="v">i pick the tool that fits the job, not the one with the nicest logo. <a href="/skills">all skills, and where each one shows up</a></p>`, 'skills')}
${win('projects.log', `<h2>Projects</h2>${projectLinks(PROJECTS)}<p class="v">nine of them have their own page. there are 100+ public repos on github in various states of finished.</p>`, 'projects')}
${win('wins.txt', `<h2>Hackathon wins and achievements</h2><p>12+ hackathon and expo wins, 6 of them first places.</p>${winsHtml()}<p class="v">yes, i keep count.</p>`, 'wins')}
${win('research.md', `<h2>Research</h2><p>Research intern at SRM IST with NIDM (India's National Institute of Disaster Management): a machine learning early-warning pipeline for glacial lake outburst floods in the Upper Tista Basin, with alert latency cut by 40%. <a href="/projects/glof-early-warning">Read the project</a>.</p><p class="v">the guided version, with a globe and a lake, is in mission_ctrl.</p>`, 'research')}
${win('experience.log', `<h2>Experience</h2>${li(['Research intern, SRM IST × NIDM (GLOF early warning, Upper Tista Basin).', 'Student convenor, RoboFest 2.0, one of the biggest international events at SRM; built the judging, attendance and seat-allocation portal.', 'Technical lead, Intelligent System Design (ISD) Lab, SRM IST.'])}`, 'experience')}
${win('faq.txt', `<h2>Frequently asked questions</h2>${faqHtml()}`, 'faq')}
${win('contact.sh', `<h2>Contact Rishit Tandon</h2><p>Email <a href="mailto:${LINKS.email}">${LINKS.email}</a> · <a href="${LINKS.github}" rel="me">GitHub</a> · <a href="${LINKS.linkedin}" rel="me">LinkedIn</a> · <a href="${LINKS.hub}" rel="me">rishit.site</a></p><p class="v">${esc(AVAIL[0].toUpperCase() + AVAIL.slice(1))}. read <a href="/how-its-built">how this portfolio is built</a> or the <a href="/portfolio-design-tips">design tips</a>.</p>`, 'contact')}
</div>`
  if (!html.includes('<div id="root"></div>')) throw new Error('root marker missing in dist/index.html')
  html = html.replace('<div id="root"></div>', `<div id="root">${fallback}</div>\n    ${sections}`)
  stats['/'] = words(fallback + sections)
  writeFileSync(new URL('index.html', DIST), html)
}

/* ------------------------------------------------------ text/data files */
function files() {
  const pages = ALL_PAGES()
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((p) => `  <url><loc>${url(p.path)}</loc><lastmod>${today}</lastmod><changefreq>${p.kind === 'home' ? 'weekly' : 'monthly'}</changefreq><priority>${p.kind === 'home' ? '1.0' : p.kind === 'project' ? '0.7' : '0.8'}</priority></url>`).join('\n')}\n</urlset>\n`)
  const L = (arr) => arr.join('\n')
  write('llms.txt', L([
    `# ${NAME}`, '',
    `> ${INTRO} ${CONTRIB} on GitHub.`, '',
    '## Key pages',
    `- [Home — interactive portfolio](${SITE}/): the main portfolio, nine interactive worlds`,
    `- [About](${SITE}/about): background, education, research, leadership, achievements`,
    `- [Skills](${SITE}/skills): AI/ML, full-stack, embedded and robotics skills`,
    `- [How this portfolio is built](${SITE}/how-its-built): case study of the OS-style interactive portfolio: concept, React/Three.js/GSAP stack, performance, easter eggs, before and after`,
    `- [Portfolio design tips](${SITE}/portfolio-design-tips): ten practical tips for a developer portfolio that does not look like a template`,
    ...(TEMPLATE_REPO ? [`- [Portfolio template (open source)](${TEMPLATE_REPO}): the template behind this site`] : []), '',
    '## Projects',
    ...PROJECTS.map((p) => `- [${p.name}](${projectUrl(p)}): ${p.short}`), '',
    '## Skills',
    ...SKILL_GROUPS.map((s) => `- ${s.g}: ${s.items.join('; ')}`), '',
    '## Contact',
    `- Email: ${LINKS.email}`, `- GitHub: ${LINKS.github}`, `- LinkedIn: ${LINKS.linkedin}`, `- Hub: ${LINKS.hub}`, '',
  ]))
  write('llms-full.txt', L([
    `# ${NAME} — full profile`, '', `> ${INTRO}`, '',
    '## Achievements', `12+ hackathon and expo wins, 6 first places. First places: ${WINS.first.join(', ')}. Second places: ${WINS.second.join(', ')}. Others: ${WINS.other.join(', ')}.`, '',
    '## Projects', '',
    ...PROJECTS.flatMap((p) => [`### ${p.name} — ${p.tag}`, `${p.problem.join(' ')} ${p.approach.join(' ')} Results: ${p.results.join(' ')} Stack: ${p.stack.join(', ')}.${p.links.length ? ' Links: ' + p.links.map((l) => `${l.t} ${l.u}`).join('; ') + '.' : ''} Page: ${projectUrl(p)}`, '']),
    '## FAQ', '', ...FAQ.flatMap(([q, a]) => [`**${q}**`, a, '']),
    '## Contact', `Email ${LINKS.email}. GitHub ${LINKS.github}. LinkedIn ${LINKS.linkedin}. Hub ${LINKS.hub}.`, '',
  ]))
  write('humans.txt', `/* TEAM */\nBuilder: ${NAME}\nContact: ${LINKS.email}\nFrom: Chennai, India\n\n/* SITE */\nLast update: ${today}\nStandards: HTML5, CSS3, JSON-LD (schema.org)\nComponents: React, Three.js, GSAP, Lenis, Matter.js, Vite\n`)
}

/* ---------------------------------------------------------------- main */
let lh = null
const lhFile = new URL('../seo/lighthouse.json', import.meta.url)
if (existsSync(lhFile)) lh = JSON.parse(readFileSync(lhFile, 'utf8')).after || null
home()
write('about/index.html', aboutPage())
write('skills/index.html', skillsPage())
write('how-its-built/index.html', builtPage(lh))
write('portfolio-design-tips/index.html', tipsPage())
for (const p of PROJECTS) write(`projects/${p.slug}/index.html`, projectPage(p))
write('404.html', notFound())
files()

// guard rails
const bad = []
if (HOME.desc.length < 150 || HOME.desc.length > 160) bad.push(`home description is ${HOME.desc.length} chars (want 150-160)`)
for (const p of ALL_PAGES()) if (p.desc.length > 160 || p.desc.length < 120) bad.push(`${p.path} description ${p.desc.length} chars`)
// short project pages are published as they are: never padded, never filled with todo text
for (const p of PROJECTS) if (stats['/projects/' + p.slug] < 300) console.log(`note: /projects/${p.slug} is ${stats['/projects/' + p.slug]} words (short on purpose, no padding)`)
if (stats['/how-its-built'] < 1200) bad.push(`/how-its-built only ${stats['/how-its-built']} words (want 1200+)`)
if (stats['/about'] < 400) bad.push(`/about only ${stats['/about']} words (want 400+)`)
console.log('seo-build ok:', Object.entries(stats).map(([k, v]) => `${k} ${v}w`).join(' | '))
if (bad.length) { console.warn('SEO WARNINGS:\n - ' + bad.join('\n - ')) }
