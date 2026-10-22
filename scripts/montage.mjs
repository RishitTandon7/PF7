// dev tool: tile screenshots into contact sheets. usage: node scripts/montage.mjs <dir> <perSheet> [cols]
import { chromium } from 'playwright-core'
import { readdirSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const dir = resolve(process.argv[2])
const per = +process.argv[3] || 10
const cols = +process.argv[4] || 5
const files = readdirSync(dir).filter((f) => /.png$/.test(f) && !f.startsWith("sheet")).sort()
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' })
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
for (let s = 0; s * per < files.length; s++) {
  const part = files.slice(s * per, (s + 1) * per)
  const html = `<body style="margin:0;background:#222;display:grid;grid-template-columns:repeat(${cols},1fr);gap:6px;padding:6px;font:11px monospace;color:#fff">${part.map((f) => `<figure style="margin:0"><img style="width:100%;display:block" src="${pathToFileURL(resolve(dir, f))}"><figcaption>${f}</figcaption></figure>`).join('')}</body>`
  const p = resolve(dir, `sheet-${s}.html`)
  writeFileSync(p, html)
  await page.goto(pathToFileURL(p).href)
  await page.waitForTimeout(500)
  await page.screenshot({ path: resolve(dir, `sheet-${s}.png`), fullPage: true })
  console.log('sheet', s, part.length)
}
await browser.close()
