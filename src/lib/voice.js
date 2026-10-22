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

// speak a line. kind: 'female' (cute pet) | 'male' (jarvis). returns a promise that resolves when it ends.
export async function speakLine(text, { kind = 'female', onStart, onEnd } = {}) {
  if (!('speechSynthesis' in window)) return onEnd?.()
  const s = window.speechSynthesis
  s.cancel()
  const u = new SpeechSynthesisUtterance(text)
  const v = await pickVoice(kind)
  if (v) { u.voice = v; u.lang = v.lang }
  // warm and clear, not chipmunk: a neural voice already sounds good, so only nudge it
  if (kind === 'female') { u.pitch = 1.2; u.rate = 1.06 } else { u.pitch = 0.9; u.rate = 1.0 }
  u.volume = 1
  return new Promise((res) => {
    u.onstart = () => onStart?.()
    u.onend = u.onerror = () => { onEnd?.(); res() }
    s.speak(u)
  })
}
