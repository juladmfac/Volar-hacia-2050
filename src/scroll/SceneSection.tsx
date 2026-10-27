import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import type { ReactNode } from 'react'
import { progress, ui, type SceneId } from '../store.ts'

gsap.registerPlugin(ScrollTrigger, useGSAP)

// Sección alta con un panel fijo (sticky). Mientras el panel está fijo,
// el scroll se traduce a progress[id] en 0..1. La escena activa cambia
// cuando la sección cruza el centro de la pantalla.
interface SceneSectionProps {
  id: SceneId
  heightVh: number
  label: string
  children: ReactNode
}

export default function SceneSection({ id, heightVh, label, children }: SceneSectionProps) {
  const ref = useRef<HTMLElement>(null!)

  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: ref.current,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          progress[id] = self.progress
        },
      })
      ScrollTrigger.create({
        trigger: ref.current,
        start: 'top center',
        end: 'bottom center',
        onToggle: (self) => self.isActive && ui.set({ activeScene: id }),
      })
    },
    { scope: ref },
  )

  return (
    <section id={id} ref={ref} aria-label={label} className="relative" style={{ height: `${heightVh}vh` }}>
      <div className="sticky top-0 h-screen overflow-hidden">{children}</div>
    </section>
  )
}
