// dev tool: screenshots every world at desktop + phone width and measures real fps.
// usage: node scripts/shots.mjs <outdir> [desktop|mobile] [only-ids,comma]
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const out = process.argv[2] || 'shots'
const only = process.argv[3] && process.argv[3] !== 'all' ? process.argv[3] : null
const ids = process.argv[4] ? process.argv[4].split(',') : null
mkdirSync(out, { recursive: true })

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--enable-webgl'],
})

const LABEL = { boot: 'terminal', notebook: 'notebook', mission: 'mission_ctrl', ide: 'ide', projects: 'projects', forge: 'the forge', arcade: 'arcade', workshop: 'workshop', museum: 'museum', contact: 'boarding pass' }
const SHOTS = {
  boot: [0], notebook: [0], mission: [0.3, 0.45, 0.6, 0.8], ide: [0.1, 0.5],
  projects: ['head', 'aisgr', 'neurovibe', 'arclyth', 'agentmarket', 'linkedout', 'multiverse', 'documind'],
  forge: [0, 0.22, 0.45, 0.7, 0.95], arcade: [0.2], workshop: [0.1, 0.8], museum: [0.05, 0.5], contact: [0.3, 0.9],
}

for (const kind of only ? [only] : ['desktop', 'mobile']) {
  const ctx = await browser.newContext(kind === 'desktop'
    ? { viewport: { width: 1440, height: 900 } }
    : { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errors.push(`[${m.type()}] ${m.text()}`.slice(0, 300)) })
  page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message.slice(0, 200) + ' ' + String(e.stack).split('\n').slice(1, 4).join(' | ')))
  await page.goto('http://localhost:5173/', { waitUntil: 'load' })
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${out}/${kind}-00-bios.png` })
  await page.keyboard.press('Space')
  await page.waitForTimeout(2500)
  const fpsAt = async (label) => {
    const f = await page.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const l = () => { n++; if (performance.now() - t0 < 1500) requestAnimationFrame(l); else res(Math.round(n / ((performance.now() - t0) / 1000))) }; requestAnimationFrame(l) }))
    console.log(kind, 'fps', label, f)
  }
  const worlds = ['boot', 'notebook', 'mission', 'ide', 'projects', 'forge', 'arcade', 'workshop', 'museum', 'contact']
  let k = 1
  for (const id of worlds) {
    if (ids && !ids.includes(id)) continue
    // jump the way a visitor would: through the dock (themed wipe + lazy mount), then settle
    await page.click('.dock-item[aria-label="' + LABEL[id] + '"]')
    await page.waitForTimeout(2600)
    for (const pos of SHOTS[id]) {
      await page.evaluate(({ id, pos }) => {
        const w = document.querySelector(`[data-world="${id}"]`)
        const r = w.getBoundingClientRect()
        let y
        if (typeof pos === 'string') {
          if (pos === 'head') y = scrollY + r.top
          else { const a = document.getElementById('proj-' + pos); y = scrollY + a.getBoundingClientRect().top }
        } else y = scrollY + r.top + Math.max(0, r.height - innerHeight) * pos
        scrollTo(0, y)
      }, { id, pos })
      await page.waitForTimeout(2400)
      await page.screenshot({ path: `${out}/${kind}-${String(k++).padStart(2, '0')}-${id}-${pos}.png` })
    }
    await fpsAt(id)
  }
  console.log(kind, 'errors:', errors.length ? '\n' + [...new Set(errors)].join('\n') : 'none')
  await ctx.close()
}
await browser.close()
