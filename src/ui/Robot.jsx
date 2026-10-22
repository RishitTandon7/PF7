import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import GL from './GL'
import { bot } from '../lib/bot'
import { emit } from '../lib/bus'

// grab it, spin it. spin it too hard and it gets dizzy (eyes turn into x's).
const mouse = { x: 0, y: 0 }
if (typeof window !== 'undefined') {
  window.addEventListener('pointermove', (e) => { mouse.x = (e.clientX / innerWidth) * 2 - 1; mouse.y = (e.clientY / innerHeight) * 2 - 1 }, { passive: true })
}

function Bot({ drag }) {
  const g = useRef(), head = useRef(), ant = useRef(), eyeL = useRef(), eyeR = useRef(), xL = useRef(), xR = useRef(), mouth = useRef()
  const spin = useRef({ vy: 0, vx: 0, ry: -0.5, rx: 0 })

  useFrame((s, dt) => {
    // (dt comes from the shared ticker via advance())
    const sp = spin.current
    const k = Math.min(dt * 60, 3) // frame-rate independent: 1 at 60fps
    if (drag.current.down) {
      sp.vy = drag.current.dx * 0.012; sp.vx = drag.current.dy * 0.008
      drag.current.dx = drag.current.dy = 0
    } else {
      // let go: momentum bleeds off, then it sways back round to face you
      sp.vy *= Math.pow(0.965, k)
      sp.vx *= Math.pow(0.92, k)
      if (Math.abs(sp.vy) < 0.03) {
        const base = Math.round(sp.ry / (Math.PI * 2)) * Math.PI * 2
        sp.ry += (base + Math.sin(s.clock.elapsedTime * 0.6) * 0.45 - sp.ry) * 0.05 * k
      }
    }
    sp.ry += sp.vy * k; sp.rx = Math.max(-0.7, Math.min(0.7, sp.rx + sp.vx * k))
    if (!drag.current.down) sp.rx *= Math.pow(0.95, k)
    g.current.rotation.set(sp.rx, sp.ry, 0)
    g.current.position.y = Math.sin(s.clock.elapsedTime * 1.6) * 0.06
    const dizzy = Math.abs(sp.vy) > 0.12
    eyeL.current.visible = eyeR.current.visible = !dizzy
    xL.current.visible = xR.current.visible = dizzy
    // when it's idle the eyes look at your cursor
    const facing = Math.cos(sp.ry % (Math.PI * 2)) > 0.2
    if (!dizzy && facing && Math.abs(sp.vy) < 0.02) {
      head.current.rotation.y += (mouse.x * 0.35 - head.current.rotation.y) * 0.08 * k
      head.current.rotation.x += (mouse.y * 0.2 - head.current.rotation.x) * 0.08 * k
    }
    const blink = Math.sin(s.clock.elapsedTime * 2.3) > 0.985 ? 0.1 : 1
    eyeL.current.scale.y = eyeR.current.scale.y = blink
    ant.current.material.emissiveIntensity = 0.5 + (Math.sin(s.clock.elapsedTime * 5) > 0 ? 1.5 : 0)
    const t = s.clock.elapsedTime
    mouth.current.scale.x = dizzy ? 0.4 : 1 + Math.abs(Math.sin(t * 3)) * 0.1
    // talking: the mouth flaps and the head bobs a little
    mouth.current.scale.y = bot.talk ? 1 + Math.abs(Math.sin(t * 20)) * 4 : 1
    if (bot.talk) head.current.position.y = Math.sin(t * 9) * 0.03; else head.current.position.y *= 0.8
    // happy: a hop and squinty eyes
    if (bot.happy > 0) {
      bot.happy = Math.max(0, bot.happy - dt * 0.9)
      g.current.position.y += Math.abs(Math.sin(bot.happy * Math.PI * 3)) * 0.5
      eyeL.current.scale.y = eyeR.current.scale.y = 0.4
    }
  })

  const shell = '#e9e2d0', dark = '#17140f', amber = '#ffb000', ink = '#d1301f'
  return (
    <group ref={g} scale={1.15}>
      <group ref={head}>
        <RoundedBox args={[1.7, 1.35, 1.25]} radius={0.16} smoothness={3} position={[0, 0.55, 0]}>
          <meshStandardMaterial color={shell} roughness={0.55} />
        </RoundedBox>
        <RoundedBox args={[1.38, 0.85, 0.06]} radius={0.08} smoothness={3} position={[0, 0.58, 0.64]}>
          <meshStandardMaterial color={dark} roughness={0.25} metalness={0.3} />
        </RoundedBox>
        <mesh ref={eyeL} position={[-0.38, 0.72, 0.69]}><boxGeometry args={[0.26, 0.26, 0.04]} /><meshStandardMaterial color={amber} emissive={amber} emissiveIntensity={1.4} /></mesh>
        <mesh ref={eyeR} position={[0.38, 0.72, 0.69]}><boxGeometry args={[0.26, 0.26, 0.04]} /><meshStandardMaterial color={amber} emissive={amber} emissiveIntensity={1.4} /></mesh>
        {[xL, xR].map((r, i) => (
          <group key={i} ref={r} visible={false} position={[i ? 0.38 : -0.38, 0.72, 0.7]}>
            <mesh rotation={[0, 0, 0.78]}><boxGeometry args={[0.34, 0.06, 0.03]} /><meshStandardMaterial color={ink} emissive={ink} emissiveIntensity={1} /></mesh>
            <mesh rotation={[0, 0, -0.78]}><boxGeometry args={[0.34, 0.06, 0.03]} /><meshStandardMaterial color={ink} emissive={ink} emissiveIntensity={1} /></mesh>
          </group>
        ))}
        <mesh ref={mouth} position={[0, 0.34, 0.69]}><boxGeometry args={[0.55, 0.06, 0.03]} /><meshStandardMaterial color={amber} emissive={amber} emissiveIntensity={0.9} /></mesh>
        <mesh position={[-0.95, 0.55, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.28, 0.28, 0.2, 20]} /><meshStandardMaterial color={ink} roughness={0.5} /></mesh>
        <mesh position={[0.95, 0.55, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.28, 0.28, 0.2, 20]} /><meshStandardMaterial color={ink} roughness={0.5} /></mesh>
        <mesh position={[0.3, 1.45, 0]}><cylinderGeometry args={[0.03, 0.03, 0.45, 8]} /><meshStandardMaterial color="#555" /></mesh>
        <mesh ref={ant} position={[0.3, 1.72, 0]}><sphereGeometry args={[0.1, 16, 16]} /><meshStandardMaterial color={ink} emissive={ink} emissiveIntensity={1} /></mesh>
        {/* a sticker, because every laptop has one */}
        <mesh position={[0.6, 1.06, 0.64]} rotation={[0, 0, -0.2]}><boxGeometry args={[0.28, 0.18, 0.012]} /><meshStandardMaterial color="#39d353" /></mesh>
      </group>
      <RoundedBox args={[1.1, 0.7, 0.9]} radius={0.12} smoothness={3} position={[0, -0.55, 0]}>
        <meshStandardMaterial color={shell} roughness={0.6} />
      </RoundedBox>
      <mesh position={[0, -0.18, 0]}><cylinderGeometry args={[0.2, 0.25, 0.16, 16]} /><meshStandardMaterial color="#555" /></mesh>
      <mesh position={[0, -0.55, 0.46]}><boxGeometry args={[0.5, 0.22, 0.03]} /><meshStandardMaterial color={dark} /></mesh>
    </group>
  )
}

export default function Robot({ onGrab }) {
  const drag = useRef({ down: false, dx: 0, dy: 0, lx: 0, ly: 0 })
  const box = useRef()
  useEffect(() => {
    const el = box.current
    const down = (e) => { drag.current.moved = 0; drag.current.down = true; drag.current.lx = e.clientX; drag.current.ly = e.clientY; if (e.pointerType !== 'touch') el.setPointerCapture(e.pointerId); onGrab?.() }
    const move = (e) => { const d = drag.current; if (!d.down) return; d.dx += e.clientX - d.lx; d.dy += e.clientY - d.ly; d.moved += Math.abs(e.clientX - d.lx) + Math.abs(e.clientY - d.ly); d.lx = e.clientX; d.ly = e.clientY }
    const up = () => { if (drag.current.down && drag.current.moved < 6) emit('bot-poke'); drag.current.down = false }
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up)
    return () => { el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up) }
  }, [onGrab])
  return (
    <div ref={box} className="robot-grab">
      <GL camera={{ position: [0, 0.5, 8.6], fov: 38 }} gl={{ alpha: true, antialias: true }}>
        <hemisphereLight args={['#fff3d6', '#2a2118', 1.1]} />
        <directionalLight position={[3, 4, 4]} intensity={2.4} />
        <pointLight position={[-3, 0, 2]} intensity={14} color="#ffb000" />
        <Bot drag={drag} />
      </GL>
    </div>
  )
}
