import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

const ROCKS = Array.from({ length: 42 }, (_, index) => {
  const angle = (index / 42) * Math.PI * 2
  const noise = Math.sin(index * 12.37) * 0.5 + Math.sin(index * 4.19) * 0.5
  const radius = 1 + noise * 0.035
  return {
    position: [
      Math.cos(angle) * 4.92 * radius,
      -0.06 + Math.sin(index * 2.4) * 0.045,
      Math.sin(angle) * 3.5 * radius,
    ],
    rotation: [index * 0.33, angle + noise, index * 0.21],
    scale: [
      0.52 + (index % 5) * 0.075,
      0.28 + (index % 4) * 0.055,
      0.46 + (index % 6) * 0.052,
    ],
    color: ['#667069', '#77786d', '#5e6761', '#817b6d'][index % 4],
  }
})

const PEBBLES = Array.from({ length: 28 }, (_, index) => {
  const angle = (index / 28) * Math.PI * 2 + 0.08
  const radius = index % 2 ? 5.5 : 4.45
  return {
    position: [Math.cos(angle) * radius, -0.12, Math.sin(angle) * radius * 0.71],
    rotation: [index, angle, index * 0.43],
    scale: 0.15 + (index % 4) * 0.035,
  }
})

function WaterSurface({ isNight, onFeed }) {
  const geometry = useMemo(() => new THREE.CircleGeometry(4.55, 112), [])
  const basePositions = useMemo(() => Float32Array.from(geometry.attributes.position.array), [geometry])

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame(({ clock }) => {
    const positions = geometry.attributes.position
    const time = clock.elapsedTime
    for (let index = 1; index < positions.count; index += 1) {
      const x = basePositions[index * 3]
      const y = basePositions[index * 3 + 1]
      const ripple = Math.sin(x * 2.1 + time * 1.05) * 0.012
        + Math.cos(y * 2.8 - time * 0.82) * 0.009
        + Math.sin((x + y) * 1.6 + time * 0.5) * 0.006
      positions.setZ(index, ripple)
    }
    positions.needsUpdate = true
  })

  const handleClick = (event) => {
    event.stopPropagation()
    onFeed({ x: event.point.x, z: event.point.z })
  }

  return (
    <mesh
      geometry={geometry}
      position={[0, 0.22, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={[1, 0.72, 1]}
      onPointerDown={handleClick}
      onPointerEnter={() => { document.body.style.cursor = 'crosshair' }}
      onPointerLeave={() => { document.body.style.cursor = 'default' }}
    >
      <meshPhysicalMaterial
        color={isNight ? '#163a42' : '#416f68'}
        roughness={0.12}
        metalness={0.02}
        transmission={isNight ? 0.16 : 0.28}
        thickness={0.55}
        ior={1.33}
        transparent
        opacity={isNight ? 0.78 : 0.68}
        clearcoat={1}
        clearcoatRoughness={0.16}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function Shore() {
  return (
    <>
      <mesh receiveShadow position={[0, -0.42, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[80, 80, 1, 1]} />
        <meshStandardMaterial color="#596554" roughness={1} />
      </mesh>
      <mesh receiveShadow position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.72, 1]}>
        <circleGeometry args={[4.72, 112]} />
        <meshStandardMaterial color="#283a32" roughness={0.98} />
      </mesh>
      {ROCKS.map((rock, index) => (
        <mesh key={index} castShadow receiveShadow position={rock.position} rotation={rock.rotation} scale={rock.scale}>
          <dodecahedronGeometry args={[0.72, 1]} />
          <meshStandardMaterial color={rock.color} roughness={0.98} />
        </mesh>
      ))}
      {PEBBLES.map((pebble, index) => (
        <mesh key={index} receiveShadow position={pebble.position} rotation={pebble.rotation} scale={[pebble.scale * 1.5, pebble.scale * 0.65, pebble.scale]}>
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={index % 2 ? '#64685f' : '#747267'} roughness={1} />
        </mesh>
      ))}
    </>
  )
}

export default function PondEnvironment({ isNight, onFeed }) {
  return (
    <>
      <color attach="background" args={[isNight ? '#09161b' : '#a6b9b1']} />
      <fog attach="fog" args={[isNight ? '#09161b' : '#a6b9b1', 10.5, 24]} />
      <hemisphereLight intensity={isNight ? 0.58 : 0.78} color={isNight ? '#9ab0bb' : '#d9e1dc'} groundColor={isNight ? '#1d2924' : '#4d5548'} />
      <ambientLight intensity={isNight ? 0.38 : 0.4} color={isNight ? '#879eae' : '#ddd8c6'} />
      <directionalLight
        castShadow
        position={isNight ? [-6, 9, -5] : [6.5, 10, 4.5]}
        intensity={isNight ? 1.65 : 2.35}
        color={isNight ? '#9ab5d0' : '#f2e6ca'}
        shadow-mapSize={[1536, 1536]}
        shadow-bias={-0.00015}
      />
      <Shore />
      <WaterSurface isNight={isNight} onFeed={onFeed} />
      <ContactShadows position={[0, -0.04, 0]} opacity={isNight ? 0.22 : 0.34} scale={13} blur={2.8} far={6} />
    </>
  )
}
