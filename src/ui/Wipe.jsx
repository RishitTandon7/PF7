import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { on, emit } from '../lib/bus'
import { scrollToId, scrollToEl, stopScroll } from '../lib/scroll'
import { whoosh } from '../lib/audio'

// every world has its own way of covering the screen while the page jumps underneath.
// cover animates in -> scroll jumps while nothing is visible -> cover animates out.
const CELLS = { ide: 12, forge: 10, workshop: 8 }

const K = {
  boot: { from: { scaleY: 0.004 }, to: { scaleY: 1, duration: 0.18, ease: 'power4.in' }, out: { scaleY: 0.004, duration: 0.2, ease: 'power4.out' } },
  // page turn
  notebook: { from: { rotateY: 95, transformOrigin: '0% 50%' }, to: { rotateY: 0, duration: 0.38, ease: 'power2.in' }, out: { rotateY: -95, transformOrigin: '100% 50%', duration: 0.42, ease: 'power2.out' } },
  // radar ping
  roles: { from: { yPercent: -105 }, to: { yPercent: 0, duration: 0.4, ease: 'bounce.out' }, out: { yPercent: 105, duration: 0.3, ease: 'power2.in' } },
  mission: { from: { scale: 0 }, to: { scale: 1, duration: 0.4, ease: 'power3.in' }, out: { scale: 0, duration: 0.4, ease: 'power3.out' } },
  // lines of code
  ide: { from: { scaleX: 0, transformOrigin: '0% 50%' }, to: { scaleX: 1, duration: 0.22, stagger: 0.025, ease: 'power2.in' }, out: { scaleX: 0, transformOrigin: '100% 50%', duration: 0.22, stagger: 0.025, ease: 'power2.out' } },
  projects: { from: { xPercent: 110, skewX: -14 }, to: { xPercent: 0, duration: 0.34, ease: 'power3.in' }, out: { xPercent: -110, duration: 0.36, ease: 'power3.out' } },
  // skyline buildings rising
  forge: { from: { scaleY: 0, transformOrigin: '50% 100%' }, to: { scaleY: 1, duration: 0.28, stagger: { each: 0.03, from: 'random' }, ease: 'power2.in' }, out: { scaleY: 0, transformOrigin: '50% 0%', duration: 0.3, stagger: { each: 0.03, from: 'random' }, ease: 'power2.out' } },
  // crt power on, in steps
  arcade: { from: { scaleX: 0.004, scaleY: 0.004 }, to: { scaleX: 1, scaleY: 1, duration: 0.24, ease: 'steps(4)' }, out: { scaleY: 0.004, duration: 0.18, ease: 'power4.in' } },
  // pegboard slats dropping
  workshop: { from: { yPercent: -105 }, to: { yPercent: 0, duration: 0.4, stagger: 0.04, ease: 'bounce.out' }, out: { yPercent: 105, duration: 0.3, stagger: 0.03, ease: 'power2.in' } },
  museum: { from: { opacity: 0 }, to: { opacity: 1, duration: 0.35, ease: 'power1.in' }, out: { opacity: 0, duration: 0.7, ease: 'power1.out' } },
  contact: { from: { xPercent: 105 }, to: { xPercent: 0, duration: 0.34, ease: 'power3.in' }, out: { xPercent: -105, duration: 0.34, ease: 'power3.out' } },
}

export default function Wipe() {
  const [job, setJob] = useState(null)
  const root = useRef()
  const busy = useRef(false)
  const queued = useRef(null)

  useEffect(() => on('wipe', (id) => {
    if (busy.current) { queued.current = id; return } // tapped again mid-transition: remember it, run it right after
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return scrollToId(id, false)
    busy.current = true
    whoosh()
    setJob({ id })
  }), [])

  useLayoutEffect(() => {
    if (!job) return
    const cells = [...root.current.children]
    const k = K[job.id]
    stopScroll(true)
    const tl = gsap.timeline({ onComplete: () => { setJob(null); busy.current = false; stopScroll(false); const q = queued.current; queued.current = null; if (q) setTimeout(() => emit('wipe', q), 30) } })
    tl.fromTo(cells, k.from, k.to)
    tl.call(() => {
      stopScroll(false)
      scrollToId(job.id, true)
      stopScroll(true)
      // worlds mount lazily and can change height, so nudge once more when they've settled
      setTimeout(() => scrollToEl(document.querySelector(`[data-world="${job.id}"]`), true), 140)
    })
    tl.to(cells, k.out, '+=0.1')
    return () => tl.kill()
  }, [job])

  if (!job) return null
  return (
    <div ref={root} className={'wipe k-' + job.id} aria-hidden>
      {Array.from({ length: CELLS[job.id] || 1 }, (_, i) => <div key={i} className="wipe-cell" style={{ '--i': i }} />)}
    </div>
  )
}
