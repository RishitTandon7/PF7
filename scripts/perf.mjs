// dev tool: phone performance + tap check on the production build. usage: node scripts/perf.mjs [cpuSlowdown=4]
import { chromium } from 'playwright-core'
const slow = +process.argv[2] || 4
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true })
const p = await ctx.newPage()
const cdp = await ctx.newCDPSession(p)
await cdp.send('Emulation.setCPUThrottlingRate', { rate: slow })
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)))
await p.addInitScript(() => {
  window.__long = 0; window.__longMs = 0
  new PerformanceObserver((l) => { for (const e of l.getEntries()) { window.__long++; window.__longMs += e.duration } }).observe({ entryTypes: ['longtask'] })
})
const t0 = Date.now()
await p.goto('http://localhost:4173/', { waitUntil: 'load' })
console.log(`cpu ${slow}x slower | page load: ${Date.now() - t0}ms`)
await p.waitForTimeout(500); await p.touchscreen.tap(200, 400); await p.waitForTimeout(3000)
const fps = (ms) => p.evaluate((ms) => new Promise((res) => { let n = 0; const t = performance.now(); const l = () => { n++; performance.now() - t < ms ? requestAnimationFrame(l) : res(Math.round(n / ((performance.now() - t) / 1000))) }; requestAnimationFrame(l) }), ms)
console.log('idle fps (hero):', await fps(1500))
// real touch-scroll gesture through the page, sampling fps per stretch
const scroll = (dy) => cdp.send('Input.synthesizeScrollGesture', { x: 195, y: 600, yDistance: -dy, speed: 1800, gestureSourceType: 'touch' })
for (const [label, dy, n] of [['hero->notebook', 700, 2], ['badges/research', 900, 4], ['projects', 900, 4], ['forge', 900, 5], ['arcade+workshop', 900, 4]]) {
  const f0 = fps(2500)
  for (let i = 0; i < n; i++) { await scroll(dy); await p.waitForTimeout(250) }
  console.log(label.padEnd(18), 'avg fps while scrolling:', await f0)
}
console.log('long tasks (>50ms):', await p.evaluate(() => window.__long), 'total blocked ms:', Math.round(await p.evaluate(() => window.__longMs)))
// tap check: do taps land? (dock buttons + a page button)
await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(800)
const dockBtn = async (l) => { const bb = await p.locator(`.dock-item[aria-label="${l}"]`).boundingBox(); await p.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2) }
let ok = 0
for (const [l, id] of [['notebook', 'notebook'], ['projects', 'projects'], ['arcade', 'arcade'], ['museum', 'museum']]) {
  await dockBtn(l); await p.waitForTimeout(2600)
  const act = await p.evaluate(() => document.documentElement.dataset.active)
  console.log('tap dock', l, '->', act, act === id ? 'OK' : 'FAIL'); if (act === id) ok++
}
console.log('dock taps landed:', ok + '/4', '| errors:', errs.length ? errs : 'none')
await b.close()
