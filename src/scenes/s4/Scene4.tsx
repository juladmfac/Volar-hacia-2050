import { Suspense, useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import gsap from 'gsap'
import * as THREE from 'three'
import Cyclorama from '../../three/hangar/Cyclorama.tsx'
import HangarModel from '../../three/hangar/HangarModel.tsx'
import SafeBoundary from '../../three/SafeBoundary.tsx'
import ParametricEVTOL from '../../three/vehicle/ParametricEVTOL.tsx'
import { transitionState } from '../../three/transition.ts'
import { progress, useUI } from '../../store.ts'
import { guidedView, VIEWS } from './views.ts'
import { LIGHT_PROFILE } from '../../three/webgl.ts'

const FLOOR_Y = -0.92
const BG = new THREE.Color('#05070c')
const HOVER = { current: 0 }

export default function Scene4({ active }: { active: boolean }) {
  const { camera, scene, size } = useThree()
  const reduced = useUI((s) => s.reducedMotion)
  const explorar = useUI((s) => s.explorar)
  const vista = useUI((s) => s.vista)
  const config = useUI((s) => s.configuracion)
  const carrier = useUI((s) => s.portador)
  const controls = useRef<OrbitControlsImpl>(null!)
  const fog = useMemo(() => new THREE.Fog('#05070c', 1, 60), [])
  const look = useMemo(() => new THREE.Vector3(...VIEWS.tres_cuartos.look), [])
  const goal = useMemo(() => ({ pos: new THREE.Vector3(...VIEWS.tres_cuartos.pos), look: new THREE.Vector3(...VIEWS.tres_cuartos.look) }), [])
  const floor = useRef<THREE.Group>(null!)

  // En modo explorar, las vistas se animan con GSAP y la órbita queda libre.
  useEffect(() => {
    if (!active || !explorar) return
    const v = VIEWS[vista]
    const c = controls.current
    if (!c) return
    // En pantallas angostas la cámara se aleja para que entre el modelo completo.
    const far = size.width / size.height < 0.9 ? 1.7 : 1
    const [px, py, pz] = v.pos.map((x) => x * far)
    if (reduced) {
      camera.position.set(px, py, pz)
      c.target.set(...v.look)
      c.update()
      return
    }
    const tl = gsap.timeline({ onUpdate: () => c.update() })
    tl.to(camera.position, { x: px, y: py, z: pz, duration: 1.3, ease: 'power3.inOut' }, 0)
    tl.to(c.target, { x: v.look[0], y: v.look[1], z: v.look[2], duration: 1.3, ease: 'power3.inOut' }, 0)
    return () => {
      tl.kill()
    }
  }, [active, explorar, vista, camera, reduced, size])

  // En pantallas anchas el panel ocupa la derecha: se corre el encuadre para que el modelo quede a la izquierda.
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    if (active && size.width / size.height > 1.2) cam.setViewOffset(size.width, size.height, size.width * 0.12, 0, size.width, size.height)
    else cam.clearViewOffset()
    return () => cam.clearViewOffset()
  }, [active, camera, size])

  useFrame((_, dt) => {
    if (!active) return
    scene.background = BG
    scene.fog = fog
    const tr = transitionState('s4')
    fog.near = THREE.MathUtils.lerp(12, 0.5, tr.fog)
    fog.far = THREE.MathUtils.lerp(60, 1, tr.fog)
    // La vista inferior esconde el piso.
    const under = camera.position.y < FLOOR_Y + 0.2
    floor.current.visible = !under
    if (explorar) return

    // Recorrido guiado: la cámara va de una vista a otra según el scroll.
    const v = VIEWS[guidedView(progress.s4)]
    const k = reduced ? 1 : 1 - Math.exp(-dt * 2.2)
    const far = size.width / size.height < 0.9 ? 1.7 : 1
    goal.pos.set(...v.pos).multiplyScalar(far * (1 + (reduced ? 0 : tr.arriving * 1.2)))
    goal.look.set(...v.look)
    camera.position.lerp(goal.pos, k)
    look.lerp(goal.look, k)
    camera.lookAt(look)
    if (controls.current) controls.current.target.copy(look)
  })

  return (
    <group visible={active}>
      <ambientLight intensity={0.08} />
      {/* Foco cenital que arma la "isla" de luz, recorte trasero frío y relleno lateral. */}
      <spotLight position={[0, 9, 0]} angle={0.55} penumbra={1} intensity={140} distance={30} decay={2} color="#f2f5fa" />
      <directionalLight position={[-6, 3, -5]} intensity={1.4} color="#9cc8ff" />
      <directionalLight position={[6, 2.5, 4]} intensity={0.9} color="#ffe6cc" />
      {/* Si el modelo de Blender no carga, queda el eVTOL paramétrico de la escena 3. */}
      <SafeBoundary fallback={<ParametricEVTOL config={config} carrier={carrier} running={active && !reduced} phaseRef={HOVER} />}>
        <Suspense fallback={null}>
          <HangarModel config={config} running={active && !reduced} reduced={reduced} />
        </Suspense>
      </SafeBoundary>
      <group ref={floor}>
        <Cyclorama y={FLOOR_Y} color="#0c1017" />
        <ContactShadows frames={active ? Infinity : 0} position={[0, FLOOR_Y + 0.005, 0]} scale={14} opacity={0.75} blur={2.4} far={4} resolution={LIGHT_PROFILE ? 512 : 1024} color="#000000" />
      </group>
      <OrbitControls
        ref={controls}
        enabled={active && explorar}
        enableDamping
        dampingFactor={0.08}
        enablePan
        minDistance={3}
        maxDistance={18}
        makeDefault={false}
      />
    </group>
  )
}

