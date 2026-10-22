import { useRef, useState } from 'react'
import gsap from 'gsap'

// a tiny app store for agents. hit "get" and it mints a (fake, demo) api key.
const AGENTS = [
  ['inbox-zero', 'reads your email so you don\'t have to', '4.8'],
  ['pr-reviewer', 'leaves comments you\'ll pretend you thought of', '4.7'],
  ['sql-whisperer', 'turns "uhh the users table?" into a query', '4.9'],
  ['resume-roaster', 'brutal. accurate. free.', '4.6'],
  ['bug-hunter', 'finds the semicolon. every time.', '4.5'],
  ['meeting-ghost', 'attends for you, takes notes, says "great point"', '4.4'],
]
const rk = () => 'agm_live_' + Array.from({ length: 24 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[(Math.random() * 36) | 0]).join('')

export default function Market() {
  const [pick, setPick] = useState(null)
  const [key, setKey] = useState('')
  const [copied, setCopied] = useState(false)
  const [q, setQ] = useState('')
  const panel = useRef()

  const get = (a) => {
    setPick(a); setCopied(false); setKey('')
    const k = rk()
    const o = { n: 0 }
    // the key "generates" character by character
    gsap.to(o, { n: k.length, duration: 0.9, ease: 'none', onUpdate: () => setKey(k.slice(0, Math.floor(o.n))) })
    requestAnimationFrame(() => gsap.fromTo(panel.current, { y: 30, opacity: 0, rotate: 1.5 }, { y: 0, opacity: 1, rotate: 0, duration: 0.45, ease: 'back.out(1.7)' }))
  }
  const list = AGENTS.filter((a) => a[0].includes(q.toLowerCase()))
  return (
    <div className="vis market-vis">
      <div className="store">
        <div className="store-top"><b>agent store</b><input placeholder="search agents..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="search agents" /></div>
        <div className="store-grid">
          {list.map((a, i) => (
            <div className={'agent' + (pick?.[0] === a[0] ? ' picked' : '')} key={a[0]} style={{ '--tilt': ((i % 3) - 1) * 0.6 + 'deg' }}>
              <div className="agent-ico">{a[0][0]}</div>
              <div><h4>{a[0]}</h4><p>{a[1]}</p><small>★ {a[2]}</small></div>
              <button onClick={() => get(a)}>get</button>
            </div>
          ))}
          {!list.length && <p className="empty">no agent called "{q}". build it. (that's literally the point.)</p>}
        </div>
      </div>
      {pick && (
        <div className="keypanel" ref={panel}>
          <small>installed: {pick[0]}</small>
          <code>{key}<i className="caret" /></code>
          <button onClick={() => { navigator.clipboard?.writeText(key); setCopied(true) }}>{copied ? 'copied' : 'copy key'}</button>
          <small>demo key. it opens nothing. the real flow does.</small>
        </div>
      )}
    </div>
  )
}
