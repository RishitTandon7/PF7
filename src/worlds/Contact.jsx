import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Window } from '../ui/Window'
import { ME } from '../data/content'
import { unlock } from '../lib/store'
import { rip, beep } from '../lib/audio'
import './contact.css'

// zig-zag edge for the torn paper (percent points along one side)
const zig = (side) => {
  const pts = []
  for (let i = 0; i <= 24; i++) pts.push(`${side === 'right' ? 100 - (i % 2 ? 2.2 : 0) : (i % 2 ? 2.2 : 0)}% ${(i / 24) * 100}%`)
  return pts
}
const MAIN_TORN = `polygon(0 0, 100% 0, ${zig('right').join(', ')}, 100% 100%, 0 100%)`
const STUB_TORN = `polygon(${zig('left').join(', ')}, 100% 100%, 100% 0)`

export default function Contact() {
  const root = useRef(), pass = useRef(), stub = useRef(), drag = useRef(null)
  const [torn, setTorn] = useState(false)
  const [copied, setCopied] = useState(false)

  // the pass prints out of the slot, dot-matrix style
  useEffect(() => {
    const t = gsap.fromTo(pass.current, { yPercent: -112 }, { yPercent: 0, duration: 1.6, ease: 'steps(14)', paused: true })
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { t.play(); io.disconnect() } }, { threshold: 0.35 })
    io.observe(root.current)
    return () => { io.disconnect(); t.kill() }
  }, [])

  const vertical = () => matchMedia('(max-width: 720px)').matches
  const tearOff = (d) => {
    setTorn(true); unlock('torn'); rip()
    const v = vertical()
    gsap.killTweensOf(stub.current)
    gsap.to(stub.current, { x: v ? 26 : 70, y: v ? 40 : 36, rotation: v ? 4 : 10, duration: 1, ease: 'bounce.out' })
  }
  const down = (e) => {
    if (torn) return
    drag.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
    e.currentTarget.classList.add('pulling')
  }
  const move = (e) => {
    const s = drag.current
    if (!s || torn) return
    const v = vertical()
    const d = Math.max(0, v ? e.clientY - s.y : e.clientX - s.x)
    // paper resists, then gives up
    gsap.set(stub.current, { x: v ? 0 : d * 0.55, y: v ? d * 0.55 : 0, rotation: (v ? -d : d) * 0.09, transformOrigin: v ? '0% 0%' : '0% 100%' })
    if (d > 95) { drag.current = null; tearOff(d * 0.55) }
  }
  const up = (e) => {
    e.currentTarget.classList.remove('pulling')
    if (!drag.current || torn) return
    drag.current = null
    gsap.to(stub.current, { x: 0, y: 0, rotation: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)' })
  }
  const reprint = () => {
    gsap.set(stub.current, { clearProps: 'all' })
    setTorn(false)
    gsap.fromTo(pass.current, { yPercent: -112 }, { yPercent: 0, duration: 1.2, ease: 'steps(12)' })
  }
  const copy = async () => {
    try { await navigator.clipboard.writeText(ME.email) } catch {}
    setCopied(true); setTimeout(() => setCopied(false), 2600)
  }

  return (
    <section className="w-contact" ref={root}>
      <Window title="boarding_pass.app" barClass="ct-bar">
        <div className="ct">
          <div className="ct-copy">
            <h2>last call.</h2>
            <p>this is the part where you email me. i answer fast, i swear. i'm usually awake.</p>
            <p className="ct-hint">tear the stub off the end of the ticket. it's perforated. you know you want to.</p>
          </div>
          <div className="slot" aria-hidden><i /></div>
          <div className={'pass' + (torn ? ' is-torn' : '')} ref={pass}>
            <div className="pass-main" style={torn ? { clipPath: MAIN_TORN } : undefined}>
              <header><b>RISHIT AIR</b><span>boarding pass · economy+ (it's a joke, everyone sits in 1A)</span></header>
              <div className="route">
                <div><small>from</small><b>SRM</b><span>srm ist, chennai</span></div>
                <i aria-hidden>→</i>
                <div><small>to</small><b>YOU</b><span>your company</span></div>
              </div>
              <dl className="meta">
                <div><dt>passenger</dt><dd>TANDON / RISHIT MR</dd></div>
                <div><dt>flight</dt><dd>RT-2027</dd></div>
                <div><dt>gate</dt><dd>HIRE</dd></div>
                <div><dt>seat</dt><dd>1A</dd></div>
              </dl>
              <ul className="links">
                <li><small>hub</small><a href={ME.hub} target="_blank" rel="noreferrer">rishit.site</a><em className="hubnote">everything of mine, connected</em></li>
                <li><small>email</small><a href={'mailto:' + ME.email}>{ME.email}</a><button onClick={copy}>{copied ? 'copied. now actually send it.' : 'copy'}</button></li>
                <li><small>github</small><a href={ME.github} target="_blank" rel="noreferrer">github.com/RishitTandon7</a></li>
                <li><small>linkedin</small><a href={ME.linkedin} target="_blank" rel="noreferrer">linkedin.com/in/rishit-tandon-928661287</a></li>
                <li><small>whatsapp</small><a href={ME.whatsapp} target="_blank" rel="noreferrer">wa.me/917394865520</a></li>
              </ul>
            </div>
            <div className="perf" aria-hidden />
            <div className="pass-stub" ref={stub} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} style={torn ? { clipPath: STUB_TORN } : undefined}>
              <small>group</small><b>1</b>
              <div className="barcode" aria-hidden />
              {torn
                ? <a className="resume" href={ME.resume} target="_blank" rel="noreferrer" onPointerDown={(e) => e.stopPropagation()}>resume.pdf ↓</a>
                : <span className="tearme">← tear me</span>}
            </div>
          </div>
          {torn && <button className="reprint" onClick={reprint}>print another ticket</button>}
        </div>
      </Window>
    </section>
  )
}
