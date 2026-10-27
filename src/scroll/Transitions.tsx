import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { enter, type SceneId } from '../store.ts'

// Mide el tramo entre escenas (desde que la siguiente asoma abajo hasta que queda fija).
// Las escenas 3D lo usan para disolverse en niebla mientras la cámara sigue moviéndose.
export default function Transitions({ sceneIds }: { sceneIds: SceneId[] }) {
  useGSAP(() => {
    sceneIds.slice(1).forEach((id) => {
      ScrollTrigger.create({
        trigger: `#${id}`,
        start: 'top bottom',
        end: 'top top',
        onUpdate: (self) => {
          enter[id] = self.progress
        },
      })
    })
  })
  return null
}
