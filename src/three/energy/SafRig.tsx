import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Edges } from '@react-three/drei'
import * as THREE from 'three'
import { CARRIER_COLOR } from '../../theme.ts'

// Esquema del SAF (escena 2): tanque en corte, cuatro rutas de producción que lo alimentan
// y un turbofán genérico. Formas y flujos ilustrativos, sin escala; el único dato es el
// tope de mezcla, que llega por `limitRef`.

const metal = { color: '#2a3140', metalness: 0.8, roughness: 0.32, clearcoat: 0.3 }
const EDGE = '#9fb3cc'
const FOSIL = '#5a6272'

export const TANK = { r: 1.15, h: 3.2, y: 0.4 }
const INNER = { r: 1.07, bottom: TANK.y - TANK.h / 2 + 0.08, h: TANK.h - 0.16 }
export const ENGINE_X = 4.8

// Orden de arriba hacia abajo = orden de la lista de rutas en la capa de texto.
export const ROUTE_Y = [2.5, 1.35, 0.2, -0.95]
const ROUTE_Z = [-0.45, -0.15, 0.15, 0.45]
export const SOURCE_X = -6.2

export interface SafRigRefs {
  share: { current: number } // fracción de SAF en la columna de líquido (0..1)
  fill: { current: number } // fracción del tanque con líquido (0..1)
  limit: { current: number | null } // tope de mezcla como fracción, o null si no hay dato
  marker: { current: number } // visibilidad de la marca del tope (0..1)
  routes: { current: number[] } // intensidad de cada ruta (0..1)
  feed: { current: number } // intensidad del flujo al motor (0..1)
}

function routeCurve(i: number) {
  const y = ROUTE_Y[i]
  const z = ROUTE_Z[i]
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(SOURCE_X + 0.6, y, z),
    new THREE.Vector3(-3.6, y, z),
    new THREE.Vector3(-1.7, TANK.y + TANK.h / 2 + 0.55, z * 0.6),
    new THREE.Vector3(-0.2, TANK.y + TANK.h / 2 + 0.25, z * 0.3),
    new THREE.Vector3(0, TANK.y + TANK.h / 2 - 0.2, 0),
  ])
}

const feedCurve = () =>
  new THREE.CatmullRomCurve3([
    new THREE.Vector3(TANK.r * 0.9, INNER.bottom + 0.25, 0.2),
    new THREE.Vector3(2.2, INNER.bottom - 0.1, 0.4),
    new THREE.Vector3(ENGINE_X - 0.6, -0.75, 0.3),
    new THREE.Vector3(ENGINE_X - 0.2, -0.45, 0),
  ])

// Cantidad de partículas por ruta: el e-SAF casi no fluye (ilustrativo).
const PER_ROUTE = [18, 14, 12, 3]
const FEED_N = 16

function Particles({ refs, running }: { refs: SafRigRefs; running: boolean }) {
  const mesh = useRef<THREE.InstancedMesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>>(null!)
  const curves = useMemo(() => [...ROUTE_Y.map((_, i) => routeCurve(i)), feedCurve()], [])
  const slots = useMemo(() => {
    const s: { curve: number; phase: number }[] = []
    PER_ROUTE.forEach((n, i) => {
      for (let k = 0; k < n; k++) s.push({ curve: i, phase: k / n })
    })
    for (let k = 0; k < FEED_N; k++) s.push({ curve: ROUTE_Y.length, phase: k / FEED_N })
    return s
  }, [])
  const tmp = useMemo(() => new THREE.Object3D(), [])
  const amber = useMemo(() => new THREE.Color(CARRIER_COLOR.saf), [])
  const grey = useMemo(() => new THREE.Color('#9aa3b2'), [])
  const c = useMemo(() => new THREE.Color(), [])
  useFrame(({ clock }) => {
    const t = running ? clock.elapsedTime : 0
    slots.forEach((s, i) => {
      const feed = s.curve === ROUTE_Y.length
      const u = (s.phase + t * (feed ? 0.22 : 0.16)) % 1
      tmp.position.copy(curves[s.curve].getPointAt(u))
      tmp.scale.setScalar(0.05 + 0.03 * Math.sin(u * Math.PI))
      tmp.updateMatrix()
      mesh.current.setMatrixAt(i, tmp.matrix)
      const w = feed ? refs.feed.current : refs.routes.current[s.curve] ?? 0
      // Al motor llega la mezcla: partículas ámbar y grises alternadas.
      c.copy(feed && i % 2 ? grey : amber).multiplyScalar(w)
      mesh.current.setColorAt(i, c)
    })
    mesh.current.instanceMatrix.needsUpdate = true
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
  })
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, slots.length]} frustumCulled={false}>
      <sphereGeometry args={[1, 10, 10]} />
      <meshBasicMaterial toneMapped={false} blending={THREE.AdditiveBlending} transparent depthWrite={false} />
    </instancedMesh>
  )
}

function Pipes() {
  const tubes = useMemo(() => [...ROUTE_Y.map((_, i) => routeCurve(i)), feedCurve()].map((c) => new THREE.TubeGeometry(c, 64, 0.05, 8)), [])
  return (
    <group>
      {tubes.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshPhysicalMaterial color="#c9d2de" transparent opacity={0.16} roughness={0.1} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

// Insumos de cada ruta, en formas simples: aceite, alcohol, biomasa, electricidad + CO₂.
function Sources() {
  return (
    <group position-x={SOURCE_X}>
      <group position={[0, ROUTE_Y[0], ROUTE_Z[0]]}>
        <mesh scale={[0.32, 0.42, 0.32]}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshPhysicalMaterial color="#d9c27a" roughness={0.15} clearcoat={1} />
        </mesh>
        <mesh position-y={0.42} rotation-x={Math.PI}>
          <coneGeometry args={[0.2, 0.32, 24]} />
          <meshPhysicalMaterial color="#d9c27a" roughness={0.15} clearcoat={1} />
        </mesh>
      </group>
      <group position={[0, ROUTE_Y[1], ROUTE_Z[1]]}>
        <mesh position-y={-0.1}>
          <cylinderGeometry args={[0.3, 0.3, 0.5, 24]} />
          <meshPhysicalMaterial color="#c9d2de" transparent opacity={0.35} roughness={0.05} depthWrite={false} />
          <Edges threshold={30} color={EDGE} />
        </mesh>
        <mesh position-y={0.28}>
          <cylinderGeometry args={[0.08, 0.3, 0.26, 24]} />
          <meshPhysicalMaterial color="#c9d2de" transparent opacity={0.35} roughness={0.05} depthWrite={false} />
        </mesh>
        <mesh position-y={-0.18}>
          <cylinderGeometry args={[0.26, 0.26, 0.3, 24]} />
          <meshStandardMaterial color="#e8dcb4" transparent opacity={0.75} />
        </mesh>
      </group>
      <group position={[0, ROUTE_Y[2], ROUTE_Z[2]]}>
        {[
          [0, 0, 0],
          [0.28, 0.1, 0.1],
          [-0.24, 0.12, -0.08],
          [0.06, 0.3, -0.12],
          [-0.08, -0.22, 0.14],
        ].map((p, k) => (
          <mesh key={k} position={p as [number, number, number]} rotation={[k, k * 0.7, 0]}>
            <icosahedronGeometry args={[0.17, 0]} />
            <meshStandardMaterial color={k % 2 ? '#7c8f4e' : '#9aa86a'} roughness={0.8} flatShading />
          </mesh>
        ))}
      </group>
      <group position={[0, ROUTE_Y[3], ROUTE_Z[3]]}>
        <mesh rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.3, 0.035, 10, 40]} />
          <meshStandardMaterial color={CARRIER_COLOR.bateria} emissive={CARRIER_COLOR.bateria} emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
        <mesh position={[-0.12, 0, 0]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color={CARRIER_COLOR.hidrogeno} emissive={CARRIER_COLOR.hidrogeno} emissiveIntensity={0.8} />
        </mesh>
        <mesh position={[0.14, 0, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#6b7385" />
        </mesh>
      </group>
    </group>
  )
}

function Tank({ refs }: { refs: SafRigRefs }) {
  const saf = useRef<THREE.Mesh>(null!)
  const fosil = useRef<THREE.Mesh>(null!)
  const marker = useRef<THREE.Mesh<THREE.TorusGeometry, THREE.MeshStandardMaterial>>(null!)
  useFrame(() => {
    const col = INNER.h * refs.fill.current
    const hs = Math.max(0.001, col * refs.share.current)
    const hf = Math.max(0.001, col - hs)
    saf.current.visible = hs > 0.01
    saf.current.scale.y = hs
    saf.current.position.y = INNER.bottom + hs / 2
    fosil.current.scale.y = hf
    fosil.current.position.y = INNER.bottom + hs + hf / 2
    const lim = refs.limit.current
    marker.current.visible = lim !== null && refs.marker.current > 0.01
    if (lim !== null) marker.current.position.y = INNER.bottom + col * lim
    marker.current.material.opacity = refs.marker.current
  })
  return (
    <group>
      <mesh position-y={TANK.y}>
        <cylinderGeometry args={[TANK.r, TANK.r, TANK.h, 48, 1, true]} />
        <meshPhysicalMaterial color="#c9d2de" transparent opacity={0.1} roughness={0.05} clearcoat={1} depthWrite={false} side={THREE.DoubleSide} />
        <Edges threshold={30} color={EDGE} />
      </mesh>
      {[TANK.y - TANK.h / 2, TANK.y + TANK.h / 2].map((y) => (
        <mesh key={y} position-y={y}>
          <cylinderGeometry args={[TANK.r + 0.05, TANK.r + 0.05, 0.12, 48]} />
          <meshPhysicalMaterial {...metal} />
        </mesh>
      ))}
      <mesh ref={saf}>
        <cylinderGeometry args={[INNER.r, INNER.r, 1, 48]} />
        <meshStandardMaterial color={CARRIER_COLOR.saf} emissive={CARRIER_COLOR.saf} emissiveIntensity={0.45} transparent opacity={0.92} />
      </mesh>
      <mesh ref={fosil}>
        <cylinderGeometry args={[INNER.r, INNER.r, 1, 48]} />
        <meshStandardMaterial color={FOSIL} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh ref={marker} rotation-x={Math.PI / 2}>
        <torusGeometry args={[TANK.r + 0.04, 0.025, 8, 64]} />
        <meshStandardMaterial color={CARRIER_COLOR.saf} emissive={CARRIER_COLOR.saf} emissiveIntensity={2.2} toneMapped={false} transparent />
      </mesh>
    </group>
  )
}

// Turbofán genérico (arquetipo, sin modelo comercial): góndola, fan y núcleo.
function Turbofan({ running }: { running: boolean }) {
  const fan = useRef<THREE.Group>(null!)
  const nacelle = useMemo(() => {
    const pts = [
      [0.86, -1.1],
      [1.0, -0.95],
      [1.06, -0.5],
      [1.04, 0.5],
      [0.9, 1.05],
      [0.84, 1.05],
      [0.92, 0.5],
      [0.94, -0.5],
      [0.88, -0.95],
      [0.82, -1.1],
    ].map(([r, y]) => new THREE.Vector2(r, y))
    return new THREE.LatheGeometry(pts, 64)
  }, [])
  useFrame((_, dt) => {
    if (running) fan.current.rotation.y += dt * 6
  })
  return (
    <group position={[ENGINE_X, 0.4, 0]} rotation-z={-Math.PI / 2}>
      <mesh geometry={nacelle}>
        <meshPhysicalMaterial color="#c9d2de" metalness={0.7} roughness={0.28} clearcoat={0.6} side={THREE.DoubleSide} />
      </mesh>
      <group ref={fan} position-y={-0.6}>
        <mesh position-y={-0.12}>
          <coneGeometry args={[0.24, 0.42, 32]} />
          <meshPhysicalMaterial {...metal} color="#1f2633" />
        </mesh>
        {Array.from({ length: 18 }, (_, k) => (
          <group key={k} rotation-y={(k / 18) * Math.PI * 2}>
            <mesh position-x={0.55} rotation-x={0.55}>
              <boxGeometry args={[0.66, 0.04, 0.2]} />
              <meshPhysicalMaterial {...metal} color="#8a93a6" />
            </mesh>
          </group>
        ))}
      </group>
      <mesh position-y={0.55}>
        <cylinderGeometry args={[0.42, 0.34, 1.6, 32]} />
        <meshPhysicalMaterial {...metal} color="#3c4658" />
      </mesh>
    </group>
  )
}

export default function SafRig({ refs, running }: { refs: SafRigRefs; running: boolean }) {
  return (
    <group>
      <Sources />
      <Pipes />
      <Tank refs={refs} />
      <Turbofan running={running} />
      <Particles refs={refs} running={running} />
    </group>
  )
}
