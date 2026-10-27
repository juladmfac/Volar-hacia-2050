import * as THREE from 'three'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

// Rotor genérico de dos palas con disco translúcido.
interface RotorProps {
  radius?: number
  running?: boolean
  speed?: number
  color?: string
}

export default function Rotor({ radius = 1.2, running = true, speed = 18, color = '#c9d2de' }: RotorProps) {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (running && ref.current) ref.current.rotation.y += dt * speed
  })
  return (
    <group>
      <group ref={ref}>
        <mesh>
          <boxGeometry args={[radius * 2, 0.03, 0.14]} />
          <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
        </mesh>
      </group>
      <mesh>
        <cylinderGeometry args={[radius, radius, 0.01, 32]} />
        <meshStandardMaterial color={color} transparent opacity={running ? 0.12 : 0} depthWrite={false} />
      </mesh>
      <mesh position-y={-0.08}>
        <cylinderGeometry args={[0.1, 0.12, 0.2, 12]} />
        <meshStandardMaterial color="#2a3140" metalness={0.6} roughness={0.35} />
      </mesh>
    </group>
  )
}
