import { useCallback, useEffect, useRef, useState } from 'react'
import { WORLDS } from '../worlds'
import { useActive } from '../lib/active'
import { emit, on } from '../lib/bus'
import { pop } from '../lib/audio'
import { speakLine } from '../lib/voice'

// bit: a tiny robot pet at the bottom of the page. he stays quiet. he only speaks when you leave a section
// without touching anything in it, and then he points out what you missed and offers to take you back.
// click him any time for a normal tip about where you are.
const MISSED = {
  boot: 'you skipped the terminal. type "help" in it. it has a few secrets.',
  notebook: 'you scrolled past the education desk. the student card flips, and the index cards can be dragged.',
  roles: 'you passed the badges without flipping one. each has the real details on the back.',
  mission: 'you missed the research walkthrough. it is the quickest way to understand his internship.',
  projects: 'you did not open any project. jarvis has a video demo, and there are live demos too.',
  forge: 'you did not touch the forge. orbit the skyline, and click a planet to open a repo.',
  arcade: 'the arcade has a playable game. press c for a coin.',
  workshop: 'those tools can be pulled off the wall and thrown. try it.',
  museum: 'you did not open a certificate. click a frame to zoom in.',
}
const TIPS = {
  boot: 'try typing "help" in the terminal.',
  notebook: 'flip the student card, and drag the index cards around.',
  roles: 'flip a badge. the back has the details.',
  mission: 'press "start the walkthrough" and scroll slowly. it follows you.',
  projects: 'open a project. jarvis has a video demo.',
  forge: 'drag the skyline to orbit. click a planet to open that repo.',
  arcade: 'press c for a coin, and score 150 to get on the board.',
  workshop: 'pull a tool off the wall and throw it.',
  museum: 'click a certificate to zoom in. the first ones are the big wins.',
  contact: 'tear the stub off the ticket to get the resume. then email him.',
}

const getVoice = () => { try { return localStorage.getItem('rt_petvoice') !== '0' } catch { return true } }

export default function Pet() {
  const active = useActive()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [back, setBack] = useState(null) // world to offer "take me back" for
  const [voice, setVoice] = useState(getVoice())
  const [talking, setTalking] = useState(false)
  const [gone, setGone] = useState(false)
  const root = useRef(), lastSpoke = useRef(0), hideT = useRef(0), typeT = useRef(0), interacted = useRef(false)
  const touched = useRef(new Set()), told = useRef(new Set()), entered = useRef({ id: null, t: 0 })
  const small = typeof window !== 'undefined' && window.innerWidth < 640

  // which sections has the visitor actually touched (a click, tap, drag or key inside it)?
  useEffect(() => {
    const mark = (target) => {
      interacted.current = true
      if (!target?.closest || target.closest('.pet, .dock, .menubar, .wipe')) return
      const w = target.closest('[data-world]'); if (w) touched.current.add(w.dataset.world)
    }
    const pd = (e) => mark(e.target), kd = () => mark(document.activeElement)
    window.addEventListener('pointerdown', pd, true); window.addEventListener('keydown', kd, true)
    return () => { window.removeEventListener('pointerdown', pd, true); window.removeEventListener('keydown', kd, true) }
  }, [])

  // sections can report that the visitor engaged with them without a click (e.g. the walkthrough auto-starting)
  useEffect(() => on('touched', (id) => touched.current.add(id)), [])
  // sections can tell the pet "this was seen" themselves (e.g. the walkthrough starting on its own)

  // eyes follow the cursor
  useEffect(() => {
    const mv = (e) => {
      const el = root.current; if (!el) return
      const r = el.getBoundingClientRect()
      el.style.setProperty('--ex', Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / 300)) * 3 + 'px')
      el.style.setProperty('--ey', Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / 300)) * 2 + 'px')
    }
    window.addEventListener('pointermove', mv, { passive: true })
    return () => window.removeEventListener('pointermove', mv)
  }, [])

  const speak = useCallback((line) => {
    if (!voice || !interacted.current) return
    speakLine(line, { kind: 'female', onStart: () => setTalking(true), onEnd: () => setTalking(false) })
  }, [voice])

  const say = useCallback((line, { backTo = null } = {}) => {
    clearInterval(typeT.current); clearTimeout(hideT.current)
    setBack(backTo); setOpen(true); setText('')
    let i = 0
    typeT.current = setInterval(() => { i++; setText(line.slice(0, i)); if (i >= line.length) clearInterval(typeT.current) }, 22)
    speak(line)
    hideT.current = setTimeout(() => setOpen(false), (small ? 5000 : 10000) + line.length * 30)
  }, [speak, small])

  // when the visitor leaves a section they never touched, point it out (once per section, never more than every 12s)
  useEffect(() => {
    const prev = entered.current
    entered.current = { id: active, t: Date.now() }
    if (!prev.id || prev.id === active) return
    const stayed = Date.now() - prev.t
    if (stayed < 900 || touched.current.has(prev.id) || told.current.has(prev.id) || !MISSED[prev.id]) return
    if (Date.now() - lastSpoke.current < 12000) return
    told.current.add(prev.id); lastSpoke.current = Date.now()
    say(MISSED[prev.id], { backTo: prev.id })
  }, [active, say])

  useEffect(() => () => { clearInterval(typeT.current); clearTimeout(hideT.current); try { window.speechSynthesis?.cancel() } catch {} }, [])

  const idx = WORLDS.findIndex((w) => w.id === active)
  const next = WORLDS[(idx + 1) % WORLDS.length]
  const backW = WORLDS.find((w) => w.id === back)
  // the big robot owns the hero, so the pet only shows once you've scrolled past it
  if (gone || active === 'boot') return null
  return (
    <div className={'pet' + (talking ? ' talking' : '')} ref={root}>
      {open && (
        <div className="pet-bubble" role="status">
          <p>{text}</p>
          <div className="pet-btns">
            {backW
              ? <button onClick={() => { pop(); setOpen(false); emit('wipe', backW.id) }}>take me back to {backW.label}</button>
              : <button onClick={() => { pop(); setOpen(false); emit('wipe', next.id) }}>next: {next.label} →</button>}
            <button onClick={() => { const v = !voice; setVoice(v); try { localStorage.setItem('rt_petvoice', v ? '1' : '0'); window.speechSynthesis.cancel() } catch {} }} aria-pressed={voice}>voice {voice ? 'on' : 'off'}</button>
            <button onClick={() => { setOpen(false); try { window.speechSynthesis.cancel() } catch {} }}>{backW ? 'got it' : '✕'}</button>
          </div>
        </div>
      )}
      <button className="pet-body" onClick={() => { pop(); open ? setOpen(false) : say(TIPS[active] || TIPS.projects) }} onDoubleClick={() => setGone(true)} aria-label="bit, the robot pet. click for a tip">
        <svg viewBox="0 0 64 74" width="60" height="70" aria-hidden>
          <line x1="32" y1="4" x2="32" y2="14" stroke="#555" strokeWidth="2.5" />
          <circle className="pet-ant" cx="32" cy="4" r="4" fill="#ff5a3a" />
          <rect x="10" y="14" width="44" height="30" rx="8" fill="#e9e2d0" stroke="#14110d" strokeWidth="2.5" />
          <rect x="15" y="19" width="34" height="20" rx="5" fill="#14110d" />
          <g className="pet-eyes"><rect x="21" y="24" width="8" height="8" rx="1.5" fill="#ffb000" /><rect x="35" y="24" width="8" height="8" rx="1.5" fill="#ffb000" /></g>
          <rect className="pet-mouth" x="27" y="35" width="10" height="2.5" rx="1" fill="#ffb000" />
          <rect x="18" y="47" width="28" height="18" rx="5" fill="#e9e2d0" stroke="#14110d" strokeWidth="2.5" />
          <rect x="24" y="52" width="16" height="7" rx="2" fill="#d1301f" />
          <rect x="20" y="66" width="9" height="6" rx="2" fill="#14110d" /><rect x="35" y="66" width="9" height="6" rx="2" fill="#14110d" />
          <rect x="3" y="26" width="7" height="10" rx="2" fill="#d1301f" /><rect x="54" y="26" width="7" height="10" rx="2" fill="#d1301f" />
        </svg>
      </button>
    </div>
  )
}
