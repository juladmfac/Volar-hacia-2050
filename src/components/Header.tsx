import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useUI, type SceneId } from '../store.ts'
import { scrollToY } from '../scroll/smoothScroll.ts'

const NAV: { id: SceneId; n: string; label: string }[] = [
  { id: 's1', n: '01', label: 'Carril' },
  { id: 's2', n: '02', label: 'Energía' },
  { id: 's3', n: '03', label: 'Fuerzas' },
  { id: 's4', n: '04', label: 'Hangar' },
  { id: 's5', n: '05', label: 'Propulsión' },
  { id: 's6', n: '06', label: 'Ciudad y aeródromo' },
]

export default function Header() {
  const active = useUI((s) => s.activeScene)
  const bar = useRef<HTMLDivElement>(null!)

  useGSAP(() => {
    const tick = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      bar.current.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  })

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="flex items-center justify-between px-4 py-4 sm:px-6">
        <p className="leading-none">
          <span className="display text-[0.8125rem] tracking-[0.02em]">Volar en 2050</span>
          <span className="eyebrow ml-3 hidden sm:inline">investigación personal</span>
        </p>
        <nav aria-label="Escenas" className="pointer-events-auto flex gap-4 sm:gap-6">
          {NAV.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-current={active === s.id ? 'step' : undefined}
              onClick={() => {
                const el = document.getElementById(s.id)
                if (el) scrollToY(el.offsetTop)
              }}
              className={`font-mono text-[0.6875rem] tracking-[0.16em] uppercase transition-colors ${active === s.id ? 'text-tinta' : 'text-tenue hover:text-tinta'}`}
            >
              {s.n}
              <span className="ml-1.5 hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </nav>
      </div>
      <div className="h-px bg-linea">
        <div ref={bar} className="h-px origin-left bg-tinta/70" style={{ transform: 'scaleX(0)' }} />
      </div>
    </header>
  )
}
