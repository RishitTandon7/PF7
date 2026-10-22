// picks the best speech voice the visitor's browser has. neural/"natural" voices (edge, chrome on windows/android, safari) sound far
// better than the old default ones, so they rank first. voices load asynchronously, so we wait for them.
const FEMALE = /aria|jenny|sonia|libby|michelle|ana\b|emma|samantha|ava|allison|karen|moira|tessa|serena|zira|female/i
const MALE = /guy|ryan|davis|brian|christopher|eric|roger|george|daniel|alex|oliver|arthur|thomas|male/i

let cache = null
export function voicesReady() {
  if (cache) return cache
  cache = new Promise((res) => {
    if (!('speechSynthesis' in window)) return res([])
    const s = window.speechSynthesis
    const have = s.getVoices()
    if (have.length) return res(have)
    const done = () => res(s.getVoices())
    s.addEventListener('voiceschanged', done, { once: true })
    setTimeout(done, 1500)
  })
  return cache
}

const score = (v, re) => {
  let n = 0
  if (!/^en/i.test(v.lang)) return -1
  if (/natural|neural|online/i.test(v.name)) n += 50      // microsoft neural voices in edge
  if (/google/i.test(v.name)) n += 25                      // chrome's network voices
  if (/premium|enhanced/i.test(v.name)) n += 30            // apple's better voices
  if (re.test(v.name)) n += 20
  if (/en-US|en-GB|en-IN/i.test(v.lang)) n += 5
  if (v.localService === false) n += 4
  return n
}

export async function pickVoice(kind = 'female') {
  const vs = await voicesReady()
  const re = kind === 'male' ? MALE : FEMALE
  let best = null, top = -1
  for (const v of vs) { const s = score(v, re); if (s > top) { top = s; best = v } }
  return best
}

// speak a line. kind: 'female' (cute pet) | 'male' (jarvis). resolves when it ends - and ALWAYS resolves, even if the browser drops it.
// chrome's speech engine has known flaws that make it go silent: an utterance that gets garbage-collected mid-speech never fires onend,
// a speak() straight after cancel() can be swallowed, and the engine can get stuck "paused". so: keep a reference, resume first,
// give cancel a beat, and if nothing starts within ~1.2s try once more; a watchdog guarantees the promise settles.
let keep = null
export async function speakLine(text, { kind = 'female', onStart, onEnd } = {}) {
  if (!('speechSynthesis' in window)) return onEnd?.()
  const s = window.speechSynthesis
  const v = await pickVoice(kind)
  return new Promise((resolve) => {
    let started = false, done = false, tries = 0, wd, retry
    const finish = () => { if (done) return; done = true; clearTimeout(wd); clearTimeout(retry); keep = null; onEnd?.(); resolve() }
    const attempt = () => {
      tries++
      try { s.cancel(); s.resume() } catch {}
      setTimeout(() => {
        const u = new SpeechSynthesisUtterance(text)
        keep = u // hold a reference until it ends
        if (v) { u.voice = v; u.lang = v.lang }
        // warm and clear, not chipmunk: a neural voice already sounds good, so only nudge it
        if (kind === 'female') { u.pitch = 1.2; u.rate = 1.06 } else { u.pitch = 0.9; u.rate = 1.0 }
        u.volume = 1
        u.onstart = () => { started = true; onStart?.() }
        u.onend = finish
        u.onerror = (e) => { if (e.error === 'interrupted' || e.error === 'canceled') return finish(); if (tries < 2 && !started) return attempt(); finish() }
        try { s.speak(u) } catch { finish() }
        // nothing started? the engine swallowed it. try once more
        clearTimeout(retry)
        retry = setTimeout(() => { if (!started && !done && tries < 2) attempt() }, 1200)
      }, tries === 1 ? 60 : 250)
    }
    attempt()
    // never leave a caller waiting: about 14 characters a second, plus a margin
    wd = setTimeout(finish, Math.min(45000, 3500 + text.length * 80))
  })
}
