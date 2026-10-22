import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Window } from '../ui/Window'
import { WINS } from '../data/content'
import { useTick, useVisible, rand } from '../lib/hooks'
import { unlock } from '../lib/store'
import { coin, zap, boom, beep } from '../lib/audio'
import './arcade.css'

const W = 320, H = 240
const SPR = {
  ship: ['...11...', '...11...', '..1111..', '.111111.', '11111111', '11.11.11'],
  a: ['1.1..1.1', '.111111.', '11.11.11', '11111111', '.1.11.1.', '1......1'],
  b: ['..1111..', '.111111.', '11.11.11', '11111111', '.11..11.', '1.1..1.1'],
  c: ['1..11..1', '.111111.', '11111111', '1.1111.1', '..1..1..', '.1.11.1.'],
}
const LABELS = ['null', 'undefined', 'NaN', 'off-by-one', 'merge conflict', '404', 'segfault', 'race condition']
const HI_KEY = 'rt_arcade_hi'
const loadHi = () => { try { return JSON.parse(localStorage.getItem(HI_KEY) || '[]') } catch { return [] } }

function sprite(g, rows, x, y, s, color) {
  g.fillStyle = color
  rows.forEach((r, j) => [...r].forEach((c, i) => c === '1' && g.fillRect(Math.round(x + (i - 4) * s), Math.round(y + (j - 3) * s), s, s)))
}

export default function Arcade() {
  const root = useRef(), screen = useRef(), cv = useRef(), hud = useRef({})
  const vis = useVisible(root)
  const [mode, setMode] = useState('attract') // attract | play | over
  const [score, setScore] = useState(0)
  const [hi, setHi] = useState(loadHi)
  const [initials, setInitials] = useState('')
  const G = useRef(null)
  const keys = useRef({})

  // crt power-on when the world scrolls in
  useEffect(() => {
    const el = screen.current
    const t = gsap.fromTo(el, { scaleY: 0.01, scaleX: 0.7, filter: 'brightness(4)' }, { scaleY: 1, scaleX: 1, filter: 'brightness(1)', duration: 0.7, ease: 'steps(7)', paused: true })
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { t.play(); io.disconnect() } }, { threshold: 0.3 })
    io.observe(el)
    return () => { io.disconnect(); t.kill() }
  }, [])

  const start = () => {
    coin()
    const lives = window.__lives || 3
    G.current = { x: W / 2, tx: W / 2, bullets: [], bugs: [], parts: [], t: 0, score: 0, lives, wave: 1, kills: 0, spawn: 0.4, fire: 0, banner: { text: 'wave 1 — ' + WINS[0].name, t: 2.2 }, boss: false, stars: Array.from({ length: 40 }, () => ({ x: rand(0, W), y: rand(0, H), s: rand(10, 50) })) }
    setScore(0); setInitials(''); setMode('play')
  }

  useEffect(() => {
    const kd = (e) => {
      if (mode === 'attract' && vis && (e.key === 'c' || e.key === 'C') && e.target.tagName !== 'INPUT') start()
      keys.current[e.key] = true
      if (mode === 'play' && ['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault()
    }
    const ku = (e) => { keys.current[e.key] = false }
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku)
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku) }
    // eslint-disable-next-line
  }, [mode, vis])

  useTick((_, dt) => {
    const s = G.current
    if (!s || mode !== 'play' || s.over || !cv.current) return
    dt = Math.min(dt, 0.05)
    s.t += dt
    if (keys.current.ArrowLeft || keys.current.a) s.tx -= 190 * dt
    if (keys.current.ArrowRight || keys.current.d) s.tx += 190 * dt
    s.tx = Math.max(10, Math.min(W - 10, s.tx))
    s.x += (s.tx - s.x) * Math.min(1, dt * 14)
    s.fire -= dt
    if (s.fire <= 0) { s.bullets.push({ x: s.x, y: 205 }); s.fire = 0.2; zap() }
    s.bullets.forEach((b) => (b.y -= 280 * dt)); s.bullets = s.bullets.filter((b) => b.y > -6)

    s.spawn -= dt
    if (s.spawn <= 0) {
      s.spawn = Math.max(0.28, 1.15 - s.wave * 0.09)
      if (!s.boss && s.kills > 0 && s.kills % 18 === 0 && !s.bossDone?.[s.kills]) {
        s.boss = true; (s.bossDone ||= {})[s.kills] = true
        s.bugs.push({ x0: W / 2, x: W / 2, y: -10, vy: 9, amp: 70, ph: 0, hp: 14, boss: true, k: 'a', label: 'prod bug, friday 5pm' })
      } else {
        s.bugs.push({ x0: rand(24, W - 24), x: 0, y: -8, vy: 20 + s.wave * 4 + rand(0, 12), amp: rand(4, 22), ph: rand(0, 6), hp: 1, k: 'abc'[(Math.random() * 3) | 0], label: Math.random() < 0.25 ? LABELS[(Math.random() * LABELS.length) | 0] : '' })
      }
    }
    for (const b of s.bugs) { b.y += b.vy * dt; b.x = b.x0 + Math.sin(s.t * 2 + b.ph) * b.amp }
    // hits
    for (const b of s.bugs) {
      const hw = b.boss ? 20 : 9, hh = b.boss ? 15 : 8
      for (const bl of s.bullets) {
        if (!bl.dead && Math.abs(bl.x - b.x) < hw && Math.abs(bl.y - b.y) < hh) {
          bl.dead = true; b.hp--; b.flash = 0.08
          if (b.hp <= 0) {
            b.dead = true; s.kills++; s.score += b.boss ? 200 : 10
            if (b.boss) s.boss = false
            boom()
            for (let i = 0; i < (b.boss ? 40 : 10); i++) s.parts.push({ x: b.x, y: b.y, vx: rand(-90, 90), vy: rand(-90, 90), life: rand(0.3, 0.8) })
            const w = 1 + Math.floor(s.kills / 12)
            if (w !== s.wave) { s.wave = w; s.banner = { text: `wave ${w} — ${WINS[(w - 1) % WINS.length].name}`, t: 2.2 }; beep(1200, 0.2) }
            setScore(s.score)
          }
          break
        }
      }
    }
    s.bullets = s.bullets.filter((b) => !b.dead)
    for (const b of s.bugs) if (!b.dead && b.y > 222) { b.dead = true; s.lives--; beep(90, 0.3, 'sawtooth', 0.06); if (b.boss) s.boss = false }
    s.bugs = s.bugs.filter((b) => !b.dead)
    s.parts.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt }); s.parts = s.parts.filter((p) => p.life > 0)
    if (s.banner) { s.banner.t -= dt; if (s.banner.t <= 0) s.banner = null }
    if (hud.current.lives) hud.current.lives.textContent = 'lives ' + '♥'.repeat(Math.min(s.lives, 8)) + (s.lives > 8 ? '+' + (s.lives - 8) : '')
    if (hud.current.score) hud.current.score.textContent = String(s.score).padStart(5, '0')

    // draw
    const g = cv.current.getContext('2d')
    g.fillStyle = '#05050f'; g.fillRect(0, 0, W, H)
    g.fillStyle = '#9aa0c8'
    s.stars.forEach((st) => { st.y = (st.y + st.s * dt) % H; g.fillRect(st.x, st.y, 1, 1) })
    for (const b of s.bugs) {
      if (b.boss) { sprite(g, SPR.a, b.x, b.y, 5, b.flash > 0 ? '#fff' : '#ff2d55'); g.fillStyle = '#ffe600'; g.fillRect(b.x - 20, b.y - 22, (40 * b.hp) / 14, 3) }
      else sprite(g, SPR[b.k], b.x, b.y, 2, b.flash > 0 ? '#fff' : ['#00f0ff', '#ffe600', '#7dff6a'][b.k.charCodeAt(0) - 97])
      if (b.flash > 0) b.flash -= dt
      if (b.label) { g.fillStyle = '#ff2d55'; g.font = '7px monospace'; g.textAlign = 'center'; g.fillText(b.label, b.x, b.y - (b.boss ? 26 : 10)) }
    }
    g.fillStyle = '#fff'; s.bullets.forEach((b) => g.fillRect(b.x - 1, b.y, 2, 6))
    sprite(g, SPR.ship, s.x, 218, 2, '#ffe600')
    g.fillStyle = '#ff9a3d'; s.parts.forEach((p) => g.fillRect(p.x, p.y, 2, 2))
    if (s.banner) { g.fillStyle = '#00f0ff'; g.font = '10px "Press Start 2P", monospace'; g.textAlign = 'center'; g.fillText(s.banner.text.toUpperCase(), W / 2, 110) }
    if (s.lives <= 0) { s.over = true; setMode('over'); boom() }
  }, vis && mode === 'play')

  const move = (e) => {
    if (mode !== 'play' || !G.current) return
    const r = cv.current.getBoundingClientRect()
    G.current.tx = ((e.clientX - r.left) / r.width) * W
  }
  const save = () => {
    const name = (initials || 'RT').toUpperCase().slice(0, 3)
    const next = [...hi, { name, score: G.current.score }].sort((a, b) => b.score - a.score).slice(0, 5)
    setHi(next); try { localStorage.setItem(HI_KEY, JSON.stringify(next)) } catch {}
    unlock('highscore'); setMode('attract')
  }
  const final = G.current?.score || 0

  return (
    <section className="w-arcade" ref={root}>
      <Window title="arcade.app" barClass="ar-bar">
        <div className="ar">
          <div className="ar-cab">
            <div className="ar-marquee">RISHIT <i>ARCADE</i></div>
            <div className="crt" ref={screen}>
              <div className="crt-in">
                {mode === 'attract' && (
                  <div className="attract">
                    <h3>HIGH SCORES</h3>
                    <p className="sub">(these are real wins. i checked.)</p>
                    <ol>
                      {WINS.map((w, i) => (
                        <li key={w.name} className={'pl-' + w.place[0]}><span>{String(i + 1).padStart(2, '0')}</span><b>{w.place}</b><span className="nm">{w.name}</span></li>
                      ))}
                    </ol>
                    {hi.length > 0 && <p className="visitors">VISITORS: {hi.map((h) => `${h.name} ${h.score}`).join('  ·  ')}</p>}
                    <button className="insert" onClick={start}>INSERT COIN</button>
                  </div>
                )}
                {mode !== 'attract' && (
                  <div className={'game' + (mode === 'play' ? ' playing' : '')}>
                    <canvas ref={cv} width={W} height={H} onPointerMove={move} onPointerDown={move} />
                    <div className="hud"><span ref={(e) => (hud.current.score = e)}>00000</span><span ref={(e) => (hud.current.lives = e)}>lives</span></div>
                    {mode === 'over' && (
                      <div className="over">
                        <h3>GAME OVER</h3>
                        <p>SCORE {final}</p>
                        {final >= 150
                          ? <><p>ENTER INITIALS</p><input maxLength={3} value={initials} onChange={(e) => setInitials(e.target.value.replace(/[^a-z]/gi, ''))} autoFocus aria-label="initials" /><button onClick={save}>SAVE</button></>
                          : <><p className="sub">150+ gets you on the board</p><button onClick={start}>CONTINUE? 9..8..</button></>}
                      </div>
                    )}
                    {mode === 'play' && <button className="quit" onClick={() => setMode('attract')}>quit</button>}
                  </div>
                )}
              </div>
            </div>
          </div>
          <aside className="ar-side">
            <h4>how to play</h4>
            <p>move your mouse / drag your finger / arrow keys. it auto-fires. the bugs are named after real bugs i've met. every wave is named after a hackathon i won.</p>
            <p className="coin-hint">press <kbd>c</kbd> to insert a coin.</p>
            <p className="sub">tip: there's a famous cheat code for extra lives. you know the one.</p>
          </aside>
        </div>
      </Window>
    </section>
  )
}
