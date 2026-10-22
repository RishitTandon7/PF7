import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useLoader } from '@react-three/fiber'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Window } from '../ui/Window'
import GL from '../ui/GL'
import { NIDM } from '../data/content'
import { useCanvas2D, useVisible, clamp, lerp } from '../lib/hooks'
import { scrollToEl } from '../lib/scroll'
import { emit } from '../lib/bus'
import { ping, siren, whoosh } from '../lib/audio'
import './mission.css'

gsap.registerPlugin(ScrollTrigger)

const ease = (t) => t * t * (3 - 2 * t)
const smooth = (a, b, x) => ease(clamp((x - a) / (b - a), 0, 1))
const ll = (lat, lon, r = 1) => {
  const phi = ((90 - lat) * Math.PI) / 180, th = ((lon + 180) * Math.PI) / 180
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th))
}
const HIMALAYA = ll(27.915, 88.183)
const CHENNAI = ll(13.0827, 80.2707)
const CHENNAI_LL = [13.0827, 80.2707]

/* ---- value-noise terrain for the glacial lake ---- */
const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s) }
const vnoise = (x, y) => {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf)
  return lerp(lerp(hash(xi, yi), hash(xi + 1, yi), u), lerp(hash(xi, yi + 1), hash(xi + 1, yi + 1), u), v)
}
const fbm = (x, y) => { let a = 0.5, f = 1, s = 0; for (let i = 0; i < 5; i++) { s += a * vnoise(x * f, y * f); f *= 2; a *= 0.5 } return s }
// ---- real terrain: south lhonak lake, baked from aws terrarium tiles (scripts/dem.mjs) ----
const DN = 192, STEP = 135.1, UNIT = 400, VEX = 1.7, BASE = 5266
const toY = (e) => ((e - BASE) / UNIT) * VEX
let DEM = null
const demReady = fetch('/tex/lhonak.bin').then((r) => r.arrayBuffer()).then((b) => { DEM = new Uint16Array(b) })
// grid -> world: 1 world unit = 400 m, lake at the origin, north = -z
const gw = (g) => (g - DN / 2) * (STEP / UNIT)
const GEO = { dir: new THREE.Vector3(1, 0, 0.5).normalize(), lake: [], path: [] }
function analyse() {
  // the lake = cells connected to the centre that sit within 20 m of its surface
  const c = DEM[(DN / 2) * DN + DN / 2], seen = new Set([(DN / 2) * DN + DN / 2]), q = [...seen]
  while (q.length) {
    const i = q.pop(), x = i % DN, y = (i / DN) | 0
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, j = ny * DN + nx
      if (nx < 0 || ny < 0 || nx >= DN || ny >= DN || seen.has(j) || Math.abs(DEM[j] - c) > 20) continue
      seen.add(j); q.push(j)
    }
  }
  GEO.lake = [...seen]
  // the drainage line: from the lowest cell touching the lake, keep stepping to the lowest unvisited neighbour
  let best = null
  for (const i of seen) {
    const x = i % DN, y = (i / DN) | 0
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const j = (y + dy) * DN + x + dx; if (!seen.has(j) && (best == null || DEM[j] < DEM[best])) best = j }
  }
  const vis = new Set(seen), path = []
  let cur = best
  for (let s = 0; s < 220 && cur != null; s++) {
    path.push(cur); vis.add(cur)
    const x = cur % DN, y = (cur / DN) | 0
    let nxt = null
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy, j = ny * DN + nx
      if (nx < 1 || ny < 1 || nx >= DN - 1 || ny >= DN - 1 || vis.has(j)) continue
      if (nxt == null || DEM[j] < DEM[nxt]) nxt = j
    }
    cur = nxt
  }
  GEO.path = path
  const far = path[Math.min(path.length - 1, 40)] ?? best
  GEO.dir.set(gw(far % DN), 0, gw((far / DN) | 0)).normalize()
  if (!isFinite(GEO.dir.x)) GEO.dir.set(1, 0, 0.5).normalize()
}

function Pin({ at, color, label }) {
  const ring = useRef()
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), at.clone().normalize()), [at])
  const tag = useMemo(() => {
    const c = document.createElement('canvas'); c.width = 320; c.height = 56
    const g = c.getContext('2d'); g.fillStyle = 'rgba(2,14,11,.85)'; g.fillRect(0, 6, 320, 44); g.strokeStyle = color; g.lineWidth = 2; g.strokeRect(1, 7, 318, 42)
    g.fillStyle = color; g.font = '24px "Share Tech Mono", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, 160, 29)
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t
  }, [color, label])
  useFrame((s) => { const k = 1 + ((s.clock.elapsedTime * 0.8) % 1); ring.current.scale.setScalar(k); ring.current.material.opacity = 1 - (k - 1) })
  return (
    <group position={at.clone().multiplyScalar(1.004)} quaternion={q}>
      <mesh ref={ring}><ringGeometry args={[0.02, 0.026, 32]} /><meshBasicMaterial color={color} transparent /></mesh>
      <mesh><circleGeometry args={[0.008, 16]} /><meshBasicMaterial color={color} /></mesh>
      <sprite position={[0, 0.035, 0.01]} scale={[0.15, 0.026, 1]}><spriteMaterial map={tag} transparent depthTest={false} /></sprite>
    </group>
  )
}

// a real earth: nasa blue marble + city lights, tinted down so it still sits in the mission-control palette
function Globe() {
  const [day, night] = useLoader(THREE.TextureLoader, ['/tex/earth.jpg', '/tex/earth_lights.png'])
  day.colorSpace = THREE.SRGBColorSpace; night.colorSpace = THREE.SRGBColorSpace
  const stars = useMemo(() => {
    const a = []
    for (let i = 0; i < 400; i++) { const v = new THREE.Vector3().randomDirection().multiplyScalar(14 + Math.random() * 10); a.push(v.x, v.y, v.z) }
    const b = new THREE.BufferGeometry(); b.setAttribute('position', new THREE.Float32BufferAttribute(a, 3)); return b
  }, [])
  return (
    <group>
      <mesh><sphereGeometry args={[1, 96, 64]} /><meshStandardMaterial map={day} emissiveMap={night} emissive="#ffcf80" emissiveIntensity={0.9} roughness={0.9} /></mesh>
      <mesh><sphereGeometry args={[1.012, 64, 48]} /><meshBasicMaterial color="#38ffb0" transparent opacity={0.07} side={THREE.BackSide} /></mesh>
      <points geometry={stars}><pointsMaterial size={0.05} color="#bfffe8" sizeAttenuation transparent opacity={0.5} /></points>
      <Pin at={CHENNAI} color="#ffb020" label="CHENNAI · SRM IST" />
      <Pin at={HIMALAYA} color="#ff4d4d" label="SOUTH LHONAK LAKE" />
    </group>
  )
}

function Terrain({ p }) {
  // analyse before any memo reads GEO (the dem may already be loaded by the time we mount)
  if (DEM && !GEO.lake.length) analyse()
  const [ready, setReady] = useState(!!DEM)
  useEffect(() => { demReady.then(() => { if (!GEO.lake.length) analyse(); setReady(true) }) }, [])
  const geo = useMemo(() => {
    if (!ready) return null
    const size = DN * (STEP / UNIT)
    const g = new THREE.PlaneGeometry(size, size, DN - 1, DN - 1)
    g.rotateX(-Math.PI / 2)
    const pos = g.attributes.position, col = []
    const forest = new THREE.Color('#1b2b22'), moss = new THREE.Color('#3f4d3e'), rock = new THREE.Color('#6d706a'), snow = new THREE.Color('#f1fbff')
    for (let i = 0; i < pos.count; i++) {
      const e = DEM[i]
      pos.setY(i, toY(e))
      const n = 0.88 + vnoise(pos.getX(i) * 1.3, pos.getZ(i) * 1.3) * 0.24
      const c = e < 4950 ? forest.clone() : e < 5500 ? forest.clone().lerp(moss, clamp((e - 4950) / 550, 0, 1)) : e < 6100 ? moss.clone().lerp(rock, clamp((e - 5500) / 600, 0, 1)) : rock.clone().lerp(snow, clamp((e - 6100) / 500, 0, 1))
      c.multiplyScalar(n); col.push(c.r, c.g, c.b)
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals()
    return g
  }, [ready])
  // the real lake outline, as flat quads at lake level
  const lakeGeo = useMemo(() => {
    if (!ready) return null
    const v = [], h = (STEP / UNIT) / 2 * 1.15
    for (const i of GEO.lake) { const x = gw(i % DN), z = gw((i / DN) | 0); v.push(x - h, 0, z - h, x - h, 0, z + h, x + h, 0, z - h, x + h, 0, z - h, x - h, 0, z + h, x + h, 0, z + h) }
    const b = new THREE.BufferGeometry(); b.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); b.computeVertexNormals(); return b
  }, [ready])
  const sensors = useMemo(() => {
    if (!ready || !GEO.path.length) return []
    return [6, 22, 44, 80, 130].map((k) => { const i = GEO.path[Math.min(k, GEO.path.length - 1)]; return [gw(i % DN), toY(DEM[i]) + 0.35, gw((i / DN) | 0)] })
  }, [ready])
  const water = useRef(), ring = useRef(), vill = useRef([])
  useFrame((s) => {
    if (!ready) return
    const t = s.clock.elapsedTime, a = clamp((p.current - 0.8) / 0.2, 0, 1)
    water.current.position.y = 0.13 + a * 0.12 + Math.sin(t * 2) * 0.01
    ring.current.visible = a > 0
    const k = 1 + ((t * 1.2) % 1) * 5
    ring.current.scale.setScalar(k); ring.current.material.opacity = (1 - (k - 1) / 5) * 0.9
    // the flood runs down the real drainage line; each sensor it passes flips to red
    sensors.forEach((_, i) => {
      const m = vill.current[i]?.material; if (!m) return
      const hit = a * 1.15 > (i + 0.5) / sensors.length
      m.color.set(hit ? '#ff4d4d' : '#ffb020'); m.emissive.set(hit ? '#ff1a1a' : '#552a00')
      m.emissiveIntensity = hit ? 1.2 + Math.sin(t * 12) * 0.6 : 0.6
    })
  })
  if (!ready) return null
  return (
    <group>
      <mesh geometry={geo}><meshStandardMaterial vertexColors roughness={0.95} flatShading /></mesh>
      <mesh ref={water} geometry={lakeGeo} position={[0, 0.13, 0]}><meshStandardMaterial color="#25c2d6" emissive="#0b6070" emissiveIntensity={0.8} roughness={0.15} metalness={0.3} side={THREE.DoubleSide} /></mesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.3, 0]}><ringGeometry args={[0.9, 1, 48]} /><meshBasicMaterial color="#ff4d4d" transparent /></mesh>
      {sensors.map((pos, i) => (
        <mesh key={i} ref={(el) => (vill.current[i] = el)} position={pos}><boxGeometry args={[0.35, 0.7, 0.35]} /><meshStandardMaterial color="#ffb020" emissive="#552a00" /></mesh>
      ))}
    </group>
  )
}

function Rig({ p, onTick }) {
  const globe = useRef(), terr = useRef()
  const start = useMemo(() => ll(8, -35).normalize(), [])
  const tgt = useMemo(() => HIMALAYA.clone().normalize(), [])
  const chen = useMemo(() => CHENNAI.clone().normalize(), [])
  useFrame(({ camera, scene }) => {
    const v = p.current
    onTick?.(v)
    scene.children.forEach((c) => { if (c.userData.stage === 'globe') c.visible = v < 0.3; if (c.userData.stage === 'terrain') c.visible = v >= 0.6 })
    // 0-0.3 globe (orbit -> chennai -> himalaya), 0.3-0.6 your google earth recording zooming to the lake, 0.6-1 real dem terrain
    if (v < 0.3) {
      const t = clamp(v / 0.3, 0, 1)
      // orbit -> chennai (where srm is) -> himalaya
      let dir, dist
      if (t < 0.5) { const a = ease(t / 0.5); dir = start.clone().lerp(chen, a).normalize(); dist = lerp(3.6, 1.75, a) }
      else { const b = ease((t - 0.5) / 0.5); dir = chen.clone().lerp(tgt, b).normalize(); dist = lerp(1.75, 1.16, b) }
      camera.position.copy(dir.multiplyScalar(dist))
      camera.lookAt(0, 0, 0)
      camera.up.set(0, 1, 0)
      camera.fov = 38
    } else if (v >= 0.6) {
      const u = ease(clamp((v - 0.6) / 0.4, 0, 1))
      // stay high until the end, then drop into the valley mouth (x=0, downstream) and look up at the lake
      const d = GEO.dir
      const sx = d.x * 34 - 6, sz = d.z * 34 + 6
      camera.position.set(lerp(sx, d.x * 8.5, u), lerp(34, 15, u * u), lerp(sz, d.z * 8.5, u))
      camera.lookAt(d.x * lerp(0, 1, u), 0, d.z * lerp(0, 1, u))
      camera.fov = 45
    }
    camera.updateProjectionMatrix()
  })
  return null
}

function Radar({ active, p }) {
  const blips = useMemo(() => Array.from({ length: 9 }, (_, i) => ({ a: (i * 2.399) % 6.283, r: 0.25 + ((i * 0.37) % 0.65) })), [])
  const ref = useCanvas2D((g, w, h, t) => {
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - 4
    if (R <= 2) return // not laid out (hidden) - drawing an arc with a negative radius throws every single frame
    g.clearRect(0, 0, w, h)
    g.strokeStyle = 'rgba(56,255,176,.35)'; g.lineWidth = 1
    for (let i = 1; i <= 4; i++) { g.beginPath(); g.arc(cx, cy, (R * i) / 4, 0, 6.283); g.stroke() }
    g.beginPath(); g.moveTo(cx - R, cy); g.lineTo(cx + R, cy); g.moveTo(cx, cy - R); g.lineTo(cx, cy + R); g.stroke()
    const ang = (t * 1.6) % 6.283
    for (let i = 0; i < 40; i++) {
      g.strokeStyle = `rgba(56,255,176,${(1 - i / 40) * 0.5})`
      g.beginPath(); g.moveTo(cx, cy); const a = ang - i * 0.025; g.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.stroke()
    }
    const alert = p.current > 0.8
    blips.forEach((b, i) => {
      const da = ((ang - b.a) % 6.283 + 6.283) % 6.283
      const hot = alert && i === 3
      const al = Math.max(hot ? 0.6 : 0, 1 - da / 3.2)
      g.fillStyle = hot ? `rgba(255,77,77,${al})` : `rgba(56,255,176,${al})`
      g.beginPath(); g.arc(cx + Math.cos(b.a) * b.r * R, cy + Math.sin(b.a) * b.r * R, hot ? 5 : 3, 0, 6.283); g.fill()
    })
  }, active)
  return <canvas ref={ref} className="radar" />
}

const ALERTS = [
  [0.12, 'sat link acquired — upper teesta catchment, sikkim'],
  [0.4, 'scanning moraine-dammed lakes ...'],
  [0.58, 'south lhonak lake locked. level nominal.'],
  [0.74, 'sensor 14: water level rising'],
  [0.82, 'GLOF SIGNATURE DETECTED'],
  [0.88, 'alert dispatched downstream'],
  [0.94, 'villages notified. sirens on.'],
]

// the guided tour: what you're looking at, in plain words, one stop at a time
const STEPS = [
  [0, 'stop 1 · home base', 'this is earth. i study at srm ist in chennai (the amber pin). this internship was a research project with nidm, india\'s national institute of disaster management.'],
  [0.15, 'stop 2 · the himalayas', 'the project is about glacial lakes in the himalayas. flying from chennai up to sikkim, in the east of the range.'],
  [0.3, 'stop 3 · south lhonak lake', 'real satellite view. this lake sits at about 5,200 m in the upper teesta (tista) catchment. it is held back by loose ice and rock.'],
  [0.5, 'stop 4 · the problem', 'in oct 2023 the dam broke and the lake emptied downhill: a glacial lake outburst flood, or glof. towns downstream get minutes of warning, not hours.'],
  [0.78, 'stop 5 · the alarm', 'this is the alert pipeline firing (demo feed).'],
  [0.88, 'stop 6 · my part', 'my job: make that warning arrive faster. result: 40% lower alert latency. details below.'],
]

export default function Mission() {
  const root = useRef(), track = useRef(), P = useRef(0)
  const vis = useVisible(root)
  const hud = useRef({})
  const [tour, setTour] = useState(false)
  // on phones the walkthrough is a tap-through story (back / next): the globe flies to each stop on its own, and three still frames from
  // the recording crossfade in place of the 18mb video. scrubbing a video and a webgl globe with your thumb is what phones are worst at.
  const [phone] = useState(() => typeof window !== 'undefined' && window.matchMedia('(hover: none), (max-width: 820px)').matches)
  const [stop, setStop] = useState(0)
  const STOP_P = [0.02, 0.17, 0.33, 0.56, 0.84, 0.95] // where the story sits for each of the six stops
  const go = (i) => {
    const n = Math.max(0, Math.min(STEPS.length - 1, i)); setStop(n)
    gsap.to(P, { current: STOP_P[n], duration: 1.9, ease: 'power2.inOut', overwrite: true })
  }

  useEffect(() => {
    if (!tour || phone) return
    const st = ScrollTrigger.create({ trigger: track.current, start: 'top top+=60', end: 'bottom bottom', onUpdate: (s) => (P.current = s.progress) })
    ScrollTrigger.refresh()
    return () => st.kill()
  }, [tour, phone])

  const start = () => {
    emit('touched', 'mission') // the pet should not say "you missed it" about something that is running
    emit('touched', 'mission') // starting the walkthrough counts as engaging with this section
    setTour(true); setStop(0); P.current = STOP_P[0]
    setTimeout(() => scrollToEl(track.current), 80)
  }

  // closing the walkthrough puts the card (and its start button) back, and leaves you at the top of this section
  const close = () => {
    gsap.killTweensOf(P)
    hud.current = {}; P.current = 0
    setTour(false)
    setTimeout(() => scrollToEl(root.current, true), 60)
  }

  const onTick = (v) => {
    const h = hud.current
    if (!h.flash) return
    // narrate: the card changes at each stop, with a ping
    let si = 0
    STEPS.forEach(([at], i) => { if (v >= at) si = i })
    if (h.si !== si && h.stepT) {
      h.si = si
      h.stepT.textContent = STEPS[si][1]; h.stepP.textContent = STEPS[si][2]
      h.stepDots?.forEach((d, i) => d.classList.toggle('on', i <= si))
      if (h.pinged) ping()
      h.pinged = true
      gsap.fromTo(h.card, { x: -14, opacity: 0.4 }, { x: 0, opacity: 1, duration: 0.35, ease: 'power2.out' })
    }
    if (v > 0.8 && !h.sirened) { h.sirened = true; siren() } else if (v < 0.75) h.sirened = false
    h.flash.style.opacity = "0"
    const a = clamp((v - 0.84) / 0.12, 0, 1)
    if (h.bar) h.bar.style.transform = `scaleX(${1 - 0.4 * ease(a)})` // (radar / latency panels aren't rendered on phones)
    if (h.pct) h.pct.textContent = '-' + Math.round(40 * ease(a)) + '%'
    h.alerts?.forEach((el, i) => el?.classList.toggle('on', v >= ALERTS[i][0]))
    h.alerts?.forEach((el, i) => el?.classList.toggle('hot', i >= 4 && v >= ALERTS[i][0]))
    // the recording is scrubbed by scroll; fades in over the globe, out into the 3d terrain
    if (h.stills) {
      const o1 = clamp((v - 0.26) / 0.06, 0, 1) * (1 - clamp((v - 0.42) / 0.1, 0, 1))
      const o2 = clamp((v - 0.42) / 0.1, 0, 1) * (1 - clamp((v - 0.66) / 0.1, 0, 1))
      const o3 = clamp((v - 0.66) / 0.1, 0, 1)
      const z = 1 + clamp((v - 0.3) / 0.6, 0, 1) * 0.1
      h.stills.forEach((el, i) => { if (!el) return; el.style.opacity = [o1, o2, o3][i].toFixed(2); el.style.transform = 'scale(' + z.toFixed(3) + ')' })
    }
    const vid = h.vid
    if (vid && vid.duration) {
      // linear across the whole stretch (an ease made the middle race), and the picture follows with inertia so a fast flick can't teleport it
      const k = clamp((v - 0.3) / 0.4, 0, 1)
      vid.style.opacity = clamp((v - 0.26) / 0.05, 0, 1).toFixed(2)
      const want = k * (vid.duration - 0.05)
      h.vt = h.vt == null ? want : h.vt + (want - h.vt) * 0.14
      if (vid.readyState >= 2 && !vid.seeking && Math.abs(vid.currentTime - h.vt) > 0.02) vid.currentTime = h.vt
    }
    h.coords.textContent = v < 0.3
      ? `ORBIT  ${lerp(8, v < 0.15 ? CHENNAI_LL[0] : 27.915, ease(v / 0.3)).toFixed(2)}N  ${lerp(-35, v < 0.15 ? CHENNAI_LL[1] : 88.183, ease(v / 0.3)).toFixed(2)}E  alt ${Math.round(lerp(22000, 3000, ease(v / 0.3)))}km`
      : v < 0.7
        ? `KANCHENJUNGA REGION  27.92N 88.18E  alt ${Math.round(lerp(3000, 12, ease((v - 0.3) / 0.4)))}km`
        : `SOUTH LHONAK LAKE  27.92N 88.18E  alt ${Math.round(lerp(5600, 5200, clamp((v - 0.6) / 0.4, 0, 1)))}m`
    if (h.pulse) h.pulse.style.opacity = clamp((v - 0.8) / 0.05, 0, 1)
    root.current.classList.toggle('alarm', v > 0.8)
  }

  return (
    <section className="w-mission" ref={root}>
      <Window title="mission_ctrl.app" barClass="mc-bar">
        {!tour && (
          <div className="mc-intro" style={{ backgroundImage: 'url(/media/lhonak-poster.jpg)' }}>
            <div className="mc-intro-card">
              <small>{NIDM.org} · research intern</small>
              <h2>my research internship, explained</h2>
              <p>glacial lake floods are hard to explain in one line. so this is a guided walkthrough: six stops, about 30 seconds, you just {phone ? 'tap next' : 'scroll'}.</p>
              <ol className="mc-stops">{STEPS.map((s) => <li key={s[1]}>{s[1].split(' · ')[1]}</li>)}</ol>
              <button className="mc-go" onClick={start}>▶ start the walkthrough</button>
              <span className="mc-hintsmall">{phone ? 'sound on is better. close it any time.' : 'sound on is better. you can scroll back up any time.'}</span>
            </div>
          </div>
        )}
        {tour && <div className={'mc-track' + (phone ? ' phone' : '')} ref={track}>
          <div className="mc-stick">
            {phone
              ? [1, 2, 3].map((n, i) => <img key={n} className="mc-still" ref={(e) => ((hud.current.stills ||= [])[i] = e)} src={`/media/lhonak-${n}.jpg`} alt="" decoding="async" />)
              : <video className="mc-vid" ref={(e) => (hud.current.vid = e)} src="/media/lhonak-zoom.mp4" poster="/media/lhonak-1.jpg" muted playsInline preload="auto" aria-hidden />}
            <GL className="mc-gl" camera={{ position: [0, 0, 3.6], fov: 38, near: 0.02, far: 80 }}>
              <fog attach="fog" args={['#06130f', 28, 80]} />
              <ambientLight intensity={0.9} />
              <directionalLight position={[8, 14, 6]} intensity={2.2} color="#e8fff4" />
              <group userData={{ stage: 'globe' }}><Globe /></group>
              <Rig p={P} onTick={onTick} />
            </GL>
            <i className="mc-pulse" ref={(e) => (hud.current.pulse = e)} aria-hidden />
            <div className="mc-flash" ref={(e) => (hud.current.flash = e)} />
            <div className="mc-scan" aria-hidden />

            <header className="mc-top">
              <span>GLOF-WATCH</span><span ref={(e) => (hud.current.coords = e)}>ORBIT</span><span className="rec">● live demo</span>
            </header>

            {!phone && <aside className="mc-side">
              <div className="mc-panel">
                <h4>radar</h4>
                <Radar active={vis} p={P} />
              </div>
              <div className="mc-panel mc-log">
                <h4>alert log <em>(demo feed)</em></h4>
                <ul>{ALERTS.map(([, t], i) => <li key={i} ref={(e) => (hud.current.alerts ||= [])[i] = e}>{t}</li>)}</ul>
              </div>
              <div className="mc-panel">
                <h4>alert latency</h4>
                <div className="lat"><span>before</span><i /></div>
                <div className="lat after"><span>after</span><i ref={(e) => (hud.current.bar = e)} /></div>
                <b className="pct" ref={(e) => (hud.current.pct = e)}>-0%</b>
              </div>
            </aside>}

            <div className="mc-role" ref={(e) => (hud.current.card = e)}>
              <small>{NIDM.org} · research intern</small>
              <h3 ref={(e) => (hud.current.stepT = e)}>{STEPS[0][1]}</h3>
              <p ref={(e) => (hud.current.stepP = e)}>{STEPS[0][2]}</p>
              <div className="mc-dots" aria-hidden>{STEPS.map((_, i) => <i key={i} className={i === 0 ? 'on' : ''} ref={(e) => ((hud.current.stepDots ||= [])[i] = e)} />)}</div>
            </div>
            {phone
              ? <nav className="mc-nav" aria-label="walkthrough controls">
                  <button onClick={() => go(stop - 1)} disabled={stop === 0}>◀ back</button>
                  <span>{stop + 1} / {STEPS.length}</span>
                  {stop < STEPS.length - 1 ? <button className="primary" onClick={() => go(stop + 1)}>next ▶</button> : <button className="primary" onClick={close}>done ✓</button>}
                </nav>
              : <p className="mc-hint">↓ keep scrolling. the tour follows your scroll.</p>}
            <button className="mc-exit" onClick={close}>✕ close walkthrough</button>
          </div>
        </div>}
        <div className="mc-debrief">
          <p className="prompt">$ cat debrief.txt</p>
          <div className="mc-big"><b>{NIDM.stat}</b><span>{NIDM.statLabel}</span></div>
          <ul>{NIDM.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
        </div>
      </Window>
    </section>
  )
}
