import { useSyncExternalStore } from 'react'

// which world is crossing the middle of the screen right now
let active = 'boot'
const subs = new Set()
export const setActive = (id) => {
  if (id === active) return
  active = id
  // (not data-world: that attribute marks the world wrappers, and <html> would match first in querySelector)
  document.documentElement.dataset.active = id
  subs.forEach((f) => f())
}
export const useActive = () => useSyncExternalStore((cb) => (subs.add(cb), () => subs.delete(cb)), () => active)
