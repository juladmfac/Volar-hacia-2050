import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { rng } from '../rng.ts'
import { CARRIER_COLOR, COLOR } from '../../theme.ts'
import { AERODROMO } from '../../illustrative/values.ts'

// Aeródromo genérico de la escena 6: pista, calle de rodaje, plataforma con aviones de línea
// arquetípicos (tubo y ala, sin copiar ningún modelo), planta de combustible con la red de
// hidrantes, remolcador de rodaje, equipos de tierra y un vertipuerto sobre un edificio.
// Formas y distancias ilustrativas, sin escala. Las únicas proporciones que vienen de datos son
// las del ala plegable y las del pad, y llegan como props.

export interface AerodromeRefs {
  fold: { current: number } // 0 ala desplegada, 1 punteras plegadas
  saf: { current: number } // 0..1 flujo en la red de hidrantes
  tow: { current: number } // 0..1 avance del remolcador por la calle de rodaje
  gse: { current: number } // 0..1 brillo de los equipos de tierra eléctricos
}

export interface FoldGeometry {
  plegadaSobreVuelo: number | null // envergadura plegada / en vuelo
  claveSobreVuelo: number | null // límite de la clave E / envergadura en vuelo
}

export const RUNWAY_Z = -46
export const TAXI_Z = -28
export const STAND_Z = 2
export const STANDS = [-54, -18, 18, 54]
export const FOLD_STAND = 54
export const FARM = { x: -112, z: 34 }
export const VERTIPORT = { x: 126, z: 26, roof: 10 }
export const BIG_SPAN = 30

const PAVE = '#121822'
const metal = { metalness: 0.35, roughness: 0.55 }

// Semiala como placa extruida. Puntos de la planta en (x a lo largo de la envergadura, z hacia la nariz).
function planform(pts: [number, number][], thick: number) {
  const s = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)))
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false })
  g.rotateX(-Math.PI / 2)
  g.translate(0, -thick / 2, 0)
  return g
}

function useAirlinerGeometry(span: number, foldFrac: number) {
  return useMemo(() => {
    const L = span * 0.86
    const r = span * 0.045
    const half = span / 2
    const k = 0.42 // flecha del borde de ataque
    const root = span * 0.2
    const tip = span * 0.05
    const zLE = r * 1.2
    const fx = half * (1 - foldFrac) // estación del pliegue
    const le = (x: number) => zLE - (x - r) * k
    const chord = (x: number) => root + ((tip - root) * (x - r)) / (half - r)
    const inner = planform(
      [
        [r * 0.6, zLE],
        [fx, le(fx)],
        [fx, le(fx) - chord(fx)],
        [r * 0.6, zLE - root],
      ],
      span * 0.008,
    )
    const outer = planform(
      [
        [0, le(fx)],
        [half - fx, le(half)],
        [half - fx, le(half) - tip],
        [0, le(fx) - chord(fx)],
      ],
      span * 0.006,
    )
    const hs = span * 0.17
    const stab = planform(
      [
        [0, -L * 0.36],
        [hs, -L * 0.36 - hs * 0.55],
        [hs, -L * 0.36 - hs * 0.55 - span * 0.03],
        [0, -L * 0.36 - span * 0.07],
      ],
      span * 0.005,
    )
    const fin = planform(
      [
        [0, -L * 0.34],
        [span * 0.16, -L * 0.34 - span * 0.12],
        [span * 0.16, -L * 0.34 - span * 0.16],
        [0, -L * 0.34 - span * 0.1],
      ],
      span * 0.005,
    )
    fin.rotateZ(Math.PI / 2)
    const body = new THREE.CapsuleGeometry(r, L - 2 * r, 6, 18)
    body.rotateX(Math.PI / 2)
    const engine = new THREE.CylinderGeometry(r * 0.55, r * 0.5, span * 0.11, 18)
    engine.rotateX(Math.PI / 2)
    return { L, r, fx, zLE, inner, outer, stab, fin, body, engine, le }
  }, [span, foldFrac])
}

function Airliner({ span, foldFrac = 0.05, fold, color = '#cfd6e1' }: { span: number; foldFrac?: number; fold?: { current: number }; color?: string }) {
  const g = useAirlinerGeometry(span, foldFrac)
  const left = useRef<THREE.Group>(null!)
  const right = useRef<THREE.Group>(null!)
  useFrame(() => {
    if (!fold) return
    const a = fold.current * Math.PI * 0.5
    left.current.rotation.z = a
    right.current.rotation.z = a
  })
  const mat = <meshStandardMaterial color={color} side={THREE.DoubleSide} {...metal} />
  const wingY = -g.r * 0.35
  const side = (sign: 1 | -1, ref: React.RefObject<THREE.Group>) => (
    <group scale-x={sign}>
      <mesh geometry={g.inner} position-y={wingY}>
        {mat}
      </mesh>
      <group ref={ref} position={[g.fx, wingY, 0]}>
        <mesh geometry={g.outer}>{mat}</mesh>
      </group>
      <mesh geometry={g.engine} position={[span * 0.17, wingY - g.r * 0.75, g.le(span * 0.17) + span * 0.02]}>
        <meshStandardMaterial color="#8a93a6" {...metal} />
      </mesh>
      <mesh geometry={g.stab} position-y={g.r * 0.25}>
        {mat}
      </mesh>
    </group>
  )
  return (
    <group position-y={g.r + 1.1}>
      <mesh geometry={g.body}>{mat}</mesh>
      <mesh geometry={g.fin} position-y={g.r * 0.6}>
        {mat}
      </mesh>
      {side(1, left)}
      {side(-1, right)}
      {/* luz de navegación en la cola */}
      <mesh position={[0, g.r * 0.2, -g.L / 2]}>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
    </group>
  )
}

// Luces de borde: esferas instanciadas, sin sombra.
function EdgeLights({ points, color, size = 0.22 }: { points: THREE.Vector3[]; color: string; size?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null!)
  const tmp = useMemo(() => new THREE.Object3D(), [])
  useLayoutEffect(() => {
    points.forEach((p, i) => {
      tmp.position.copy(p)
      tmp.scale.setScalar(size)
      tmp.updateMatrix()
      ref.current.setMatrixAt(i, tmp.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  }, [points, size, tmp])
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, points.length]} frustumCulled={false}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </instancedMesh>
  )
}

function Runway() {
  const edges = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let x = -150; x <= 150; x += 8) for (const dz of [-5.2, 5.2]) pts.push(new THREE.Vector3(x, 0.25, RUNWAY_Z + dz))
    return pts
  }, [])
  const taxi = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let x = -130; x <= 130; x += 9) for (const dz of [-2.6, 2.6]) pts.push(new THREE.Vector3(x, 0.2, TAXI_Z + dz))
    return pts
  }, [])
  const dashes = useMemo(() => Array.from({ length: 24 }, (_, i) => -138 + i * 12), [])
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, RUNWAY_Z]}>
        <planeGeometry args={[310, 10]} />
        <meshStandardMaterial color={PAVE} roughness={0.9} />
      </mesh>
      {dashes.map((x) => (
        <mesh key={x} rotation-x={-Math.PI / 2} position={[x, 0.04, RUNWAY_Z]}>
          <planeGeometry args={[5, 0.35]} />
          <meshBasicMaterial color="#5b6577" />
        </mesh>
      ))}
      {[-148, 148].map((x) =>
        [-3.6, -2.2, -0.8, 0.8, 2.2, 3.6].map((dz) => (
          <mesh key={`${x}${dz}`} rotation-x={-Math.PI / 2} position={[x - Math.sign(x) * 3, 0.04, RUNWAY_Z + dz]}>
            <planeGeometry args={[6, 0.6]} />
            <meshBasicMaterial color="#6b7587" />
          </mesh>
        )),
      )}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, TAXI_Z]}>
        <planeGeometry args={[270, 5]} />
        <meshStandardMaterial color={PAVE} roughness={0.9} />
      </mesh>
      {[-100, -36, 36, 100].map((x) => (
        <mesh key={x} rotation-x={-Math.PI / 2} position={[x, 0.021, (RUNWAY_Z + TAXI_Z) / 2]}>
          <planeGeometry args={[5, RUNWAY_Z - TAXI_Z + 10]} />
          <meshStandardMaterial color={PAVE} roughness={0.9} />
        </mesh>
      ))}
      {[-54, 0, 54].map((x) => (
        <mesh key={x} rotation-x={-Math.PI / 2} position={[x, 0.021, (TAXI_Z - 12) / 2]}>
          <planeGeometry args={[5, -TAXI_Z - 12]} />
          <meshStandardMaterial color={PAVE} roughness={0.9} />
        </mesh>
      ))}
      <EdgeLights points={edges} color="#fff4dc" />
      <EdgeLights points={taxi} color="#4f8dff" size={0.18} />
    </group>
  )
}

function Apron({ geo, refs }: { geo: FoldGeometry; refs: AerodromeRefs }) {
  const lim = geo.claveSobreVuelo
  const half = BIG_SPAN / 2
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.015, 6]}>
        <planeGeometry args={[160, 34]} />
        <meshStandardMaterial color="#0f141d" roughness={0.95} />
      </mesh>
      {/* terminal */}
      <mesh position={[0, 5, 30]}>
        <boxGeometry args={[150, 10, 10]} />
        <meshStandardMaterial color="#1a2130" {...metal} />
      </mesh>
      <mesh position={[0, 6, 24.95]}>
        <planeGeometry args={[146, 4]} />
        <meshBasicMaterial color="#8fb7d9" toneMapped={false} transparent opacity={0.35} />
      </mesh>
      {/* puestos: línea de guía y aviones (el último, el de ala plegable) */}
      {STANDS.map((x) => (
        <group key={x} position={[x, 0, STAND_Z]}>
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
            <planeGeometry args={[0.25, 30]} />
            <meshBasicMaterial color="#c9b26a" />
          </mesh>
          {x === FOLD_STAND ? (
            <Airliner span={BIG_SPAN} foldFrac={geo.plegadaSobreVuelo ? (1 - geo.plegadaSobreVuelo) : 0.08} fold={refs.fold} />
          ) : (
            <Airliner span={24} />
          )}
        </group>
      ))}
      {/* límite de la clave E alrededor del avión de ala plegable, en proporción a los datos */}
      {lim && (
        <group position={[FOLD_STAND, 0.06, STAND_Z]}>
          {[-1, 1].map((s) => (
            <Line
              key={s}
              points={[
                [s * half * lim, 0, -16],
                [s * half * lim, 0, 14],
              ]}
              color={COLOR.acento}
              lineWidth={1.5}
              dashed
              dashSize={1}
              gapSize={0.6}
            />
          ))}
        </group>
      )}
      <Hydrants refs={refs} />
      <Gse refs={refs} />
    </group>
  )
}

// Red de hidrantes: de la planta de combustible a cada puesto.
const PIPE = new THREE.CatmullRomCurve3(
  [
    [FARM.x + 8, 0.35, FARM.z - 4],
    [FARM.x + 30, 0.35, 20],
    [-70, 0.35, 20],
    [70, 0.35, 20],
  ].map(([x, y, z]) => new THREE.Vector3(x, y, z)),
  false,
  'centripetal',
)

function Hydrants({ refs }: { refs: AerodromeRefs }) {
  const tube = useMemo(() => new THREE.TubeGeometry(PIPE, 120, 0.3, 8), [])
  const n = 60
  const ref = useRef<THREE.InstancedMesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>>(null!)
  const tmp = useMemo(() => new THREE.Object3D(), [])
  const c = useMemo(() => new THREE.Color(), [])
  const saf = useMemo(() => new THREE.Color(CARRIER_COLOR.saf), [])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    for (let i = 0; i < n; i++) {
      const u = (i / n + t * 0.04) % 1
      tmp.position.copy(PIPE.getPointAt(u))
      tmp.position.y += 0.35
      tmp.scale.setScalar(0.45)
      tmp.updateMatrix()
      ref.current.setMatrixAt(i, tmp.matrix)
      ref.current.setColorAt(i, c.copy(saf).multiplyScalar(refs.saf.current))
    }
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
  })
  return (
    <group>
      <mesh geometry={tube}>
        <meshStandardMaterial color="#2a3140" {...metal} />
      </mesh>
      {STANDS.map((x) => (
        <mesh key={x} position={[x, 0.2, 20]}>
          <cylinderGeometry args={[0.8, 0.8, 0.3, 16]} />
          <meshStandardMaterial color={CARRIER_COLOR.saf} emissive={CARRIER_COLOR.saf} emissiveIntensity={0.4} />
        </mesh>
      ))}
      <instancedMesh ref={ref} args={[undefined, undefined, n]} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial toneMapped={false} blending={THREE.AdditiveBlending} transparent depthWrite={false} />
      </instancedMesh>
    </group>
  )
}

function FuelFarm() {
  const tanks: [number, number][] = [
    [0, 0],
    [12, 0],
    [0, 12],
    [12, 12],
  ]
  return (
    <group position={[FARM.x, 0, FARM.z]}>
      <mesh rotation-x={-Math.PI / 2} position={[6, 0.02, 6]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#0d121a" />
      </mesh>
      {tanks.map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <mesh position-y={3.5}>
            <cylinderGeometry args={[4.6, 4.6, 7, 32]} />
            <meshStandardMaterial color="#3a4354" {...metal} />
          </mesh>
          <mesh position-y={5.6}>
            <cylinderGeometry args={[4.65, 4.65, 0.6, 32]} />
            <meshStandardMaterial color={CARRIER_COLOR.saf} emissive={CARRIER_COLOR.saf} emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// Remolcador de rodaje (TaxiBot): lleva un avión por la calle de rodaje con los motores apagados.
function TaxiBot({ refs }: { refs: AerodromeRefs }) {
  const g = useRef<THREE.Group>(null!)
  useFrame(() => {
    const u = refs.tow.current
    g.current.position.x = THREE.MathUtils.lerp(-120, 80, u)
  })
  return (
    <group ref={g} position-z={TAXI_Z} rotation-y={Math.PI / 2}>
      <Airliner span={24} color="#b9c2cf" />
      <group position={[0, 0, 11.8]}>
        <mesh position-y={0.8}>
          <boxGeometry args={[3, 1.2, 4]} />
          <meshStandardMaterial color="#1f2633" {...metal} />
        </mesh>
        <mesh position-y={1.5}>
          <boxGeometry args={[3.02, 0.2, 4.02]} />
          <meshStandardMaterial color={CARRIER_COLOR.bateria} emissive={CARRIER_COLOR.bateria} emissiveIntensity={1.2} />
        </mesh>
      </group>
    </group>
  )
}

// Equipos de apoyo en tierra eléctricos (eGSE): carros chicos que van y vienen en la plataforma.
// Un solo material para el brillo de todos.
const GSE_MAT = new THREE.MeshStandardMaterial({ color: CARRIER_COLOR.bateria, emissive: CARRIER_COLOR.bateria, emissiveIntensity: 0.4 })
function Gse({ refs }: { refs: AerodromeRefs }) {
  const carts = useMemo(() => {
    const r = rng(AERODROMO.seed)
    return STANDS.flatMap((x) => [0, 1].map((k) => ({ x: x + (k ? 7 : -7) + r() * 2, z: STAND_Z + 4 + r() * 6, ph: r() * Math.PI * 2 })))
  }, [])
  const groups = useRef<(THREE.Group | null)[]>([])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    carts.forEach((c, i) => {
      const o = groups.current[i]
      if (o) o.position.z = c.z + Math.sin(t * 0.4 + c.ph) * 2
    })
    GSE_MAT.emissiveIntensity = 0.2 + 1.4 * refs.gse.current
  })
  return (
    <group>
      {carts.map((c, i) => (
        <group key={i} ref={(o) => void (groups.current[i] = o)} position={[c.x, 0, c.z]}>
          <mesh position-y={0.5}>
            <boxGeometry args={[1.4, 0.8, 2.4]} />
            <meshStandardMaterial color="#2a3140" {...metal} />
          </mesh>
          <mesh position-y={1} material={GSE_MAT}>
            <boxGeometry args={[1.42, 0.12, 2.42]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// Fondo: bloques de ciudad oscuros detrás de la pista, para ubicar el aeródromo en la ciudad.
function Skyline() {
  const ref = useRef<THREE.InstancedMesh>(null!)
  const blocks = useMemo(() => {
    const r = rng(AERODROMO.seed + 1)
    return Array.from({ length: 160 }, () => ({ x: (r() - 0.5) * 520, z: -95 - r() * 160, h: 6 + r() * r() * 80, w: 6 + r() * 10 }))
  }, [])
  const tmp = useMemo(() => new THREE.Object3D(), [])
  useLayoutEffect(() => {
    blocks.forEach((b, i) => {
      tmp.position.set(b.x, b.h / 2, b.z)
      tmp.scale.set(b.w, b.h, b.w)
      tmp.updateMatrix()
      ref.current.setMatrixAt(i, tmp.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  }, [blocks, tmp])
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, blocks.length]} frustumCulled={false}>
      <boxGeometry />
      <meshStandardMaterial color="#0e131c" emissive="#1b2a40" emissiveIntensity={0.25} {...metal} />
    </instancedMesh>
  )
}

// Vertipuerto sobre un edificio: cuadrado de la FATO (fato × D), área de seguridad (seguridad × D)
// y el círculo D de la aeronave. Si falta un factor, ese anillo no se dibuja.
export function VertiportPad({ d, fato, seguridad }: { d: number; fato: number | null; seguridad: number | null }) {
  const sq = (side: number): [number, number, number][] => {
    const h = side / 2
    return [
      [-h, 0, -h],
      [h, 0, -h],
      [h, 0, h],
      [-h, 0, h],
      [-h, 0, -h],
    ]
  }
  const circle = useMemo(
    () => Array.from({ length: 65 }, (_, i) => [Math.cos((i / 64) * Math.PI * 2) * (d / 2), 0, Math.sin((i / 64) * Math.PI * 2) * (d / 2)] as [number, number, number]),
    [d],
  )
  const fatoSide = fato ? fato * d : null
  return (
    <group position={[VERTIPORT.x, 0, VERTIPORT.z]}>
      <mesh position-y={VERTIPORT.roof / 2}>
        <boxGeometry args={[34, VERTIPORT.roof, 34]} />
        <meshStandardMaterial color="#161c27" {...metal} />
      </mesh>
      <group position-y={VERTIPORT.roof + 0.06}>
        {fatoSide && (
          <mesh rotation-x={-Math.PI / 2} position-y={-0.03}>
            <planeGeometry args={[fatoSide, fatoSide]} />
            <meshStandardMaterial color="#1d2533" roughness={0.9} />
          </mesh>
        )}
        {fatoSide && <Line points={sq(fatoSide)} color={COLOR.acento} lineWidth={2} />}
        {fatoSide && seguridad && <Line points={sq(fatoSide + 2 * seguridad * d)} color={COLOR.tenue} lineWidth={1.5} dashed dashSize={0.8} gapSize={0.5} />}
        <Line points={circle} color={COLOR.ilustrativo} lineWidth={1.2} dashed dashSize={0.4} gapSize={0.3} />
      </group>
      {/* luces del perímetro del pad */}
      {fatoSide &&
        Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2
          const r = fatoSide / 2
          const x = Math.max(-r, Math.min(r, Math.cos(a) * r * 1.42))
          const z = Math.max(-r, Math.min(r, Math.sin(a) * r * 1.42))
          return (
            <mesh key={i} position={[x, VERTIPORT.roof + 0.25, z]}>
              <sphereGeometry args={[0.18, 8, 8]} />
              <meshBasicMaterial color="#a3e635" toneMapped={false} />
            </mesh>
          )
        })}
    </group>
  )
}

export default function Aerodrome({ refs, geo }: { refs: AerodromeRefs; geo: FoldGeometry }) {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.01}>
        <planeGeometry args={[900, 900]} />
        <meshStandardMaterial color="#070a10" roughness={1} />
      </mesh>
      <Runway />
      <Apron geo={geo} refs={refs} />
      <FuelFarm />
      <TaxiBot refs={refs} />
      <Skyline />
    </group>
  )
}
