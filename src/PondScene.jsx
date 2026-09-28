import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

const fishPalette = [
  ['#b9482d', '#d9d2bd'],
  ['#d7d0bc', '#a54632'],
  ['#ad7f31', '#333b37'],
  ['#d9d6ca', '#b54b35'],
  ['#b45d38', '#d8cdae'],
  ['#c09b4d', '#56605a'],
  ['#d8d4c9', '#a83e2d'],
  ['#9d432f', '#323b38'],
]

const rockData = Array.from({ length: 42 }, (_, index) => {
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

const pebbleData = Array.from({ length: 28 }, (_, index) => {
  const angle = (index / 28) * Math.PI * 2 + 0.08
  const radius = index % 2 ? 5.5 : 4.45
  return {
    position: [Math.cos(angle) * radius, -0.12, Math.sin(angle) * radius * 0.71],
    rotation: [index, angle, index * 0.43],
    scale: 0.15 + (index % 4) * 0.035,
  }
})

const lilyData = [
  [-2.6, 0.255, -1.15, 0.52],
  [-1.78, 0.255, -1.72, 0.38],
  [2.2, 0.255, -1.35, 0.46],
  [2.95, 0.255, -0.55, 0.32],
  [-3.18, 0.255, 0.62, 0.34],
  [1.56, 0.255, 1.62, 0.3],
]

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

function Fish({ fish, index, food, isNight }) {
  const group = useRef()
  const tail = useRef()
  const leftFin = useRef()
  const rightFin = useRef()
  const [bodyColor, detailColor] = fishPalette[index % fishPalette.length]
  const temp = useMemo(() => new THREE.Vector3(), [])
  const speed = (0.16 + (index % 3) * 0.026) * fish.pace
  const radiusX = (1.5 + (index % 4) * 0.6) * fish.orbit
  const radiusZ = (0.82 + (index % 3) * 0.44) * fish.orbit
  const phase = fish.phase

  useFrame(({ clock }, delta) => {
    if (!group.current) return
    const time = clock.elapsedTime
    const hungry = food && performance.now() - food.startedAt < 6200
    let targetX
    let targetZ
    let targetY

    if (hungry) {
      const personalAngle = phase + time * 0.52
      const ring = 0.34 + index * 0.045
      targetX = food.x + Math.cos(personalAngle) * ring
      targetZ = food.z + Math.sin(personalAngle) * ring
      targetY = 0.14 - (index % 3) * 0.018
    } else {
      const angle = time * speed + phase
      targetX = Math.cos(angle) * radiusX
      targetZ = Math.sin(angle) * radiusZ
      targetY = 0.11 + Math.sin(time * 0.72 + index) * 0.03
    }

    temp.set(targetX, targetY, targetZ)
    const previousX = group.current.position.x
    const previousZ = group.current.position.z
    group.current.position.lerp(temp, Math.min(delta * (hungry ? 1.15 : 0.62), 1))
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

function Turtle({ turtle: turtleData, index, signal, onTurtle, isNight }) {
  const turtle = useRef()
  const head = useRef()
  const frontLeft = useRef()
  const frontRight = useRef()
  const lastSignal = useRef(signal)
  const [excitedUntil, setExcitedUntil] = useState(0)

  useEffect(() => {
    if (signal !== lastSignal.current) {
      lastSignal.current = signal
      setExcitedUntil(performance.now() + 1900)
    }
  }, [signal])

  useFrame(({ clock }) => {
    if (!turtle.current) return
    const time = clock.elapsedTime
    const excited = performance.now() < excitedUntil
    const angle = time * (excited ? 0.31 : 0.072) * turtleData.pace + turtleData.phase
    const orbitX = (1.65 + (index % 3) * 0.42) * turtleData.orbit
    const orbitZ = (0.92 + (index % 2) * 0.34) * turtleData.orbit
    turtle.current.position.x = Math.cos(angle) * orbitX
    turtle.current.position.z = Math.sin(angle) * orbitZ + (index % 2 ? -0.22 : 0.22)
    turtle.current.position.y = 0.13 + Math.sin(time * 1.1) * 0.022
    turtle.current.rotation.y = -angle + Math.PI / 2
    if (head.current) head.current.position.x = 0.72 + (excited ? Math.sin(time * 7) * 0.065 : 0)
    if (frontLeft.current) frontLeft.current.rotation.z = -0.28 + Math.sin(time * 2.7) * 0.14
    if (frontRight.current) frontRight.current.rotation.z = 0.28 - Math.sin(time * 2.7) * 0.14
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
      {[[-0.34, 0.37], [-0.34, -0.37]].map(([x, z], index) => (
        <mesh key={index} position={[x, -0.14, z]} rotation={[0, 0, -0.38]} scale={[0.4, 0.12, 0.21]}>
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

function FoodRipple({ food }) {
  const ripple = useRef()
  useFrame(() => {
    if (!ripple.current || !food) return
    const age = Math.min((performance.now() - food.startedAt) / 2000, 1)
    ripple.current.scale.setScalar(0.5 + age * 3.4)
    ripple.current.material.opacity = Math.max(0, 0.42 * (1 - age))
  })
  if (!food) return null

  return (
    <group key={food.id} position={[food.x, 0.26, food.z]}>
      <mesh ref={ripple} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.14, 0.16, 56]} />
        <meshBasicMaterial color="#e5eee9" transparent opacity={0.42} side={THREE.DoubleSide} />
      </mesh>
      {Array.from({ length: 7 }, (_, index) => {
        const angle = (index / 7) * Math.PI * 2
        return (
          <mesh key={index} position={[Math.cos(angle) * 0.17, 0.01, Math.sin(angle) * 0.17]}>
            <sphereGeometry args={[0.032, 8, 6]} />
            <meshStandardMaterial color="#9f8450" roughness={0.95} />
          </mesh>
        )
      })}
    </group>
  )
}

function LilyPad({ data, index }) {
  const [x, y, z, size] = data
  const shape = useMemo(() => {
    const nextShape = new THREE.Shape()
    nextShape.moveTo(0, 0)
    for (let point = 0; point <= 34; point += 1) {
      const angle = 0.34 + ((Math.PI * 2 - 0.68) * point) / 34
      nextShape.lineTo(Math.cos(angle) * size, Math.sin(angle) * size)
    }
    nextShape.lineTo(0, 0)
    return nextShape
  }, [size])

  return (
    <group position={[x, y, z]} rotation={[0, index * 0.73, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <shapeGeometry args={[shape]} />
        <meshStandardMaterial color={index % 2 ? '#3f6747' : '#4c7650'} roughness={0.74} side={THREE.DoubleSide} />
      </mesh>
      {index === 1 || index === 3 ? (
        <group position={[0.04, 0.09, -0.03]}>
          {Array.from({ length: 8 }, (_, petal) => {
            const angle = (petal / 8) * Math.PI * 2
            return (
              <mesh key={petal} rotation={[0, angle, 0]} position={[Math.cos(angle) * 0.075, 0, Math.sin(angle) * 0.075]} scale={[0.6, 0.18, 0.28]}>
                <sphereGeometry args={[0.1, 12, 8]} />
                <meshStandardMaterial color="#ddd6cf" roughness={0.7} />
              </mesh>
            )
          })}
          <mesh position={[0, 0.018, 0]}>
            <sphereGeometry args={[0.043, 10, 8]} />
            <meshStandardMaterial color="#ae9551" roughness={0.72} />
          </mesh>
        </group>
      ) : null}
    </group>
  )
}

function Reeds() {
  const clusters = [[-4.45, -1.62], [4.32, 1.42], [-3.72, 2.2]]
  return clusters.flatMap(([x, z], cluster) => Array.from({ length: 8 }, (_, index) => {
    const height = 1.08 + (index % 4) * 0.17
    const offset = (index - 3.5) * 0.11
    return (
      <group key={`${cluster}-${index}`} position={[x + offset, 0.05, z + Math.sin(index * 1.7) * 0.15]} rotation={[0, index * 0.4, offset * 0.06]}>
        <mesh position={[0, height / 2, 0]}>
          <cylinderGeometry args={[0.009, 0.017, height, 7]} />
          <meshStandardMaterial color={index % 2 ? '#556b42' : '#65784b'} roughness={0.9} />
        </mesh>
        {index % 3 !== 0 ? (
          <mesh position={[0, height + 0.07, 0]}>
            <capsuleGeometry args={[0.038, 0.21, 5, 9]} />
            <meshStandardMaterial color="#65503c" roughness={1} />
          </mesh>
        ) : null}
      </group>
    )
  }))
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
      {rockData.map((rock, index) => (
        <mesh key={index} castShadow receiveShadow position={rock.position} rotation={rock.rotation} scale={rock.scale}>
          <dodecahedronGeometry args={[0.72, 1]} />
          <meshStandardMaterial color={rock.color} roughness={0.98} />
        </mesh>
      ))}
      {pebbleData.map((pebble, index) => (
        <mesh key={index} receiveShadow position={pebble.position} rotation={pebble.rotation} scale={[pebble.scale * 1.5, pebble.scale * 0.65, pebble.scale]}>
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={index % 2 ? '#64685f' : '#747267'} roughness={1} />
        </mesh>
      ))}
    </>
  )
}

function PondWorld({ isNight, food, turtleSignal, fish, turtles, onFeed, onTurtle }) {
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
      {lilyData.map((lily, index) => <LilyPad key={index} data={lily} index={index} />)}
      <Reeds />

      {fish.map((fishData, index) => (
        <Fish key={fishData.id} fish={fishData} index={index} food={food} isNight={isNight} />
      ))}
      {turtles.map((turtleData, index) => (
        <Turtle
          key={turtleData.id}
          turtle={turtleData}
          index={index}
          signal={turtleSignal}
          onTurtle={onTurtle}
          isNight={isNight}
        />
      ))}
      <FoodRipple food={food} />

      <ContactShadows position={[0, -0.04, 0]} opacity={isNight ? 0.22 : 0.34} scale={13} blur={2.8} far={6} />
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={7.2}
        maxDistance={14}
        minPolarAngle={0.56}
        maxPolarAngle={1.32}
        target={[0, -0.05, 0]}
        dampingFactor={0.05}
        enableDamping
      />
    </>
  )
}

function PondScene(props) {
  return (
    <div className="canvas-wrap">
      <Canvas
        shadows
        dpr={[1, 1.65]}
        camera={{ position: [8.7, 4.8, 9.7], fov: 39, near: 0.1, far: 50 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <PondWorld {...props} />
      </Canvas>
    </div>
  )
}

export default PondScene
