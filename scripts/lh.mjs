// runs lighthouse (mobile) against the local production build and stores the scores in seo/lighthouse.json.
// usage: npm run build && npx vite preview --port 4173 (other terminal) && npm run lighthouse [before|after] [path]
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
const label = process.argv[2] || 'after'
// git bash rewrites a leading / into a windows path ('C:/Program Files/Git/about'); undo that
let path = process.argv[3] || '/'
if (path.includes(':')) path = path.slice(path.indexOf('Git') + 3)
if (!path.startsWith('/')) path = '/' + path
const out = new URL('../seo/_lh.json', import.meta.url).pathname.slice(1)
execSync(`npx --yes lighthouse ${process.env.LH_BASE || "http://localhost:4173"}${path} --chrome-flags="--headless=new --use-angle=d3d11" --form-factor=mobile --screenEmulation.mobile --only-categories=performance,seo,accessibility,best-practices --output=json --output-path="${out}" --quiet`, { stdio: 'inherit', env: { ...process.env, CHROME_PATH: 'C:/Program Files/Google/Chrome/Application/chrome.exe' } })
const r = JSON.parse(readFileSync(out, 'utf8'))
const s = Object.fromEntries(Object.entries(r.categories).map(([k, v]) => [k, Math.round(v.score * 100)]))
const a = r.audits, m = { lcp: a['largest-contentful-paint'].displayValue, fcp: a['first-contentful-paint'].displayValue, tbt: a['total-blocking-time'].displayValue, cls: a['cumulative-layout-shift'].displayValue }
console.log(path, label, JSON.stringify(s), JSON.stringify(m))
const fails = Object.values(a).filter((x) => x.score !== null && x.score < 1 && Object.values(r.categories).some((c) => c.auditRefs.some((y) => y.id === x.id && y.weight > 0))).map((x) => `${x.id}(${Math.round(x.score * 100)})`)
console.log('not perfect:', fails.join(', '))
if (path === '/') { const f = new URL('../seo/lighthouse.json', import.meta.url); const cur = existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : {}; cur[label] = { ...s, ...m }; writeFileSync(f, JSON.stringify(cur, null, 2)) }
