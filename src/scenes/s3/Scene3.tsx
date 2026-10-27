import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ContactShadows } from '@react-three/drei'
import TechFloor, { useTechFloorMaterial } from '../../three/TechFloor.tsx'
import { transitionState } from '../../three/transition.ts'
import { COLOR } from '../../theme.ts'
import ParametricEVTOL from '../../three/vehicle/ParametricEVTOL.tsx'
import ForceArrow, { FORCE_COLOR, type ForceArrowHandle } from '../../three/forces/ForceArrow.tsx'
import { ARROW_SCALE, FORCES, WEIGHT_DROP, WING_SHARE } from '../../illustrative/values.ts'
import { progress, useUI, type Configuracion, type ForceId } from '../../store.ts'
import { atPhase, pastFilter, phaseFromProgress } from './phase.ts'

const BG = new THREE.Color(COLOR.noche)
const FLOOR_Y = -1.7
const STREAKS = 70
const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
const DOWN = v3(0, -1, 0)
const UPV = v3(0, 1, 0)
const FWD = v3(1, 0, 0)
const BACK = v3(-1, 0, 0)

// Origen de cada flecha según la configuración.
const ORIGINS: Record<Configuracion, { empuje: THREE.Vector3 }> = {
  multicoptero: { empuje: v3(0.4, 0.75, 0) },
  sustentacion_crucero: { empuje: v3(-2.3, 0.25, 0) },
  rotores_basculantes: { empuje: v3(1.0, 0.85, 0) },
}

interface StreaksProps {
  speedRef: { current: number }
  highlightRef: { current: number }
}

function Streaks({ speedRef, highlightRef }: StreaksProps) {
  const ref = useRef<THREE.InstancedMesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>>(null!)
  const seeds = useMemo(
    () => Array.from({ length: STREAKS }, (_, i) => [((i * 37) % 100) / 100, ((i * 53) % 100) / 100, ((i * 71) % 100) / 100]),
    [],
  )
  const tmp = useMemo(() => new THREE.Object3D(), [])
  const offset = useRef(0)
  useFrame((_, dt) => {
    offset.current += speedRef.current * dt * 14
    seeds.forEach(([a, b, c], i) => {
      const x = 8 - ((a * 16 + offset.current) % 16)
      tmp.position.set(x, -2 + b * 5, -4 + c * 8)
      tmp.scale.set(0.6 + speedRef.current * 1.6, 1, 1)
      tmp.updateMatrix()
      ref.current.setMatrixAt(i, tmp.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.material.opacity = speedRef.current * (0.25 + highlightRef.current * 0.5)
  })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, STREAKS]} frustumCulled={false}>
      <boxGeometry args={[1, 0.015, 0.015]} />
      <meshBasicMaterial color={FORCE_COLOR.resistencia} transparent depthWrite={false} toneMapped={false} />
    </instancedMesh>
  )
}

export default function Scene3({ active }: { active: boolean }) {
  const { camera, scene, size } = useThree()
  const reduced = useUI((s) => s.reducedMotion)
  const config = useUI((s) => s.configuracion)
  const carrier = useUI((s) => s.portador)
  const fuerza = useUI((s) => s.fuerza)
  const running = active && !reduced

  const phaseRef = useRef(0)
  const speedRef = useRef(0)
  const dragHighlight = useRef(0)
  const vehicle = useRef<THREE.Group>(null!)
  const subject = useRef<THREE.Group>(null!)
  const floor = useTechFloorMaterial(16)
  const fog = useMemo(() => new THREE.Fog(COLOR.noche, 1, 400), [])
  const gridOffset = useRef(0)
  const a = {
    peso: useRef<ForceArrowHandle>(null!),
    sustRotor: useRef<ForceArrowHandle>(null!),
    sustAla: useRef<ForceArrowHandle>(null!),
    empuje: useRef<ForceArrowHandle>(null!),
    resistencia: useRef<ForceArrowHandle>(null!),
  }
  const look = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock }, dt) => {
    if (!active) return
    scene.background = BG
    scene.fog = fog
    const target = phaseFromProgress(progress.s3)
    phaseRef.current = reduced ? target : THREE.MathUtils.damp(phaseRef.current, target, 5, dt)
    const ph = phaseRef.current
    const t = reduced ? 0 : clock.elapsedTime

    // Magnitudes relativas (ilustrativas). El peso baja solo si el portador se consume.
    const consumo = 1 - WEIGHT_DROP[carrier] * (ph / 2)
    const W = atPhase(FORCES.peso, ph) * consumo
    const L = atPhase(FORCES.sustentacion, ph) * consumo
    const share = atPhase(WING_SHARE[config], ph)
    const T = atPhase(FORCES.empuje, ph)
    const D = atPhase(FORCES.resistencia, ph)
    const op = (k: ForceId) => (fuerza === 'todas' || fuerza === k ? 1 : 0.1)
    const w = (k: ForceId) => (fuerza === k ? 1.5 : 1)

    a.peso.current.update(v3(0, -0.3, 0), DOWN, W * ARROW_SCALE, op('peso'), w('peso'))
    a.sustRotor.current.update(v3(share > 0 ? 0.35 : 0, 1.0, 0), UPV, L * (1 - share) * ARROW_SCALE, op('sustentacion'), w('sustentacion'))
    a.sustAla.current.update(v3(-0.35, 0.45, 0), UPV, L * share * ARROW_SCALE, op('sustentacion'), w('sustentacion'))
    a.empuje.current.update(ORIGINS[config].empuje, FWD, T * ARROW_SCALE, op('empuje'), w('empuje'))
    a.resistencia.current.update(v3(-1.5, -0.45, 0), BACK, D * ARROW_SCALE, op('resistencia'), w('resistencia'))

    // Velocidad de avance relativa: líneas de corriente y piso que se desplaza.
    speedRef.current = Math.min(1, ph / 2) * (running ? 1 : 0)
    dragHighlight.current = fuerza === 'resistencia' ? 1 : 0
    gridOffset.current = (gridOffset.current + speedRef.current * dt * 14) % 10
    floor.uniforms.uOffset.value = gridOffset.current

    // El multicóptero inclina la nariz para avanzar; las versiones con ala no lo necesitan.
    const pitch = config === 'multicoptero' ? -0.2 * Math.min(1, ph) : 0
    vehicle.current.rotation.z = pitch
    vehicle.current.position.y = Math.sin(t * 1.5) * 0.06 * (1 - Math.min(1, ph))

    const narrow = size.width / size.height < 0.9
    const ang = 0.32 + Math.sin(t * 0.15) * 0.1
    // Al entrar, la cámara se acerca desde lejos mientras la niebla se abre.
    const tr = transitionState('s3')
    const dist = (narrow ? 16 : 10.5) + (reduced ? 0 : tr.arriving * 14)
    camera.position.set(Math.sin(ang) * dist, 2.6 + (reduced ? 0 : tr.arriving * 3), Math.cos(ang) * dist)
    look.set(0.2, narrow ? -2.4 : 0.1, 0)
    // Después del filtro el eVTOL queda de fondo, detrás de los gráficos.
    const back = pastFilter(progress.s3)
    subject.current.visible = back < 0.5
    fog.near = THREE.MathUtils.lerp(THREE.MathUtils.lerp(40, 6, back), 0.5, tr.fog)
    fog.far = THREE.MathUtils.lerp(THREE.MathUtils.lerp(400, 30, back), 1, tr.fog)
    camera.lookAt(look)
  })

  return (
    <group visible={active}>
      <ambientLight intensity={0.2} />
      <directionalLight position={[6, 10, 6]} intensity={1.6} />
      <directionalLight position={[-6, 4, -6]} intensity={0.7} color="#7cc8ff" />
      <group ref={subject}>
        <group ref={vehicle}>
          <ParametricEVTOL config={config} carrier={carrier} running={running} phaseRef={phaseRef} />
        </group>
        <ForceArrow ref={a.peso} color={FORCE_COLOR.peso} />
        <ForceArrow ref={a.sustRotor} color={FORCE_COLOR.sustentacion} />
        <ForceArrow ref={a.sustAla} color={FORCE_COLOR.sustentacion} />
        <ForceArrow ref={a.empuje} color={FORCE_COLOR.empuje} />
        <ForceArrow ref={a.resistencia} color={FORCE_COLOR.resistencia} />
        <Streaks speedRef={speedRef} highlightRef={dragHighlight} />
      </group>
      <TechFloor material={floor} y={FLOOR_Y} size={60} />
      <ContactShadows frames={active ? Infinity : 0} position={[0, FLOOR_Y + 0.01, 0]} scale={12} opacity={0.6} blur={2.2} far={3} resolution={512} color="#000000" />
    </group>
  )
}
