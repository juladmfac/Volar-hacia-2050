import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ui } from '../store.ts'

gsap.registerPlugin(ScrollTrigger)

let lenis: Lenis | null = null

// Scroll suave con Lenis, sincronizado con ScrollTrigger por el ticker de GSAP.
function startLenis() {
  lenis = new Lenis({ lerp: 0.12 })
  lenis.on('scroll', ScrollTrigger.update)
  const raf = (time: number) => lenis?.raf(time * 1000)
  gsap.ticker.add(raf)
  gsap.ticker.lagSmoothing(0)
  return () => {
    gsap.ticker.remove(raf)
    lenis?.destroy()
    lenis = null
  }
}

// Con movimiento reducido no hay Lenis; el cambio de preferencia se aplica en vivo.
export function setupMotionPreference() {
  const mm = gsap.matchMedia()
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    ui.set({ reducedMotion: false })
    return startLenis()
  })
  mm.add('(prefers-reduced-motion: reduce)', () => {
    ui.set({ reducedMotion: true })
  })
  return () => mm.revert()
}

// Pausa el scroll de la página (para explorar el modelo con la rueda y los gestos).
export function setPageScroll(enabled: boolean) {
  if (enabled) lenis?.start()
  else lenis?.stop()
  document.documentElement.style.overflow = enabled ? '' : 'hidden'
}

export function scrollToY(top: number) {
  if (lenis) lenis.scrollTo(top, { duration: 1.2 })
  else window.scrollTo({ top, behavior: 'auto' })
}
