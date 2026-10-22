import { useEffect, useRef, useState } from 'react'
import { useActive } from '../lib/active'
import { useFound, SECRETS } from '../lib/store'
import { useTick } from '../lib/hooks'
import { isMuted, setMuted, beep, isBgm, setBgm } from '../lib/audio'
import { WORLDS } from '../worlds'

const ist = () => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date())

// a real fps counter: counts frames on the shared ticker, so it measures what the page actually gets
function Fps() {
  const [fps, setFps] = useState(60)
  const [mode, setMode] = useState(0)
  const [pokes, setPokes] = useState(0)
  const acc = useRef({ n: 0, t: 0, worst: 60 })
  useTick((_, dt) => {
    const a = acc.current
    a.n++; a.t += dt
    if (a.t >= 0.5) {
      const f = Math.round(a.n / a.t)
      a.worst = Math.min(a.worst, f)
      setFps(f); a.n = 0; a.t = 0
    }
  })
  const label = mode === 0 ? `${fps} fps` : mode === 1 ? `${(1000 / Math.max(fps, 1)).toFixed(1)} ms` : `low ${acc.current.worst}`
  const poke = () => { setMode((m) => (m + 1) % 3); setPokes((p) => p + 1) }
  return (
    <button className={'mb-fps' + (fps < 30 ? ' bad' : '')} onClick={poke} title="click me. i dare you.">
      {pokes > 7 ? 'stop it' : label}
    </button>
  )
}

function Secrets() {
  const found = useFound()
  const [open, setOpen] = useState(false)
  return (
    <div className="mb-secrets">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open}>secrets {found.length}/{SECRETS.length}</button>
      {open && (
        <div className="sec-pop">
          <p>// hidden things on this site. no hints unless you hover.</p>
          <ul>
            {SECRETS.map((s) => {
              const f = found.includes(s.id)
              return <li key={s.id} className={f ? 'got' : ''} title={f ? '' : s.hint}>{f ? '[x] ' + s.name : '[ ] ???'}<em>{f ? '' : s.hint}</em></li>
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function MenuBar() {
  const active = useActive()
  const [t, setT] = useState(ist())
  const [mute, setMute] = useState(isMuted())
  const [music, setMusic] = useState(isBgm())
  useEffect(() => { const i = setInterval(() => setT(ist()), 1000); return () => clearInterval(i) }, [])
  const w = WORLDS.find((x) => x.id === active)
  return (
    <header className="menubar">
      <span className="mb-brand">rishit_os</span>
      <span className="mb-app">{w?.label}.app</span>
      <span className="mb-sp" />
      <Fps />
      <Secrets />
      <button className="mb-snd" onClick={() => { setMuted(!mute); setMute(!mute); beep(660) }}>sfx {mute ? 'off' : 'on'}</button>
      <button className="mb-snd" onClick={() => { setBgm(!music); setMusic(!music) }}>music {music ? 'on' : 'off'}</button>
      <span className="mb-clock" title="my local time. yes i'm probably awake.">IST {t}</span>
    </header>
  )
}
