import { useEffect, useRef } from 'react'
import { useTick } from '../lib/hooks'

// a gta-style pointer: a bold white arrow with a thick black outline. the tip is the click point.
//  - mouse (desktop): replaces the native cursor.
//  - stylus (s pen / apple pencil / surface pen): shown while the pen hovers or touches (turns green).
//  - finger touch: nothing is shown, and the native behaviour is untouched.
const HOT = 'a, button, [role=button], input, textarea, select, label, summary, .mat, .bd-card, .ed-id, .dock-item'
const GRAB = '.tool, .ed-card, .robot-grab, canvas, .crt canvas'
// the click point is the arrow's sharp tip: the top-left vertex (5,3) of the path, in a 46x48 viewBox drawn at 34x36 px
const TIP = { x: 5 * (34 / 46), y: 3 * (36 / 48) }

export default function CustomCursor() {
  const el = useRef()
  const s = useRef({ x: -100, y: -100, px: -100, rot: 0, on: false, kind: 'mouse', hot: false, grab: false, down: false })

  useEffect(() => {
    const root = document.documentElement
    const st = s.current
    const show = (on) => {
      if (st.on === on) return
      st.on = on
      root.classList.toggle('has-cursor', on && st.kind === 'mouse') // hide the native arrow only for a mouse
      el.current?.classList.toggle('on', on)
    }
    const move = (e) => {
      if (e.pointerType === 'touch') { show(false); return }
      st.kind = e.pointerType
      st.x = e.clientX; st.y = e.clientY
      if (!st.on) st.px = st.x
      const t = e.target
      st.hot = !!t.closest?.(HOT); st.grab = !st.hot && !!t.closest?.(GRAB)
      show(true)
    }
    const down = (e) => { if (e.pointerType !== 'touch') { st.down = true; st.x = e.clientX; st.y = e.clientY } }
    const up = () => { st.down = false }
    const leave = () => show(false)
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', down, { passive: true })
    window.addEventListener('pointerup', up, { passive: true })
    document.addEventListener('pointerleave', leave)
    document.addEventListener('mouseleave', leave)
    return () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerdown', down); window.removeEventListener('pointerup', up)
      document.removeEventListener('pointerleave', leave); document.removeEventListener('mouseleave', leave)
      root.classList.remove('has-cursor')
    }
  }, [])

  useTick(() => {
    const st = s.current
    if (!st.on) return
    // the arrow leans into fast sideways movement, like the one in the game
    const vx = st.x - st.px; st.px = st.x
    st.rot += (Math.max(-18, Math.min(18, vx * 0.7)) - st.rot) * 0.2
    const sc = st.down ? 0.85 : st.hot ? 1.2 : 1
    el.current.style.transform = `translate3d(${st.x - TIP.x}px, ${st.y - TIP.y}px, 0) rotate(${st.rot}deg) scale(${sc})`
    el.current.style.transformOrigin = `${TIP.x}px ${TIP.y}px`
    el.current.dataset.state = st.hot ? 'hot' : st.grab ? 'grab' : 'idle'
    el.current.dataset.kind = st.kind
  })

  return (
    <svg ref={el} className="cur-arrow" width="34" height="36" viewBox="0 0 46 48" aria-hidden>
      <path d="M5 3 L38 29 L21 30.5 L12 45 Z" strokeLinejoin="round" />
    </svg>
  )
}
