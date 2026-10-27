import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Battery } from '../energy/CarrierModels.tsx'
import { CARRIER_COLOR } from '../../theme.ts'

// Cadena de potencia esquemática (escena 5): turbogenerador → nodo → inversor → motor → hélice,
// con la batería que entra al nodo. Formas y flujos ilustrativos. Las intensidades de cada tramo
// llegan por refs: el híbrido en despegue usa batería y generador; en crucero, solo el generador;
// el eléctrico, solo la batería (el generador desaparece).

const metal = { metalness: 0.7, roughness: 0.32 }
export const CHAIN = { gen: -4.4, node: -0.6, inv: 0.9, motor: 2.5, prop: 3.25, batY: -1.6 }

export interface ChainRefs {
  gen: { current: number } // 0..1: flujo del generador
  bat: { current: number } // 0..1: flujo de la batería
  main: { current: number } // 0..1: flujo al motor
  genScale: { current: number } // 0..1: el generador aparece o desaparece
}

const curve = (pts: [number, number, number][]) => new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)))
const PATHS = {
  gen: curve([
    [CHAIN.gen + 1.0, 0, 0],
    [(CHAIN.gen + CHAIN.node) / 2, 0.15, 0],
    [CHAIN.node, 0, 0],
  ]),
  bat: curve([
    [CHAIN.node - 0.9, CHAIN.batY + 0.75, 0],
    [CHAIN.node - 0.3, -0.5, 0],
    [CHAIN.node, 0, 0],
  ]),
  main: curve([
    [CHAIN.node, 0, 0],
    [CHAIN.inv - 0.35, 0, 0],
    [CHAIN.inv + 0.35, 0, 0],
    [CHAIN.motor - 0.4, 0, 0],
  ]),
}
const N = { gen: 14, bat: 12, main: 18 }

function Cables() {
  const tubes = useMemo(() => Object.values(PATHS).map((c) => new THREE.TubeGeometry(c, 48, 0.045, 8)), [])
  return (
    <group>
      {tubes.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshStandardMaterial color="#2a3140" {...metal} />
        </mesh>
      ))}
    </group>
  )
}

function Flow({ refs, running }: { refs: ChainRefs; running: boolean }) {
  const ref = useRef<THREE.InstancedMesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>>(null!)
  const tmp = useMemo(() => new THREE.Object3D(), [])
  const slots = useMemo(
    () => (Object.keys(N) as (keyof typeof N)[]).flatMap((k) => Array.from({ length: N[k] }, (_, i) => ({ k, ph: i / N[k] }))),
    [],
  )
  const colors = useMemo(() => ({ gen: new THREE.Color(CARRIER_COLOR.hibrido), bat: new THREE.Color(CARRIER_COLOR.bateria), main: new THREE.Color('#e9edf3') }), [])
  const c = useMemo(() => new THREE.Color(), [])
  useFrame(({ clock }) => {
    const t = running ? clock.elapsedTime : 0
    slots.forEach((s, i) => {
      const u = (s.ph + t * 0.35) % 1
      tmp.position.copy(PATHS[s.k].getPointAt(u))
      tmp.scale.setScalar(0.06)
      tmp.updateMatrix()
      ref.current.setMatrixAt(i, tmp.matrix)
      c.copy(colors[s.k]).multiplyScalar(refs[s.k].current)
      ref.current.setColorAt(i, c)
    })
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, slots.length]} frustumCulled={false}>
      <sphereGeometry args={[1, 10, 10]} />
      <meshBasicMaterial toneMapped={false} blending={THREE.AdditiveBlending} transparent depthWrite={false} />
    </instancedMesh>
  )
}

function Turbogenerator({ refs, running }: { refs: ChainRefs; running: boolean }) {
  const g = useRef<THREE.Group>(null!)
  const fan = useRef<THREE.Group>(null!)
  useFrame((_, dt) => {
    g.current.scale.setScalar(Math.max(0.001, refs.genScale.current))
    g.current.visible = refs.genScale.current > 0.01
    if (running) fan.current.rotation.x += dt * 10
  })
  return (
    <group ref={g} position-x={CHAIN.gen}>
      {/* turbina compacta */}
      <mesh position-x={-0.35} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.38, 0.32, 1.1, 32]} />
        <meshStandardMaterial color="#5b6577" {...metal} />
      </mesh>
      <group ref={fan} position-x={-0.92}>
        {Array.from({ length: 12 }, (_, k) => (
          <group key={k} rotation-x={(k / 12) * Math.PI * 2}>
            <mesh position-y={0.2} rotation-y={0.5}>
              <boxGeometry args={[0.06, 0.3, 0.015]} />
              <meshStandardMaterial color="#aab3c2" {...metal} />
            </mesh>
          </group>
        ))}
      </group>
      {/* generador eléctrico */}
      <mesh position-x={0.55} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.42, 0.42, 0.7, 32]} />
        <meshStandardMaterial color={CARRIER_COLOR.hibrido} emissive={CARRIER_COLOR.hibrido} emissiveIntensity={0.35} {...metal} />
      </mesh>
    </group>
  )
}

function Inverter() {
  return (
    <group position-x={CHAIN.inv}>
      <mesh>
        <boxGeometry args={[0.7, 0.5, 0.55]} />
        <meshStandardMaterial color="#1f2633" {...metal} />
      </mesh>
      {[-0.18, -0.06, 0.06, 0.18].map((x) => (
        <mesh key={x} position={[x, 0.3, 0]}>
          <boxGeometry args={[0.03, 0.1, 0.5]} />
          <meshStandardMaterial color="#8a93a6" {...metal} />
        </mesh>
      ))}
      <mesh position={[0, 0, 0.28]}>
        <planeGeometry args={[0.4, 0.18]} />
        <meshStandardMaterial color="#0b1422" emissive="#7cc8ff" emissiveIntensity={0.8} />
      </mesh>
    </group>
  )
}

function MotorProp({ running, refs }: { running: boolean; refs: ChainRefs }) {
  const prop = useRef<THREE.Group>(null!)
  useFrame((_, dt) => {
    if (running) prop.current.rotation.x += dt * (6 + 10 * refs.main.current)
  })
  return (
    <group>
      <mesh position-x={CHAIN.motor} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.45, 0.45, 0.8, 32]} />
        <meshStandardMaterial color="#3c4658" {...metal} />
      </mesh>
      {[-0.25, -0.1, 0.05, 0.2].map((x) => (
        <mesh key={x} position-x={CHAIN.motor + x} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.5, 0.5, 0.04, 32]} />
          <meshStandardMaterial color="#8a93a6" {...metal} />
        </mesh>
      ))}
      <group ref={prop} position-x={CHAIN.prop}>
        <mesh rotation-z={-Math.PI / 2}>
          <coneGeometry args={[0.16, 0.4, 24]} />
          <meshStandardMaterial color="#1f2633" {...metal} />
        </mesh>
        {[0, 1, 2, 3].map((k) => (
          <group key={k} rotation-x={(k / 4) * Math.PI * 2}>
            <mesh position-y={0.75} rotation-y={0.45}>
              <boxGeometry args={[0.16, 1.3, 0.03]} />
              <meshStandardMaterial color="#c9d2de" {...metal} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

export default function PowerChain({ refs, running }: { refs: ChainRefs; running: boolean }) {
  return (
    <group>
      <Turbogenerator refs={refs} running={running} />
      <group position={[CHAIN.node - 1.4, CHAIN.batY, 0]} scale={0.5}>
        <Battery running={running} />
      </group>
      <mesh position-x={CHAIN.node}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#e9edf3" emissive="#e9edf3" emissiveIntensity={0.4} />
      </mesh>
      <Cables />
      <Inverter />
      <MotorProp running={running} refs={refs} />
      <Flow refs={refs} running={running} />
    </group>
  )
}
