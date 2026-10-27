import { Suspense, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import Aerodrome, { FOLD_STAND, FARM, STAND_Z, VERTIPORT, VertiportPad, type AerodromeRefs, type FoldGeometry } from '../../three/aerodrome/Aerodrome.tsx'
import VertiportEvtol from '../../three/aerodrome/VertiportEvtol.tsx'
import ParametricEVTOL from '../../three/vehicle/ParametricEVTOL.tsx'
import SafeBoundary from '../../three/SafeBoundary.tsx'
import { transitionState } from '../../three/transition.ts'
import { aerodromo } from '../../data/load.ts'
import { COLOR } from '../../theme.ts'
import { progress, useUI } from '../../store.ts'
import { TRAMOS6, smooth, within, type Tramo6 } from './steps.ts'

const BG = new THREE.Color(COLOR.noche)
const D = 7 // diámetro del círculo que envuelve al eVTOL, en unidades de escena (ilustrativo)
const HOVER = { current: 0 }

type V3 = [number, number, number]
interface Shot {
  pos: V3
  look: V3
  column: boolean // texto a la izquierda: en pantallas anchas el sujeto va a la derecha
}
const CHARTS: Shot = { pos: [10, 230, 270], look: [10, 0, 0], column: false }
const SHOTS: Record<Tramo6, Shot> = {
  intro: { pos: [-30, 95, 170], look: [10, 0, -6], column: true },
  saf: { pos: [-150, 36, 86], look: [-76, 0, 16], column: true },
  alas: { pos: [FOLD_STAND + 4, 24, STAND_Z + 40], look: [FOLD_STAND, 2, STAND_Z], column: true },
  vertipuerto: { pos: [VERTIPORT.x + 9, VERTIPORT.roof + 9, VERTIPORT.z + 17], look: [VERTIPORT.x, VERTIPORT.roof + 2.2, VERTIPORT.z], column: true },
  ciudades: CHARTS,
  anios: CHARTS,
  pad: CHARTS,
  argentina: CHARTS,
}
const KEYS = (Object.keys(TRAMOS6) as Tramo6[]).map((k) => ({ at: (TRAMOS6[k][0] + TRAMOS6[k][1]) / 2, s: SHOTS[k] }))
const plateau = (p: number, t: Tramo6, e = 0.02) => smooth(p, TRAMOS6[t][0] - e, TRAMOS6[t][0] + e) * (1 - smooth(p, TRAMOS6[t][1] - e, TRAMOS6[t][1] + e))

// Proporciones del ala plegable y de la clave E, desde data/aerodromo.json (null si falta un dato).
const v = aerodromo.ala.vuelo.value as number | null
const pl = aerodromo.ala.plegada.value as number | null
const claveE = aerodromo.claves.find((c) => c.letra === 'E')?.hasta.value as number | null | undefined
const GEO: FoldGeometry = {
  plegadaSobreVuelo: v && pl ? pl / v : null,
  claveSobreVuelo: v && claveE ? claveE / v : null,
}
const FATO = aerodromo.vertipuerto.fatoD.value as number | null
const SEGURIDAD = aerodromo.vertipuerto.seguridadD.value as number | null

export default function Scene6({ active }: { active: boolean }) {
  const { camera, scene, size } = useThree()
  const reduced = useUI((s) => s.reducedMotion)
  const config = useUI((s) => s.configuracion)
  const carrier = useUI((s) => s.portador)
  const running = active && !reduced
  const p = useRef(0)
  const fog = useMemo(() => new THREE.Fog(COLOR.noche, 80, 700), [])
  const pos = useMemo(() => new THREE.Vector3(), [])
  const look = useMemo(() => new THREE.Vector3(), [])
  const a = useMemo(() => ({ pos: new THREE.Vector3(), look: new THREE.Vector3() }), [])
  const b = useMemo(() => ({ pos: new THREE.Vector3(), look: new THREE.Vector3() }), [])
  const offset = useMemo(() => new THREE.Vector3(), [])
  const refs = useMemo<AerodromeRefs>(() => ({ fold: { current: 0 }, saf: { current: 0.3 }, tow: { current: 0 }, gse: { current: 0 } }), [])
  const evtol = useRef<THREE.Group>(null!)

  const shot = (s: Shot, out: { pos: THREE.Vector3; look: THREE.Vector3 }, wide: boolean) => {
    out.pos.set(...s.pos)
    out.look.set(...s.look)
    if (s.column) {
      if (wide) {
        const d = out.pos.distanceTo(out.look)
        out.look.x -= d * 0.26
        out.pos.x -= d * 0.08
      } else {
        out.look.y -= out.pos.distanceTo(out.look) * 0.3
        out.pos.sub(out.look).multiplyScalar(1.7).add(out.look)
      }
    } else if (!wide) out.pos.multiplyScalar(1.25)
  }

  useFrame((_, dt) => {
    if (!active) return
    scene.background = BG
    scene.fog = fog
    p.current = reduced ? progress.s6 : THREE.MathUtils.damp(p.current, progress.s6, 5, dt)
    const t = p.current
    const wide = size.width / size.height > 1.1

    let i = KEYS.findIndex((k) => k.at > t)
    if (i === -1) i = KEYS.length - 1
    const k1 = KEYS[Math.max(0, i - 1)]
    const k2 = KEYS[i]
    shot(k1.s, a, wide)
    shot(k2.s, b, wide)
    const w = k1 === k2 ? 1 : smooth(t, k1.at, k2.at)
    pos.lerpVectors(a.pos, b.pos, w)
    look.lerpVectors(a.look, b.look, w)

    // Animaciones por tramo: hidrantes y remolcador (SAF), punteras (alas), descenso (vertipuerto).
    const saf = plateau(t, 'saf')
    refs.saf.current = 0.25 + 0.75 * saf
    refs.gse.current = saf
    refs.tow.current = within(t, 'saf', 0.05, 0.95)
    refs.fold.current = within(t, 'alas', 0.3, 0.7)
    const down = t < TRAMOS6.vertipuerto[0] ? 0 : within(t, 'vertipuerto', 0.1, 0.65)
    evtol.current.position.y = VERTIPORT.roof + 0.05 + (1 - down) * 7

    const charts = smooth(t, TRAMOS6.ciudades[0] - 0.02, TRAMOS6.ciudades[0] + 0.03)
    const tr = transitionState('s6')
    if (!reduced) pos.add(offset.set(0, tr.arriving * 30, tr.arriving * 60 - tr.leaving * 30))
    fog.near = THREE.MathUtils.lerp(THREE.MathUtils.lerp(80, 30, charts), 0.5, tr.fog)
    fog.far = THREE.MathUtils.lerp(THREE.MathUtils.lerp(700, 260, charts), 1, tr.fog)
    camera.position.copy(pos)
    camera.lookAt(look)
  })

  return (
    <group visible={active}>
      <hemisphereLight args={['#5a6f92', '#05070b', 0.7]} />
      <directionalLight position={[-80, 120, 60]} intensity={1.1} color="#c8d6ff" />
      <pointLight position={[FARM.x + 6, 18, FARM.z + 6]} intensity={900} distance={70} color="#f5c27a" />
      <pointLight position={[VERTIPORT.x, VERTIPORT.roof + 14, VERTIPORT.z]} intensity={500} distance={45} color="#cfe3ff" />
      <Aerodrome refs={refs} geo={GEO} />
      <VertiportPad d={D} fato={FATO} seguridad={SEGURIDAD} />
      <group ref={evtol} position={[VERTIPORT.x, VERTIPORT.roof, VERTIPORT.z]} rotation-y={-0.6}>
        <SafeBoundary fallback={<ParametricEVTOL config={config} carrier={carrier} running={running} phaseRef={HOVER} />}>
          <Suspense fallback={null}>
            <VertiportEvtol config={config} running={running} d={D} />
          </Suspense>
        </SafeBoundary>
      </group>
    </group>
  )
}
