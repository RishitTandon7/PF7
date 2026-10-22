import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Window } from '../ui/Window'
import { ROLES } from '../data/content'
import { emit } from '../lib/bus'
import { paper } from '../lib/audio'
import './roles.css'

gsap.registerPlugin(ScrollTrigger)

// three roles, three badges on lanyards. they sway on their own, you can flip them.
function Badge({ r, i }) {
  const root = useRef(), swing = useRef()
  const [flip, setFlip] = useState(false)
  useEffect(() => {
    // idle pendulum from the top of the strap, each one out of phase
    swing.current = gsap.fromTo(root.current, { rotation: -3 - i }, { rotation: 3 + i, duration: 2.6 + i * 0.4, ease: 'sine.inOut', yoyo: true, repeat: -1, transformOrigin: '50% 0%' })
    // dropped in on their straps
    const drop = gsap.from(root.current.parentNode, { y: -260, duration: 1, delay: 0.15 * i, ease: 'bounce.out', scrollTrigger: { trigger: root.current, start: 'top 90%', once: true } })
    return () => { swing.current?.kill(); drop.scrollTrigger?.kill(); drop.kill() }
  }, [i])
  const toggle = () => { paper(); setFlip((f) => !f); swing.current?.timeScale(flip ? 1 : 0.25) }
  return (
    <div className={'bd-slot k-' + r.kind}>
      <div className="bd-strap" aria-hidden />
      <div className="bd-hang" ref={root}>
        <i className="bd-clip" aria-hidden />
        <button className={'bd-card' + (flip ? ' flip' : '')} onClick={toggle} aria-label={`${r.title}: click to flip`}>
          <span className="face front">
            <em>{r.tag}</em>
            <b>{r.title}</b>
            <span className="org">{r.org}</span>
            <span className="line">{r.line}</span>
            <small>click to flip ↻</small>
          </span>
          <span className="face back">
            <em>{r.title}</em>
            <ul>{r.back.map((b) => <li key={b}>{b}</li>)}</ul>
          </span>
        </button>
        {r.go[0].startsWith('http')
          ? <a className="bd-go" href={r.go[0]} target="_blank" rel="noreferrer">{r.go[1]}</a>
          : <a className="bd-go" href={'#' + r.go[0]} onClick={(e) => { e.preventDefault(); emit('wipe', r.go[0]) }}>{r.go[1]}</a>}
      </div>
    </div>
  )
}

export default function Roles() {
  return (
    <section className="w-roles">
      <Window title="badges.app" barClass="bd-bar">
        <div className="bd-wrap">
          <header>
            <h2>three badges.</h2>
            <p>the stuff i actually got trusted with. flip them.</p>
          </header>
          <div className="bd-row">{ROLES.map((r, i) => <Badge key={r.id} r={r} i={i} />)}</div>
        </div>
      </Window>
    </section>
  )
}
