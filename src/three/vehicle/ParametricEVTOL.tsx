import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Edges } from '@react-three/drei'
import gsap from 'gsap'
import * as THREE from 'three'
import { bladeGeometry, fuselageGeometry, wingGeometry } from './geometry.ts'
import { CONFIGS, type RotorSpec } from './params.ts'
import { CARRIER_COLOR } from '../../theme.ts'
import { ui, type Configuracion, type PortadorId } from '../../store.ts'

// eVTOL genérico y paramétrico: las tres configuraciones salen del mismo generador.
// `phaseRef.current` va de 0 (despegue vertical) a 2 (crucero).

type PhaseRef = { current: number }

const EDGE = '#9fb3cc'

function useMaterials() {
  return useMemo(
    () => ({
      piel: new THREE.MeshPhysicalMaterial({ color: '#e7ebf0', roughness: 0.38, metalness: 0.05, clearcoat: 0.7, clearcoatRoughness: 0.25 }),
      oscuro: new THREE.MeshPhysicalMaterial({ color: '#1a2230', roughness: 0.45, metalness: 0.6 }),
      vidrio: new THREE.MeshPhysicalMaterial({ color: '#0b1422', roughness: 0.05, metalness: 0.3, clearcoat: 1 }),
      pala: new THREE.MeshPhysicalMaterial({ color: '#2b3442', roughness: 0.35, metalness: 0.4 }),
    }),
    [],
  )
}

function Rotor({ spec, running, phaseRef, mats }: { spec: RotorSpec; running: boolean; phaseRef: PhaseRef; mats: ReturnType<typeof useMaterials> }) {
  const spin = useRef<THREE.Group>(null!)
  const disc = useRef<THREE.MeshBasicMaterial>(null!)
  const blade = useMemo(() => bladeGeometry(spec.blade), [spec.blade])
  useFrame((_, dt) => {
    const ph = phaseRef.current
    // Rotores de sustentación: se detienen en crucero. Hélice de empuje: arranca en transición.
    const on = running && (spec.kind === 'lift' ? ph < 1.6 : spec.kind === 'pusher' ? ph > 0.4 : true)
    if (on) spin.current.rotation.y += dt * 22 * spec.dir
    else spin.current.rotation.y = THREE.MathUtils.damp(spin.current.rotation.y, Math.round(spin.current.rotation.y / Math.PI) * Math.PI, 6, dt)
    disc.current.opacity = THREE.MathUtils.damp(disc.current.opacity, on ? 0.05 : 0, 8, dt)
  })
  return (
    <group>
      <group ref={spin}>
        {Array.from({ length: spec.blades }, (_, i) => (
          <mesh key={i} geometry={blade} material={mats.pala} rotation-y={(i * 2 * Math.PI) / spec.blades} />
        ))}
      </group>
      <mesh material={mats.oscuro} position-y={-0.06}>
        <cylinderGeometry args={[0.07, 0.09, 0.16, 16]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2}>
        <ringGeometry args={[spec.blade.radius * 0.2, spec.blade.radius, 48]} />
        <meshBasicMaterial ref={disc} color="#cfe0f5" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

interface Props {
  config: Configuracion
  carrier: PortadorId
  running: boolean
  phaseRef: PhaseRef
}

export default function ParametricEVTOL({ config, carrier, running, phaseRef }: Props) {
  const p = CONFIGS[config]
  const mats = useMaterials()
  const fuselage = useMemo(() => fuselageGeometry(p.fuselaje), [p.fuselaje])
  const wing = useMemo(() => (p.ala ? wingGeometry(p.ala) : null), [p.ala])
  const tail = useMemo(() => wingGeometry(p.cola.panel), [p.cola.panel])
  const tilts = useRef<(THREE.Group | null)[]>([])
  const parts = useRef<THREE.Group>(null!)

  // Rotores basculantes: giran de vertical a horizontal con la fase.
  useFrame(() => {
    const tilt = THREE.MathUtils.clamp(phaseRef.current / 2, 0, 1) * (Math.PI / 2)
    tilts.current.forEach((g) => g && (g.rotation.z = -tilt))
  })

  // Al cambiar de configuración, las piezas aparecen escalonadas.
  useLayoutEffect(() => {
    if (ui.get().reducedMotion) return
    const targets = parts.current.children.map((c) => c.scale)
    const tw = gsap.from(targets, { x: 0.001, y: 0.001, z: 0.001, duration: 0.7, ease: 'back.out(1.4)', stagger: 0.05 })
    return () => {
      tw.progress(1).kill()
    }
  }, [config])

  return (
    <group>
      <mesh geometry={fuselage} material={mats.piel}>
        <Edges threshold={40} color={EDGE} />
      </mesh>
      {/* cabina */}
      <mesh material={mats.vidrio} position={[p.fuselaje.length * 0.22, p.fuselaje.radius * 0.38, 0]} scale={[0.78, 0.32, 0.43]}>
        <sphereGeometry args={[1, 32, 16]} />
      </mesh>
      {/* portador de energía bajo el piso, con su color fijo */}
      <mesh position={[0, -p.fuselaje.radius * 0.82, 0]}>
        <boxGeometry args={[1.5, 0.06, 0.5]} />
        <meshStandardMaterial color={CARRIER_COLOR[carrier]} emissive={CARRIER_COLOR[carrier]} emissiveIntensity={1.1} toneMapped={false} />
      </mesh>
      {/* cola en V */}
      {[1, -1].map((s) => (
        <mesh key={s} geometry={tail} material={mats.piel} position={p.cola.pos} rotation-x={s * p.cola.angulo} scale={[1, 1, 0.5]}>
          <Edges threshold={25} color={EDGE} />
        </mesh>
      ))}

      <group ref={parts}>
        {wing && p.ala && (
          <mesh geometry={wing} material={mats.piel} position={p.ala.pos}>
            <Edges threshold={25} color={EDGE} />
          </mesh>
        )}
        {p.booms.map((b) => (
          <mesh key={b.z} material={mats.piel} position={[(b.x0 + b.x1) / 2, b.y, b.z]} rotation-z={Math.PI / 2}>
            <capsuleGeometry args={[0.08, b.x1 - b.x0, 6, 16]} />
          </mesh>
        ))}
        {p.brazos.map(([x, y, z]) => {
          const len = Math.hypot(x, z)
          return (
            <mesh key={`${x}${z}`} material={mats.oscuro} position={[x / 2, y, z / 2]} rotation={[0, Math.atan2(-z, x), Math.PI / 2]}>
              <cylinderGeometry args={[0.045, 0.06, len, 12]} />
            </mesh>
          )
        })}
        {p.rotores.map((r, i) => (
          <group key={i} position={r.pos}>
            {r.kind === 'tilt' ? (
              <group
                ref={(g) => {
                  tilts.current[i] = g
                }}
              >
                <mesh material={mats.piel} position-y={-0.12}>
                  <capsuleGeometry args={[0.09, 0.32, 6, 16]} />
                </mesh>
                <group position-y={0.18}>
                  <Rotor spec={r} running={running} phaseRef={phaseRef} mats={mats} />
                </group>
              </group>
            ) : (
              <group rotation-z={r.kind === 'pusher' ? Math.PI / 2 : 0}>
                <Rotor spec={r} running={running} phaseRef={phaseRef} mats={mats} />
              </group>
            )}
          </group>
        ))}
      </group>
    </group>
  )
}
