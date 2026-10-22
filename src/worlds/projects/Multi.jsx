import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import GL from '../../ui/GL'
import { useTick, useVisible } from '../../lib/hooks'

// a unity-ish editor around a tiny digital twin. the telemetry is simulated; the idea is the real thing.
const NODES = [
  { id: 'boiler-01', pos: [-3, 0.6, -1.5] }, { id: 'pump-02', pos: [0.5, 0.5, -2.4] }, { id: 'turbine-03', pos: [3.2, 0.9, -0.6] },
  { id: 'gate-04', pos: [-2.2, 0.5, 2.2] }, { id: 'belt-05', pos: [1.8, 0.4, 2.4] },
]

function Scene({ sel, setSel, sim }) {
  const meshes = useRef([])
  useFrame(() => {
    NODES.forEach((n, i) => {
      const m = meshes.current[i]; if (!m) return
      const bad = sim.current[i].temp > 82
      m.material.color.set(bad ? '#ff4d4d' : '#4ade80'); m.material.emissive.set(bad ? '#ff2020' : '#14803a')
      m.scale.setScalar(sel === i ? 1.35 : 1)
    })
  })
  return (
    <>
      <ambientLight intensity={0.7} /><directionalLight position={[5, 8, 4]} intensity={2} />
      <Grid args={[14, 14]} cellColor="#3a3a3a" sectionColor="#5a5a5a" fadeDistance={22} infiniteGrid />
      {/* the "plant": a few boxes */}
      <mesh position={[0, 0.25, 0]}><boxGeometry args={[7.4, 0.5, 6]} /><meshStandardMaterial color="#2a2d31" /></mesh>
      {[[-3, 0.5, -1.5, 1.2], [3.2, 0.75, -0.6, 1.5], [0.5, 0.4, -2.4, 0.9]].map(([x, y, z, s], i) => (
        <mesh key={i} position={[x, y + 0.5, z]}><boxGeometry args={[s, s, s]} /><meshStandardMaterial color="#44484e" /></mesh>
      ))}
      {NODES.map((n, i) => (
        <mesh key={n.id} ref={(el) => (meshes.current[i] = el)} position={[n.pos[0], n.pos[1] + 1.4, n.pos[2]]} onClick={(e) => { e.stopPropagation(); setSel(i) }} onPointerOver={() => (document.body.style.cursor = 'pointer')} onPointerOut={() => (document.body.style.cursor = '')}>
          <sphereGeometry args={[0.22, 20, 20]} /><meshStandardMaterial color="#4ade80" emissive="#14803a" emissiveIntensity={1} />
        </mesh>
      ))}
      <group position={[NODES[sel].pos[0], NODES[sel].pos[1] + 1.4, NODES[sel].pos[2]]}>
        {/* translate gizmo, because it is a unity viewport */}
        <mesh position={[0.6, 0, 0]} rotation={[0, 0, -Math.PI / 2]}><coneGeometry args={[0.07, 0.3, 8]} /><meshBasicMaterial color="#ff4d4d" /></mesh>
        <mesh position={[0.3, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.015, 0.015, 0.6]} /><meshBasicMaterial color="#ff4d4d" /></mesh>
        <mesh position={[0, 0.6, 0]}><coneGeometry args={[0.07, 0.3, 8]} /><meshBasicMaterial color="#4ade80" /></mesh>
        <mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.015, 0.015, 0.6]} /><meshBasicMaterial color="#4ade80" /></mesh>
        <mesh position={[0, 0, 0.6]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.07, 0.3, 8]} /><meshBasicMaterial color="#4a90ff" /></mesh>
        <mesh position={[0, 0, 0.3]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.015, 0.015, 0.6]} /><meshBasicMaterial color="#4a90ff" /></mesh>
      </group>
      <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={0.5} maxPolarAngle={1.35} makeDefault enabled={!(typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches)} />
    </>
  )
}

export default function Multi() {
  const wrap = useRef()
  const vis = useVisible(wrap)
  const [sel, setSel] = useState(0)
  const [log, setLog] = useState(['[info] twin online. 5 nodes.'])
  const sim = useRef(NODES.map((_, i) => ({ temp: 60 + i * 3, vib: 1 + i * 0.2, hot: false })))
  const el = useRef({})
  const cur = useRef(sel); cur.current = sel
  const clock = useRef(0)

  useTick((t, dt) => {
    clock.current += dt
    sim.current.forEach((s, i) => {
      s.temp += (Math.sin(t * (0.6 + i * 0.13) + i) * 0.4 + (s.hot ? 1.2 : -0.35)) * dt * 6
      s.temp = Math.max(55, Math.min(95, s.temp)); s.vib = 1 + Math.abs(Math.sin(t * 1.7 + i)) * (s.temp > 82 ? 3 : 1)
      if (!s.hot && Math.random() < dt * 0.04) { s.hot = true; setLog((l) => [...l.slice(-3), `[warn] ${NODES[i].id} temp rising`]) }
      if (s.hot && s.temp > 88) { s.hot = false; setLog((l) => [...l.slice(-3), `[error] ${NODES[i].id} out of range. go look at it.`]) }
    })
    const s = sim.current[cur.current]
    if (el.current.t) { el.current.t.textContent = s.temp.toFixed(1) + ' °C'; el.current.v.textContent = s.vib.toFixed(2) + ' mm/s'; el.current.bar.style.transform = `scaleX(${(s.temp - 55) / 40})` }
  }, vis)

  return (
    <div className="vis multi-vis" ref={wrap}>
      <div className="uni-tool"><span>▶</span><span>❚❚</span><span>▮▶</span><em>Scene</em><em className="dim">Game</em><em className="dim">Asset Store (no)</em></div>
      <div className="uni-body">
        <aside className="uni-hier"><p>Hierarchy</p>
          <ul><li>▾ Multiverse</li>{NODES.map((n, i) => <li key={n.id}><button className={sel === i ? 'on' : ''} onClick={() => setSel(i)}>◇ {n.id}</button></li>)}</ul>
        </aside>
        <GL className="uni-view" camera={{ position: [6.5, 5, 7.5], fov: 45 }}>
          <color attach="background" args={['#2b2b2b']} />
          <Scene sel={sel} setSel={setSel} sim={sim} />
        </GL>
        <aside className="uni-insp"><p>Inspector</p>
          <h4>{NODES[sel].id}</h4>
          <dl><dt>Position</dt><dd>{NODES[sel].pos.join(', ')}</dd><dt>Temperature</dt><dd ref={(e) => (el.current.t = e)}>--</dd><dt>Vibration</dt><dd ref={(e) => (el.current.v = e)}>--</dd></dl>
          <div className="uni-bar"><i ref={(e) => (el.current.bar = e)} /></div>
          <small>simulated telemetry. the click-through is real.</small>
        </aside>
      </div>
      <div className="uni-console"><p>Console</p>{log.map((l, i) => <div key={i} className={l.startsWith('[warn]') ? 'w' : l.startsWith('[error]') ? 'e' : ''}>{l}</div>)}</div>
    </div>
  )
}
