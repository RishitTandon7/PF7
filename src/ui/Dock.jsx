import { useRef } from 'react'
import { WORLDS } from '../worlds'
import { useActive } from '../lib/active'
import { emit } from '../lib/bus'
import { tick } from '../lib/audio'

// hand-drawn-ish glyphs, one per app
const G = {
  boot: <path d="M5 7l6 5-6 5M13 18h6" />,
  notebook: <><rect x="6" y="4" width="13" height="16" rx="1.5" /><path d="M3 8h5M3 12h5M3 16h5M10 9h6M10 13h6" /></>,
  roles: <><rect x="6" y="7" width="12" height="14" rx="2" /><path d="M12 3v4M9 12h6M9 16h4" /></>,
  mission: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><path d="M12 12l6-6" /></>,
  ide: <path d="M9 7l-5 5 5 5M15 7l5 5-5 5M13.5 5l-3 14" />,
  projects: <><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" /></>,
  forge: <path d="M4 20V12h3v8M10.5 20V6h3v14M17 20V10h3v10M3 20h18" />,
  arcade: <><circle cx="12" cy="7" r="3" /><path d="M12 10v6M6 20h12l-1.5-4h-9z" /></>,
  workshop: <path d="M14.5 6.5a4 4 0 00-5 5L4 17l3 3 5.5-5.5a4 4 0 005-5l-2.5 2.5-2.5-.5-.5-2.5z" />,
  museum: <><path d="M3 9l9-5 9 5zM6 11v7M10 11v7M14 11v7M18 11v7M4 20h16" /></>,
  contact: <><path d="M3 8a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 000-4z" /><path d="M14 6v12" strokeDasharray="2 2" /></>,
}

export default function Dock() {
  const active = useActive()
  const ref = useRef()
  // fisheye: scale each icon by how close the pointer is. only transforms are touched.
  const move = (e) => {
    const items = ref.current.children
    for (const it of items) {
      const r = it.getBoundingClientRect()
      const d = Math.abs(e.clientX - (r.left + r.width / 2))
      it.style.setProperty('--s', 1 + Math.max(0, 1 - d / 90) * 0.55)
    }
  }
  const leave = () => { for (const it of ref.current.children) it.style.setProperty('--s', 1) }
  return (
    <nav className="dock" aria-label="apps">
      <div className="dock-row" ref={ref} onPointerMove={(e) => e.pointerType === 'mouse' && move(e)} onPointerLeave={leave}>
        {WORLDS.map((w, i) => (
          <button key={w.id} className={'dock-item' + (active === w.id ? ' on' : '')} style={{ '--c': w.color, '--r': (i % 2 ? 1.6 : -1.6) + 'deg' }}
            onPointerEnter={(e) => e.pointerType === 'mouse' && tick()} onClick={() => emit('wipe', w.id)} aria-label={w.label} aria-current={active === w.id}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{G[w.id]}</svg>
            <span className="dock-tip">{w.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
