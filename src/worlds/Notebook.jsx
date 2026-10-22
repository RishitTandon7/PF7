import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Draggable } from 'gsap/Draggable'
import { Window } from '../ui/Window'
import { EDU } from '../data/content'
import { paper, thunk } from '../lib/audio'
import './notebook.css'

gsap.registerPlugin(ScrollTrigger, Draggable)

// the path through school: each stop is a place i spent years
const STOPS = [
  { y: '2021', name: 'jaipuria', note: 'class 10' },
  { y: '2023', name: 'dps lucknow', note: 'class 12' },
  { y: '2023', name: 'srm ist', note: 'b.tech cse' },
  { y: '2027', name: 'graduation', note: 'you are here ↓ (final year)' },
]

export default function Notebook() {
  const root = useRef(), dial = useRef(), num = useRef(), path = useRef()
  const [flip, setFlip] = useState(false)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const st = { trigger: root.current, start: 'top 60%', once: true }
      // 1. the path draws itself, stops pop on as the line reaches them
      const pth = path.current, len = pth.getTotalLength(), svg = pth.ownerSVGElement, walker = root.current.querySelector('.ed-walker')
      const w = { p: 0 }
      const stops = [...root.current.querySelectorAll('.ed-stop')]
      gsap.set(stops, { opacity: 0.25 })
      // the line draws and a red dot rides its tip; each stop lights up and bounces as the dot reaches it
      const tl = gsap.timeline({ scrollTrigger: st })
      tl.to(w, { p: 1, duration: 3.6, ease: 'power1.inOut', onUpdate: () => {
        const pt = pth.getPointAtLength(w.p * len), box = svg.getBoundingClientRect(), par = svg.parentNode.getBoundingClientRect()
        pth.style.strokeDashoffset = 1 - w.p
        gsap.set(walker, { x: (pt.x / 1000) * box.width, y: pt.y * (box.height / 80) + (box.top - par.top) })
      } })
      ;[0.0, 0.33, 0.67, 1].forEach((at, i) => tl.add(() => { gsap.to(stops[i], { opacity: 1, duration: 0.3 }); gsap.fromTo(stops[i].querySelector('i'), { scale: 2.2 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)' }); paper() }, at * 3.6))
      tl.to(walker, { scale: 1.6, duration: 0.3, yoyo: true, repeat: 3 }, '>')
      // 2. cgpa dial sweeps to 9.2, number counts up, then it gets stamped
      const o = { v: 0 }
      gsap.timeline({ scrollTrigger: st, delay: 0.3 })
        .to(dial.current, { strokeDashoffset: 1 - parseFloat(EDU.cgpa) / 10, duration: 1.8, ease: 'power3.out' })
        .to(o, { v: parseFloat(EDU.cgpa), duration: 1.8, ease: 'power3.out', onUpdate: () => { if (num.current) num.current.textContent = o.v.toFixed(1) } }, '<')
        .fromTo('.ed-stamp', { scale: 3, rotate: -25, opacity: 0 }, { scale: 1, rotate: -9, opacity: 1, duration: 0.35, ease: 'power4.in', onComplete: thunk })
      // 3. index cards get taped up, each at its own angle
      gsap.from('.ed-card', { y: -120, rotate: (i) => (i ? 12 : -12), opacity: 0, duration: 0.9, stagger: 0.2, ease: 'bounce.out', scrollTrigger: { ...st, start: 'top 45%' } })
      gsap.from('.ed-id', { x: -80, rotate: -8, opacity: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: st })
    }, root)
    return () => ctx.revert()
  }, [])

  // the index cards can be picked up and moved around
  useEffect(() => {
    if (!window.matchMedia('(hover: hover)').matches) return // on a phone the cards stay put so the page scrolls freely
    const d = Draggable.create('.ed-card', { type: 'x,y', bounds: root.current.querySelector('.ed-sheet'), edgeResistance: 0.8, onPress() { paper() }, zIndexBoost: true })
    return () => d.forEach((x) => x.kill())
  }, [])

  return (
    <section className="w-notebook" ref={root}>
      <Window title="notebook.app" barClass="nb-bar">
        <div className="nb-desk">
          <span className="coffee-ring" aria-hidden /><span className="pencil" aria-hidden />
          <div className="ed-sheet">
            <header className="ed-head">
              <p className="print">page 1 — education</p>
              <h2>b.tech, cse</h2>
              <p className="hand">{EDU.school}, {EDU.years}. final year. (send help)</p>
            </header>

            <div className="ed-grid">
              {/* student card: flip for the electives */}
              <button className={'ed-id' + (flip ? ' flip' : '')} onClick={() => { paper(); setFlip((f) => !f) }} aria-label="flip student card">
                <span className="face front">
                  <em>SRM IST · STUDENT</em>
                  <i className="avatar">RT</i>
                  <b>rishit tandon</b>
                  <span>b.tech · computer science</span>
                  <span>{EDU.years}</span>
                  <small>tap to flip ↻</small>
                </span>
                <span className="face back">
                  <em>electives</em>
                  {EDU.electives.map((e) => <p key={e.name}><b>{e.name}</b><span>★ {e.rank}</span></p>)}
                  <small>top of the batch, not the middle</small>
                </span>
              </button>

              {/* cgpa gauge */}
              <div className="ed-cgpa">
                <svg viewBox="0 0 200 200" aria-label={`cgpa ${EDU.cgpa} out of 10`}>
                  <circle cx="100" cy="100" r="84" className="track" />
                  <circle ref={dial} cx="100" cy="100" r="84" className="arc" pathLength="1" strokeDasharray="1" strokeDashoffset="1" transform="rotate(-90 100 100)" />
                </svg>
                <div className="ed-num"><b ref={num}>0.0</b><span>cgpa / 10</span></div>
                <span className="ed-stamp">checked<br />twice</span>
              </div>

              {/* index cards */}
              <div className="ed-cards">
                <p className="print">drag me around</p>
                {EDU.electives.map((e, i) => (
                  <div className={'ed-card c' + i} key={e.name}>
                    <i className="tape" aria-hidden />
                    <b>{e.name}</b>
                    <span>elective</span>
                    <strong>{e.rank}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* the path */}
            <div className="ed-path">
              <svg viewBox="0 0 1000 80" preserveAspectRatio="none" aria-hidden>
                <path ref={path} className="ed-line" pathLength="1" strokeDasharray="1" strokeDashoffset="1" d="M0 40 C 40 40, 80 40, 120 40 C 200 0, 290 80, 373 40 C 450 0, 550 80, 627 40 C 700 0, 800 80, 880 40 C 920 40, 960 40, 1000 40" />
              </svg>
              <i className="ed-walker" aria-hidden />
              <ol>
                {STOPS.map((s, i) => (
                  <li key={s.name} className={'ed-stop' + (i === STOPS.length - 1 ? ' now' : '')}>
                    <i />
                    <b>{s.y}</b><span>{s.name}</span><small>{s.note}</small>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </Window>
    </section>
  )
}
