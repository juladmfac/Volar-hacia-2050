import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FILL, modelUrl, useModel } from '../hangar/HangarModel.tsx'
import { CARRIER_COLOR } from '../../theme.ts'
import type { Configuracion } from '../../store.ts'

// El eVTOL de Blender en corte (escena 5): el casco y el vidrio pasan a "rayos X" y quedan a la
// vista la cabina (puesto de piloto, asientos), el paquete de batería bajo el piso y los motores.
const HULL = ['fuselaje', 'cabina', 'marco_cabina', 'ventanilla', 'puerta', 'manija', 'acento', 'luz_nariz']

export default function EvtolXray({ config, running }: { config: Configuracion; running: boolean }) {
  const gltf = useModel(modelUrl(config))
  const scene = useMemo(() => gltf.scene.clone(true), [gltf])
  const spins = useMemo(() => {
    const out: { node: THREE.Object3D; dir: number }[] = []
    scene.traverse((o) => {
      if (o.name.startsWith('spin_')) out.push({ node: o, dir: Number(o.name.split('_')[1]) % 2 === 0 ? 1 : -1 })
    })
    return out
  }, [scene])

  useEffect(() => {
    scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      if (HULL.some((h) => m.name.startsWith(h))) m.material = FILL
      const mats = Array.isArray(m.material) ? m.material : [m.material]
      for (const mat of mats)
        if (mat.name === 'energia') {
          const e = (mat as THREE.MeshStandardMaterial).clone()
          e.color.set(CARRIER_COLOR.bateria)
          e.emissive.set(CARRIER_COLOR.bateria)
          e.emissiveIntensity = 1.6
          m.material = e
        }
    })
  }, [scene])

  useFrame((_, dt) => {
    if (running) for (const s of spins) s.node.rotation.y += dt * 18 * s.dir
  })

  return <primitive object={scene} />
}
