import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Window } from '../ui/Window'
import { PROJECTS, REPO_TOTAL, ME } from '../data/content'
import snap from '../data/snapshot.json'
import { scrollToEl } from '../lib/scroll'
import Aisgr from './projects/Aisgr'
import Neuro from './projects/Neuro'
import Arclyth from './projects/Arclyth'
import Market from './projects/Market'
import Linked from './projects/Linked'
import Multi from './projects/Multi'
import Doc from './projects/Doc'
import Jarvis from './projects/Jarvis'
import './projects.css'

gsap.registerPlugin(ScrollTrigger)

const VIS = { jarvis: Jarvis, aisgr: Aisgr, neurovibe: Neuro, arclyth: Arclyth, agentmarket: Market, linkedout: Linked, multiverse: Multi, documind: Doc }

// each project walks in its own way. no shared fade-up.
const ENTER = {
  jarvis: { opacity: 0, x: -40, duration: 0.45, stagger: 0.12, ease: 'steps(6)' },
  aisgr: { opacity: 0, x: -30, skewX: 24, duration: 0.5, stagger: 0.09, ease: 'steps(5)' },
  neurovibe: { opacity: 0, scaleX: 0.6, transformOrigin: '0% 50%', duration: 1.3, stagger: 0.12, ease: 'power3.out' },
  arclyth: { opacity: 0, x: 240, y: -140, rotate: 7, duration: 0.9, stagger: 0.1, ease: 'power4.out' },
  agentmarket: { opacity: 0, scale: 0.4, duration: 0.7, stagger: 0.07, ease: 'back.out(2.6)' },
  linkedout: { opacity: 0, duration: 0.01, stagger: 0.32 },
  multiverse: { opacity: 0, x: (i) => (i % 2 ? 160 : -160), duration: 0.9, stagger: 0.08, ease: 'expo.out' },
  documind: { opacity: 0, rotate: -5, y: 70, duration: 0.8, stagger: 0.1, ease: 'power2.out' },
}

function Project({ p, flip, open, onToggle, onVideo }) {
  const root = useRef()
  const Vis = VIS[p.id]
  // each project walks in its own way when you open it. no shared fade-up.
  useLayoutEffect(() => {
    if (!open) return
    const ctx = gsap.context(() => {
      gsap.from('.p-info > *', { ...ENTER[p.id] })
      gsap.from('.vis', { opacity: 0, scale: 0.94, duration: 0.8, ease: 'power2.out' })
    }, root)
    return () => ctx.revert()
  }, [open, p.id])
  return (
    <article className={`proj ${p.cls}${flip ? ' flip' : ''}${open ? ' open' : ''}`} ref={root} id={'proj-' + p.id}>
      <button className="p-row" onClick={onToggle} aria-expanded={open}>
        <span className="p-num">{p.n}</span>
        <h3 className="p-name">{p.name}</h3>
        <span className="p-tag">{p.tag}</span>
        <span className="p-plus" aria-hidden>{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="p-body">
          <div className="p-info">
            <dl>
              <dt>the problem</dt><dd>{p.problem}</dd>
              <dt>what i built</dt><dd>{p.built}</dd>
              <dt>so what</dt><dd>{p.impact}</dd>
            </dl>
            <ul className="p-tech">{p.tech.map((t) => <li key={t}>{t}</li>)}</ul>
            <div className="p-links">
              {p.video && <button className="p-play" onClick={() => onVideo(p)}>▶ watch demo</button>}
              {p.links.length ? p.links.map((l) => <a key={l.t} href={l.u} target="_blank" rel="noreferrer">{l.t} ↗</a>) : <span>repo: not public. ask me, i'll show you.</span>}
            </div>
          </div>
          <Vis />
        </div>
      )}
    </article>
  )
}

export default function Projects() {
  const [open, setOpen] = useState(PROJECTS[0].id)
  const [vid, setVid] = useState(null)
  const head = useRef()
  // one open at a time; the opened row slides to the top so its world is in view
  const pick = (id) => {
    const next = open === id ? null : id
    setOpen(next)
    if (next) setTimeout(() => scrollToEl(document.getElementById('proj-' + id), false, 72), 80)
  }
  return (
    <section className="w-projects">
      <Window title="projects.app" barClass="pr-bar">
        <header className="pr-head" ref={head}>
          <h2>eight worlds.<br />one mood each.</h2>
          <p>pick one. each project opens into its own place with its own look, because a robot and an app store should not feel the same. most demos are live, so poke them.</p>
        </header>
        <div className="pr-list">
          {PROJECTS.map((p, i) => <Project key={p.id} p={p} flip={i % 2 === 1} open={open === p.id} onToggle={() => pick(p.id)} onVideo={setVid} />)}
        </div>
        <div className="pr-more">
          <div>
            <b>+ {REPO_TOTAL - PROJECTS.length} more</b>
            <p>those were the headliners. the other {REPO_TOTAL - PROJECTS.length} of my {REPO_TOTAL} repos are experiments, hackathon builds, tools and half-finished ideas. all on github.</p>
            <a className="pr-gh" href={ME.github + '?tab=repositories'} target="_blank" rel="noreferrer">see the other {REPO_TOTAL - PROJECTS.length} on github ↗</a>
          </div>
          <ul aria-label="some of the other repositories">
            {snap.repos.filter((r) => !r.fork).slice(0, 28).map((r) => <li key={r.name}><a href={r.url} target="_blank" rel="noreferrer">{r.name}</a></li>)}
          </ul>
        </div>
      </Window>
      {vid && (
        <div className="vid-modal" onClick={() => setVid(null)} role="dialog" aria-modal="true" aria-label={vid.name + ' demo video'}>
          <div className="vid-box" onClick={(e) => e.stopPropagation()}>
            <header><b>{vid.name} — demo</b><button onClick={() => setVid(null)} aria-label="close">✕</button></header>
            <iframe src={`https://drive.google.com/file/d/${vid.video}/preview`} allow="autoplay; fullscreen" allowFullScreen title={vid.name + ' demo'} />
            <a href={`https://drive.google.com/file/d/${vid.video}/view`} target="_blank" rel="noreferrer">can't see it? open in drive ↗</a>
          </div>
        </div>
      )}
    </section>
  )
}
