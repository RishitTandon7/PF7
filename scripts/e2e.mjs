// dev tool: pokes every interactive thing and reports what happened. usage: node scripts/e2e.mjs <outdir>
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const out = process.argv[2] || 'e2e'
mkdirSync(out, { recursive: true })
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] })
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message.slice(0, 200)))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 200)))
const ok = (name, cond, extra = '') => console.log(cond ? 'PASS' : 'FAIL', name, extra)
const secrets = () => page.locator('.mb-secrets button').innerText()
const dock = async (label) => { await page.click(`.dock-item[aria-label="${label}"]`); await page.waitForTimeout(2600) }

await page.goto('http://localhost:4173/')
await page.waitForTimeout(500)
await page.keyboard.press('Space') // skip bios
await page.waitForTimeout(1800)

// --- terminal
const term = page.locator('.term-in input')
await term.scrollIntoViewIfNeeded()
await term.click()
await page.keyboard.type('help\n'); await page.waitForTimeout(150)
await page.keyboard.type('cd projects\n'); await page.keyboard.type('ls\n'); await page.keyboard.type('cat aisgr.md\n'); await page.waitForTimeout(150)
const txt = await page.locator('.term-out').innerText()
ok('terminal help/ls/cat works', /about\s+projects/.test(txt) && /aisgr\.md/.test(txt) && /problem:/.test(txt))
await page.keyboard.type('github\n'); await page.waitForTimeout(2500)
ok('terminal github pulls real data', /contributions in the last year/.test(await page.locator('.term-out').innerText()))
await page.screenshot({ path: `${out}/01-terminal.png` })

await page.keyboard.type('sudo hire rishit\n'); await page.waitForTimeout(2200)
ok('sudo hire rishit -> celebration', (await page.locator('.fx-hire').count()) === 1, await secrets())
await page.screenshot({ path: `${out}/02-hire.png` })
await page.keyboard.press('Escape'); await page.waitForTimeout(300)
ok('esc closes celebration', (await page.locator('.fx-hire').count()) === 0)

await term.click()
await page.keyboard.type('matrix\n'); await page.waitForTimeout(1500)
ok('matrix overlay', (await page.locator('.fx-matrix').count()) === 1, await secrets())
await page.screenshot({ path: `${out}/03-matrix.png` })
await page.keyboard.press('Escape'); await page.waitForTimeout(300)
await page.locator('.term-in input').click()
await page.keyboard.type('crash\n'); await page.waitForTimeout(3000)
ok('crash overlay', (await page.locator('.fx-crash').count()) === 1, await secrets())
await page.screenshot({ path: `${out}/04-crash.png` })
await page.waitForTimeout(4500)
ok('crash reboots into bios', (await page.locator('.bios').count()) === 1)
await page.keyboard.press('Space'); await page.waitForTimeout(1800)

// --- konami
for (const k of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']) await page.keyboard.press(k)
await page.waitForTimeout(500)
ok('konami', (await page.locator('.toast').count()) >= 1, await secrets())

// --- todo sticky x3
for (let i = 0; i < 3; i++) await page.click('.sticky button')
await page.waitForTimeout(400)
ok('todo: sleep egg', (await page.locator('.nope').count()) === 1, await secrets())
await page.click('.nope')

// --- view source
await dock('notebook')
await page.click('.win-src')
await page.waitForTimeout(600)
const srcLines = await page.locator('.viewsrc pre > div').count()
ok('view source shows real file', srcLines > 100, srcLines + ' lines')
await page.screenshot({ path: `${out}/05-viewsource.png` })
await page.click('.win-src')

// --- notebook flip

// --- arcade
await dock('arcade')
await page.keyboard.press('c'); await page.waitForTimeout(6500)
const score = await page.locator('.hud span').first().innerText().catch(() => 'none')
ok('arcade game runs', (await page.locator('.game canvas').count()) === 1, 'score ' + score)
await page.mouse.move(700, 500); await page.waitForTimeout(3500)
await page.screenshot({ path: `${out}/07-arcade-play.png` })

// --- workshop drag + fling
await dock('workshop')
const tool = page.locator('.tool').nth(3)
const b0 = await tool.boundingBox()
await page.mouse.move(b0.x + 20, b0.y + 30); await page.mouse.down()
for (let i = 1; i <= 8; i++) { await page.mouse.move(b0.x + 20 + i * 70, b0.y + 30 - i * 14); await page.waitForTimeout(16) }
await page.mouse.up(); await page.waitForTimeout(1500)
const b1 = await tool.boundingBox()
ok('workshop tool dragged off the wall', Math.abs(b1.x - b0.x) > 80 || Math.abs(b1.y - b0.y) > 80, `moved ${Math.round(b1.x - b0.x)},${Math.round(b1.y - b0.y)}`)
ok('fling secret', /fling|[1-9]\/9/.test(await secrets()), await secrets())
await page.screenshot({ path: `${out}/08-workshop.png` })

// --- contact tear
await dock('boarding pass')
const stub = page.locator('.pass-stub')
const s0 = await stub.boundingBox()
await page.mouse.move(s0.x + 60, s0.y + 100); await page.mouse.down()
for (let i = 1; i <= 14; i++) { await page.mouse.move(s0.x + 60 + i * 12, s0.y + 100 + i * 2); await page.waitForTimeout(16) }
await page.mouse.up(); await page.waitForTimeout(1600)
ok('boarding pass tears', (await page.locator('.pass.is-torn').count()) === 1, await secrets())
await page.screenshot({ path: `${out}/09-torn.png` })

// --- museum lightbox
await dock('museum')
await page.locator('.mat').first().click(); await page.waitForTimeout(500)
ok('museum lightbox', (await page.locator('.lightbox').count()) === 1)
await page.keyboard.press('Escape')

// --- forge hover tooltip + galaxy
await dock('the forge')
await page.waitForTimeout(1500)
console.log('secrets:', await secrets())
console.log('errors:', errors.length ? [...new Set(errors)] : 'none')
await browser.close()
