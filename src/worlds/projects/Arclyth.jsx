import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import GL from '../../ui/GL'
import { fbm } from '../../lib/noise'

const th = (x, z) => Math.max(0, fbm(x * 0.06 + 11, z * 0.06 + 4) - 0.36) * 13
const DRONES = [
  { name: 'crux', color: '#ff7a1a', phase: 0 },
  { name: 'oberon', color: '#ffd23f', phase: 2.094 },
  { name: 'capella', color: '#7dffb2', phase: 4.188 },
]

// name tags are canvas textures on sprites (no DOM overlay to tear down when the canvas unmounts)
function tagTexture(name, color) {
  const c = document.createElement('canvas')
  c.width = 256; c.height = 64
  const g = c.getContext('2d')
  g.fillStyle = '#0f140e'; g.fillRect(0, 8, 256, 48)
  g.strokeStyle = color; g.lineWidth = 3; g.strokeRect(2, 10, 252, 44)
  g.fillStyle = color; g.font = '800 30px "Barlow Condensed", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'
  g.fillText(name.toUpperCase().split('').join(' '), 128, 33)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
  return t
}

function Terrain() {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(80, 80, 100, 100)
    g.rotateX(-Math.PI / 2)
    const p = g.attributes.position, col = []
    const a = new THREE.Color('#1c2a1b'), b = new THREE.Color('#d8cfae')
    for (let i = 0; i < p.count; i++) {
      const y = th(p.getX(i), p.getZ(i)); p.setY(i, y)
      const c = a.clone().lerp(b, Math.min(1, y / 6)); col.push(c.r, c.g, c.b)
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals()
    return g
  }, [])
  return (
    <>
      <mesh geometry={geo}><meshStandardMaterial vertexColors flatShading roughness={1} /></mesh>
      <mesh geometry={geo} position={[0, 0.03, 0]}><meshBasicMaterial color="#f2ecdf" wireframe transparent opacity={0.07} /></mesh>
    </>
  )
}

function Drone({ d, i, trails }) {
  const g = useRef(), rot = useRef([])
  const tr = useRef([])
  const tag = useMemo(() => tagTexture(d.name, d.color), [d])
  useFrame((s) => {
    const t = s.clock.elapsedTime * 0.4 + d.phase
    // the swarm orbits as a triangle that slowly breathes
    const R = 11 + Math.sin(s.clock.elapsedTime * 0.4) * 2.5
    const x = Math.cos(t) * R, z = Math.sin(t) * R * 0.75
    const y = 7 + th(x, z) * 0.5 + Math.sin(t * 2 + i) * 0.5
    g.current.position.set(x, y, z)
    g.current.rotation.set(Math.sin(t * 2) * 0.12, -t + Math.PI, Math.cos(t * 2) * 0.12)
    rot.current.forEach((r) => r && (r.rotation.y += 1.4))
    tr.current.push(new THREE.Vector3(x, y, z)); if (tr.current.length > 90) tr.current.shift()
    trails.current[i] = tr.current
  })
  return (
    <group ref={g} scale={1.7}>
      <mesh><boxGeometry args={[0.9, 0.18, 0.9]} /><meshStandardMaterial color="#181a16" roughness={0.4} /></mesh>
      <mesh position={[0, 0.14, 0]}><boxGeometry args={[0.4, 0.14, 0.4]} /><meshStandardMaterial color={d.color} emissive={d.color} emissiveIntensity={0.9} /></mesh>
      {[[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]].map(([x, z], k) => (
        <mesh key={k} position={[x, 0.1, z]} ref={(el) => (rot.current[k] = el)}><boxGeometry args={[0.9, 0.02, 0.1]} /><meshStandardMaterial color="#bbb" /></mesh>
      ))}
      <pointLight color={d.color} intensity={14} distance={8} />
      <sprite position={[0, 1.3, 0]} scale={[2.6, 0.65, 1]}><spriteMaterial map={tag} transparent depthTest={false} /></sprite>
    </group>
  )
}

function Trails({ trails }) {
  const refs = useRef([])
  useFrame(() => {
    trails.current.forEach((pts, i) => {
      const l = refs.current[i]
      if (l && pts.length > 2) l.geometry.setPositions(pts.flatMap((p) => [p.x, p.y, p.z]))
    })
  })
  return DRONES.map((d, i) => <Line key={d.name} ref={(el) => (refs.current[i] = el)} points={[[0, 0, 0], [0, 0.01, 0]]} color={d.color} lineWidth={1.6} transparent opacity={0.75} />)
}

export default function Arclyth() {
  const trails = useRef([])
  return (
    <div className="vis arc-vis">
      <GL camera={{ position: [0, 24, 30], fov: 42 }}>
        <color attach="background" args={['#0f140e']} />
        <fog attach="fog" args={['#0f140e', 34, 75]} />
        <hemisphereLight args={['#fff6dc', '#1a2518', 1.1]} />
        <directionalLight position={[10, 18, 6]} intensity={2} />
        <Terrain />
        {DRONES.map((d, i) => <Drone key={d.name} d={d} i={i} trails={trails} />)}
        <Trails trails={trails} />
      </GL>
      <small className="vis-cap">3 aircraft · 1 plan · formation: triangle</small>
    </div>
  )
}
