import { useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { useTick, useVisible } from '../lib/hooks'

// every webgl canvas in the site goes through here:
//  - mounts only when within ~a screen of the viewport, unmounts when far away
//  - frameloop is "never": frames are pushed (r3f wants seconds here, not ms) from the shared gsap ticker, and only while visible
//  - r3f's container defaults to touch-action:none, which stops a finger from scrolling the page when it starts on a scene. pan-y fixes that.
//  - dpr capped at 1.5 on desktop, 2 on phones (lower looked pixelated)
function Pump({ active }) {
  const advance = useThree((s) => s.advance)
  useTick(() => advance(performance.now() / 1000), active)
  return null
}

export default function GL({ children, camera, className, style, onVisible, ...rest }) {
  const ref = useRef()
  const near = useVisible(ref, typeof window !== 'undefined' && window.innerWidth < 820 ? '40% 0px' : '120% 0px')
  const vis = useVisible(ref, '0px')
  return (
    <div ref={ref} className={className} style={style} data-gl>
      {near && (
        <Canvas frameloop="never" style={{ touchAction: 'pan-y' }} dpr={[1, typeof window !== 'undefined' && window.innerWidth < 820 ? 2 : 1.5]} camera={camera} gl={{ antialias: true, powerPreference: 'high-performance' }} {...rest}>
          <Pump active={vis} />
          {children}
        </Canvas>
      )}
    </div>
  )
}
