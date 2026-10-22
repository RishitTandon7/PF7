import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { on, emit } from '../lib/bus'
import { unlock } from '../lib/store'
import { useCanvas2D, useTick, rand } from '../lib/hooks'
import { ME } from '../data/content'
import { stopScroll } from '../lib/scroll'
import { boom, coin } from '../lib/audio'

/* ---------- matrix ---------- */
function Matrix({ done }) {
  const cols = useRef([])
  const glyphs = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄ01{}[]<>/=;$#'
  const ref = useCanvas2D((g, w, h, _t, dt) => {
    if (!cols.current.length) cols.current = Array.from({ length: Math.ceil(w / 16) }, () => rand(-h, 0))
    g.fillStyle = 'rgba(0,10,0,0.12)'
    g.fillRect(0, 0, w, h)
    g.font = '15px "JetBrains Mono", monospace'
    cols.current.forEach((y, i) => {
      g.fillStyle = Math.random() > 0.96 ? '#e0ffe0' : '#27d04a'
      g.fillText(glyphs[(Math.random() * glyphs.length) | 0], i * 16, y)
      cols.current[i] = y > h + rand(0, 400) ? 0 : y + 420 * dt * rand(0.6, 1.4)
    })
  }, true)
  useEffect(() => {
    const t = setTimeout(done, 9000)
    const k = (e) => e.key === 'Escape' && done()
    window.addEventListener('keydown', k)
    return () => { clearTimeout(t); window.removeEventListener('keydown', k) }
  }, [done])
  return (
    <div className="fx fx-matrix" onClick={done}>
      <canvas ref={ref} />
      <p className="fx-type">wake up, recruiter...<br />the matrix has you.<br /><a href={'mailto:' + ME.email} onClick={(e) => e.stopPropagation()}>follow the white rabbit → {ME.email}</a></p>
      <small>click or esc to take the blue pill</small>
    </div>
  )
}

/* ---------- kernel panic ---------- */
const PANIC = [
  '[    0.000000] Linux version rishit_os 4.2.0 (rishit@bed) (gcc: too many tabs open)',
  '[    0.004211] BUG: unable to handle personality at 00000000deadbeef',
  '[    0.004212] kernel panic - not syncing: portfolio has too many hackathon wins to hold in memory',
  '[    0.004213] CPU: 0 PID: 1337 Comm: rishit Tainted: G        W  coffee-0.9',
  'Call Trace:',
  '  dump_stack+0x6d/0x8b',
  '  panic+0x101/0x2e3',
  '  trophy_shelf_overflow+0x12/0x40 [wins]',
  '  firsts_x6_seconds_x2+0x77/0x90 [wins]',
  '  sleep_scheduler_starved+0x9/0x10 [life]',
  '  ret_from_fork+0x35/0x40',
  '---[ end Kernel panic - not syncing: ctrl+s was never pressed ]---',
]
function Crash({ done }) {
  const [n, setN] = useState(0)
  const [cd, setCd] = useState(null)
  useEffect(() => { boom() }, [])
  useEffect(() => {
    if (n < PANIC.length) { const t = setTimeout(() => setN(n + 1), 140); return () => clearTimeout(t) }
    if (cd == null) return setCd(3)
    if (cd === 0) { done(true); return }
    const t = setTimeout(() => setCd(cd - 1), 900)
    return () => clearTimeout(t)
  }, [n, cd, done])
  return (
    <div className="fx fx-crash">
      <pre>{PANIC.slice(0, n).join('\n')}{cd != null && cd > 0 ? `\n\nrebooting in ${cd}...` : ''}<span className="blink">█</span></pre>
    </div>
  )
}

/* ---------- sudo hire rishit ---------- */
function Hire({ done }) {
  const parts = useRef([])
  const root = useRef()
  const ref = useCanvas2D((g, w, h, _t, dt) => {
    g.clearRect(0, 0, w, h)
    if (parts.current.length < 220 && Math.random() < 0.9) {
      for (let i = 0; i < 4; i++) parts.current.push({ x: rand(0, w), y: -20, vx: rand(-60, 60), vy: rand(60, 260), r: rand(0, 6), vr: rand(-6, 6), s: rand(14, 34), c: ['#39d353', '#ffe600', '#ff4d4d', '#f2ecdf', '#38bdf8'][(Math.random() * 5) | 0], ch: '{}[];=>!#$%&*01()'.charAt((Math.random() * 17) | 0) })
    }
    g.textAlign = 'center'
    parts.current = parts.current.filter((p) => p.y < h + 40)
    for (const p of parts.current) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 220 * dt; p.r += p.vr * dt
      g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.font = `800 ${p.s}px "JetBrains Mono"`; g.fillText(p.ch, 0, 0); g.restore()
    }
  }, true)
  useEffect(() => {
    gsap.fromTo(root.current.querySelector('h2'), { scale: 4, rotate: -8, opacity: 0 }, { scale: 1, rotate: -3, opacity: 1, duration: 0.5, ease: 'back.out(1.8)' })
    gsap.fromTo(root.current, { x: 0 }, { keyframes: { x: [-18, 16, -12, 8, 0] }, duration: 0.4 })
    const k = (e) => e.key === 'Escape' && done()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [done])
  return (
    <div className="fx fx-hire" ref={root}>
      <canvas ref={ref} />
      <div className="fx-hire-card">
        <small>$ sudo hire rishit</small>
        <h2>offer accepted.</h2>
        <p>[sudo] password for recruiter: ••••••••<br />ok that was a joke. but the email is real and i answer fast.</p>
        <a className="btn" href={'mailto:' + ME.email + '?subject=hiring%20you%20(sudo)'}>{ME.email}</a>
        <button className="btn ghost" onClick={done}>close (esc)</button>
      </div>
    </div>
  )
}

export default function FX() {
  const [fx, setFx] = useState(null)
  useEffect(() => on('fx', (name) => {
    stopScroll(true)
    setFx(name)
    if (name === 'hire') { unlock('hired'); coin() }
    if (name === 'matrix') unlock('matrix')
    if (name === 'crash') unlock('crash')
  }), [])
  const close = (reboot) => { setFx(null); stopScroll(false); if (reboot === true) emit('reboot') }
  if (fx === 'matrix') return <Matrix done={close} />
  if (fx === 'crash') return <Crash done={close} />
  if (fx === 'hire') return <Hire done={close} />
  return null
}
