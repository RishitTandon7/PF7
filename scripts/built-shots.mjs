// captures the screenshots used on /how-its-built (jpg, 1440x900 viewport crops of real worlds + the old site at /os/).
// usage: serve dist on :4195 first (npx serve dist -l 4195), then: node scripts/built-shots.mjs
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const BASE = process.env.BASE || 'http://127.0.0.1:4195'
const OUT = new URL('../public/media/built/', import.meta.url)
mkdirSync(OUT, { recursive: true })
const out = (n) => new URL(n, OUT).pathname.replace(/^\/([A-Za-z]:)/, '$1')

const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-webgl'] })
const page = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
const shot = (n) => page.screenshot({ path: out(n), type: 'jpeg', quality: 76 })

await page.goto(BASE + '/', { waitUntil: 'load' })
await page.waitForTimeout(6000)
await shot('terminal.jpg')
for (const [id, name, y] of [['mission', 'mission.jpg', 0.45], ['forge', 'forge.jpg', 0.3], ['arcade', 'arcade.jpg', 0.2], ['workshop', 'workshop.jpg', 0.1]]) {
  await page.evaluate(([i, f]) => { const el = document.querySelector(`[data-world="${i}"]`); const r = el.getBoundingClientRect(); window.scrollTo(0, r.top + scrollY + Math.max(0, r.height - innerHeight) * f) }, [id, y])
  await page.waitForTimeout(3500)
  await shot(name)
  console.log('shot', name)
}
await page.goto(BASE + '/os/', { waitUntil: 'load' })
await page.waitForTimeout(3000)
await shot('old-site.jpg')
await b.close()
console.log('done')
