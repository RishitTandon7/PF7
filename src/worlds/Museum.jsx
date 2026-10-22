import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Window } from '../ui/Window'
import { CERT_COUNT } from '../data/content'
import { useTick, useVisible } from '../lib/hooks'
import { thunk } from '../lib/audio'
import './museum.css'

gsap.registerPlugin(ScrollTrigger)

const PREVIEW = 8
// the big ones first: 13 = 1st place roboroarz singapore, 37 = 2nd place, 2 = seismo hack 2nd, 38 = nwc expo champ,
// 23 = ml expo best innovation, 39 = bis, 36 = institution of engineers merit, 40 = project expo'24, then the rest
const MAJOR = [13, 37, 2, 38, 23, 39, 36, 40, 4, 34, 1, 3, 22, 5, 14]
const ORDER = [...MAJOR, ...Array.from({ length: CERT_COUNT }, (_, i) => i + 1).filter((n) => !MAJOR.includes(n))]
const CERTS = ORDER.map((n, i) => ({
  n,
  src: `/certificates/cert_${n}.jpg`,
  tilt: [-0.9, 0.5, -0.3, 0.8, -0.6, 0.2][i % 6],
  style: i % 4,
}))

// shown when the jpg isn't there (yet): a drawn-in certificate so the wall never looks broken
function Missing({ n }) {
  return (
    <div className="missing">
      <b>CERTIFICATE</b>
      <span>of something impressive</span>
      <i>cert_{n}.jpg</i>
      <em>drop the file in /public/certificates</em>
    </div>
  )
}

function Frame({ c, open }) {
  const [bad, setBad] = useState(false)
  return (
    <figure className={`frame f${c.style}`} data-tilt={c.tilt} style={{ transform: `rotate(${c.tilt}deg)` }}>
      <svg className="wire" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden><path d="M50 0 L12 30 M50 0 L88 30" /></svg>
      <button className="mat" onClick={() => open(c.n)} aria-label={`open certificate ${c.n}`}>
        {bad ? <Missing n={c.n} /> : <img src={c.src} alt={`certificate ${c.n}`} loading="lazy" decoding="async" onError={() => setBad(true)} />}
      </button>
      <figcaption>exhibit {String(c.n).padStart(2, '0')}</figcaption>
    </figure>
  )
}

export default function Museum() {
  const root = useRef(), wall = useRef(), spot = useRef()
  const vis = useVisible(root)
  const [lb, setLb] = useState(null)
  const [more, setMore] = useState(false)
  const [bad, setBad] = useState({})
  const pointer = useRef({ x: 0, y: 0, has: false, t: 0 })

  // frames swing in on their wires, one batch at a time (re-runs when 'see more' adds frames; already-hung ones are skipped)
  useLayoutEffect(() => {
    const frames = [...wall.current.querySelectorAll('.frame')].filter((f) => !f.dataset.done)
    if (!frames.length) return
    gsap.set(frames, { opacity: 0 })
    const batch = ScrollTrigger.batch(frames, {
      start: 'top 92%', once: true,
      onEnter: (els) => els.forEach((el, i) => { el.dataset.done = '1'; gsap.fromTo(el, { rotation: (i % 2 ? 1 : -1) * 10, opacity: 0, transformOrigin: '50% 0%' }, { rotation: parseFloat(el.dataset.tilt), opacity: 1, duration: 1.5, delay: i * 0.07, ease: 'elastic.out(1, 0.35)' }) }),
    })
    return () => batch.forEach((s) => s.kill())
  }, [more])

  // the lights come on with a flicker the first time you walk in
  useEffect(() => {
    const el = spot.current
    const t = gsap.timeline({ paused: true }).fromTo(el, { opacity: 1 }, { keyframes: { opacity: [1, 0.35, 1, 0.2, 0.9, 0.5, 0.75] }, duration: 1.1, ease: 'steps(1)' })
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { t.play(); thunk(); setTimeout(thunk, 300); io.disconnect() } }, { threshold: 0.15 })
    io.observe(wall.current)
    return () => { io.disconnect(); t.kill() }
  }, [])

  useEffect(() => {
    const mv = (e) => { if (e.pointerType === 'mouse') { pointer.current.x = e.clientX; pointer.current.y = e.clientY; pointer.current.has = true } }
    window.addEventListener('pointermove', mv, { passive: true })
    return () => window.removeEventListener('pointermove', mv)
  }, [])

  // spotlight: follows the cursor, and wanders on its own if you have no cursor (phones)
  const cur = useRef({ x: 400, y: 300 })
  useTick((t) => {
    const r = wall.current.getBoundingClientRect()
    const p = pointer.current
    const tx = p.has ? p.x : innerWidth / 2 + Math.sin(t * 0.5) * innerWidth * 0.32
    const ty = p.has ? p.y : innerHeight / 2 + Math.sin(t * 0.77) * innerHeight * 0.22
    cur.current.x += (tx - r.left - cur.current.x) * 0.1
    cur.current.y += (ty - r.top - cur.current.y) * 0.1
    spot.current.style.transform = `translate3d(${cur.current.x - 400}px, ${cur.current.y - 400}px, 0) scale(4)`
  }, vis)

  useEffect(() => {
    if (lb == null) return
    const k = (e) => {
      if (e.key === 'Escape') setLb(null)
      if (e.key === 'ArrowRight') setLb((n) => (n % CERT_COUNT) + 1)
      if (e.key === 'ArrowLeft') setLb((n) => ((n - 2 + CERT_COUNT) % CERT_COUNT) + 1)
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [lb])

  return (
    <section className="w-museum" ref={root}>
      <Window title="museum.app" barClass="mu-bar">
        <header className="mu-head">
          <p>— permanent collection —</p>
          <h2>the museum</h2>
          <p className="mu-sub">{CERT_COUNT} pieces of paper that say i did the thing. here are a few. the lights are on a timer. move your cursor to find them.</p>
        </header>
        <div className="mu-wall" ref={wall}>
          <div className="mu-cols">{CERTS.slice(0, more ? CERT_COUNT : PREVIEW).map((c) => <Frame key={c.n} c={c} open={setLb} />)}</div>
          <div className="spot" ref={spot} aria-hidden />
        </div>
        <div className="mu-more">
          <button onClick={() => { setMore((x) => !x); if (more) setTimeout(() => root.current.scrollIntoView({ behavior: 'smooth' }), 50) }}>{more ? 'show fewer' : `see all ${CERT_COUNT} certificates (+${CERT_COUNT - PREVIEW} more)`}</button>
        </div>
        <p className="mu-foot">please do not touch the exhibits. (you may click them.)</p>
      </Window>
      {lb != null && (
        <div className="lightbox" onClick={() => setLb(null)} role="dialog" aria-modal="true">
          {bad[lb] ? <Missing n={lb} /> : <img src={`/certificates/cert_${lb}.jpg`} alt={`certificate ${lb}`} onError={() => setBad((b) => ({ ...b, [lb]: true }))} onClick={(e) => e.stopPropagation()} />}
          <button className="lb-nav prev" onClick={(e) => { e.stopPropagation(); setLb(((lb - 2 + CERT_COUNT) % CERT_COUNT) + 1) }} aria-label="previous">←</button>
          <button className="lb-nav next" onClick={(e) => { e.stopPropagation(); setLb((lb % CERT_COUNT) + 1) }} aria-label="next">→</button>
          <span className="lb-count">exhibit {String(lb).padStart(2, '0')} / {CERT_COUNT} · esc to leave</span>
        </div>
      )}
    </section>
  )
}
