// tiny event bus. terminal -> overlays, achievements -> toasts, dock -> wipes
const t = new EventTarget()
export const emit = (name, detail) => t.dispatchEvent(new CustomEvent(name, { detail }))
export const on = (name, fn) => {
  const h = (e) => fn(e.detail)
  t.addEventListener(name, h)
  return () => t.removeEventListener(name, h)
}
