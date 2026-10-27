import { useImperativeHandle, useMemo, useRef, type Ref } from 'react'
import { FORCE_COLOR } from '../../theme.ts'
import * as THREE from 'three'

export { FORCE_COLOR }

const UP = new THREE.Vector3(0, 1, 0)
const HEAD = 0.4

// Flecha de fuerza actualizada cada frame desde la escena (sin re-render).
// Se dibuja por encima de la aeronave para que nunca quede tapada.
export interface ForceArrowHandle {
  update(origin: THREE.Vector3, dir: THREE.Vector3, length: number, opacity: number, width?: number): void
}

interface ForceArrowProps {
  ref: Ref<ForceArrowHandle>
  color: string
}

export default function ForceArrow({ ref, color }: ForceArrowProps) {
  const group = useRef<THREE.Group>(null!)
  const shaft = useRef<THREE.Mesh>(null!)
  const head = useRef<THREE.Mesh>(null!)
  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({ color, transparent: true, depthTest: false, toneMapped: false }),
    [color],
  )

  useImperativeHandle(ref, () => ({
    update(origin, dir, length, opacity, width = 1) {
      const g = group.current
      g.visible = length > 0.05 && opacity > 0.01
      if (!g.visible) return
      g.position.copy(origin)
      g.quaternion.setFromUnitVectors(UP, dir)
      const body = Math.max(0.001, length - HEAD)
      shaft.current.scale.set(width, body, width)
      shaft.current.position.y = body / 2
      head.current.scale.setScalar(width)
      head.current.position.y = body + HEAD / 2
      mat.opacity = opacity
    },
  }))

  return (
    <group ref={group} renderOrder={10}>
      <mesh ref={shaft} material={mat} renderOrder={10}>
        <cylinderGeometry args={[0.055, 0.055, 1, 12]} />
      </mesh>
      <mesh ref={head} material={mat} renderOrder={10}>
        <coneGeometry args={[0.17, HEAD, 16]} />
      </mesh>
    </group>
  )
}
