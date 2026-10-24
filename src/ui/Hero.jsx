import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import Terminal from './Terminal'
const Robot = lazy(() => import('./Robot')) // three.js + r3f: loaded after first paint so it can't block LCP
import { BOOT_STACK, WINS, ME } from '../data/content'
import { loadGithub, quickGithub } from '../lib/github'
import { on, emit } from '../lib/bus'
import { unlock } from '../lib/store'
import { stopScroll, velocity } from '../lib/scroll'
import { useTick, useVisible } from '../lib/hooks'
import { beep } from '../lib/audio'

/* ---------------- BIOS ---------------- */
function Bios({ done }) {
  const [lines, setLines] = useState([])
  const root = useRef()
  const finished = useRef(false)

  useEffect(() => {
    let alive = true
    const gh = quickGithub().catch(() => null)
    const script = [
      ['RISHIT_OS BIOS v4.2.0   (c) 2026 rishit tandon. some rights reserved.', 120],
      ['cpu0: caffeine-powered @ 3 cups      mem: 16384K ... ', 60, 'ok'],
      ['detecting hardware', 120],
      ['  [ ok ] robots ............ 3 found, 1 is sulking', 90],
      ['  [ ok ] ai glasses ........ calibrated', 70],
      ['  [ ok ] bci headset ....... reading thoughts (mostly about food)', 90],
      ['  [ ok ] drone swarm ....... crux, oberon, capella', 90],
      ['loading stack', 160],
      ...BOOT_STACK.map((s) => [`  [ ok ] ${s}`, 28]),
      ['mounting /home/rishit ... done', 140],
      ['checking trophies ....... 12+ wins, 6 firsts', 120],
      ['pulling live contributions from github ...', 100, 'gh'],
      ['starting window server ... done', 200],
      ['welcome. there is no template here.', 400],
    ]
    ;(async () => {
      for (const [text, wait, kind] of script) {
        if (!alive) return
        let t = text
        if (kind === 'ok') t += '16384K OK'
        if (kind === 'gh') { const d = await Promise.race([gh, new Promise((r) => setTimeout(r, 900))]); t += d ? ` ${d.total.toLocaleString()} (${d.live ? 'live' : 'cached'})` : ' offline, using snapshot' }
        setLines((l) => [...l, t])
        beep(1800, 0.01, 'square', 0.006)
        await new Promise((r) => setTimeout(r, wait))
      }
      if (alive) finish()
    })()
    return () => { alive = false }
    // eslint-disable-next-line
  }, [])

  const finish = () => {
    if (finished.current) return
    finished.current = true
    gsap.timeline({ onComplete: done })
      .to(root.current, { scaleY: 0.006, duration: 0.28, ease: 'power4.in' })
      .to(root.current, { scaleX: 0, duration: 0.14 })
  }
  useEffect(() => {
    const k = (e) => { if (e.key === ' ' || e.key.startsWith('Arrow')) e.preventDefault(); finish() } // space would also page-down
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])
  // keep the newest line in view by moving the text with a transform (a scrollTop change counts as layout shift, a transform does not)
  useEffect(() => { const el = root.current, pre = el.firstChild; const room = el.clientHeight - 150; pre.style.transform = `translateY(${-Math.max(0, pre.offsetHeight - room)}px)` }, [lines])

  return (
    <div className="bios" ref={root} onClick={finish}>
      <pre>{lines.join('\n')}<span className="blink">█</span></pre>
      <small>press any key to skip. nobody reads these anyway.</small>
    </div>
  )
}

/* ---------------- headline you can poke ---------------- */
const HEAD = [['i write code', 'that writes code,'], ['build robots,'], ['and win hackathons.']]

function Headline({ ready }) {
  const root = useRef()
  const m = useRef({ x: -999, y: -999, on: false })
  const vis = useVisible(root)

  useLayoutEffect(() => {
    if (!ready) return
    const chars = root.current.querySelectorAll('.ch')
    // letters fall in and bounce, like they were dropped on the desk
    gsap.fromTo(chars, { y: () => -gsap.utils.random(120, 420), rotate: () => gsap.utils.random(-50, 50), opacity: 0 }, { y: 0, rotate: 0, opacity: 1, duration: 1.1, ease: 'bounce.out', stagger: { each: 0.018, from: 'random' } })
  }, [ready])

  useEffect(() => {
    const el = root.current
    const mv = (e) => { if (e.pointerType === 'touch') return; m.current.x = e.clientX; m.current.y = e.clientY; m.current.on = true }
    const lv = () => { m.current.on = false }
    el.addEventListener('pointermove', mv); el.addEventListener('pointerleave', lv)
    return () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerleave', lv) }
  }, [])

  // letters near the cursor get shoved away and spring back. page scroll velocity skews the whole line.
  const state = useRef({ cache: null, frame: 0 })
  useTick(() => {
    const el = root.current
    if (!el) return
    const s = state.current
    el.style.setProperty('--sk', (Math.max(-8, Math.min(8, velocity() * -0.12))).toFixed(2) + 'deg')
    if (!m.current.on && !s.moving) return
    const chars = el.querySelectorAll('.ch')
    let any = false
    chars.forEach((c) => {
      const r = c.getBoundingClientRect()
      const cx = r.left + r.width / 2 - (c._ox || 0), cy = r.top + r.height / 2 - (c._oy || 0)
      let tx = 0, ty = 0
      if (m.current.on) {
        const dx = cx - m.current.x, dy = cy - m.current.y, d = Math.hypot(dx, dy)
        if (d < 110) { const f = (1 - d / 110) * 46; tx = (dx / (d || 1)) * f; ty = (dy / (d || 1)) * f }
      }
      c._ox = (c._ox || 0) + (tx - (c._ox || 0)) * 0.18
      c._oy = (c._oy || 0) + (ty - (c._oy || 0)) * 0.18
      if (Math.abs(c._ox) + Math.abs(c._oy) > 0.05) { c.style.translate = `${c._ox}px ${c._oy}px`; any = true } else if (c.style.translate) c.style.translate = ''
    })
    s.moving = any
  }, vis)

  return (
    <p className="headline" role="img" ref={root} aria-label="i write code that writes code, build robots, and win hackathons.">
      {HEAD.map((line, li) => (
        <span className="hl" key={li} aria-hidden>
          {line.join(' ').split(' ').map((w, wi) => (
            <span className="word" key={wi}>{[...w].map((c, ci) => <span className="ch" key={ci}>{c}</span>)}</span>
          ))}
        </span>
      ))}
    </p>
  )
}

/* ---------------- live numbers ---------------- */
function Stat({ n, label, suffix = '' }) {
  const ref = useRef()
  useEffect(() => {
    if (n == null) return
    const o = { v: 0 }
    gsap.to(o, { v: n, duration: 1.6, ease: 'power3.out', onUpdate: () => { if (ref.current) ref.current.textContent = Math.round(o.v).toLocaleString() + suffix } })
  }, [n, suffix])
  return <div className="stat"><b ref={ref}>{n == null ? '···' : '0'}</b><span>{label}</span></div>
}

/* ---------------- the sticky note with the todo ---------------- */
function Sticky() {
  const [n, setN] = useState(0)
  const [dim, setDim] = useState(false)
  const poke = () => {
    const k = n + 1
    setN(k)
    if (k >= 3) { unlock('insomnia'); setDim(true); setTimeout(() => setDim(false), 3200); setN(0) }
  }
  return (
    <>
      <div className="sticky" aria-label="todo list">
        <b>todo.txt</b>
        <p className="done">[x] win hackathons</p>
        <p className="done">[x] ship this site</p>
        <p>[ ] 10,000 commits</p>
        <button onClick={poke}>[ ] sleep{n ? '.'.repeat(n) : ''}</button>
      </div>
      {dim && <div className="nope" onClick={() => setDim(false)}><p>nope. shipping first.</p><small>(click to go back to being awake)</small></div>}
    </>
  )
}

/* ---------------- hero ---------------- */
export default function Hero() {
  const seen = useRef((() => { try { return sessionStorage.getItem('rt_booted') === '1' } catch { return false } })())
  const [phase, setPhase] = useState(seen.current ? 'desk' : 'boot')
  const [gh, setGh] = useState(null)
  const root = useRef()

  useEffect(() => {
    quickGithub().then(setGh)
    // upgrade to live numbers on the first real interaction (a click, key, touch or scroll), never during load
    const live = () => loadGithub().then(setGh)
    const evs = ['pointerdown', 'keydown', 'touchstart', 'scroll']
    evs.forEach((e) => addEventListener(e, live, { once: true, passive: true }))
    return () => evs.forEach((e) => removeEventListener(e, live))
  }, [])
  // the 3d robot (three.js + r3f, ~1mb) mounts 2.5s after the boot screen is gone, or immediately if the visitor interacts first.
  // it is never part of the first load, so it can't block the first paint or add to blocking time.
  const [robotOn, setRobotOn] = useState(false)
  useEffect(() => {
    if (phase !== 'desk' || robotOn) return
    const evs = ['pointerdown', 'touchstart', 'keydown', 'wheel']
    let t
    const go = () => { evs.forEach((e) => removeEventListener(e, go)); clearTimeout(t); ('requestIdleCallback' in window ? requestIdleCallback(() => setRobotOn(true), { timeout: 800 }) : setTimeout(() => setRobotOn(true), 100)) }
    t = setTimeout(go, 2500)
    evs.forEach((e) => addEventListener(e, go, { passive: true }))
    return () => { evs.forEach((e) => removeEventListener(e, go)); clearTimeout(t) }
  }, [phase, robotOn])
  useEffect(() => on('reboot', () => { try { sessionStorage.removeItem('rt_booted') } catch {} setPhase('boot') }), [])
  useEffect(() => { stopScroll(phase === 'boot'); return () => stopScroll(false) }, [phase])
  const bootDone = useCallback(() => { try { sessionStorage.setItem('rt_booted', '1') } catch {} setPhase('desk') }, [])

  useLayoutEffect(() => {
    if (phase !== 'desk') return
    const ctx = gsap.context(() => {
      gsap.from('.desk-win', { y: 40, opacity: 0, duration: 0.7, ease: 'power3.out', delay: 0.25 })
      gsap.from('.robot-wrap', { scale: 0.6, opacity: 0, duration: 0.9, ease: 'back.out(1.6)', delay: 0.35 })
      gsap.from('.stat', { y: 16, opacity: 0, stagger: 0.08, delay: 0.8 })
      gsap.from('.doodle', { opacity: 0, delay: 1.6, duration: 0.6 })
    }, root)
    return () => ctx.revert()
  }, [phase])

  const firsts = WINS.filter((w) => w.place === '1ST').length
  return (
    <section className="hero" ref={root}>
      {phase === 'boot' && <Bios done={bootDone} />}
      <div className="desk">
        <div className="desk-icons" aria-hidden={false}>
          <a href={ME.resume} target="_blank" rel="noreferrer"><i className="ico ico-pdf" />resume.pdf</a>
          <button onClick={() => emit('wipe', 'arcade')}><i className="ico ico-cup" />trophies/</button>
          <button onClick={() => emit('fx', 'crash')}><i className="ico ico-exe" />do_not_open.exe</button>
        </div>

        <div className="desk-main">
          <h1 className="kicker">Rishit Tandon — AI/ML Engineer &amp; Full-Stack Developer</h1>
          <p className="kicker2">final-year cse · srm ist · student convenor, robofest 2.0</p>
          <Headline ready={phase === 'desk'} />
          <p className="lede">i build robots, ai glasses, a wheelchair you steer with your brain, and a drone swarm with names. no templates allowed. <span className="mark">feel free to break things</span> — that's what hackers do.</p>
          <div className="stats">
            <Stat n={gh?.total} label="contributions this year" />
            <Stat n={gh?.user.public_repos} label={gh && !gh.live ? 'public repos (snapshot)' : 'public repos'} />
            <Stat n={WINS.length + 1} label="wins" suffix="+" />
            <Stat n={firsts} label="firsts" />
          </div>
        </div>

        <div className="robot-wrap">
          {robotOn ? <Suspense fallback={<div className="robot-grab" />}><Robot /></Suspense> : <div className="robot-grab" />}
          <svg className="doodle d-arrow" viewBox="0 0 160 110" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden>
            <path d="M6 14c30-14 78-8 104 22 10 12 14 28 12 52" /><path d="M105 78l17 20 18-24" />
          </svg>
          <span className="doodle d-note">grab me. he spins.<br />(not too fast)</span>
        </div>

        <div className="desk-win term-win">
          <div className="win-bar"><span className="win-dots"><b /><b /><b /></span><span className="win-title">terminal — try "help"</span></div>
          <Terminal />
        </div>
        <Sticky />
        <span className="doodle d-under" aria-hidden>↓ scroll. or use the dock. or the terminal. i'm not your boss.</span>
      </div>
    </section>
  )
}
