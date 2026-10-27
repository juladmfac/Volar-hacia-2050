import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import type { ReactNode } from 'react'
import { progress, ui, type SceneId } from '../store.ts'

// Bloque de texto visible entre `from` y `to` del progreso de su escena.
interface BeatProps {
  scene: SceneId
  from: number
  to: number
  className?: string
  // Duración del fundido, en fracción del progreso de la escena.
  fade?: number
  children: ReactNode
}

export default function Beat({ scene, from, to, className = '', fade = 0.04, children }: BeatProps) {
  const ref = useRef<HTMLDivElement>(null!)

  useGSAP(() => {
    const el = ref.current
    const tick = () => {
      const p = progress[scene]
      const a = Math.min(1, Math.max(0, (p - from) / fade, 0), Math.max(0, (to - p) / fade))
      const o = Math.max(0, Math.min(1, a))
      el.style.opacity = String(o)
      el.style.visibility = o === 0 ? 'hidden' : 'visible'
      el.style.transform = ui.get().reducedMotion ? 'none' : `translateY(${(1 - o) * 16}px)`
    }
    tick()
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  })

  return (
    <div ref={ref} data-beat className={className} style={{ opacity: 0 }}>
      {children}
    </div>
  )
}
