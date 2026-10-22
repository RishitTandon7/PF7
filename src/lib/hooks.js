import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import gsap from 'gsap'

// is this element on screen? (margin lets us mount a bit early)
export function useVisible(ref, margin = '0px') {
  const [v, setV] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setV(e.isIntersecting), { rootMargin: margin })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, margin])
  return v
}

// everything animated hangs off the one gsap ticker (lenis + r3f are driven from it too)
export function useTick(fn, active = true) {
  const f = useRef(fn)
  f.current = fn
  useEffect(() => {
    if (!active) return
    const h = (time, dt, frame) => f.current(time, dt / 1000, frame)
    gsap.ticker.add(h)
    return () => gsap.ticker.remove(h)
  }, [active])
}

export function useMedia(q) {
  const sub = (cb) => {
    const m = window.matchMedia(q)
    m.addEventListener('change', cb)
    return () => m.removeEventListener('change', cb)
  }
  return useSyncExternalStore(sub, () => window.matchMedia(q).matches, () => false)
}
export const useMobile = () => useMedia('(max-width: 820px)')
export const useReducedMotion = () => useMedia('(prefers-reduced-motion: reduce)')

// canvas that sizes itself to its box at dpr<=1.5
export function useCanvas2D(draw, active) {
  const ref = useRef()
  const st = useRef({ w: 0, h: 0, dpr: 1 })
  useEffect(() => {
    const c = ref.current
    const fit = () => {
      const r = c.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      st.current = { w: r.width, h: r.height, dpr }
      c.width = Math.max(1, r.width * dpr)
      c.height = Math.max(1, r.height * dpr)
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(c)
    return () => ro.disconnect()
  }, [])
  useTick((time, dt) => {
    const c = ref.current
    if (!c) return
    const { w, h, dpr } = st.current
    const g = c.getContext('2d')
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    draw(g, w, h, time, dt)
  }, active)
  return ref
}

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
export const lerp = (a, b, t) => a + (b - a) * t
export const rand = (a, b) => a + Math.random() * (b - a)
