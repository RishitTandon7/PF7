import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import GL from '../../ui/GL'
import { useCanvas2D, useVisible } from '../../lib/hooks'
import { fbm } from '../../lib/noise'

// a brain made of 4000 points. a thought is a bright blob wandering through it.
function Brain() {
  const g = useRef(), pts = useRef()
  const { geo, base } = useMemo(() => {
    const N = typeof window !== 'undefined' && window.innerWidth < 820 ? 2400 : 6500, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), base = new Float32Array(N * 3)
    const v = new THREE.Vector3(), c = new THREE.Color()
    for (let i = 0; i < N; i++) {
      const side = i % 2 ? 1 : -1
      v.randomDirection()
      const wob = 1 + (fbm(v.x * 3 + 7, v.y * 3 + v.z * 3) - 0.5) * 0.55
      // push points out to the surface so it reads as a folded shell, with a gap down the middle
      const sx = side * (0.1 + Math.abs(v.x)) * 0.95
      const x = sx * wob + side * 0.18, y = v.y * 0.85 * wob, z = v.z * 1.3 * wob
      pos.set([x, y, z], i * 3)
      base.set([x, y, z], i * 3)
      c.setHSL(0.03 + Math.random() * 0.04, 0.9, 0.45 + Math.random() * 0.15)
      col.set([c.r, c.g, c.b], i * 3)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
    return { geo, base }
  }, [])
  const orig = useMemo(() => geo.attributes.color.array.slice(), [geo])
  const flip = useRef(0)
  useFrame((s) => {
    const t = s.clock.elapsedTime
    g.current.rotation.y = t * 0.2 + s.pointer.x * 0.6
    g.current.rotation.x = -s.pointer.y * 0.3
    const f = new THREE.Vector3(Math.sin(t * 1.3) * 1.2, Math.sin(t * 0.9) * 0.7, Math.cos(t * 1.1) * 1.3)
    // the glow is recomputed for every point in js: on a phone do it every 3rd frame (the eye can't tell)
    if (window.innerWidth < 820 && ++flip.current % 3) return
    const c = geo.attributes.color.array
    for (let i = 0; i < c.length; i += 3) {
      const d = (base[i] - f.x) ** 2 + (base[i + 1] - f.y) ** 2 + (base[i + 2] - f.z) ** 2
      const k = Math.exp(-d * 2.4) * 1.6
      c[i] = Math.min(1, orig[i] + k); c[i + 1] = Math.min(1, orig[i + 1] + k * 0.85); c[i + 2] = Math.min(1, orig[i + 2] + k * 0.6)
    }
    geo.attributes.color.needsUpdate = true
  })
  return <group ref={g}><points ref={pts} geometry={geo}><pointsMaterial size={0.03} vertexColors sizeAttenuation transparent opacity={0.95} /></points></group>
}

const CMDS = [['LEFT', '←'], ['FORWARD', '↑'], ['RIGHT', '→'], ['STOP', '■']]

function Eeg({ active, onIntent }) {
  const st = useRef({ spike: 0, next: 2.5, idx: 0 })
  const ref = useCanvas2D((g, w, h, t, dt) => {
    const s = st.current
    g.clearRect(0, 0, w, h)
    s.spike = Math.max(0, s.spike - dt * 1.2)
    if (t > s.next) { s.spike = 1; s.next = t + 3 + Math.random() * 2; s.idx = (s.idx + 1) % CMDS.length; onIntent(s.idx) }
    const ch = 8
    for (let c = 0; c < ch; c++) {
      const y0 = ((c + 0.5) / ch) * h
      g.strokeStyle = `rgba(255,122,89,${0.45 + (c % 3) * 0.18})`; g.lineWidth = 1.3
      g.beginPath()
      for (let x = 0; x < w; x += 3) {
        const u = x / w, tt = t * 2.2 - u * 7
        const amp = 3 + Math.sin(tt * (1 + c * 0.2) + c) * 3 + Math.sin(tt * 7.3 + c * 2) * 1.5 + (Math.random() - 0.5) * 1.5
        // an intent shows up as a burst on every channel at once
        const burst = s.spike * Math.exp(-((u - 0.82) ** 2) * 50) * 14 * Math.sin(tt * 18)
        const y = y0 + (amp + burst) * 0.9
        x ? g.lineTo(x, y) : g.moveTo(x, y)
      }
      g.stroke()
    }
    g.fillStyle = 'rgba(255,122,89,.4)'; g.fillRect(w * 0.82, 0, 1, h)
  }, active)
  return <canvas ref={ref} className="eeg" />
}

export default function Neuro() {
  const wrap = useRef()
  const vis = useVisible(wrap)
  const [cmd, setCmd] = useState(0)
  return (
    <div className="vis neuro-vis" ref={wrap}>
      <GL className="neuro-gl" camera={{ position: [0, 0, 4.4], fov: 42 }} gl={{ alpha: true }}>
        <Brain />
      </GL>
      <div className="neuro-bottom">
        <Eeg active={vis} onIntent={setCmd} />
        <div className="intent"><small>decoded intent (demo)</small><b>{CMDS[cmd][1]} {CMDS[cmd][0]}</b><small>→ motor controller</small></div>
      </div>
    </div>
  )
}
