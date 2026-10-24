import { useEffect, useState } from 'react'
import { CHANGELOG, ME } from '../data/content'

const mins = () => Math.max(0, Math.round((Date.now() - new Date(__BUILD_TIME__)) / 60000))
const fmt = (m) => (m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`)

export default function Footer() {
  const [m, setM] = useState(mins())
  useEffect(() => { const i = setInterval(() => setM(mins()), 30000); return () => clearInterval(i) }, [])
  return (
    <footer className="foot">
      <div className="foot-log">
        <b>$ git log --oneline</b>
        {CHANGELOG.map(([t, msg], i) => (
          <p key={i}><code>{(__BUILD_HASH__.slice(0, 4) + (i * 7919 + 4096).toString(16)).slice(0, 7)}</code> <em>{t}:</em> {msg}</p>
        ))}
      </div>
      <div className="foot-meta">
        <p>built by hand in vite + react + r3f + gsap + lenis + matter. no template was harmed.</p>
        <p className="build">build <code>{__BUILD_HASH__}</code> · deployed {fmt(m)} · <a href="https://rishit.site" target="_blank" rel="noreferrer">rishit.site (the hub)</a> · <a href="https://dev.rishit.site" target="_blank" rel="noreferrer">old portfolio</a> · <a href={'mailto:' + ME.email}>{ME.email}</a></p>
        <p className="todo">// TODO: sleep</p>
      </div>
    </footer>
  )
}
