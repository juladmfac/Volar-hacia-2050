import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ContactShadows } from '@react-three/drei'
import TechFloor, { useTechFloorMaterial } from '../../three/TechFloor.tsx'
import { transitionState } from '../../three/transition.ts'
import { COLOR } from '../../theme.ts'
import { CARRIER_MODELS } from '../../three/energy/CarrierModels.tsx'
import SafRig, { ROUTE_Y, SOURCE_X, type SafRigRefs } from '../../three/energy/SafRig.tsx'
import { SAF_TANK } from '../../illustrative/values.ts'
import { safData } from '../../data/load.ts'
import { progress, useUI } from '../../store.ts'
import { CHART_TRAMOS, OTRAS, TRAMOS, otrasRange, smooth, type Tramo } from './steps.ts'

const BG = new THREE.Color(COLOR.noche)
const FLOOR_Y = -1.3
const OTRAS_X = 14
const OTRAS_GAP = 8

// Tope de mezcla: el único valor de esta escena 3D que es dato (data/saf.json).
const LIMIT = safData.limiteMezcla.hasValue && typeof safData.limiteMezcla.value === 'number' ? safData.limiteMezcla.value / 100 : null

type V3 = [number, number, number]
interface Shot {
  pos: V3
  look: V3
  // Con texto a la izquierda, en pantallas anchas el sujeto se corre a la derecha.
  column: boolean
}

const SHOTS: Partial<Record<Tramo, Shot>> = {
  intro: { pos: [4.2, 2.6, 12.5], look: [2.8, 0.4, 0], column: true },
  rutas: { pos: [-2.2, 2.6, 11], look: [-2.6, 0.8, 0], column: true },
  mezcla: { pos: [1.2, 1.3, 7.2], look: [0.3, 0.3, 0], column: true },
  pedido: { pos: [0, 6, 24], look: [0, 0, 0], column: false },
  esaf: { pos: [-3.2, 1.4, 9.6], look: [-3.6, ROUTE_Y[3] + 0.5, 0], column: true },
  argentina: { pos: [-4.8, 2.6, 8.8], look: [SOURCE_X + 0.6, 0.9, 0], column: true },
  tabla: { pos: [16, 17, 40], look: [16, -11, 0], column: false },
}
for (const t of CHART_TRAMOS) SHOTS[t] = SHOTS.pedido

const mid = (t: Tramo) => (TRAMOS[t][0] + TRAMOS[t][1]) / 2

// Un encuadre por centro de tramo; en el carrusel, uno por portador.
const KEYS: { at: number; s: Shot }[] = (Object.keys(TRAMOS) as Tramo[]).flatMap((k) =>
  k === 'otras'
    ? OTRAS.map((_, i) => {
        const [a, b] = otrasRange(i)
        const x = OTRAS_X + i * OTRAS_GAP
        return { at: (a + b) / 2, s: { pos: [x + 0.6, 2.2, 9] as V3, look: [x + 0.4, 0, 0] as V3, column: true } }
      })
    : [{ at: mid(k), s: SHOTS[k]! }],
)
const plateau = (p: number, t: Tramo, edge = 0.025) => smooth(p, TRAMOS[t][0] - edge, TRAMOS[t][0] + edge) * (1 - smooth(p, TRAMOS[t][1] - edge, TRAMOS[t][1] + edge))

export default function Scene2({ active }: { active: boolean }) {
  const { camera, scene, size } = useThree()
  const reduced = useUI((s) => s.reducedMotion)
  const running = active && !reduced
  const p = useRef(0)
  const fog = useMemo(() => new THREE.Fog(COLOR.noche, 1, 400), [])
  const floor = useTechFloorMaterial(26)
  const pos = useMemo(() => new THREE.Vector3(), [])
  const look = useMemo(() => new THREE.Vector3(), [])
  const a = useMemo(() => ({ pos: new THREE.Vector3(), look: new THREE.Vector3() }), [])
  const b = useMemo(() => ({ pos: new THREE.Vector3(), look: new THREE.Vector3() }), [])
  const offset = useMemo(() => new THREE.Vector3(), [])
  const refs = useMemo<SafRigRefs>(
    () => ({
      share: { current: 0 },
      fill: { current: SAF_TANK.fill },
      limit: { current: LIMIT },
      marker: { current: 0 },
      routes: { current: [0, 0, 0, 0] },
      feed: { current: 0 },
    }),
    [],
  )

  // Encuadre de un tramo, ajustado al ancho de la pantalla.
  const shot = (s: Shot, out: { pos: THREE.Vector3; look: THREE.Vector3 }, wide: boolean) => {
    out.pos.set(...s.pos)
    out.look.set(...s.look)
    if (s.column) {
      if (wide) {
        out.look.x -= 2.4
        out.pos.x -= 0.9
      } else {
        out.look.y -= 1.6
        out.pos.z *= 1.45
      }
    } else if (!wide) out.pos.multiplyScalar(1.3)
  }

  useFrame((_, dt) => {
    if (!active) return
    scene.background = BG
    scene.fog = fog
    p.current = reduced ? progress.s2 : THREE.MathUtils.damp(p.current, progress.s2, 5, dt)
    const t = p.current
    const wide = size.width / size.height > 1.1

    // Cámara: interpola entre los encuadres de los centros de tramo.
    let i = KEYS.findIndex((k) => k.at > t)
    if (i === -1) i = KEYS.length - 1
    const k1 = KEYS[Math.max(0, i - 1)]
    const k2 = KEYS[i]
    shot(k1.s, a, wide)
    shot(k2.s, b, wide)
    const w = k1 === k2 ? 1 : smooth(t, k1.at, k2.at)
    pos.lerpVectors(a.pos, b.pos, w)
    look.lerpVectors(a.look, b.look, w)

    // Tanque: entra SAF con las rutas y se frena en el tope de mezcla.
    const max = LIMIT ?? SAF_TANK.sinDato
    const toRutas = smooth(t, TRAMOS.rutas[0], TRAMOS.rutas[1]) * SAF_TANK.enRutas
    const toLimit = smooth(t, TRAMOS.mezcla[0], (TRAMOS.mezcla[0] + TRAMOS.mezcla[1]) / 2)
    refs.share.current = reduced ? max : THREE.MathUtils.lerp(toRutas * max, max, toLimit)
    refs.marker.current = reduced ? 1 : smooth(t, TRAMOS.mezcla[0], TRAMOS.mezcla[0] + 0.03)

    // Flujos: las rutas encendidas desde su tramo; en e-SAF solo la cuarta.
    const on = smooth(t, TRAMOS.rutas[0] - 0.02, TRAMOS.rutas[0] + 0.03)
    const esaf = plateau(t, 'esaf')
    const charts = Math.max(...CHART_TRAMOS.map((c) => plateau(t, c)))
    for (let r = 0; r < 4; r++) refs.routes.current[r] = on * (1 - charts * 0.7) * (r === 3 ? 1 : 1 - esaf * 0.85)
    refs.feed.current = Math.max(1 - on, 0.35) * (1 - charts * 0.7) * (1 - esaf * 0.85)

    // Transiciones entre escenas y fondo que se aleja detrás de los gráficos.
    const tr = transitionState('s2')
    if (!reduced) pos.add(offset.set(0, tr.arriving * 5, tr.arriving * 16 - tr.leaving * 7))
    const near = THREE.MathUtils.lerp(60, 10, charts)
    const far = THREE.MathUtils.lerp(400, 60, charts)
    fog.near = THREE.MathUtils.lerp(near, 0.5, tr.fog)
    fog.far = THREE.MathUtils.lerp(far, 1, tr.fog)
    camera.position.copy(pos)
    camera.lookAt(look)
  })

  return (
    <group visible={active}>
      <ambientLight intensity={0.25} />
      <directionalLight position={[5, 8, 10]} intensity={1.4} />
      <directionalLight position={[-6, 3, -4]} intensity={0.6} color="#7cc8ff" />
      <SafRig refs={refs} running={running} />
      {OTRAS.map((id, i) => {
        const M = CARRIER_MODELS[id]
        return (
          <group key={id} position-x={OTRAS_X + i * OTRAS_GAP} rotation-y={-0.35}>
            <M running={running} />
          </group>
        )
      })}
      <TechFloor material={floor} y={FLOOR_Y} size={160} />
      <ContactShadows frames={active ? Infinity : 0} position={[10, FLOOR_Y + 0.01, 0]} scale={[90, 18]} opacity={0.55} blur={2.6} far={3.5} resolution={512} color="#000000" />
    </group>
  )
}

