import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  FISH_TURTLE_FOOD_RESPONSE,
  getFishTurtleFoodInterest,
} from '../animalBehavior.js'

const FISH_PALETTE = [
  ['#b9482d', '#d9d2bd'],
  ['#d7d0bc', '#a54632'],
  ['#ad7f31', '#333b37'],
  ['#d9d6ca', '#b54b35'],
  ['#b45d38', '#d8cdae'],
  ['#c09b4d', '#56605a'],
  ['#d8d4c9', '#a83e2d'],
  ['#9d432f', '#323b38'],
]

export default function Fish({ fish, index, fishFood, turtleFood, isNight }) {
  const group = useRef()
  const tail = useRef()
  const leftFin = useRef()
  const rightFin = useRef()
  const [bodyColor, detailColor] = FISH_PALETTE[index % FISH_PALETTE.length]
  const target = useMemo(() => new THREE.Vector3(), [])
  const speed = (0.16 + (index % 3) * 0.026) * fish.pace
  const radiusX = (1.5 + (index % 4) * 0.6) * fish.orbit
  const radiusZ = (0.82 + (index % 3) * 0.44) * fish.orbit

  useFrame(({ clock }, delta) => {
    if (!group.current) return
    const time = clock.elapsedTime
    const now = performance.now()
    const chasingFishFood = fishFood && now - fishFood.startedAt < 6200
    const turtleFoodInterest = chasingFishFood ? 0 : getFishTurtleFoodInterest(turtleFood, now)
    let targetX
    let targetZ
    let targetY
    let approachRate

    if (chasingFishFood) {
      const personalAngle = fish.phase + time * 0.52
      const ring = 0.34 + index * 0.045
      targetX = fishFood.x + Math.cos(personalAngle) * ring
      targetZ = fishFood.z + Math.sin(personalAngle) * ring
      targetY = 0.14 - (index % 3) * 0.018
      approachRate = 1.15
    } else if (turtleFoodInterest > 0) {
      const personalAngle = fish.phase + time * 0.26
      const respectfulDistance = FISH_TURTLE_FOOD_RESPONSE.avoidanceRadius + (index % 4) * 0.1
      targetX = turtleFood.x + Math.cos(personalAngle) * respectfulDistance
      targetZ = turtleFood.z + Math.sin(personalAngle) * respectfulDistance
      targetY = 0.1 - (index % 3) * 0.015
      approachRate = FISH_TURTLE_FOOD_RESPONSE.approachRate * (0.7 + turtleFoodInterest * 0.3)
    } else {
      const angle = time * speed + fish.phase
      targetX = Math.cos(angle) * radiusX
      targetZ = Math.sin(angle) * radiusZ
      targetY = 0.11 + Math.sin(time * 0.72 + index) * 0.03
      approachRate = 0.62
    }

    target.set(targetX, targetY, targetZ)
    const previousX = group.current.position.x
    const previousZ = group.current.position.z
    group.current.position.lerp(target, Math.min(delta * approachRate, 1))
    const directionX = group.current.position.x - previousX
    const directionZ = group.current.position.z - previousZ
    if (Math.abs(directionX) + Math.abs(directionZ) > 0.0001) {
      const desiredRotation = Math.atan2(-directionZ, directionX)
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, desiredRotation, delta * 3)
    }
    group.current.rotation.z = Math.sin(time * 1.35 + index) * 0.025
    if (tail.current) tail.current.rotation.y = Math.sin(time * 7.2 + index) * 0.32
    if (leftFin.current) leftFin.current.rotation.x = -0.45 + Math.sin(time * 4.2 + index) * 0.18
    if (rightFin.current) rightFin.current.rotation.x = 0.45 - Math.sin(time * 4.2 + index) * 0.18
  })

  const scale = (0.62 + (index % 3) * 0.035) * fish.size
  return (
    <group ref={group} scale={scale}>
      <mesh castShadow scale={[1.48, 0.43, 0.58]}>
        <sphereGeometry args={[0.42, 28, 18]} />
        <meshPhysicalMaterial
          color={bodyColor}
          roughness={0.42}
          metalness={0.03}
          clearcoat={0.28}
          emissive={isNight ? bodyColor : '#000000'}
          emissiveIntensity={isNight ? 0.035 : 0}
        />
      </mesh>
      <mesh position={[0.08, 0.13, 0]} scale={[0.82, 0.17, 0.59]}>
        <sphereGeometry args={[0.32, 22, 14]} />
        <meshStandardMaterial color={detailColor} roughness={0.52} />
      </mesh>
      <mesh position={[-0.04, 0.24, 0]} rotation={[0, 0, -0.08]} scale={[0.5, 0.28, 0.055]}>
        <coneGeometry args={[0.32, 0.58, 3]} />
        <meshStandardMaterial color={detailColor} roughness={0.58} side={THREE.DoubleSide} />
      </mesh>
      <group ref={tail} position={[-0.68, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} scale={[0.6, 0.48, 0.08]}>
          <coneGeometry args={[0.42, 0.66, 3]} />
          <meshStandardMaterial color={bodyColor} roughness={0.52} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <mesh ref={leftFin} position={[0.05, -0.02, 0.27]} rotation={[-0.45, 0, -0.18]} scale={[0.34, 0.24, 0.045]}>
        <coneGeometry args={[0.28, 0.48, 3]} />
        <meshStandardMaterial color={detailColor} transparent opacity={0.82} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={rightFin} position={[0.05, -0.02, -0.27]} rotation={[0.45, 0, -0.18]} scale={[0.34, 0.24, 0.045]}>
        <coneGeometry args={[0.28, 0.48, 3]} />
        <meshStandardMaterial color={detailColor} transparent opacity={0.82} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.47, 0.055, 0.16]}>
        <sphereGeometry args={[0.027, 10, 8]} />
        <meshStandardMaterial color="#111615" roughness={0.16} />
      </mesh>
      <mesh position={[0.47, 0.055, -0.16]}>
        <sphereGeometry args={[0.027, 10, 8]} />
        <meshStandardMaterial color="#111615" roughness={0.16} />
      </mesh>
    </group>
  )
}
