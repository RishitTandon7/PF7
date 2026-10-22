import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useVisible } from '../lib/hooks'

export const WorldCtx = createContext(null)

// loads a world's chunk only when you're about to scroll into it
export function Lazy({ world }) {
  const ref = useRef()
  const near = useVisible(ref, '100% 0px')
  const [Comp, setComp] = useState(null)
  useEffect(() => {
    if (near && !Comp) world.load().then((m) => setComp(() => m.default))
  }, [near, Comp, world])
  return (
    <div ref={ref} data-world={world.id} style={Comp ? undefined : { minHeight: typeof window !== 'undefined' && window.innerWidth < 820 && world.minHm ? world.minHm : world.minH }}>
      {Comp ? <WorldCtx.Provider value={world}><Comp /></WorldCtx.Provider> : <div className="loading-world">loading {world.label}<span className="blink">_</span></div>}
    </div>
  )
}

// tiny highlighter so "view source" doesn't look like a wall of grey
const TOK = /(\/\/.*$)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)|\b(import|from|export|default|const|let|var|function|return|if|else|for|while|new|await|async|of|in|null|true|false|undefined|class|switch|case|break|continue|typeof)\b/g
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
export function hl(line) {
  let out = '', last = 0
  for (const m of line.matchAll(TOK)) {
    out += esc(line.slice(last, m.index))
    out += `<i class="${m[1] ? 'c' : m[2] ? 's' : 'k'}">${esc(m[0])}</i>`
    last = m.index + m[0].length
  }
  return out + esc(line.slice(last))
}

export function Window({ title, children, className = '', barClass = '' }) {
  const world = useContext(WorldCtx)
  const [src, setSrc] = useState(null)
  const toggle = async () => {
    if (src) return setSrc(null)
    if (!world?.raw) return
    const m = await world.raw()
    setSrc(m.default)
  }
  return (
    <div className={'win ' + className}>
      <div className={'win-bar ' + barClass}>
        <span className="win-dots"><b /><b /><b /></span>
        <span className="win-title">~/rishit_os/{title}</span>
        <button className="win-src" onClick={toggle} aria-pressed={!!src} title="view the real source of this world">
          {src ? 'close' : '</> view source'}
        </button>
      </div>
      <div className="win-body">
        {children}
        {src && (
          <div className="viewsrc" data-lenis-prevent>
            <p className="viewsrc-note">// this is the actual file running this world right now. no mockups. {src.split('\n').length} lines.</p>
            <pre>{src.split('\n').map((l, i) => (
              <div key={i}><span className="ln">{i + 1}</span><span dangerouslySetInnerHTML={{ __html: hl(l) || ' ' }} /></div>
            ))}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
