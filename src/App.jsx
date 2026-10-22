import { useEffect } from 'react'
import gsap from 'gsap'
import MenuBar from './ui/MenuBar'
import Dock from './ui/Dock'
import Wipe from './ui/Wipe'
import Toasts from './ui/Toasts'
import FX from './ui/FX'
import Hero from './ui/Hero'
import Footer from './ui/Footer'
import Pet from './ui/Pet'
import CustomCursor from './ui/CustomCursor'
import { Lazy } from './ui/Window'
import { WORLDS } from './worlds'
import { initScroll, scrollToId } from './lib/scroll'
import { setActive } from './lib/active'
import { unlock } from './lib/store'
import { emit, on } from './lib/bus'

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']

export default function App() {
  useEffect(() => {
    initScroll()

    // which world is crossing the middle of the screen
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.dataset.world)), { rootMargin: '-50% 0px -50% 0px' })
    const watch = () => document.querySelectorAll('[data-world]').forEach((el) => io.observe(el))
    watch()
    const mo = new MutationObserver(watch)
    mo.observe(document.getElementById('root'), { childList: true, subtree: true })

    // konami -> barrel roll + 30 lives in the arcade
    let i = 0
    const kd = (e) => {
      const tag = e.target.tagName
      if (e.key === '`' && tag !== 'INPUT') { e.preventDefault(); scrollToId('boot'); setTimeout(() => emit('focus-term'), 400); return }
      i = e.key.toLowerCase() === KONAMI[i].toLowerCase() ? i + 1 : (e.key === KONAMI[0] ? 1 : 0)
      if (i === KONAMI.length) {
        i = 0
        window.__lives = 30
        unlock('konami')
        gsap.fromTo('#root', { rotate: 0 }, { rotate: 360, duration: 1.1, ease: 'power2.inOut', clearProps: 'rotate' })
      }
    }
    window.addEventListener('keydown', kd)

    // a big gap between outer and inner window usually means devtools is docked open
    const dt = () => { if (outerWidth - innerWidth > 200 || outerHeight - innerHeight > 260) unlock('devtools') }
    window.addEventListener('resize', dt)
    const off = on('devtools', () => unlock('devtools'))

    return () => { io.disconnect(); mo.disconnect(); window.removeEventListener('keydown', kd); window.removeEventListener('resize', dt); off() }
  }, [])

  return (
    <>
      <MenuBar />
      <main>
        <div data-world="boot"><Hero /></div>
        {WORLDS.slice(1).map((w) => <Lazy key={w.id} world={w} />)}
      </main>
      <Footer />
      <Dock />
      <Wipe />
      <Toasts />
      <FX />
      <Pet />
      <CustomCursor />
    </>
  )
}
