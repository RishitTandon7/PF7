import { useEffect, useRef, useState } from 'react'
import { useVisible } from '../../lib/hooks'
import { speakLine } from '../../lib/voice'

// a demo of jarvis that really talks. it speaks with the browser's speech engine and (in chrome/edge) listens through the mic.
// the "brain" is a small set of scripted skills (create / deploy / paper), not a live model. the card says so.

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'my-project'
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

// each skill returns [{ text, say? }]: text is shown, say is spoken (code-looking lines stay silent)
function brain(raw, memo) {
  const q = raw.toLowerCase()
  if (/paper|research|study|abstract/.test(q)) {
    const topic = (q.match(/(?:on|about|regarding)\s+(.+)$/)?.[1] || memo.topic || 'glacial lake floods').replace(/[.?!]$/, '')
    memo.topic = topic
    return [
      { text: `drafting a short research paper on ${topic}.`, say: `drafting a short research paper on ${topic}.` },
      { text: `title      ${cap(topic)}: a short study` },
      { text: `abstract   this note frames the problem of ${topic}, proposes a simple approach, and lists open questions.` },
      { text: `sections   1 problem  2 approach  3 results (to run)  4 open questions  5 references` },
      { text: 'draft saved: paper.md', say: 'done. title, abstract and an outline are ready. references are left for you to verify.' },
    ]
  }
  if (/deploy|publish|ship|launch|host/.test(q)) {
    const name = memo.project || 'my-project'
    return [
      { text: 'on it. deploying to production.', say: 'on it. deploying to production.' },
      { text: '$ git push origin main' },
      { text: '$ vercel deploy --prod' },
      { text: `✓ live: https://${name}.rishit.site  (demo url)`, say: `done. ${name.replace(/-/g, ' ')} is live.` },
    ]
  }
  if (/create|build|make|new|generate|scaffold|app|website|page|project/.test(q)) {
    const m = q.match(/(?:create|build|make|generate|scaffold)\s+(?:me\s+)?(?:an?\s+|the\s+)?(.+)$/)
    const name = slug(m?.[1] || 'landing page')
    memo.project = name
    return [
      { text: `understood. creating ${name.replace(/-/g, ' ')}.`, say: `understood. creating ${name.replace(/-/g, ' ')}.` },
      { text: `$ npm create vite@latest ${name}` },
      { text: '✓ scaffolded  ✓ repo created  ✓ tests pass' },
      { text: `project ready: ./${name}`, say: 'done. the project is created and the tests pass. say deploy when you want it live.' },
    ]
  }
  if (/hello|hi|hey|who are you|name/.test(q)) return [{ text: 'hello. i am jarvis. i can create projects, deploy them, and write short research papers.', say: 'hello. i am jarvis. i can create projects, deploy them, and write short research papers.' }]
  return [{ text: 'i can create a project, deploy it, or draft a short research paper. try one.', say: 'i can create a project, deploy it, or draft a short research paper. try one.' }]
}

const CHIPS = ['create a landing page', 'deploy it', 'write a research paper on glacial lake floods']

export default function Jarvis() {
  const wrap = useRef(), logRef = useRef(), memo = useRef({}), alive = useRef(true), recog = useRef(null)
  const vis = useVisible(wrap)
  const [log, setLog] = useState([])
  const [val, setVal] = useState('')
  const [speaking, setSpeaking] = useState(false)
  const [listening, setListening] = useState(false)
  const [voice, setVoice] = useState(true)
  const [busy, setBusy] = useState(false)
  const voiceRef = useRef(true); voiceRef.current = voice
  const canTalk = typeof window !== 'undefined' && 'speechSynthesis' in window
  const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

  useEffect(() => () => { alive.current = false; try { window.speechSynthesis?.cancel(); recog.current?.abort() } catch {} }, [])
  useEffect(() => { if (!vis) try { window.speechSynthesis?.cancel() } catch {} }, [vis])
  useEffect(() => { const el = logRef.current; if (el) el.scrollTop = el.scrollHeight }, [log])

  const say = (text) => new Promise((res) => {
    if (!canTalk || !voiceRef.current) return res()
    speakLine(text, { kind: 'male', onStart: () => setSpeaking(true), onEnd: () => { setSpeaking(false); res() } })
  })
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

  const ask = async (text) => {
    const t = text.trim()
    if (!t || busy) return
    setBusy(true); setVal('')
    try { window.speechSynthesis?.cancel() } catch {}
    setLog((l) => [...l, { who: 'you', text: t }])
    await sleep(350)
    for (const step of brain(t, memo.current)) {
      if (!alive.current) return
      setLog((l) => [...l, { who: step.say ? 'jarvis' : 'sys', text: step.text }])
      if (step.say) await say(step.say); else await sleep(450)
    }
    setBusy(false)
  }

  const listen = () => {
    if (!SR || listening || busy) return
    try { window.speechSynthesis?.cancel() } catch {}
    const r = new SR(); recog.current = r
    r.lang = 'en-US'; r.interimResults = false; r.maxAlternatives = 1
    r.onstart = () => setListening(true)
    r.onend = () => setListening(false)
    r.onerror = () => setListening(false)
    r.onresult = (e) => ask(e.results[0][0].transcript)
    r.start()
  }

  const intro = () => ask('hello')
  const active = speaking || listening

  return (
    <div className="vis jarvis-vis" ref={wrap}>
      <div className="jv-top"><span>J.A.R.V.I.S</span><span className={'jv-mic' + (active ? ' on' : '')}>{listening ? 'listening' : speaking ? 'speaking' : busy ? 'working' : 'standby'}</span></div>
      <div className="jv-wave" aria-hidden>{Array.from({ length: 36 }, (_, i) => <i key={i} className={active ? 'on' : ''} style={{ '--d': (i * 53) % 7, animationDelay: `${(i % 9) * 60}ms` }} />)}</div>
      <div className="jv-log" ref={logRef} data-lenis-prevent>
        {!log.length && <p className="sys">press "say hello" and turn your sound on. it will talk back.</p>}
        {log.map((m, i) => <p key={i} className={m.who}>{m.who !== 'sys' && <b>{m.who === 'you' ? 'you >' : 'jarvis >'}</b>} {m.text}</p>)}
      </div>
      <div className="jv-chips">
        {!log.length && <button onClick={intro}>say hello</button>}
        {CHIPS.map((c) => <button key={c} onClick={() => ask(c)} disabled={busy}>{c}</button>)}
      </div>
      <form className="jv-form" onSubmit={(e) => { e.preventDefault(); ask(val) }}>
        <input value={val} onChange={(e) => setVal(e.target.value)} placeholder="ask jarvis: create / deploy / write a paper on ..." aria-label="ask jarvis" />
        <button type="submit" disabled={busy}>send</button>
        {SR && <button type="button" className={listening ? 'on' : ''} onClick={listen} aria-label="speak to jarvis">{listening ? 'listening…' : 'mic'}</button>}
        {canTalk && <button type="button" onClick={() => { setVoice((v) => !v); try { window.speechSynthesis.cancel() } catch {} }}>voice {voice ? 'on' : 'off'}</button>}
      </form>
      <small className="jv-foot">voice is real (your browser's speech engine). the skills are a scripted demo, not a live model. the real jarvis is on github.</small>
    </div>
  )
}
