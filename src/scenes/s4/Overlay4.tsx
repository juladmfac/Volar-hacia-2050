import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import Beat from '../../scroll/Beat.tsx'
import Headline from '../../scroll/Headline.tsx'
import Selector from '../../components/Selector.tsx'
import DraftTag from '../../components/DraftTag.tsx'
import IllustrativeTag from '../../components/IllustrativeTag.tsx'
import { CONFIG_TEXT, HOTSPOT_TEXT, VIEW_TEXT } from '../../content/es-AR.ts'
import { progress, ui, useUI, type Configuracion, type HangarView } from '../../store.ts'
import { setPageScroll } from '../../scroll/smoothScroll.ts'
import { HOTSPOTS, hotspotScreen } from '../../three/hangar/hotspots.ts'
import { GUIDED, INTRO_END } from './views.ts'

function Slider({ id, label, left, right, value, onChange }: { id: string; label: string; left: string; right: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="eyebrow mb-2 block">
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--color-acento)]"
      />
      <div className="mt-1 flex justify-between font-mono text-[0.6875rem] text-tenue">
        <span>{left}</span>
        <span>{right}</span>
      </div>
    </div>
  )
}

// Puntos numerados sobre el modelo: siguen la proyección que escribe la escena 3D.
function Pins() {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const hotspot = useUI((s) => s.hotspot)
  useGSAP(() => {
    const tick = () => {
      HOTSPOTS.forEach((id, i) => {
        const el = refs.current[i]
        const p = hotspotScreen[id]
        if (!el) return
        el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`
        el.style.opacity = p.visible ? '1' : '0'
        el.style.pointerEvents = p.visible ? 'auto' : 'none'
      })
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  })
  return (
    <div className="pointer-events-none fixed inset-0 z-30">
      {HOTSPOTS.map((id, i) => (
        <button
          key={id}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="button"
          aria-label={HOTSPOT_TEXT[id].titulo}
          aria-pressed={hotspot === id}
          onClick={() => ui.set({ hotspot: hotspot === id ? null : id })}
          className={`absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full border font-mono text-[0.6875rem] backdrop-blur transition-colors ${
            hotspot === id ? 'border-tinta bg-tinta text-noche' : 'border-tinta/60 bg-noche/60 text-tinta hover:bg-tinta/20'
          }`}
        >
          {i + 1}
        </button>
      ))}
    </div>
  )
}

function HangarUI() {
  // En celular el panel arranca plegado para que se vea el modelo.
  const [abierto, setAbierto] = useState(() => window.innerWidth >= 640)
  const explorar = useUI((s) => s.explorar)
  const vista = useUI((s) => s.vista)
  const config = useUI((s) => s.configuracion)
  const despiece = useUI((s) => s.despiece)
  const basculado = useUI((s) => s.basculado)
  const plano = useUI((s) => s.plano)
  const hotspot = useUI((s) => s.hotspot)
  const h = hotspot ? HOTSPOT_TEXT[hotspot] : null

  return (
    <>
      <Pins />
      {explorar && (
        <div className="fixed inset-x-0 top-16 z-30 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 font-mono text-[0.6875rem] text-tenue">
          <span>Arrastrá para girar · rueda o pellizco para acercar · clic derecho para desplazar</span>
          <button type="button" onClick={() => ui.set({ explorar: false })} className="uppercase tracking-[0.16em] text-tinta underline decoration-linea underline-offset-4">
            Volver al recorrido (Esc)
          </button>
        </div>
      )}

      {h && hotspot && (
        <section aria-label={h.titulo} className="fixed bottom-16 left-4 z-30 w-[min(24rem,calc(100vw-2rem))] border hairline bg-noche/90 p-4 backdrop-blur sm:left-10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow">
                {HOTSPOTS.indexOf(hotspot) + 1} · {h.fuerza}
              </p>
              <p className="display display-md mt-1">{h.titulo}</p>
            </div>
            <button type="button" aria-label="Cerrar" onClick={() => ui.set({ hotspot: null })} className="font-mono text-tenue hover:text-tinta">
              ✕
            </button>
          </div>
          <p className="body-copy mt-3">{h.cuerpo}</p>
          <DraftTag className="mt-3" />
        </section>
      )}

      <button
        type="button"
        aria-expanded={abierto}
        aria-controls="controles-hangar"
        onClick={() => setAbierto(!abierto)}
        className="eyebrow fixed bottom-16 right-4 z-30 border hairline bg-noche/80 px-3 py-2 backdrop-blur sm:hidden"
      >
        {abierto ? 'Ocultar controles' : 'Controles'}
      </button>
      <section
        id="controles-hangar"
        aria-label="Controles del hangar"
        className={`fixed bottom-28 right-4 z-30 max-h-[60vh] w-[min(24rem,calc(100vw-2rem))] gap-4 overflow-y-auto bg-noche/85 p-3 backdrop-blur sm:bottom-16 sm:right-10 sm:grid sm:max-h-none sm:overflow-visible sm:bg-transparent sm:p-0 sm:backdrop-blur-none ${abierto ? 'grid' : 'hidden'}`}
      >
        <button
          type="button"
          aria-pressed={explorar}
          onClick={() => ui.set({ explorar: !explorar })}
          className={`display py-3 text-[0.8125rem] tracking-[0.04em] transition-colors ${explorar ? 'bg-tinta text-noche' : 'border border-tinta text-tinta hover:bg-tinta hover:text-noche'}`}
        >
          {explorar ? 'Explorando · cámara libre' : 'Explorar el modelo'}
        </button>
        <Selector
          label="Vista"
          value={vista}
          onChange={(v: HangarView) => ui.set({ vista: v, explorar: true })}
          options={(Object.keys(VIEW_TEXT) as HangarView[]).map((id) => ({ id, label: VIEW_TEXT[id] }))}
        />
        <Selector
          label="Configuración"
          value={config}
          onChange={(v: Configuracion) => ui.set({ configuracion: v })}
          options={(Object.keys(CONFIG_TEXT) as Configuracion[]).map((id) => ({ id, label: CONFIG_TEXT[id].es }))}
        />
        <div className="grid grid-cols-2 gap-4">
          <Slider id="hangar-despiece" label="Despiece" left="armado" right="separado" value={despiece} onChange={(v) => ui.set({ despiece: v })} />
          {config !== 'multicoptero' ? (
            <Slider id="hangar-rotores" label="Rotores" left="despegue" right="crucero" value={basculado} onChange={(v) => ui.set({ basculado: v })} />
          ) : (
            <p className="text-[0.75rem] leading-snug text-tenue">El multicóptero vuela siempre con los mismos rotores.</p>
          )}
        </div>
        <Selector
          label="Representación"
          value={plano ? 'plano' : 'render'}
          onChange={(v: 'render' | 'plano') => ui.set({ plano: v === 'plano' })}
          options={[
            { id: 'render', label: 'render' },
            { id: 'plano', label: 'plano técnico' },
          ]}
        />
        <IllustrativeTag detail="arquetipo genérico, sin escala" />
      </section>
    </>
  )
}

export default function Overlay4() {
  const active = useUI((s) => s.activeScene === 's4')
  const explorar = useUI((s) => s.explorar)
  const [ready, setReady] = useState(false)

  // Los controles aparecen después de la portada de la escena.
  useGSAP(() => {
    const tick = () => {
      const r = progress.s4 > INTRO_END - 0.02
      setReady((prev) => (prev === r ? prev : r))
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  })

  // Explorar pausa el scroll de la página; salir de la escena o Esc lo devuelve.
  useEffect(() => {
    setPageScroll(!explorar)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && ui.set({ explorar: false })
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [explorar])
  useEffect(() => {
    if (!active && ui.get().explorar) ui.set({ explorar: false })
  }, [active])

  return (
    <div className="relative h-full">
      <Beat scene="s4" from={-1} to={INTRO_END} className="scrim-left absolute inset-0 flex flex-col justify-center px-4 sm:px-10">
        <p className="eyebrow">04 — Hangar</p>
        <Headline className="display display-xl mt-4 max-w-[11ch]">
          El <span className="normal-case">eVTOL,</span> de cerca
        </Headline>
        <p className="lede mt-6">
          Un arquetipo genérico, modelado en Blender. Giralo, miralo desde arriba y desarmalo para ver dónde actúa cada una de
          las 4 fuerzas.
        </p>
      </Beat>

      {GUIDED.map((g, i) => {
        const to = GUIDED[i + 1]?.at ?? 2
        return (
          <Beat key={g.at} scene="s4" from={Math.max(g.at, INTRO_END)} to={to} className="pointer-events-none absolute left-4 top-20 sm:left-10 sm:top-24">
            <p className="eyebrow">04 — Vista guiada</p>
            <p className="display display-md mt-2">{VIEW_TEXT[g.view]}</p>
          </Beat>
        )
      })}

      {active && ready && createPortal(<HangarUI />, document.body)}
    </div>
  )
}
