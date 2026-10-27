import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CITY } from '../../illustrative/values.ts'
import { glowTexture } from '../glow.ts'
import { rng } from '../rng.ts'
import { EXTENT } from './layout.ts'

// Luces de navegación de aeronaves genéricas cruzando la capa (ilustrativo).
function Light({ color, size, offset }: { color: string; size: number; offset: [number, number, number] }) {
  return (
    <sprite position={offset} scale={size}>
      <spriteMaterial map={glowTexture()} color={color} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </sprite>
  )
}

interface AircraftLightsProps {
  opacityRef: { current: number }
  running: boolean
}

export default function AircraftLights({ opacityRef, running }: AircraftLightsProps) {
  const group = useRef<THREE.Group>(null!)
  const routes = useMemo(() => {
    const r = rng(CITY.seed + 2)
    return Array.from({ length: CITY.aircraft }, () => {
      const a = r() * Math.PI * 2
      return { a, offset: (r() - 0.5) * EXTENT * 0.5, speed: 10 + r() * 6, phase: r() * EXTENT, y: CITY.airspaceAltitude - 6 - r() * 10 }
    })
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    group.current.children.forEach((child, i) => {
      const rt = routes[i]
      const s = running ? ((((rt.phase + t * rt.speed) % EXTENT) + EXTENT) % EXTENT) - EXTENT / 2 : 0
      const dir = new THREE.Vector3(Math.cos(rt.a), 0, Math.sin(rt.a))
      const side = new THREE.Vector3(-dir.z, 0, dir.x)
      child.position.copy(dir.multiplyScalar(s * 0.6)).addScaledVector(side, rt.offset).setY(rt.y)
      child.rotation.y = -rt.a
      const strobe = running && Math.sin(t * 6 + i) > 0.92 ? 1 : 0.15
      const [red, green, white] = child.children as THREE.Sprite[]
      white.material.opacity = strobe * opacityRef.current
      red.material.opacity = opacityRef.current
      green.material.opacity = opacityRef.current
    })
  })

  return (
    <group ref={group}>
      {routes.map((_, i) => (
        <group key={i}>
          <Light color="#ff3b30" size={4} offset={[0, 0, -2.5]} />
          <Light color="#34c759" size={4} offset={[0, 0, 2.5]} />
          <Light color="#ffffff" size={7} offset={[0, 0.8, 0]} />
        </group>
      ))}
    </group>
  )
}
