import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

const fishPalette = [
  ['#f7a44b', '#fff1d3'],
  ['#f05a47', '#fff7e8'],
  ['#eec35a', '#263942'],
  ['#f7efe3', '#e85645'],
  ['#e88352', '#fff2cf'],
  ['#f3d572', '#475c5d'],
  ['#ffffff', '#ed785a'],
  ['#de6a45', '#263942'],
]

const rockData = Array.from({ length: 30 }, (_, index) => {
  const angle = (index / 30) * Math.PI * 2
  const wobble = 1 + Math.sin(index * 2.7) * 0.06
  return {
    position: [Math.cos(angle) * 5.05 * wobble, -0.02, Math.sin(angle) * 3.52 * wobble],
    rotation: [index * 0.19, angle, index * 0.31],
    scale: [0.7 + (index % 4) * 0.08, 0.45 + (index % 3) * 0.07, 0.58 + (index % 5) * 0.045],
    color: index % 3 === 0 ? '#6f8375' : index % 3 === 1 ? '#879386' : '#596f68',
  }
})

const lilyData = [
  [-2.55, 0.23, -1.2, 0.55],
  [-1.75, 0.23, -1.78, 0.42],
  [2.15, 0.23, -1.35, 0.5],
  [2.85, 0.23, -0.58, 0.36],
  [-3.1, 0.23, 0.58, 0.38],
  [1.5, 0.23, 1.65, 0.32],
]

function Fish({ index, food, isNight }) {
  const group = useRef()
  const tail = useRef()
  const [bodyColor, detailColor] = fishPalette[index]
  const temp = useMemo(() => new THREE.Vector3(), [])
  const speed = 0.2 + (index % 3) * 0.035
  const radiusX = 1.45 + (index % 4) * 0.58
  const radiusZ = 0.75 + (index % 3) * 0.42
  const phase = (index / fishPalette.length) * Math.PI * 2

  useFrame(({ clock }, delta) => {
    if (!group.current) return
    const time = clock.elapsedTime
    const hungry = food && performance.now() - food.startedAt < 6200
    let targetX
    let targetZ
    let targetY

    if (hungry) {
      const personalAngle = phase + time * 0.7
      const ring = 0.22 + index * 0.025
      targetX = food.x + Math.cos(personalAngle) * ring
      targetZ = food.z + Math.sin(personalAngle) * ring
      targetY = 0.2 - (index % 3) * 0.02
    } else {
      const angle = time * speed + phase
      targetX = Math.cos(angle) * radiusX
      targetZ = Math.sin(angle) * radiusZ
      targetY = 0.17 + Math.sin(time * 0.9 + index) * 0.035
    }

    temp.set(targetX, targetY, targetZ)
    const previousX = group.current.position.x
    const previousZ = group.current.position.z
    group.current.position.lerp(temp, Math.min(delta * (hungry ? 1.45 : 0.78), 1))
    const directionX = group.current.position.x - previousX
    const directionZ = group.current.position.z - previousZ
    if (Math.abs(directionX) + Math.abs(directionZ) > 0.0001) {
      const desiredRotation = Math.atan2(-directionZ, directionX)
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, desiredRotation, delta * 4)
    }
    group.current.rotation.z = Math.sin(time * 1.7 + index) * 0.04
    if (tail.current) tail.current.rotation.y = Math.sin(time * 8 + index) * 0.42
  })

  return (
    <group ref={group} scale={0.68 + (index % 3) * 0.08}>
      <mesh castShadow scale={[1.24, 0.48, 0.62]}>
        <sphereGeometry args={[0.46, 20, 14]} />
        <meshStandardMaterial color={bodyColor} roughness={0.5} emissive={isNight ? bodyColor : '#000000'} emissiveIntensity={isNight ? 0.08 : 0} />
      </mesh>
      <mesh position={[0.16, 0.16, 0]} scale={[0.72, 0.18, 0.68]}>
        <sphereGeometry args={[0.3, 16, 10]} />
        <meshStandardMaterial color={detailColor} roughness={0.55} />
      </mesh>
      <group ref={tail} position={[-0.58, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} scale={[0.55, 0.34, 0.12]}>
          <coneGeometry args={[0.42, 0.7, 3]} />
          <meshStandardMaterial color={bodyColor} roughness={0.62} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <mesh position={[0.48, 0.04, 0.18]}>
        <sphereGeometry args={[0.045, 10, 8]} />
        <meshStandardMaterial color="#101b1d" roughness={0.2} />
      </mesh>
      <mesh position={[0.48, 0.04, -0.18]}>
        <sphereGeometry args={[0.045, 10, 8]} />
        <meshStandardMaterial color="#101b1d" roughness={0.2} />
      </mesh>
    </group>
  )
}

function Turtle({ signal, onTurtle, isNight }) {
  const turtle = useRef()
  const head = useRef()
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
    const angle = time * (excited ? 0.4 : 0.09) + 1.4
    turtle.current.position.x = Math.cos(angle) * 2.15
    turtle.current.position.z = Math.sin(angle) * 1.25 + 0.25
    turtle.current.position.y = 0.2 + Math.sin(time * 1.4) * 0.035
    turtle.current.rotation.y = -angle + Math.PI / 2
    if (head.current) head.current.position.x = 0.68 + (excited ? Math.sin(time * 9) * 0.08 : 0)
  })

  const handleClick = (event) => {
    event.stopPropagation()
    setExcitedUntil(performance.now() + 1900)
    onTurtle()
  }

  return (
    <group
      ref={turtle}
      scale={0.78}
      onClick={handleClick}
      onPointerEnter={() => { document.body.style.cursor = 'pointer' }}
      onPointerLeave={() => { document.body.style.cursor = 'default' }}
    >
      <mesh castShadow scale={[1.05, 0.46, 0.78]}>
        <sphereGeometry args={[0.6, 24, 16]} />
        <meshStandardMaterial color={isNight ? '#3f765e' : '#557f52'} roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.23, 0]} scale={[0.92, 0.35, 0.68]}>
        <sphereGeometry args={[0.58, 24, 14]} />
        <meshStandardMaterial color="#a08a50" roughness={0.82} />
      </mesh>
      {[[-0.28, 0.32], [-0.28, -0.32], [0.3, 0.34], [0.3, -0.34]].map(([x, z], index) => (
        <mesh key={index} position={[x, -0.14, z]} rotation={[0, 0, index < 2 ? -0.45 : 0.45]} scale={[0.45, 0.15, 0.23]}>
          <sphereGeometry args={[0.5, 12, 8]} />
          <meshStandardMaterial color="#4f7954" roughness={0.8} />
        </mesh>
      ))}
      <group ref={head} position={[0.68, 0.08, 0]}>
        <mesh scale={[0.44, 0.32, 0.34]}>
          <sphereGeometry args={[0.5, 16, 12]} />
          <meshStandardMaterial color="#5d895f" roughness={0.74} />
        </mesh>
        <mesh position={[0.18, 0.06, 0.14]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshStandardMaterial color="#101715" />
        </mesh>
        <mesh position={[0.18, 0.06, -0.14]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshStandardMaterial color="#101715" />
        </mesh>
      </group>
    </group>
  )
}

function FoodRipple({ food }) {
  const ripple = useRef()
  useFrame(() => {
    if (!ripple.current || !food) return
    const age = Math.min((performance.now() - food.startedAt) / 1800, 1)
    ripple.current.scale.setScalar(0.5 + age * 2.8)
    ripple.current.material.opacity = Math.max(0, 0.7 * (1 - age))
  })
  if (!food) return null

  return (
    <group key={food.id} position={[food.x, 0.28, food.z]}>
      <mesh ref={ripple} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.16, 0.2, 40]} />
        <meshBasicMaterial color="#e9fff6" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      {Array.from({ length: 7 }, (_, index) => {
        const angle = (index / 7) * Math.PI * 2
        return (
          <mesh key={index} position={[Math.cos(angle) * 0.19, 0.02, Math.sin(angle) * 0.19]}>
            <sphereGeometry args={[0.045, 8, 6]} />
            <meshStandardMaterial color="#d8b86d" roughness={0.9} />
          </mesh>
        )
      })}
    </group>
  )
}

function LilyPad({ data, index }) {
  const [x, y, z, size] = data
  return (
    <group position={[x, y, z]} rotation={[0, index * 0.8, 0]}>
      <mesh receiveShadow>
        <cylinderGeometry args={[size, size * 0.97, 0.045, 28]} />
        <meshStandardMaterial color={index % 2 ? '#4c8a5d' : '#5f9862'} roughness={0.76} />
      </mesh>
      {index === 1 || index === 3 ? (
        <group position={[0.06, 0.13, -0.04]}>
          {[0, 1, 2, 3, 4, 5].map((petal) => (
            <mesh key={petal} rotation={[0, (petal / 6) * Math.PI * 2, 0]} position={[Math.cos((petal / 6) * Math.PI * 2) * 0.1, 0, Math.sin((petal / 6) * Math.PI * 2) * 0.1]} scale={[0.75, 0.28, 0.42]}>
              <sphereGeometry args={[0.11, 10, 8]} />
              <meshStandardMaterial color="#f6d9de" roughness={0.65} />
            </mesh>
          ))}
          <mesh position={[0, 0.025, 0]}>
            <sphereGeometry args={[0.06, 10, 8]} />
            <meshStandardMaterial color="#edbd55" />
          </mesh>
        </group>
      ) : null}
    </group>
  )
}

function Reeds() {
  const clusters = [[-4.35, -1.6], [4.25, 1.35], [-3.6, 2.2]]
  return clusters.flatMap(([x, z], cluster) => Array.from({ length: 5 }, (_, index) => {
    const height = 1.2 + (index % 3) * 0.2
    return (
      <group key={`${cluster}-${index}`} position={[x + index * 0.16, 0.2, z + Math.sin(index) * 0.16]} rotation={[0, 0, (index - 2) * 0.03]}>
        <mesh position={[0, height / 2, 0]}>
          <cylinderGeometry args={[0.018, 0.028, height, 8]} />
          <meshStandardMaterial color="#668a50" roughness={0.82} />
        </mesh>
        <mesh position={[0, height + 0.1, 0]}>
          <capsuleGeometry args={[0.07, 0.26, 5, 10]} />
          <meshStandardMaterial color="#755134" roughness={0.95} />
        </mesh>
      </group>
    )
  }))
}

function PondWorld({ isNight, food, turtleSignal, onFeed, onTurtle }) {
  const handlePondClick = (event) => {
    event.stopPropagation()
    onFeed({ x: event.point.x, z: event.point.z })
  }

  return (
    <>
      <color attach="background" args={[isNight ? '#06151d' : '#bdddd5']} />
      <fog attach="fog" args={[isNight ? '#06151d' : '#bdddd5', 12, 25]} />
      <ambientLight intensity={isNight ? 0.7 : 1.3} color={isNight ? '#84a8cb' : '#fff9e7'} />
      <directionalLight
        castShadow
        position={isNight ? [-5, 8, -3] : [5, 9, 4]}
        intensity={isNight ? 1.4 : 2.1}
        color={isNight ? '#a8c9ff' : '#fff4cf'}
        shadow-mapSize={[1024, 1024]}
      />
      {isNight ? <pointLight position={[1.7, 2.6, 1]} intensity={9} distance={7} color="#75e6c5" /> : null}

      <mesh receiveShadow position={[0, -0.65, 0]}>
        <cylinderGeometry args={[6.4, 6.8, 0.95, 72]} />
        <meshStandardMaterial color={isNight ? '#203b36' : '#6f9668'} roughness={0.92} />
      </mesh>
      <mesh receiveShadow position={[0, -0.13, 0]} scale={[1, 1, 0.7]}>
        <cylinderGeometry args={[4.65, 4.65, 0.7, 96]} />
        <meshStandardMaterial color="#385c4e" roughness={0.9} />
      </mesh>
      <mesh
        position={[0, 0.18, 0]}
        scale={[1, 1, 0.7]}
        onPointerDown={handlePondClick}
        onPointerEnter={() => { document.body.style.cursor = 'crosshair' }}
        onPointerLeave={() => { document.body.style.cursor = 'default' }}
      >
        <cylinderGeometry args={[4.55, 4.55, 0.18, 96]} />
        <meshPhysicalMaterial
          color={isNight ? '#164a5b' : '#3b9a97'}
          roughness={0.16}
          metalness={0.04}
          transmission={0.16}
          transparent
          opacity={isNight ? 0.72 : 0.64}
          clearcoat={0.85}
          clearcoatRoughness={0.2}
        />
      </mesh>

      {rockData.map((rock, index) => (
        <mesh key={index} castShadow receiveShadow position={rock.position} rotation={rock.rotation} scale={rock.scale}>
          <icosahedronGeometry args={[0.72, 1]} />
          <meshStandardMaterial color={isNight ? '#445c57' : rock.color} roughness={0.96} />
        </mesh>
      ))}
      {lilyData.map((lily, index) => <LilyPad key={index} data={lily} index={index} />)}
      <Reeds />

      {fishPalette.map((_, index) => <Fish key={index} index={index} food={food} isNight={isNight} />)}
      <Turtle signal={turtleSignal} onTurtle={onTurtle} isNight={isNight} />
      <FoodRipple food={food} />

      <ContactShadows position={[0, -0.09, 0]} opacity={isNight ? 0.3 : 0.42} scale={12} blur={2.3} far={5} />
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={6.8}
        maxDistance={13}
        minPolarAngle={0.38}
        maxPolarAngle={1.24}
        target={[0, 0, 0]}
        dampingFactor={0.055}
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
        dpr={[1, 1.7]}
        camera={{ position: [7.4, 6.1, 8.4], fov: 42, near: 0.1, far: 50 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <PondWorld {...props} />
      </Canvas>
    </div>
  )
}

export default PondScene
