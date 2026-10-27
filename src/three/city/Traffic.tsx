import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CITY } from '../../illustrative/values.ts'
import { rng } from '../rng.ts'
import { EXTENT, PITCH } from './layout.ts'

// Luces de autos sobre la grilla de calles (ilustrativo).
export default function Traffic({ running }: { running: boolean }) {
  const ref = useRef<THREE.InstancedMesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>>(null!)
  const cars = useMemo(() => {
    const r = rng(CITY.seed + 1)
    const streets = CITY.lots + 1
    return Array.from({ length: CITY.cars }, () => {
      const alongX = r() < 0.5
      const k = Math.floor(r() * streets) - CITY.lots / 2
      const dir = r() < 0.5 ? 1 : -1
      return { alongX, line: k * PITCH + dir * 0.9, dir, speed: 6 + r() * 10, phase: r() * EXTENT }
    })
  }, [])

  const tmp = useMemo(() => new THREE.Object3D(), [])
  const place = (t: number) => {
    cars.forEach((c, i) => {
      const s = (((c.phase + t * c.speed * c.dir) % EXTENT) + EXTENT) % EXTENT - EXTENT / 2
      if (c.alongX) {
        tmp.position.set(s, 0.5, c.line)
        tmp.rotation.set(0, Math.PI / 2, 0)
      } else {
        tmp.position.set(c.line, 0.5, s)
        tmp.rotation.set(0, 0, 0)
      }
      tmp.updateMatrix()
      ref.current.setMatrixAt(i, tmp.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  }

  useLayoutEffect(() => {
    const red = new THREE.Color('#ff3b30')
    const white = new THREE.Color('#fff4d6')
    // Mirando hacia -z: los que se alejan muestran luces traseras.
    cars.forEach((c, i) => ref.current.setColorAt(i, (c.alongX ? c.dir > 0 : c.dir < 0) ? red : white))
    ref.current.instanceColor!.needsUpdate = true
    place(0)
  }, [cars])

  useFrame(({ clock }) => {
    if (running) place(clock.elapsedTime)
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, cars.length]} frustumCulled={false}>
      <boxGeometry args={[0.7, 0.35, 1.8]} />
      <meshBasicMaterial toneMapped={false} blending={THREE.AdditiveBlending} transparent />
    </instancedMesh>
  )
}
