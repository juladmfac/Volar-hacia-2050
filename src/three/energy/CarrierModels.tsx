import { useRef, type ReactElement } from 'react'
import { useFrame } from '@react-three/fiber'
import { Edges } from '@react-three/drei'
import * as THREE from 'three'
import type { PortadorId } from '../../store.ts'
import { CARRIER_COLOR } from '../../theme.ts'

// Representaciones esquemáticas de cada portador (formas ilustrativas, sin escala real).

export { CARRIER_COLOR }

const metal = { color: '#2a3140', metalness: 0.8, roughness: 0.32, clearcoat: 0.3 }
const EDGE = '#9fb3cc'

interface CellsProps {
  cols: number
  rows: number
  color: string
  pulse: boolean
}

function Cells({ cols, rows, color, pulse }: CellsProps) {
  const glow = useRef<THREE.MeshStandardMaterial>(null)
  useFrame(({ clock }) => {
    if (glow.current && pulse) glow.current.emissiveIntensity = 1.2 + Math.sin(clock.elapsedTime * 2) * 0.5
  })
  const cells = []
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = (i - (cols - 1) / 2) * 0.75
      const z = (j - (rows - 1) / 2) * 0.75
      cells.push(
        <group key={`${i}-${j}`} position={[x, 0, z]}>
          <mesh>
            <cylinderGeometry args={[0.32, 0.32, 1.4, 20]} />
            <meshPhysicalMaterial {...metal} color="#1f2633" />
          </mesh>
          <mesh position-y={0.72}>
            <cylinderGeometry args={[0.2, 0.2, 0.06, 16]} />
            <meshStandardMaterial ref={i === 0 && j === 0 ? glow : undefined} color={color} emissive={color} emissiveIntensity={1.2} />
          </mesh>
        </group>,
      )
    }
  }
  return <group>{cells}</group>
}

interface ModelProps {
  running: boolean
}

export function Battery({ running }: ModelProps) {
  return (
    <group>
      <Cells cols={4} rows={3} color={CARRIER_COLOR.bateria} pulse={running} />
      <mesh position-y={-0.8}>
        <boxGeometry args={[3.4, 0.15, 2.6]} />
        <meshPhysicalMaterial {...metal} />
      </mesh>
      <mesh>
        <boxGeometry args={[3.5, 1.8, 2.7]} />
        <meshPhysicalMaterial color={CARRIER_COLOR.bateria} transparent opacity={0.05} roughness={0.2} depthWrite={false} />
        <Edges color={CARRIER_COLOR.bateria} />
      </mesh>
    </group>
  )
}

export function Hydrogen({ running }: ModelProps) {
  const rings = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (running && rings.current) rings.current.rotation.x = clock.elapsedTime * 0.4
  })
  return (
    <group>
      <group rotation-z={Math.PI / 2} position={[0, 0.3, 0]}>
        <mesh>
          <capsuleGeometry args={[0.85, 2.2, 8, 24]} />
          <meshPhysicalMaterial color="#dfe6ee" metalness={0.25} roughness={0.22} clearcoat={0.8} clearcoatRoughness={0.15} />
          <Edges threshold={40} color={EDGE} />
        </mesh>
        <group ref={rings}>
          {[-0.8, 0, 0.8].map((y) => (
            <mesh key={y} position-y={y} rotation-x={Math.PI / 2}>
              <torusGeometry args={[0.9, 0.04, 8, 40]} />
              <meshStandardMaterial color={CARRIER_COLOR.hidrogeno} emissive={CARRIER_COLOR.hidrogeno} emissiveIntensity={1.8} toneMapped={false} />
            </mesh>
          ))}
        </group>
      </group>
      {/* pila de combustible: placas apiladas */}
      <group position={[0, -0.95, 0]}>
        {Array.from({ length: 7 }, (_, i) => (
          <mesh key={i} position-x={(i - 3) * 0.32}>
            <boxGeometry args={[0.22, 0.6, 1.2]} />
            <meshPhysicalMaterial {...metal} color={i % 2 ? '#2a3140' : '#3c4658'} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

export function Saf({ running }: ModelProps) {
  const liquid = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (running && liquid.current) liquid.current.scale.y = 0.85 + Math.sin(clock.elapsedTime * 1.3) * 0.03
  })
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[1.1, 1.1, 2.2, 32, 1, true]} />
        <meshPhysicalMaterial color="#c9d2de" transparent opacity={0.12} roughness={0.05} clearcoat={1} depthWrite={false} />
        <Edges threshold={30} color={EDGE} />
      </mesh>
      <mesh position-y={1.1} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.9, 1.1, 32]} />
        <meshPhysicalMaterial {...metal} />
      </mesh>
      <group position-y={-1.1}>
        <mesh ref={liquid} position-y={0}>
          <cylinderGeometry args={[1.02, 1.02, 2, 32]} />
          <meshStandardMaterial color={CARRIER_COLOR.saf} emissive={CARRIER_COLOR.saf} emissiveIntensity={0.5} transparent opacity={0.85} />
        </mesh>
      </group>
      <mesh position-y={-1.15}>
        <cylinderGeometry args={[1.15, 1.15, 0.12, 32]} />
        <meshPhysicalMaterial {...metal} />
      </mesh>
    </group>
  )
}

export function Hybrid({ running }: ModelProps) {
  const shaft = useRef<THREE.Mesh>(null)
  useFrame((_, dt) => {
    if (running && shaft.current) shaft.current.rotation.x += dt * 4
  })
  return (
    <group>
      {/* motor térmico con aletas */}
      <group position={[-1.1, 0.4, 0]} rotation-z={Math.PI / 2}>
        <mesh>
          <cylinderGeometry args={[0.6, 0.6, 1.3, 24]} />
          <meshPhysicalMaterial {...metal} color="#3a3340" />
        </mesh>
        {[-0.45, -0.15, 0.15, 0.45].map((y) => (
          <mesh key={y} position-y={y}>
            <cylinderGeometry args={[0.75, 0.75, 0.06, 24]} />
            <meshPhysicalMaterial {...metal} />
          </mesh>
        ))}
      </group>
      {/* eje y generador */}
      <mesh ref={shaft} position={[0, 0.4, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.1, 0.1, 0.9, 12]} />
        <meshPhysicalMaterial {...metal} color="#8a93a6" />
      </mesh>
      <mesh position={[0.8, 0.4, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.5, 0.5, 0.8, 24]} />
        <meshStandardMaterial color={CARRIER_COLOR.hibrido} emissive={CARRIER_COLOR.hibrido} emissiveIntensity={0.4} />
      </mesh>
      {/* batería chica */}
      <group position={[0, -0.85, 0]} scale={0.55}>
        <Cells cols={4} rows={2} color={CARRIER_COLOR.bateria} pulse={running} />
      </group>
    </group>
  )
}

export const CARRIER_MODELS: Record<PortadorId, (p: ModelProps) => ReactElement> = { bateria: Battery, hidrogeno: Hydrogen, saf: Saf, hibrido: Hybrid }
