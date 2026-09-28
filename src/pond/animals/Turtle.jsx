import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  getTurtleFeedingState,
  getTurtleMotionProfile,
  getTurtleReactionDelay,
} from '../animalBehavior.js'

export default function Turtle({ turtle: turtleData, index, signal, turtleFood, onTurtle, isNight }) {
  const turtle = useRef()
  const head = useRef()
  const frontLeft = useRef()
  const frontRight = useRef()
  const lastSignal = useRef(signal)
  const target = useMemo(() => new THREE.Vector3(), [])
  const reactionDelay = useMemo(() => getTurtleReactionDelay(turtleData, index), [turtleData, index])
  const [excitedUntil, setExcitedUntil] = useState(0)

  useEffect(() => {
    if (signal !== lastSignal.current) {
      lastSignal.current = signal
      setExcitedUntil(performance.now() + 1900)
    }
  }, [signal])

  useFrame(({ clock }, delta) => {
    if (!turtle.current) return
    const time = clock.elapsedTime
    const now = performance.now()
    const foodDistance = turtleFood
      ? Math.hypot(turtle.current.position.x - turtleFood.x, turtle.current.position.z - turtleFood.z)
      : Number.POSITIVE_INFINITY
    const feedingState = getTurtleFeedingState({
      food: turtleFood,
      now,
      distance: foodDistance,
      reactionDelay,
    })
    const motion = getTurtleMotionProfile(feedingState)
    const excited = now < excitedUntil
    const orbitAngle = time * 0.105 * turtleData.pace + turtleData.phase
    const orbitX = (1.65 + (index % 3) * 0.42) * turtleData.orbit
    const orbitZ = (0.92 + (index % 2) * 0.34) * turtleData.orbit

    if (feedingState === 'alert') {
      target.copy(turtle.current.position)
    } else if (feedingState === 'sprint' && turtleFood) {
      const approachAngle = turtleData.phase + index * 1.7
      const approachOffset = 0.2 + (index % 3) * 0.055
      target.set(
        turtleFood.x + Math.cos(approachAngle) * approachOffset,
        0.14,
        turtleFood.z + Math.sin(approachAngle) * approachOffset,
      )
    } else if (feedingState === 'feeding' && turtleFood) {
      const feedingAngle = time * (0.72 + index * 0.035) + turtleData.phase
      const feedingRing = 0.24 + (index % 4) * 0.07
      target.set(
        turtleFood.x + Math.cos(feedingAngle) * feedingRing,
        0.14,
        turtleFood.z + Math.sin(feedingAngle) * feedingRing,
      )
    } else {
      target.set(
        Math.cos(orbitAngle) * orbitX,
        0.13 + Math.sin(time * 1.1 + index) * 0.022,
        Math.sin(orbitAngle) * orbitZ + (index % 2 ? -0.22 : 0.22),
      )
    }

    const previousX = turtle.current.position.x
    const previousZ = turtle.current.position.z
    turtle.current.position.lerp(target, Math.min(delta * motion.approachRate * turtleData.pace, 1))
    const directionX = turtle.current.position.x - previousX
    const directionZ = turtle.current.position.z - previousZ
    if (Math.abs(directionX) + Math.abs(directionZ) > 0.0001) {
      const desiredRotation = Math.atan2(-directionZ, directionX)
      turtle.current.rotation.y = THREE.MathUtils.lerp(
        turtle.current.rotation.y,
        desiredRotation,
        Math.min(delta * (feedingState === 'sprint' ? 8 : 3), 1),
      )
    }

    const stroke = Math.sin(time * motion.strokeCadence + index)
    if (head.current) {
      head.current.position.x = 0.72 + motion.headExtension + (excited ? Math.sin(time * 7) * 0.055 : 0)
    }
    if (frontLeft.current) frontLeft.current.rotation.z = -0.28 + stroke * 0.24
    if (frontRight.current) frontRight.current.rotation.z = 0.28 - stroke * 0.24
  })

  const handleClick = (event) => {
    event.stopPropagation()
    setExcitedUntil(performance.now() + 1900)
    onTurtle()
  }

  return (
    <group
      ref={turtle}
      scale={0.7 * turtleData.size}
      onClick={handleClick}
      onPointerEnter={() => { document.body.style.cursor = 'pointer' }}
      onPointerLeave={() => { document.body.style.cursor = 'default' }}
    >
      <mesh castShadow position={[0, 0.02, 0]} scale={[1.08, 0.42, 0.78]}>
        <sphereGeometry args={[0.6, 28, 18]} />
        <meshPhysicalMaterial color={isNight ? '#4a5140' : '#666344'} roughness={0.72} clearcoat={0.15} />
      </mesh>
      <mesh position={[0, 0.03, 0]} scale={[1.085, 0.425, 0.785]}>
        <sphereGeometry args={[0.602, 14, 10]} />
        <meshStandardMaterial color="#2d3026" wireframe transparent opacity={0.24} />
      </mesh>
      <mesh position={[0, -0.16, 0]} scale={[0.94, 0.22, 0.65]}>
        <sphereGeometry args={[0.58, 20, 12]} />
        <meshStandardMaterial color="#76765a" roughness={0.86} />
      </mesh>
      <mesh ref={frontLeft} position={[0.28, -0.12, 0.42]} rotation={[0, 0, -0.28]} scale={[0.52, 0.13, 0.24]}>
        <sphereGeometry args={[0.5, 14, 9]} />
        <meshStandardMaterial color="#5b654d" roughness={0.86} />
      </mesh>
      <mesh ref={frontRight} position={[0.28, -0.12, -0.42]} rotation={[0, 0, 0.28]} scale={[0.52, 0.13, 0.24]}>
        <sphereGeometry args={[0.5, 14, 9]} />
        <meshStandardMaterial color="#5b654d" roughness={0.86} />
      </mesh>
      {[[-0.34, 0.37], [-0.34, -0.37]].map(([x, z], legIndex) => (
        <mesh key={legIndex} position={[x, -0.14, z]} rotation={[0, 0, -0.38]} scale={[0.4, 0.12, 0.21]}>
          <sphereGeometry args={[0.5, 12, 8]} />
          <meshStandardMaterial color="#555f49" roughness={0.9} />
        </mesh>
      ))}
      <group ref={head} position={[0.72, -0.015, 0]}>
        <mesh position={[-0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.14, 0.19, 0.36, 14]} />
          <meshStandardMaterial color="#586349" roughness={0.82} />
        </mesh>
        <mesh scale={[0.45, 0.31, 0.33]}>
          <sphereGeometry args={[0.5, 20, 14]} />
          <meshStandardMaterial color="#606c4f" roughness={0.78} />
        </mesh>
        <mesh position={[0.18, 0.065, 0.135]}>
          <sphereGeometry args={[0.027, 8, 8]} />
          <meshStandardMaterial color="#0f1410" />
        </mesh>
        <mesh position={[0.18, 0.065, -0.135]}>
          <sphereGeometry args={[0.027, 8, 8]} />
          <meshStandardMaterial color="#0f1410" />
        </mesh>
      </group>
      <mesh position={[-0.66, -0.12, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[0.24, 0.13, 0.12]}>
        <coneGeometry args={[0.25, 0.5, 8]} />
        <meshStandardMaterial color="#515b46" roughness={0.9} />
      </mesh>
    </group>
  )
}
