import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import ProceduralCity from '../../three/city/ProceduralCity.tsx'
import Traffic from '../../three/city/Traffic.tsx'
import AirspaceLayer, { useAirspaceMaterial } from '../../three/city/AirspaceLayer.tsx'
import AircraftLights from '../../three/city/AircraftLights.tsx'
import SkyDome, { useSkyMaterial } from '../../three/city/SkyDome.tsx'
import { transitionState } from '../../three/transition.ts'
import { progress, useUI } from '../../store.ts'
import { COLOR } from '../../theme.ts'

// Cámara: arranca a nivel de calle y sube por encima de la capa de espacio aéreo bajo.
// Recorrido sobre la calle central (x = 0) para no atravesar edificios.
const POS = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 7, 285),
  new THREE.Vector3(0, 40, 240),
  new THREE.Vector3(0, 130, 215),
  new THREE.Vector3(60, 230, 240),
  new THREE.Vector3(110, 290, 250),
])
const LOOK = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 22, 150),
  new THREE.Vector3(0, 40, 80),
  new THREE.Vector3(0, 80, 0),
  new THREE.Vector3(0, 110, -40),
  new THREE.Vector3(0, 110, -60),
])
const BG = new THREE.Color(COLOR.noche)

const smooth = (a: number, b: number, x: number) => THREE.MathUtils.smoothstep(x, a, b)

export default function Scene1({ active }: { active: boolean }) {
  const { camera, scene } = useThree()
  const reduced = useUI((s) => s.reducedMotion)
  const p = useRef(0)
  const look = useMemo(() => new THREE.Vector3(), [])
  const fog = useMemo(() => new THREE.Fog('#0e0d16', 60, 520), [])
  const airspace = useAirspaceMaterial()
  const aircraftOpacity = useRef(0)
  const sky = useSkyMaterial()

  useFrame((_, dt) => {
    if (!active) return
    scene.background = BG
    scene.fog = fog
    // Con movimiento reducido la cámara salta entre cuatro posiciones fijas.
    const target = reduced ? Math.round(progress.s1 * 3) / 3 : progress.s1
    p.current = reduced ? target : THREE.MathUtils.damp(p.current, target, 4, dt)
    const t = p.current
    // Al irse, la cámara sigue subiendo y la ciudad se disuelve en la niebla.
    const tr = transitionState('s1')
    const rise = reduced ? 0 : tr.leaving
    camera.position.copy(POS.getPointAt(t)).add(look.set(0, rise * 140, rise * 60))
    camera.lookAt(LOOK.getPointAt(t, look).add(new THREE.Vector3(0, rise * 260, 0)))
    const near = 60 + t * 220
    const far = 520 + t * 600
    fog.near = THREE.MathUtils.lerp(near, 0.5, tr.fog)
    fog.far = THREE.MathUtils.lerp(far, 1, tr.fog)
    sky.uniforms.uFade.value = tr.fog
    airspace.uniforms.uOpacity.value = smooth(0.35, 0.6, t) * (1 - tr.fog)
    aircraftOpacity.current = smooth(0.5, 0.7, t) * (1 - tr.fog)
  })

  return (
    <group visible={active}>
      <SkyDome material={sky} />
      <ProceduralCity />
      <Traffic running={active && !reduced} />
      <AirspaceLayer material={airspace} />
      <AircraftLights opacityRef={aircraftOpacity} running={active && !reduced} />
    </group>
  )
}
