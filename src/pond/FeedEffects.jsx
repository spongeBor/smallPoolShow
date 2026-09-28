import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const FEED_STYLES = {
  fish: {
    durationMs: 6200,
    count: 7,
    spread: 0.17,
    pelletSize: 0.032,
    color: '#9f8450',
  },
  turtle: {
    durationMs: 8500,
    count: 9,
    spread: 0.24,
    pelletSize: 0.055,
    color: '#78603c',
  },
}

function FeedScatter({ feed, kind }) {
  const group = useRef()
  const ripple = useRef()
  const style = FEED_STYLES[kind]

  useFrame(() => {
    if (!group.current || !ripple.current) return

    const ageMs = performance.now() - feed.startedAt
    const rippleProgress = Math.min(ageMs / 2000, 1)
    group.current.visible = ageMs < style.durationMs
    ripple.current.scale.setScalar(0.5 + rippleProgress * 3.4)
    ripple.current.material.opacity = Math.max(0, 0.42 * (1 - rippleProgress))
  })

  return (
    <group ref={group} position={[feed.x, 0.26, feed.z]}>
      <mesh ref={ripple} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.14, 0.16, 56]} />
        <meshBasicMaterial color="#e5eee9" transparent opacity={0.42} side={THREE.DoubleSide} />
      </mesh>
      {Array.from({ length: style.count }, (_, index) => {
        const angle = (index / style.count) * Math.PI * 2
        const radius = style.spread * (0.72 + (index % 3) * 0.14)
        return (
          <mesh
            key={index}
            position={[
              Math.cos(angle) * radius,
              0.008 + (index % 2) * 0.012,
              Math.sin(angle) * radius,
            ]}
            rotation={[0.2 * index, angle, 0.1 * index]}
          >
            <dodecahedronGeometry args={[style.pelletSize, 0]} />
            <meshStandardMaterial color={style.color} roughness={0.96} />
          </mesh>
        )
      })}
    </group>
  )
}

export default function FeedEffects({ fishFood, turtleFood }) {
  return (
    <>
      {fishFood && <FeedScatter key={fishFood.id} feed={fishFood} kind="fish" />}
      {turtleFood && <FeedScatter key={turtleFood.id} feed={turtleFood} kind="turtle" />}
    </>
  )
}
