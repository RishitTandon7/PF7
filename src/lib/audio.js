// all sound is synthesised in the browser (no audio files). nothing plays until the first click/key.
let ctx, muted = false
try { muted = localStorage.getItem('rt_mute') === '1' } catch {}
let armed = false
if (typeof window !== 'undefined') {
  for (const ev of ['pointerdown', 'keydown']) window.addEventListener(ev, () => { armed = true; if (bgmOn) startBgm() }, { once: true, capture: true })
  // every button gets a soft "pop", so the whole site feels clickable
  document.addEventListener('click', (e) => { if (e.target.closest?.('button, a, [role=button]')) pop() }, true)
}
const C = () => (ctx ||= new (window.AudioContext || window.webkitAudioContext)())
export const isMuted = () => muted
export const setMuted = (m) => { muted = m; try { localStorage.setItem('rt_mute', m ? '1' : '0') } catch {} }
const ok = () => !muted && armed

// one soft note: sine (or other) with a quick attack and exponential decay
function note(freq, dur, vol, type = 'sine', slide = 0, when = 0) {
  if (!ok()) return
  try {
    const c = C(), t = c.currentTime + when
    const o = c.createOscillator(), g = c.createGain()
    o.type = type
    o.frequency.setValueAtTime(freq, t)
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(vol, t + 0.006)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g).connect(c.destination)
    o.start(t); o.stop(t + dur + 0.02)
  } catch {}
}
// filtered noise burst (paper, whoosh, rip, hats)
function noise(dur, vol, type, f0, f1, q = 1) {
  if (!ok()) return
  try {
    const c = C(), len = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.sin((i / len) * Math.PI)
    const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain()
    f.type = type; f.Q.value = q
    f.frequency.setValueAtTime(f0, c.currentTime)
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, c.currentTime + dur)
    g.gain.value = vol
    src.buffer = buf; src.connect(f).connect(g).connect(c.destination); src.start()
  } catch {}
}

/* ---- ui sounds: short, soft, low ---- */
export const pop = () => note(520, 0.07, 0.03, 'sine', -240)
export const tick = () => note(1250, 0.03, 0.012, 'sine')
export const whoosh = () => noise(0.38, 0.07, 'bandpass', 350, 1900, 0.9)
export const paper = () => { noise(0.32, 0.09, 'bandpass', 1500, 3200, 0.7); setTimeout(() => noise(0.12, 0.05, 'highpass', 3000), 220) }
export const thunk = () => note(95, 0.18, 0.08, 'sine', -35)
// a small bell for "next stop"
export const ping = () => { note(880, 0.9, 0.035); note(1760, 0.5, 0.012); note(1320, 0.7, 0.014, 'sine', 0, 0.08) }
// alert: three soft falling two-note chimes (not a siren)
export const siren = () => { for (let i = 0; i < 3; i++) { note(740, 0.28, 0.04, 'sine', 0, i * 0.42); note(554, 0.34, 0.04, 'sine', 0, i * 0.42 + 0.17) } }
export const rip = () => noise(0.3, 0.12, 'highpass', 1800)
export const coin = () => { note(988, 0.12, 0.04, 'triangle'); note(1319, 0.3, 0.04, 'triangle', 0, 0.07) }

/* ---- arcade keeps its retro blips ---- */
export const zap = () => note(900, 0.07, 0.02, 'square', -500)
export const boom = () => note(130, 0.3, 0.06, 'sawtooth', -90)
export function beep(freq = 440, dur = 0.08, type = 'square', vol = 0.04, slide = 0) {
  note(freq, dur, Math.min(vol, 0.05), type, slide)
}

/* ---- bgm: bright, playful loop in G major (~104 bpm). marimba melody, bouncy bass, soft pad, light kick/clap/shaker groove ---- */
const touchDevice = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches
let bgmOn = !touchDevice
try { const v = localStorage.getItem('rt_bgm'); if (v !== null) bgmOn = v === '1' } catch {}
let bgm = null
export const isBgm = () => bgmOn
export function setBgm(on) {
  bgmOn = on
  try { localStorage.setItem('rt_bgm', on ? '1' : '0') } catch {}
  on ? startBgm() : stopBgm()
}
const mf = (n) => 440 * 2 ** ((n - 69) / 12)
// G - D - Em - C, two bars each (midi roots + chord tones)
const PROG = [
  { root: 43, tones: [55, 59, 62] },
  { root: 38, tones: [54, 57, 62] },
  { root: 40, tones: [55, 59, 64] },
  { root: 36, tones: [55, 60, 64] },
]
const PENTA = [67, 69, 71, 74, 76, 79, 81] // g major pentatonic, a bright octave

function startBgm() {
  if (bgm || !armed) return
  try {
    const c = C(); if (c.state === 'suspended') c.resume()
    const master = c.createGain(); master.gain.value = 0; master.gain.linearRampToValueAtTime(0.5, c.currentTime + 2.5); master.connect(c.destination)
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200; lp.connect(master)
    const dl = c.createDelay(); dl.delayTime.value = 60 / 104 * 0.75 // dotted-eighth echo
    const fb = c.createGain(); fb.gain.value = 0.28; const wet = c.createGain(); wet.gain.value = 0.32
    dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(lp)

    const tone = (f, t, dur, vol, type = 'sine', send = 0, to = lp) => {
      const o = c.createOscillator(), g = c.createGain()
      o.type = type; o.frequency.value = f
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      o.connect(g); g.connect(to)
      if (send) { const s = c.createGain(); s.gain.value = send; g.connect(s); s.connect(dl) }
      o.start(t); o.stop(t + dur + 0.05)
    }
    const marimba = (f, t) => { tone(f, t, 0.5, 0.05, 'sine', 0.55); tone(f * 4, t, 0.09, 0.012, 'sine') }
    const noiseHit = (t, dur, vol, ftype, freq) => {
      const len = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0)
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len)
      const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain()
      f.type = ftype; f.frequency.value = freq; g.gain.value = vol
      s.buffer = buf; s.connect(f).connect(g).connect(lp); s.start(t)
    }
    // soft pad: three detuned saws through a low filter, retuned on each chord change
    const padLp = c.createBiquadFilter(); padLp.type = 'lowpass'; padLp.frequency.value = 900; padLp.connect(lp)
    const pads = [0, 1, 2].map((k) => { const o = c.createOscillator(), g = c.createGain(); o.type = 'sawtooth'; o.detune.value = (k - 1) * 9; o.frequency.value = mf(PROG[0].tones[k] - 12); g.gain.value = 0.011; o.connect(g); g.connect(padLp); o.start(); return o })

    const step = 60 / 104 / 2 // eighth note
    let next = c.currentTime + 0.2, i = 0, last = -1, motif = [0, 2, 4, 2, 3, 1, 2, 0]
    const timer = setInterval(() => {
      while (next < c.currentTime + 0.3) {
        const bar = Math.floor(i / 8), s = i % 16, ch = PROG[Math.floor(bar / 2) % PROG.length], t = next + (i % 2 ? step * 0.08 : 0)
        const chordIdx = Math.floor(bar / 2) % PROG.length
        if (chordIdx !== last) { last = chordIdx; pads.forEach((o, k) => o.frequency.setTargetAtTime(mf(ch.tones[k] - 12), next, 0.4)); if (chordIdx === 0) motif = Array.from({ length: 8 }, () => (Math.random() * PENTA.length) | 0) }
        // bass: root on 1, octave pop on the "and" of 2, fifth on 4
        if (s === 0 || s === 6 || s === 8 || s === 14) tone(mf(ch.root + (s === 6 || s === 14 ? 12 : 0)), t, 0.28, 0.085, 'triangle')
        // drums: kick 1 + 3, clap 2 + 4, shaker on every eighth
        if (s % 8 === 0) { const o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(50, t + 0.12); g.gain.setValueAtTime(0.09, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16); o.connect(g); g.connect(lp); o.start(t); o.stop(t + 0.18) }
        if (s % 8 === 4) noiseHit(t, 0.1, 0.035, 'bandpass', 1800)
        noiseHit(t, 0.025, i % 2 ? 0.01 : 0.006, 'highpass', 8000)
        // marimba melody: a repeating 8-note idea over the chord, with gaps so it breathes
        if (s % 2 === 0 && Math.random() > 0.3) marimba(mf(PENTA[motif[(s / 2) % 8]]), t)
        else if (s % 4 === 3 && Math.random() > 0.6) marimba(mf(ch.tones[2] + 12), t)
        next += step; i++
      }
    }, 90)
    bgm = { master, timer, pads }
  } catch {}
}
function stopBgm() {
  if (!bgm) return
  const b = bgm; bgm = null
  clearInterval(b.timer)
  b.master.gain.setTargetAtTime(0, ctx.currentTime, 0.25)
  setTimeout(() => { b.pads.forEach((o) => { try { o.stop() } catch {} }); b.master.disconnect() }, 1500)
}
