import { Suspense, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ContactShadows } from '@react-three/drei'
import TechFloor, { useTechFloorMaterial } from '../../three/TechFloor.tsx'
import { transitionState } from '../../three/transition.ts'
import SafeBoundary from '../../three/SafeBoundary.tsx'
import Turbofan from '../../three/propulsion/Turbofan.tsx'
import PowerChain, { type ChainRefs } from '../../three/propulsion/PowerChain.tsx'
import EvtolXray from '../../three/propulsion/EvtolXray.tsx'
import ParametricEVTOL from '../../three/vehicle/ParametricEVTOL.tsx'
import { COLOR } from '../../theme.ts'
import { progress, useUI } from '../../store.ts'
import { TRAMOS5, hybridCruise, smooth, type Tramo5 } from './steps.ts'

const BG = new THREE.Color(COLOR.noche)
const FLOOR_Y = -1.6
const CHAIN_X = 16
const EVTOL_X = 32
const HOVER = { current: 0 }

type V3 = [number, number, number]
interface Shot {
  pos: V3
  look: V3
  column: boolean // texto a la izquierda: en pantallas anchas el sujeto va a la derecha
}
const CHARTS: Shot = { pos: [CHAIN_X, 9, 30], look: [CHAIN_X, 0, 0], column: false }
const SHOTS: Record<Tramo5, Shot> = {
  intro: { pos: [5.2, 2.4, 7.4], look: [0.2, 0, 0], column: true },
  turbofan: { pos: [3.6, 1.5, 6.6], look: [-0.1, -0.05, 0], column: true },
  hibrido: { pos: [CHAIN_X - 0.2, 3.0, 15.6], look: [CHAIN_X - 0.2, -0.6, 0], column: true },
  electrico: { pos: [CHAIN_X + 0.6, 2.2, 12.6], look: [CHAIN_X + 0.4, -0.6, 0], column: true },
  evtol: { pos: [EVTOL_X + 4.6, 4.4, 6.6], look: [EVTOL_X + 0.6, -0.1, 0], column: true },
  horizonte: CHARTS,
  segmentos: CHARTS,
}
const KEYS = (Object.keys(TRAMOS5) as Tramo5[]).map((k) => ({ at: (TRAMOS5[k][0] + TRAMOS5[k][1]) / 2, s: SHOTS[k] }))
const plateau = (p: number, t: Tramo5, e = 0.02) => smooth(p, TRAMOS5[t][0] - e, TRAMOS5[t][0] + e) * (1 - smooth(p, TRAMOS5[t][1] - e, TRAMOS5[t][1] + e))

export default function Scene5({ active }: { active: boolean }) {
  const { camera, scene, size } = useThree()
  const reduced = useUI((s) => s.reducedMotion)
  const config = useUI((s) => s.configuracion)
  const carrier = useUI((s) => s.portador)
  const running = active && !reduced
  const p = useRef(0)
  const fog = useMemo(() => new THREE.Fog(COLOR.noche, 1, 400), [])
  const floor = useTechFloorMaterial(18)
  const pos = useMemo(() => new THREE.Vector3(), [])
  const look = useMemo(() => new THREE.Vector3(), [])
  const a = useMemo(() => ({ pos: new THREE.Vector3(), look: new THREE.Vector3() }), [])
  const b = useMemo(() => ({ pos: new THREE.Vector3(), look: new THREE.Vector3() }), [])
  const offset = useMemo(() => new THREE.Vector3(), [])
  const fan = useMemo(() => ({ current: 1 }), [])
  const chain = useMemo<ChainRefs>(() => ({ gen: { current: 1 }, bat: { current: 1 }, main: { current: 1 }, genScale: { current: 1 } }), [])
  const subject = useRef<THREE.Group>(null!)

  const shot = (s: Shot, out: { pos: THREE.Vector3; look: THREE.Vector3 }, wide: boolean) => {
    out.pos.set(...s.pos)
    out.look.set(...s.look)
    if (s.column) {
      if (wide) {
        // El corrimiento crece con la distancia, para que el sujeto quede siempre a la derecha del texto.
        const d = out.pos.distanceTo(out.look)
        out.look.x -= d * 0.26
        out.pos.x -= d * 0.08
      } else {
        out.look.y -= 1.3
        out.pos.sub(out.look).multiplyScalar(1.5).add(out.look)
      }
    } else if (!wide) out.pos.multiplyScalar(1.25)
  }

  useFrame((_, dt) => {
    if (!active) return
    scene.background = BG
    scene.fog = fog
    p.current = reduced ? progress.s5 : THREE.MathUtils.damp(p.current, progress.s5, 5, dt)
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

    // Flujos: el turbofán brilla en su tramo; la cadena pasa de híbrido a eléctrico.
    fan.current = 0.35 + 0.65 * Math.max(plateau(t, 'intro'), plateau(t, 'turbofan'))
    const cruise = reduced ? 0 : hybridCruise(t)
    const electric = smooth(t, TRAMOS5.electrico[0] - 0.02, TRAMOS5.electrico[0] + 0.03)
    chain.genScale.current = 1 - electric
    chain.gen.current = 1 - electric
    chain.bat.current = Math.max(1 - cruise, electric)
    chain.main.current = 1

    // Detrás de los paneles del final, el 3D queda de fondo.
    const charts = Math.max(plateau(t, 'horizonte'), plateau(t, 'segmentos'))
    subject.current.visible = charts < 0.6
    const tr = transitionState('s5')
    if (!reduced) pos.add(offset.set(0, tr.arriving * 4, tr.arriving * 12 - tr.leaving * 6))
    fog.near = THREE.MathUtils.lerp(THREE.MathUtils.lerp(40, 8, charts), 0.5, tr.fog)
    fog.far = THREE.MathUtils.lerp(THREE.MathUtils.lerp(400, 40, charts), 1, tr.fog)
    camera.position.copy(pos)
    camera.lookAt(look)
  })

  return (
    <group visible={active}>
      <ambientLight intensity={0.25} />
      <directionalLight position={[6, 9, 8]} intensity={1.6} />
      <directionalLight position={[-6, 4, -6]} intensity={0.7} color="#7cc8ff" />
      <group ref={subject}>
        <Turbofan running={running} intensity={fan} />
        <group position-x={CHAIN_X}>
          <PowerChain refs={chain} running={running} />
        </group>
        <group position={[EVTOL_X, -0.3, 0]} rotation-y={-0.5}>
          <SafeBoundary fallback={<ParametricEVTOL config={config} carrier={carrier} running={running} phaseRef={HOVER} />}>
            <Suspense fallback={null}>
              <EvtolXray config={config} running={running} />
            </Suspense>
          </SafeBoundary>
        </group>
      </group>
      <TechFloor material={floor} y={FLOOR_Y} size={160} />
      <ContactShadows frames={active ? Infinity : 0} position={[CHAIN_X, FLOOR_Y + 0.01, 0]} scale={[80, 16]} opacity={0.5} blur={2.4} far={3} resolution={512} color="#000000" />
    </group>
  )
}
