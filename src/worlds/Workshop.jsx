import { useCallback, useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'
import { Window } from '../ui/Window'
import { TOOLS } from '../data/content'
import { useTick, useVisible, clamp } from '../lib/hooks'
import { unlock } from '../lib/store'
import { beep } from '../lib/audio'
import './workshop.css'

const { Engine, Bodies, Body, Composite, Constraint, Events } = Matter

// silhouettes drawn on a 60x110 board. fat strokes, flat colours, like a sticker.
const S = 'stroke="#161616" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"'
const SHAPES = {
  wrench: `<path ${S} fill="#9aa4ad" d="M22 6h-6c-3 3-3 9 0 12l6 3v70a8 8 0 0016 0V21l6-3c3-3 3-9 0-12h-6v8h-10z"/><circle cx="30" cy="96" r="3" fill="#161616"/>`,
  hammer: `<path ${S} fill="#9aa4ad" d="M8 6h36v16H28v0H8z"/><path ${S} fill="#c9843e" d="M23 22h10v82a5 5 0 01-10 0z"/><path ${S} fill="#9aa4ad" d="M44 8l8-3v20l-8-3z"/>`,
  screwdriver: `<path ${S} fill="#ff6a13" d="M21 4h18c4 0 6 4 6 8v34c0 4-2 8-6 8H21c-4 0-6-4-6-8V12c0-4 2-8 6-8z"/><path ${S} fill="#9aa4ad" d="M27 54h6v50l-3 4-3-4z"/><path d="M22 14v30M30 14v30M38 14v30" stroke="#161616" stroke-width="2" opacity=".4"/>`,
  pliers: `<path ${S} fill="#ffcf2d" d="M14 100l8-46h6l-4 46zM46 100l-8-46h-6l4 46z"/><path ${S} fill="#9aa4ad" d="M22 54c-6-10-6-26 4-44h8c10 18 10 34 4 44z"/><circle cx="30" cy="48" r="3.5" fill="#161616"/>`,
  drill: `<path ${S} fill="#ffcf2d" d="M6 20h40c6 0 8 4 8 10v12H6z"/><path ${S} fill="#2a2a2a" d="M16 42h18v36H16z"/><path ${S} fill="#9aa4ad" d="M46 24h8v14h-8zM54 28h4v6h-4z"/><path ${S} fill="#2a2a2a" d="M14 78h22l-3 24H17z"/>`,
  saw: `<path ${S} fill="#c9ced2" d="M26 4h8c10 20 12 46 6 72H20C14 50 16 24 26 4z"/><path d="M21 76l-2 2M24 76l-2 2M27 76l-2 2" stroke="#161616" stroke-width="2"/><path ${S} fill="#c9843e" d="M16 76h28v10a8 8 0 01-8 8h-12a8 8 0 01-8-8z"/><ellipse cx="30" cy="86" rx="6" ry="4" fill="#161616"/>`,
  multimeter: `<rect ${S} x="10" y="6" width="40" height="98" rx="8" fill="#ffcf2d"/><rect ${S} x="16" y="14" width="28" height="22" fill="#a8d5a2"/><circle ${S} cx="30" cy="62" r="13" fill="#2a2a2a"/><path d="M30 62l7-8" stroke="#ff6a13" stroke-width="3"/><circle cx="20" cy="92" r="3.5" fill="#161616"/><circle cx="40" cy="92" r="3.5" fill="#d1301f"/>`,
  iron: `<path ${S} fill="#c9843e" d="M20 4h20l2 54H18z"/><path ${S} fill="#9aa4ad" d="M25 58h10v26h-10z"/><path ${S} fill="#ff6a13" d="M27 84h6l-3 22z"/>`,
  tape: `<circle ${S} cx="30" cy="38" r="26" fill="#ffcf2d"/><circle ${S} cx="30" cy="38" r="12" fill="#fff4c4"/><path ${S} fill="#9aa4ad" d="M26 62h22v8H26z"/><path d="M34 38l16-14" stroke="#161616" stroke-width="2"/>`,
}
const TW = 60, TH = 110, LH = 24

// css box is the unscaled tool; physics body is the scaled one. position the box so its centre sits on the body.
function place(s) {
  for (const t of s.tools) {
    const { x, y } = t.body.position
    t.el.style.transform = `translate3d(${x - TW / 2}px, ${y - (TH + LH) / 2}px, 0) rotate(${t.body.angle}rad) scale(${s.scale})`
  }
}

export default function Workshop() {
  const root = useRef(), board = useRef()
  const vis = useVisible(root)
  const sim = useRef(null)
  const [height, setHeight] = useState(760)
  const [stats, setStats] = useState({ off: 0 })
  const [built, setBuilt] = useState(0)

  const build = useCallback(() => {
    const el = board.current
    if (!el) return
    const w = el.clientWidth
    const scale = w < 560 ? 0.78 : 1
    const colW = (TW + 46) * scale
    const cols = clamp(Math.floor((w - 40) / colW), 3, 9)
    const rows = Math.ceil(TOOLS.length / cols)
    const rowH = (TH + LH + 54) * scale
    const top = 170
    const H = top + rows * rowH + 170
    setHeight(H)
    const floorY = H - 56
    const engine = Engine.create({ gravity: { y: 1.1 } })
    const world = engine.world
    Composite.add(world, [
      Bodies.rectangle(w / 2, floorY + 60, w * 2, 120, { isStatic: true, friction: 0.8 }),
      Bodies.rectangle(-30, H / 2, 60, H * 3, { isStatic: true }),
      Bodies.rectangle(w + 30, H / 2, 60, H * 3, { isStatic: true }),
    ])
    const startX = (w - (cols - 1) * colW) / 2
    const tools = TOOLS.map(([name, kind], i) => {
      const c = i % cols, r = Math.floor(i / cols)
      const bw = TW * scale, bh = (TH + LH) * scale
      const peg = { x: startX + c * colW, y: top + r * rowH }
      const body = Bodies.rectangle(peg.x, peg.y + bh / 2 - 6, bw, bh, { restitution: 0.25, friction: 0.6, frictionAir: 0.012, density: 0.002 })
      const pin = Constraint.create({ pointA: peg, bodyB: body, pointB: { x: 0, y: -bh / 2 + 6 }, stiffness: 1, length: 0 })
      Composite.add(world, [body, pin])
      return { name, kind, body, pin, peg, bw, bh, off: false, el: el.querySelectorAll('.tool')[i] }
    })
    // tools tinking into each other
    let last = 0
    Events.on(engine, 'collisionStart', (e) => {
      const now = performance.now()
      if (now - last < 70) return
      for (const p of e.pairs) {
        const v = Math.abs(p.bodyA.velocity.y) + Math.abs(p.bodyB.velocity.y) + Math.abs(p.bodyA.velocity.x) + Math.abs(p.bodyB.velocity.x)
        if (v > 3) { last = now; beep(260 + Math.random() * 380, 0.05, 'triangle', Math.min(0.035, v * 0.004)); break }
      }
    })
    sim.current = { engine, tools, w, drag: null, scale }
    place(sim.current)
    setBuilt((b) => b + 1)
    // a little clatter when the world loads: tools swing on their hooks
    tools.forEach((t, i) => Body.setAngularVelocity(t.body, (i % 2 ? 1 : -1) * 0.04))
  }, [])

  useEffect(() => {
    build()
    let t
    const ro = new ResizeObserver(() => { clearTimeout(t); t = setTimeout(() => { if (sim.current && Math.abs(sim.current.w - board.current.clientWidth) > 40) build() }, 200) })
    ro.observe(board.current)
    return () => { ro.disconnect(); clearTimeout(t) }
  }, [build])

  useTick((_, dt) => {
    const s = sim.current
    if (!s) return
    Engine.update(s.engine, Math.min(dt * 1000, 16.6))
    place(s)
    if (s.drag) {
      s.drag.c.pointA.x = s.drag.px; s.drag.c.pointA.y = s.drag.py
    }
  }, vis)

  // custom drag. mouse: grab instantly. finger: press and hold ~170ms to pick a tool up, so a normal swipe over the tools still
  // scrolls the page (the tools cover most of the board, so grabbing instantly made the page impossible to scroll on a phone).
  const pend = useRef(null)
  const grab = (i, cx, cy, el, pid) => {
    const s = sim.current
    const t = s.tools[i]
    const r = board.current.getBoundingClientRect()
    const px = cx - r.left, py = cy - r.top
    if (!t.off) {
      Composite.remove(s.engine.world, t.pin); t.off = true
      setStats((o) => ({ off: o.off + 1 }))
    }
    const local = { x: px - t.body.position.x, y: py - t.body.position.y }
    // rotate the grab point into the body's frame so it stays under the finger
    const a = -t.body.angle
    const pb = { x: local.x * Math.cos(a) - local.y * Math.sin(a), y: local.x * Math.sin(a) + local.y * Math.cos(a) }
    const c = Constraint.create({ pointA: { x: px, y: py }, bodyB: t.body, pointB: pb, stiffness: 0.16, damping: 0.12, length: 0 })
    Composite.add(s.engine.world, c)
    s.drag = { c, px, py, i }
    try { el.setPointerCapture(pid) } catch {}
    el.classList.add('held')
    beep(500, 0.03, 'triangle', 0.02)
  }
  const down = (e, i) => {
    if (e.pointerType !== 'touch') return grab(i, e.clientX, e.clientY, e.currentTarget, e.pointerId)
    const el = e.currentTarget, id = e.pointerId, x = e.clientX, y = e.clientY
    clearTimeout(pend.current?.timer)
    pend.current = { x, y, timer: setTimeout(() => { pend.current = null; navigator.vibrate?.(12); grab(i, x, y, el, id) }, 170) }
  }
  const mv = (e) => {
    const s = sim.current
    if (pend.current && Math.hypot(e.clientX - pend.current.x, e.clientY - pend.current.y) > 8) { clearTimeout(pend.current.timer); pend.current = null } // they're scrolling
    if (!s?.drag) return
    const r = board.current.getBoundingClientRect()
    s.drag.px = clamp(e.clientX - r.left, 0, s.w); s.drag.py = clamp(e.clientY - r.top, 0, height)
  }
  const up = (e) => {
    if (pend.current) { clearTimeout(pend.current.timer); pend.current = null }
    const s = sim.current
    if (!s?.drag) return
    const t = s.tools[s.drag.i]
    Composite.remove(s.engine.world, s.drag.c)
    const sp = Math.hypot(t.body.velocity.x, t.body.velocity.y)
    if (sp > 22) { unlock('fling'); Body.setAngularVelocity(t.body, t.body.angularVelocity + (Math.random() - 0.5) * 0.3) }
    s.drag = null
    e.currentTarget.classList.remove('held')
  }
  // once a tool is held, the page must not scroll under the finger (react's touchmove is passive, so this needs a native listener)
  useEffect(() => {
    const el = board.current
    const stop = (e) => { if (sim.current?.drag && e.cancelable) e.preventDefault() }
    el.addEventListener('touchmove', stop, { passive: false })
    return () => el.removeEventListener('touchmove', stop)
  }, [])
  const rehang = () => {
    const s = sim.current
    s.tools.forEach((t, i) => {
      if (t.off) { Composite.add(s.engine.world, t.pin); t.off = false }
      Body.setPosition(t.body, { x: t.peg.x, y: t.peg.y - 120 }); Body.setVelocity(t.body, { x: 0, y: 0 }); Body.setAngle(t.body, 0)
      setTimeout(() => Body.setAngularVelocity(t.body, (i % 2 ? 1 : -1) * 0.05), 200)
    })
    setStats({ off: 0 })
    beep(400, 0.1, 'sawtooth', 0.03, 200)
  }

  return (
    <section className="w-workshop" ref={root}>
      <Window title="workshop.app" barClass="ws-bar">
        <div className="ws-top">
          <h2>the workshop</h2>
          <p>every skill is a tool. grab one off the pegboard. throw it across the room. it's a workshop, not a museum.</p>
          <button className="label-btn" onClick={rehang}>RE-HANG EVERYTHING</button>
          <span className="ws-count">{stats.off ? `${stats.off} tool${stats.off > 1 ? 's' : ''} off the wall. someone has to clean that up.` : 'all tools hung. suspiciously tidy.'}</span>
        </div>
        <div className="ws-board" ref={board} style={{ height }}>
          {TOOLS.map(([name, kind], i) => (
            <div className="tool" key={name} onPointerDown={(e) => built && down(e, i)} onPointerMove={mv} onPointerUp={up} onPointerCancel={up} style={{ width: TW, height: TH + LH }}>
              <svg viewBox="0 0 60 110" width={TW} height={TH} dangerouslySetInnerHTML={{ __html: SHAPES[kind] }} aria-hidden />
              <span className="tool-label">{name}</span>
            </div>
          ))}
          <div className="bench" aria-hidden />
        </div>
      </Window>
    </section>
  )
}
