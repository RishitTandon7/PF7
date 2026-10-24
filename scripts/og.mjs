// generates public/og/<page>.png (1200x630) for every page, plus the favicon set. run locally: `npm run og`
// (uses your installed chrome; the outputs are committed, so vercel's build never needs a browser)
import { chromium } from 'playwright-core'
import { mkdirSync, writeFileSync } from 'node:fs'
import { ALL_PAGES, PROJECTS } from '../seo/data.mjs'

const OUT = new URL('../public/', import.meta.url)
mkdirSync(new URL('og/', OUT), { recursive: true })
const ACCENT = { home: '#ffb000', about: '#ffb000', skills: '#39d353', built: '#38ffb0', tips: '#ff7a59', arclyth: '#ffd23f', 'aisgr-smart-glasses': '#5ef2ff', documind: '#ffe000', 'glof-early-warning': '#38ffb0', agenthub: '#ff5a1f', 'linkedout-pro': '#4aa3ff', splitfair: '#7dff6a', 'slam-drone': '#ff7a59', 'neurovibe-bci': '#ff7a59' }
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')

const card = (pg) => {
  const key = pg.slug || pg.kind, c = ACCENT[key] || ACCENT[pg.kind] || '#ffb000'
  const proj = pg.kind === 'project' && PROJECTS.find((p) => p.slug === pg.slug)
  const big = proj ? proj.name : pg.kind === 'home' ? 'Rishit Tandon' : pg.kind === 'about' ? 'About Rishit Tandon' : pg.kind === 'skills' ? 'Skills' : pg.kind === 'tips' ? 'Portfolio design tips' : 'How this portfolio is built'
  const sub = proj ? proj.tag : pg.kind === 'home' ? 'AI/ML Engineer & Full-Stack Developer' : pg.kind === 'about' ? 'CSE student at SRM IST · 12+ hackathon wins' : pg.kind === 'skills' ? 'AI/ML · Full-Stack · Embedded · Robotics' : pg.kind === 'tips' ? '10 lessons from a non-template site' : 'React · Three.js · GSAP · Vite'
  const size = big.length > 20 ? 84 : big.length > 13 ? 104 : 128
  return `<html><head><link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap" rel="stylesheet"><style>
  *{box-sizing:border-box;margin:0}body{width:1200px;height:630px;background:#0b0b0c;color:#f2ecdf;font-family:'JetBrains Mono',monospace;position:relative;overflow:hidden;
  background-image:radial-gradient(#2b261d 1.6px,transparent 2px);background-size:30px 30px}
  .bar{position:absolute;left:0;right:0;top:0;height:56px;background:#0b0b0c;border-bottom:2px solid #26231d;display:flex;align-items:center;padding:0 40px;gap:24px;font-size:22px;color:#b9b2a1}
  .bar b{color:${c}}.dot{width:14px;height:14px;border-radius:50%;background:#3a352b}
  .wrap{position:absolute;left:64px;right:64px;top:110px;bottom:70px;display:flex;flex-direction:column;justify-content:center}
  .kick{font-size:28px;color:${c};margin-bottom:22px;letter-spacing:.02em}
  h1{font-size:${size}px;font-weight:800;line-height:1.02;letter-spacing:-.05em;color:#f2ecdf;text-shadow:8px 8px 0 ${c}33}
  h2{font-size:38px;font-weight:700;color:${c};margin-top:26px;letter-spacing:-.02em}
  .foot{position:absolute;left:64px;right:64px;bottom:34px;display:flex;justify-content:space-between;font-size:24px;color:#a39b86}
  .chip{border:2px solid ${c};color:${c};padding:4px 16px;font-size:22px}
  .accent{position:absolute;right:0;top:56px;bottom:0;width:18px;background:${c}}
  </style></head><body><div class="bar"><span class="dot"></span><span class="dot"></span><span class="dot"></span><b>rishit_os</b><span>portfolio.rishit.site</span></div><div class="accent"></div>
  <div class="wrap"><div class="kick">${proj ? 'project by Rishit Tandon' : '$ whoami'}</div><h1>${esc(big)}</h1><h2>${esc(sub)}</h2></div>
  <div class="foot"><span>Rishit Tandon · SRM IST · 2027</span><span class="chip">12+ hackathon wins</span></div></body></html>`
}

const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0b0b0c"/><path d="M16 18l15 14-15 14M35 46h16" stroke="#39d353" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`
writeFileSync(new URL('favicon.svg', OUT), logoSvg)

const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
const p = await b.newPage({ viewport: { width: 1200, height: 630 } })
for (const pg of ALL_PAGES()) {
  const name = pg.slug || (pg.kind === 'built' ? 'how-its-built' : pg.kind === 'tips' ? 'portfolio-design-tips' : pg.kind)
  await p.setContent(card(pg), { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready)
  await p.screenshot({ path: new URL(`og/${name}.png`, OUT).pathname.slice(1), clip: { x: 0, y: 0, width: 1200, height: 630 } })
  console.log('og', name)
}
// favicons from the svg
const sizes = { 'favicon-32.png': 32, 'favicon-48.png': 48, 'apple-touch-icon.png': 180, 'icon-192.png': 192, 'icon-512.png': 512 }
const fp = await b.newPage({ viewport: { width: 512, height: 512 } })
for (const [file, s] of Object.entries(sizes)) {
  await fp.setViewportSize({ width: s, height: s })
  await fp.setContent(`<body style="margin:0;background:transparent"><img src="data:image/svg+xml;utf8,${encodeURIComponent(logoSvg)}" width="${s}" height="${s}" style="display:block"></body>`)
  await fp.screenshot({ path: new URL(file, OUT).pathname.slice(1), omitBackground: true, clip: { x: 0, y: 0, width: s, height: s } })
}
await b.close()
// .ico = a png inside an ico container (valid for every modern browser)
import { readFileSync } from 'node:fs'
const png = readFileSync(new URL('favicon-48.png', OUT))
const hdr = Buffer.alloc(22); hdr.writeUInt16LE(0, 0); hdr.writeUInt16LE(1, 2); hdr.writeUInt16LE(1, 4)
hdr.writeUInt8(48, 6); hdr.writeUInt8(48, 7); hdr.writeUInt16LE(1, 10); hdr.writeUInt16LE(32, 12); hdr.writeUInt32LE(png.length, 14); hdr.writeUInt32LE(22, 18)
writeFileSync(new URL('favicon.ico', OUT), Buffer.concat([hdr, png]))
console.log('favicons ok')
