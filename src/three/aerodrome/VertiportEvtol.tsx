import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { modelUrl, useModel } from '../hangar/HangarModel.tsx'
import type { Configuracion } from '../../store.ts'

// El eVTOL de Blender (con cabina) escalado para que su planta entre en un círculo de diámetro d:
// así el círculo D del pad es, por construcción, el de esta aeronave.
export default function VertiportEvtol({ config, running, d }: { config: Configuracion; running: boolean; d: number }) {
  const gltf = useModel(modelUrl(config))
  const { scene, scale, lift } = useMemo(() => {
    const scene = gltf.scene.clone(true)
    const box = new THREE.Box3().setFromObject(scene)
    const size = box.getSize(new THREE.Vector3())
    const scale = d / Math.hypot(size.x, size.z)
    return { scene, scale, lift: -box.min.y * scale }
  }, [gltf, d])
  const spins = useMemo(() => {
    const out: { node: THREE.Object3D; dir: number }[] = []
    scene.traverse((o) => {
      if (o.name.startsWith('spin_')) out.push({ node: o, dir: Number(o.name.split('_')[1]) % 2 === 0 ? 1 : -1 })
    })
    return out
  }, [scene])
  useFrame((_, dt) => {
    if (running) for (const s of spins) s.node.rotation.y += dt * 18 * s.dir
  })
  return (
    <group position-y={lift} scale={scale}>
      <primitive object={scene} />
    </group>
  )
}
