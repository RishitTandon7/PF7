import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let lenis = null

// one clock for everything: lenis, scrolltrigger, r3f and every canvas run inside gsap.ticker
export function initScroll() {
  // phones scroll natively (smoother, and no per-frame js). lenis is only for mouse wheels.
  if (lenis || window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.matchMedia('(hover: none)').matches) { ScrollTrigger.config({ ignoreMobileResize: true }); return }
  lenis = new Lenis({ autoRaf: false, lerp: 0.1, wheelMultiplier: 0.95, syncTouch: false })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((t) => lenis.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)
}

export const velocity = () => (lenis ? lenis.velocity : 0)

// resolve the absolute y ourselves: handing lenis an element makes it add the element's rect to its own
// (possibly stale) animatedScroll, which lands on the wrong spot after a jump.
export function scrollToEl(el, immediate = false, offset = 0) {
  if (!el) return
  const y = Math.round(el.getBoundingClientRect().top + window.scrollY - offset)
  if (lenis) lenis.scrollTo(y, { immediate, force: true })
  else window.scrollTo({ top: y, behavior: immediate ? 'auto' : 'smooth' })
}

export function scrollToId(id, immediate = false) {
  scrollToEl(document.querySelector(`[data-world="${id}"]`), immediate)
}

export function stopScroll(stop) {
  if (!lenis) return
  stop ? lenis.stop() : lenis.start()
}
