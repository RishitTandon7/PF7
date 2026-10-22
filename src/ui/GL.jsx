import { useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { useTick, useVisible } from '../lib/hooks'

// every webgl canvas in the site goes through here:
//  - mounts only when within ~a screen of the viewport, unmounts when far away
//  - frameloop is "never": frames are pushed (r3f wants seconds here, not ms) from the shared gsap ticker, and only while visible
//  - dpr capped at 1.5
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
    <div ref={ref} className={className} style={style}>
      {near && (
        <Canvas frameloop="never" dpr={[1, typeof window !== 'undefined' && window.innerWidth < 820 ? 1.25 : 1.5]} camera={camera} gl={{ antialias: typeof window !== 'undefined' && window.innerWidth >= 820, powerPreference: 'high-performance' }} {...rest}>
          <Pump active={vis} />
          {children}
        </Canvas>
      )}
    </div>
  )
}
