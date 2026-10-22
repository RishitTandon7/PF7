import { useRef } from 'react'
import { useCanvas2D, useVisible, rand } from '../../lib/hooks'

// first-person view through the glasses. move your cursor = turn your head.
const TYPES = ['person', 'door', 'stairs ahead', 'car', 'sign: exit', 'chair', 'dog']
const CAPS = ['"mind the step"', '"person ahead, 2 m"', '"door on your left"', '"exit sign, straight on"', '"car approaching"']
const mk = () => ({ k: TYPES[(Math.random() * TYPES.length) | 0], x: rand(-0.9, 0.9), z: rand(0.5, 1), c: rand(0.82, 0.98) })

export default function Aisgr() {
  const wrap = useRef(), mouse = useRef({ x: 0, y: 0, sx: 0, sy: 0 })
  const vis = useVisible(wrap)
  const items = useRef(Array.from({ length: 6 }, (_, i) => ({ ...mk(), z: 0.25 + i * 0.13 })))
  const ref = useCanvas2D((g, w, h, t, dt) => {
    const m = mouse.current
    m.sx += (m.x - m.sx) * 0.08; m.sy += (m.y - m.sy) * 0.08
    const cx = w / 2 - m.sx * w * 0.18, cy = h * 0.46 + m.sy * 24
    g.fillStyle = '#02070a'; g.fillRect(0, 0, w, h)
    // sky glow + ground
    const sky = g.createLinearGradient(0, 0, 0, cy); sky.addColorStop(0, '#04141a'); sky.addColorStop(1, '#0b2a33')
    g.fillStyle = sky; g.fillRect(0, 0, w, cy)
    g.fillStyle = '#05100f'; g.fillRect(0, cy, w, h - cy)
    // buildings either side, in perspective
    g.fillStyle = '#071d24'
    for (const s of [-1, 1]) {
      g.beginPath(); g.moveTo(cx + s * w * 0.06, cy - h * 0.06); g.lineTo(cx + s * w * 0.7, cy - h * 0.55); g.lineTo(cx + s * w * 0.7, h); g.lineTo(cx + s * w * 0.06, cy + h * 0.02); g.fill()
      g.fillStyle = 'rgba(94,242,255,.35)'
      for (let i = 0; i < 14; i++) { const k = (i / 14 + t * 0.04) % 1, x = cx + s * (w * 0.08 + k * k * w * 0.6), y = cy - h * 0.04 - k * k * h * 0.28; g.fillRect(x, y, 3 + k * 16, 2 + k * 10) }
      g.fillStyle = '#071d24'
    }
    // road lanes + moving stripes
    g.strokeStyle = 'rgba(94,242,255,.18)'; g.lineWidth = 1
    for (let k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + k * w * 0.4, h); g.stroke() }
    for (let i = 0; i < 9; i++) { const z = ((i / 9) + t * 0.12) % 1, y = cy + (h - cy) * z * z; g.beginPath(); g.moveTo(cx - z * w * 0.6, y); g.lineTo(cx + z * w * 0.6, y); g.stroke() }

    // detections
    for (const it of items.current) {
      it.z -= dt * 0.05
      if (it.z < 0.06) Object.assign(it, mk(), { z: 1 })
      const p = 1 - it.z, size = 18 + p * p * h * 0.55
      const sx = cx + it.x * w * 0.5 * (0.12 + p * 0.9), sy = cy + p * p * h * 0.2
      const near = p > 0.7
      g.strokeStyle = near ? '#ff8a3d' : '#5ef2ff'; g.lineWidth = 1.5
      const bw = size * 0.8, bh = size * 1.1, L = Math.min(14, bw / 3)
      for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const x = sx + dx * bw / 2, y = sy + dy * bh / 2
        g.beginPath(); g.moveTo(x, y - dy * L); g.lineTo(x, y); g.lineTo(x - dx * L, y); g.stroke()
      }
      g.font = '11px "Share Tech Mono", monospace'; g.fillStyle = near ? '#ff8a3d' : '#5ef2ff'
      g.fillText(`${it.k} ${it.c.toFixed(2)}`, sx - bw / 2, sy - bh / 2 - 5)
    }
    // hud
    g.strokeStyle = 'rgba(94,242,255,.9)'; g.fillStyle = 'rgba(94,242,255,.9)'; g.lineWidth = 1
    g.beginPath(); g.arc(w / 2, h / 2, 14, 0, 6.283); g.moveTo(w / 2 - 22, h / 2); g.lineTo(w / 2 - 8, h / 2); g.moveTo(w / 2 + 8, h / 2); g.lineTo(w / 2 + 22, h / 2); g.stroke()
    const heading = Math.round(((42 + m.sx * 90) % 360 + 360) % 360)
    g.font = '11px "Share Tech Mono", monospace'; g.textAlign = 'center'
    for (let d = -6; d <= 6; d++) { const x = w / 2 + d * 26 - ((heading % 5) * 5.2); g.fillRect(x, 24, 1, d % 2 ? 5 : 9) }
    g.fillText(`N ${String(heading).padStart(3, '0')}°`, w / 2, 20)
    g.textAlign = 'left'; g.fillText('AISGR · demo scene', 18, h - 18)
    g.textAlign = 'right'; g.fillText('bat 78%  ▮▮▮▯', w - 18, h - 18)
    // caption bar
    const cap = CAPS[Math.floor(t / 3.2) % CAPS.length]
    g.textAlign = 'center'; g.font = '13px "Share Tech Mono", monospace'
    const tw = g.measureText(cap).width + 24
    g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(w / 2 - tw / 2, h - 58, tw, 24)
    g.fillStyle = '#e7fdff'; g.fillText(cap, w / 2, h - 41)
    // scan line
    g.fillStyle = 'rgba(94,242,255,.08)'; g.fillRect(((t * 140) % (w + 60)) - 30, 0, 2, h)
  }, vis)
  return (
    <div className="vis aisgr-vis" ref={wrap} onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); mouse.current.x = (e.clientX - r.left) / r.width * 2 - 1; mouse.current.y = (e.clientY - r.top) / r.height * 2 - 1 }}>
      <canvas ref={ref} />
      <i className="lens" aria-hidden />
      <small className="vis-cap">↖ move your cursor. you're turning your head.</small>
    </div>
  )
}
