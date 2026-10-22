// one-off: bakes a real heightmap around south lhonak lake (upper teesta catchment) from aws terrarium tiles.
// output: public/tex/lhonak.bin (uint16 metres, 192x192) + lhonak.json. run: node scripts/dem.mjs
import { writeFileSync } from 'node:fs'
import zlib from 'node:zlib'
const LAT = 27.915, LON = 88.183, Z = 11, N = 192
const n = 2 ** Z
const fx = ((LON + 180) / 360) * n
const fy = ((1 - Math.log(Math.tan((LAT * Math.PI) / 180) + 1 / Math.cos((LAT * Math.PI) / 180)) / Math.PI) / 2) * n
const tx = Math.floor(fx), ty = Math.floor(fy)
// minimal png decoder (8-bit rgb/rgba, non-interlaced) so there are no extra deps
function png(buf) {
  let p = 8, w, h, ct; const idat = []
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString('ascii', p + 4, p + 8), d = buf.subarray(p + 8, p + 8 + len)
    if (type === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); ct = d[9] } else if (type === 'IDAT') idat.push(d)
    p += 12 + len
  }
  const bpp = ct === 6 ? 4 : 3, raw = zlib.inflateSync(Buffer.concat(idat)), out = Buffer.alloc(w * h * bpp), stride = w * bpp
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)]
    for (let x = 0; x < stride; x++) {
      const v = raw[y * (stride + 1) + 1 + x], a = x >= bpp ? out[y * stride + x - bpp] : 0, b = y ? out[(y - 1) * stride + x] : 0, c = x >= bpp && y ? out[(y - 1) * stride + x - bpp] : 0
      let r = v
      if (f === 1) r = v + a; else if (f === 2) r = v + b; else if (f === 3) r = v + ((a + b) >> 1)
      else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); r = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c) }
      out[y * stride + x] = r & 255
    }
  }
  return { w, h, bpp, data: out }
}
const S = 256, big = new Float32Array(S * 3 * S * 3)
for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
  const r = await fetch(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${Z}/${tx + i}/${ty + j}.png`)
  const t = png(Buffer.from(await r.arrayBuffer()))
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const k = (y * S + x) * t.bpp
    big[((j + 1) * S + y) * S * 3 + (i + 1) * S + x] = t.data[k] * 256 + t.data[k + 1] + t.data[k + 2] / 256 - 32768
  }
}
// crop 384px around the lake, then average 2x2 -> 192
const cx = Math.round((fx - (tx - 1)) * S), cy = Math.round((fy - (ty - 1)) * S), C = 384
const out = new Uint16Array(N * N)
let lakeMin = 1e9
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
  let s = 0
  for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) s += big[(cy - C / 2 + y * 2 + dy) * S * 3 + (cx - C / 2 + x * 2 + dx)]
  out[y * N + x] = Math.round(s / 4)
}
const mpp = (156543.03 * Math.cos((LAT * Math.PI) / 180)) / n
writeFileSync(new URL('../public/tex/lhonak.bin', import.meta.url), Buffer.from(out.buffer))
const c = out[(N / 2) * N + N / 2]
writeFileSync(new URL('../public/tex/lhonak.json', import.meta.url), JSON.stringify({ n: N, metresPerSample: mpp * 2, centreElevation: c, lat: LAT, lon: LON, source: 'aws terrarium tiles z11' }))
console.log('ok', 'metres/sample', (mpp * 2).toFixed(1), 'min', Math.min(...out), 'max', Math.max(...out), 'centre', c)
