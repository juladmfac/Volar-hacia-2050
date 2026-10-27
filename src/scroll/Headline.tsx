import { useEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { ui } from '../store.ts'

gsap.registerPlugin(SplitText)

interface HeadlineProps {
  as?: 'h1' | 'h2' | 'h3' | 'p'
  className?: string
  children: ReactNode
}

// Titular que entra palabra por palabra cuando su <Beat> se vuelve visible y sale al revés.
// Con movimiento reducido queda quieto.
export default function Headline({ as: Tag = 'h2', className = '', children }: HeadlineProps) {
  const ref = useRef<HTMLHeadingElement>(null!)

  useEffect(() => {
    if (ui.get().reducedMotion) return
    let split: SplitText | null = null
    let tl: gsap.core.Timeline | null = null
    let cancelled = false
    let shown = false
    const beat = ref.current.closest('[data-beat]') as HTMLElement | null
    const tick = () => {
      if (!tl) return
      const visible = beat ? Number(beat.style.opacity) > 0.5 : true
      if (visible !== shown) {
        shown = visible
        if (visible) tl.play()
        else tl.reverse()
      }
    }
    // Se divide recién con las fuentes cargadas, para que los cortes de línea sean los reales.
    document.fonts.ready.then(() => {
      if (cancelled) return
      split = SplitText.create(ref.current, { type: 'lines,words', mask: 'lines' })
      tl = gsap.timeline({ paused: true }).from(split.words, {
        yPercent: 120,
        duration: 0.9,
        ease: 'expo.out',
        stagger: 0.04,
      })
      gsap.ticker.add(tick)
    })
    return () => {
      cancelled = true
      gsap.ticker.remove(tick)
      tl?.kill()
      split?.revert()
    }
  }, [])

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  )
}
