import { useRef } from 'react'
import { useCanvas2D, useVisible, clamp } from '../../lib/hooks'

// paper -> scan line -> ocr boxes -> entities -> knowledge graph. loops every 11 seconds.
const LINES = [
  ['INVOICE #2291', 0, 'doc'], ['acme robotics pvt ltd', 1, 'org'], ['bill to: rishit tandon', 2, 'person'],
  ['date: 14 aug 2026', 3, 'date'], ['hackathon travel kit x 3', 4, ''], ['total due: 41,500', 5, 'amount'],
  ['signed: s. mehta', 6, 'person'],
]
const NODES = [
  { id: 'invoice', x: 0.5, y: 0.5, r: 13, c: '#1b1b1b' }, { id: 'acme', x: 0.82, y: 0.22, r: 9, c: '#e8412c' },
  { id: 'rishit', x: 0.2, y: 0.28, r: 9, c: '#1d5fd1' }, { id: '14 aug', x: 0.84, y: 0.7, r: 7, c: '#8a6a00' },
  { id: '41,500', x: 0.52, y: 0.88, r: 7, c: '#0f7a3a' }, { id: 's. mehta', x: 0.16, y: 0.72, r: 8, c: '#1d5fd1' },
]
const EDGES = [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [1, 5], [2, 4]]
const CYCLE = 11

export default function Doc() {
  const wrap = useRef(), vis = useVisible(wrap)
  const ref = useCanvas2D((g, W, H, time) => {
    const t = time % CYCLE
    g.clearRect(0, 0, W, H)
    const split = W > 560 ? 0.48 : 1, dw = W * split * 0.86, dh = H * (W > 560 ? 0.9 : 0.5)
    const dx = W * split * 0.07, dy = H * 0.05
    // the page
    g.fillStyle = '#fffdf5'; g.strokeStyle = '#1b1b1b'; g.lineWidth = 2
    g.save(); g.translate(dx + dw / 2, dy + dh / 2); g.rotate(-0.025); g.translate(-dw / 2, -dh / 2)
    g.shadowColor = '#1b1b1b'; g.shadowOffsetX = 7; g.shadowOffsetY = 7; g.fillRect(0, 0, dw, dh); g.shadowColor = 'transparent'; g.strokeRect(0, 0, dw, dh)
    const scan = clamp(t / 3.5, 0, 1)
    g.font = `${Math.max(11, dw / 22)}px "Courier Prime", monospace`; g.textBaseline = 'top'
    const rowH = dh / (LINES.length + 1.2)
    LINES.forEach(([text, i, kind]) => {
      const y = rowH * (i + 0.6)
      g.fillStyle = '#2a2a2a'; g.fillText(text, 14, y)
      const recognized = scan * dh > y + 6
      if (recognized && kind) {
        const w = g.measureText(text).width
        const hot = t > 5.2
        g.strokeStyle = hot ? '#e8412c' : '#1d5fd1'; g.lineWidth = 1.6; g.strokeRect(10, y - 3, w + 8, rowH * 0.62)
        if (hot) { g.fillStyle = 'rgba(255,224,0,.4)'; g.fillRect(10, y - 3, w + 8, rowH * 0.62); g.fillStyle = '#e8412c'; g.font = '10px "Share Tech Mono", monospace'; g.fillText(kind.toUpperCase(), 14 + w + 14, y); g.font = `${Math.max(11, dw / 22)}px "Courier Prime", monospace` }
      }
    })
    // the scan line
    if (t < 4.2) { g.fillStyle = 'rgba(29,95,209,.25)'; g.fillRect(0, scan * dh - 12, dw, 12); g.fillStyle = '#1d5fd1'; g.fillRect(0, scan * dh, dw, 2) }
    g.restore()

    // graph
    const gx = W > 560 ? W * 0.52 : 0, gy = W > 560 ? 0 : H * 0.52, gw = W > 560 ? W * 0.46 : W, gh = W > 560 ? H : H * 0.46
    const gp = clamp((t - 6) / 3, 0, 1)
    EDGES.forEach(([a, b], k) => {
      const p = clamp(gp * 3 - k * 0.3, 0, 1); if (!p) return
      const A = NODES[a], B = NODES[b]
      g.strokeStyle = '#1b1b1b'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(gx + A.x * gw, gy + A.y * gh); g.lineTo(gx + (A.x + (B.x - A.x) * p) * gw, gy + (A.y + (B.y - A.y) * p) * gh); g.stroke()
    })
    NODES.forEach((n, k) => {
      const p = clamp(gp * 3 - k * 0.25, 0, 1); if (!p) return
      const fx = Math.sin(time * 0.8 + k * 2) * 4, fy = Math.cos(time * 0.7 + k) * 4
      g.fillStyle = n.c; g.beginPath(); g.arc(gx + n.x * gw + fx, gy + n.y * gh + fy, n.r * p, 0, 6.283); g.fill()
      g.fillStyle = '#1b1b1b'; g.font = '12px "Courier Prime", monospace'; g.textAlign = 'center'; g.fillText(n.id, gx + n.x * gw + fx, gy + n.y * gh + fy + n.r + 4); g.textAlign = 'left'
    })
    g.font = '11px "Share Tech Mono", monospace'; g.fillStyle = '#555'
    g.fillText(t < 4.2 ? 'stage 1/3  scanning...' : t < 6 ? 'stage 2/3  ocr + entities' : 'stage 3/3  knowledge graph', 12, H - 14)
  }, vis)
  return <div className="vis doc-vis" ref={wrap}><canvas ref={ref} /></div>
}
