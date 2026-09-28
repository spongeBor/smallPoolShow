import { useMemo } from 'react'
import * as THREE from 'three'

const LILY_PADS = [
  [-2.6, 0.255, -1.15, 0.52],
  [-1.78, 0.255, -1.72, 0.38],
  [2.2, 0.255, -1.35, 0.46],
  [2.95, 0.255, -0.55, 0.32],
  [-3.18, 0.255, 0.62, 0.34],
  [1.56, 0.255, 1.62, 0.3],
]

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

export default function PondPlants() {
  return (
    <>
      {LILY_PADS.map((lily, index) => <LilyPad key={index} data={lily} index={index} />)}
      <Reeds />
    </>
  )
}
