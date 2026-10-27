import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CARRIER_COLOR } from '../../theme.ts'

// Turbofán genérico en corte (arquetipo, sin escala ni modelo comercial). Eje +X hacia adelante:
// el fan está adelante y la tobera atrás. Una cuña de la góndola y del núcleo se abre hacia +Z
// para ver adentro. Flujos ilustrativos: el aire que pasa por fuera del núcleo (derivación) y el
// que entra al núcleo, que se calienta en la cámara donde se quema el combustible (SAF en mezcla).

const GAP = 1.9 // abertura de la cuña, en radianes
const metal = { metalness: 0.75, roughness: 0.3 }
const toX = new THREE.Euler(0, 0, -Math.PI / 2) // eje de revolución Y → X

function lathe(points: [number, number][], segs = 72) {
  return new THREE.LatheGeometry(
    points.map(([r, y]) => new THREE.Vector2(r, y)),
    segs,
    GAP / 2,
    Math.PI * 2 - GAP,
  )
}

// Disco de álabes: anillo de cajas chicas alrededor del eje.
function Stage({ x, rIn, rOut, n, color = '#8a93a6', pitch = 0.5 }: { x: number; rIn: number; rOut: number; n: number; color?: string; pitch?: number }) {
  const len = rOut - rIn
  return (
    <group position-x={x}>
      {Array.from({ length: n }, (_, k) => (
        <group key={k} rotation-x={(k / n) * Math.PI * 2}>
          <mesh position-y={rIn + len / 2} rotation-y={pitch}>
            <boxGeometry args={[0.1, len, 0.02]} />
            <meshStandardMaterial color={color} {...metal} />
          </mesh>
        </group>
      ))}
      <mesh rotation={toX}>
        <cylinderGeometry args={[rIn, rIn, 0.12, 32]} />
        <meshStandardMaterial color="#3c4658" {...metal} />
      </mesh>
    </group>
  )
}

const BYPASS = 70
const CORE = 46

function Flow({ running, intensity }: { running: boolean; intensity: { current: number } }) {
  const ref = useRef<THREE.InstancedMesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>>(null!)
  const tmp = useMemo(() => new THREE.Object3D(), [])
  const cold = useMemo(() => new THREE.Color('#9fd4ff'), [])
  const hot = useMemo(() => new THREE.Color(CARRIER_COLOR.saf), [])
  const c = useMemo(() => new THREE.Color(), [])
  // Semillas fijas: ángulo, fase y radio relativo de cada partícula (ilustrativas).
  const seeds = useMemo(
    () => Array.from({ length: BYPASS + CORE }, (_, i) => [((i * 61) % 97) / 97, ((i * 37) % 89) / 89, ((i * 17) % 23) / 23]),
    [],
  )
  useFrame(({ clock }) => {
    const t = running ? clock.elapsedTime : 0
    seeds.forEach(([a, ph, rr], i) => {
      const core = i >= BYPASS
      // Solo en la mitad abierta (hacia +Z) para que se vea a través de la cuña.
      const ang = -Math.PI / 2 + (a - 0.5) * 2.2
      const u = (ph + t * (core ? 0.28 : 0.4)) % 1
      const x = core ? 1.35 - u * 3.9 : 2.1 - u * 3.0
      const r = core ? THREE.MathUtils.lerp(0.48, 0.26, Math.min(1, Math.max(0, (1.2 - x) / 3))) * (0.8 + rr * 0.2) : 0.76 + rr * 0.18
      tmp.position.set(x, Math.cos(ang) * r, -Math.sin(ang) * r)
      tmp.scale.setScalar(core ? 0.035 : 0.03)
      tmp.updateMatrix()
      ref.current.setMatrixAt(i, tmp.matrix)
      const heat = core ? THREE.MathUtils.smoothstep(x, 0.1, -0.5) : 0
      c.copy(cold).lerp(hot, heat).multiplyScalar(intensity.current)
      ref.current.setColorAt(i, c)
    })
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, BYPASS + CORE]} frustumCulled={false}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial toneMapped={false} blending={THREE.AdditiveBlending} transparent depthWrite={false} />
    </instancedMesh>
  )
}

export default function Turbofan({ running, intensity }: { running: boolean; intensity: { current: number } }) {
  const lp = useRef<THREE.Group>(null!)
  const hp = useRef<THREE.Group>(null!)
  const flame = useRef<THREE.MeshStandardMaterial>(null!)
  const nacelle = useMemo(
    () =>
      lathe([
        [1.02, 2.05],
        [1.14, 1.85],
        [1.19, 1.2],
        [1.16, 0.2],
        [1.04, -0.75],
        [0.98, -0.85],
        [0.97, -0.75],
        [1.04, 0.2],
        [1.07, 1.2],
        [1.02, 1.85],
        [0.99, 2.05],
      ]),
    [],
  )
  const coreCowl = useMemo(
    () =>
      lathe([
        [0.6, 1.25],
        [0.64, 0.8],
        [0.63, 0.0],
        [0.55, -0.9],
        [0.43, -1.7],
        [0.4, -2.1],
        [0.37, -2.1],
        [0.4, -1.7],
        [0.52, -0.9],
        [0.6, 0.0],
        [0.6, 0.8],
        [0.57, 1.25],
      ]),
    [],
  )
  useFrame(({ clock }, dt) => {
    if (running) {
      lp.current.rotation.x += dt * 5
      hp.current.rotation.x += dt * 9
    }
    flame.current.emissiveIntensity = (1.6 + (running ? Math.sin(clock.elapsedTime * 13) * 0.25 : 0)) * intensity.current
  })
  return (
    <group>
      <mesh geometry={nacelle} rotation={toX}>
        <meshPhysicalMaterial color="#c9d2de" metalness={0.65} roughness={0.28} clearcoat={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={coreCowl} rotation={toX}>
        <meshPhysicalMaterial color="#5b6577" metalness={0.7} roughness={0.32} side={THREE.DoubleSide} />
      </mesh>
      {/* Eje de baja presión: fan, compresor de baja y turbina de baja */}
      <group ref={lp}>
        <mesh position-x={1.88} rotation={toX}>
          <coneGeometry args={[0.26, 0.45, 32]} />
          <meshStandardMaterial color="#1f2633" {...metal} />
        </mesh>
        <Stage x={1.55} rIn={0.24} rOut={1.0} n={20} color="#aab3c2" pitch={0.6} />
        <Stage x={1.05} rIn={0.3} rOut={0.58} n={24} />
        <Stage x={0.85} rIn={0.3} rOut={0.58} n={24} />
        <Stage x={-1.05} rIn={0.3} rOut={0.48} n={28} color="#6d7688" />
        <Stage x={-1.3} rIn={0.3} rOut={0.46} n={28} color="#6d7688" />
        <Stage x={-1.55} rIn={0.3} rOut={0.44} n={28} color="#6d7688" />
        <mesh rotation={toX}>
          <cylinderGeometry args={[0.07, 0.07, 3.6, 16]} />
          <meshStandardMaterial color="#8a93a6" {...metal} />
        </mesh>
      </group>
      {/* Eje de alta presión: compresor de alta y turbina de alta */}
      <group ref={hp}>
        {[0.55, 0.38, 0.21, 0.04].map((x, k) => (
          <Stage key={x} x={x} rIn={0.28} rOut={0.52 - k * 0.025} n={30} />
        ))}
        <Stage x={-0.62} rIn={0.28} rOut={0.46} n={30} color="#9a7a5a" />
        <Stage x={-0.78} rIn={0.28} rOut={0.46} n={30} color="#9a7a5a" />
      </group>
      {/* Cámara de combustión: acá se quema el combustible */}
      <mesh position-x={-0.25} rotation-y={Math.PI / 2}>
        <torusGeometry args={[0.42, 0.075, 16, 48]} />
        <meshStandardMaterial ref={flame} color="#ffb347" emissive={CARRIER_COLOR.saf} emissiveIntensity={1.6} toneMapped={false} />
      </mesh>
      {/* Línea de combustible desde arriba hasta la cámara */}
      <mesh position={[-0.25, 0.85, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.85, 12]} />
        <meshStandardMaterial color={CARRIER_COLOR.saf} emissive={CARRIER_COLOR.saf} emissiveIntensity={0.6} />
      </mesh>
      {/* Cono de escape */}
      <mesh position-x={-2.15} rotation={new THREE.Euler(0, 0, Math.PI / 2)}>
        <coneGeometry args={[0.3, 0.7, 32]} />
        <meshStandardMaterial color="#3c4658" {...metal} />
      </mesh>
      <Flow running={running} intensity={intensity} />
    </group>
  )
}
