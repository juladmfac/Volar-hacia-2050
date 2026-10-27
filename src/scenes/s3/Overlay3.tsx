import { useState, type ReactNode } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import Beat from '../../scroll/Beat.tsx'
import Headline from '../../scroll/Headline.tsx'
import Term from '../../components/Term.tsx'
import DraftTag from '../../components/DraftTag.tsx'
import VehicleCards from '../../components/VehicleCards.tsx'
import Selector from '../../components/Selector.tsx'
import { energyCarriers } from '../../data/load.ts'
import { CARRIER_WEIGHT_TEXT, CONFIG_TEXT, FORCE_TEXT, PHASE_TEXT } from '../../content/es-AR.ts'
import {
  progress,
  ui,
  useUI,
  type Configuracion,
  type ForceId,
  type Fuerza,
  type PortadorId,
  type UIState,
} from '../../store.ts'
import { CARRIER_COLOR, FORCE_COLOR } from '../../theme.ts'
import { scrollToY } from '../../scroll/smoothScroll.ts'
import TechMap from '../../components/charts/TechMap.tsx'
import BreguetChart from '../../components/charts/BreguetChart.tsx'
import BarList from '../../components/charts/BarList.tsx'
import IllustrativeTag from '../../components/IllustrativeTag.tsx'
import Footnotes, { useFootnotes } from '../../components/Footnotes.tsx'
import { bateria } from '../../data/load.ts'
import { S3_TEXT } from '../../content/es-AR.ts'
import { FILTER_END, INTRO_END, TRAMOS3, phaseFromProgress, progressForPhase } from './phase.ts'

const FORCE_IDS: ForceId[] = ['peso', 'sustentacion', 'resistencia', 'empuje']

const panel = 'absolute inset-0 flex items-center justify-center px-4 pb-14 pt-20 sm:px-10'
const card = 'w-full max-w-6xl max-h-full overflow-y-auto border hairline bg-noche/95 p-5 backdrop-blur-md sm:p-8'

function CeldaPaquete() {
  const fields = [bateria.celda, bateria.paquete, ...bateria.escenarios.map((e) => e.paquete)]
  const { notes, cite } = useFootnotes(fields)
  const rows = [
    { key: 'celda', label: 'Celda anunciada', note: 'cifra de titular', field: bateria.celda },
    { key: 'paquete', label: 'Esa celda, como paquete', note: 'estimación del autor', field: bateria.paquete },
    ...bateria.escenarios.map((e) => ({ key: `e${e.alcanceKm}`, label: `Paquete para ${e.alcanceKm.toLocaleString('es-AR')} km`, field: e.paquete })),
  ]
  return (
    <>
      <div className="mt-6">
        <BarList rows={rows} color={CARRIER_COLOR.bateria} cite={cite} label="Energía específica de celda, de paquete y de paquete necesaria por alcance" />
      </div>
      <p className="mt-4 text-[0.8125rem] text-tenue">{S3_TEXT.celdaEscenarios}</p>
      <div className="mt-3 space-y-1 text-[0.75rem] text-tenue">
        {fields.map((f, i) => f.contexto && <p key={i}>{f.contexto}</p>)}
      </div>
      <Footnotes notes={notes} className="mt-5" />
    </>
  )
}

// Las fases se eligen moviendo el scroll: una sola fuente de verdad.
function goToPhase(i: number) {
  const el = document.getElementById('s3')
  if (!el) return
  const range = el.offsetHeight - window.innerHeight
  scrollToY(el.offsetTop + range * progressForPhase(i))
}

function Block({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <div className="border-t hairline pt-3">
      <p className="eyebrow">{title}</p>
      <div className="body-copy mt-1.5">{children}</div>
    </div>
  )
}

export default function Overlay3() {
  const fase = useUI((s) => s.fase)
  const fuerza = useUI((s) => s.fuerza)
  const config = useUI((s) => s.configuracion)
  const portador = useUI((s) => s.portador)
  // En celular arranca cerrada para que se vea el modelo.
  const [explicacion, setExplicacion] = useState(() => typeof window === 'undefined' || window.innerWidth >= 640)

  useGSAP(() => {
    const tick = () => {
      const f = Math.round(phaseFromProgress(progress.s3))
      if (f !== ui.get().fase) ui.set({ fase: f as UIState['fase'] })
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  })

  const phase = PHASE_TEXT[fase]
  const cfg = CONFIG_TEXT[config]
  const carrier = energyCarriers.find((c) => c.id === portador)!

  return (
    <div className="relative h-full">
      <Beat
        scene="s3"
        from={-1}
        to={INTRO_END}
        className="scrim-left absolute inset-0 z-10 flex flex-col justify-center px-4 sm:px-10"
      >
        <p className="eyebrow">03 — Fuerzas</p>
        <Headline className="display display-xl mt-4 max-w-[12ch]">El filtro de las 4 fuerzas</Headline>
        <p className="lede mt-6">
          Cada tecnología se mira con cuatro preguntas: cómo cambia el <Term es="peso" en="weight" first />, de dónde
          sale la <Term es="sustentación" en="lift" first />, cuánta <Term es="resistencia" en="drag" first /> aparece y
          quién genera el <Term es="empuje" en="thrust" first />.
        </p>
      </Beat>

      <Beat scene="s3" from={INTRO_END - 0.02} to={FILTER_END} fade={0.02} className="absolute inset-0">
        {/* Fase actual, grande, arriba a la izquierda */}
        <div className="pointer-events-none absolute left-4 top-20 sm:left-10 sm:top-24">
          <p className="eyebrow">03 — Fase de vuelo · {fase + 1} de 3</p>
          <p className="display display-md mt-2">{phase.es}</p>
          <p className="mt-1 font-mono text-[0.75rem] text-tenue">({phase.en})</p>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex max-h-[58vh] flex-col-reverse gap-6 overflow-y-auto px-4 pb-16 pt-6 scrim-bottom sm:max-h-none sm:flex-row sm:items-end sm:justify-between sm:overflow-visible sm:bg-none sm:px-10 sm:pb-16">
          <section aria-label="Explicación" className="min-w-0 sm:w-[26rem]">
            <button
              type="button"
              aria-expanded={explicacion}
              onClick={() => setExplicacion(!explicacion)}
              className="eyebrow mb-3 underline decoration-linea underline-offset-4 hover:text-tinta"
            >
              {explicacion ? 'Ocultar explicación' : 'Ver explicación'}
            </button>
            {explicacion && (
              <div className="space-y-3">
                <Block title={`Fase · ${phase.es}`}>{phase.body}</Block>
                <Block
                  title={
                    <>
                      Configuración · {cfg.es} <span className="normal-case tracking-normal">({cfg.en})</span>
                    </>
                  }
                >
                  {cfg.body}
                  <p className="eyebrow mt-3">Vehículos reales con esta configuración</p>
                  <VehicleCards config={config} />
                </Block>
                {fuerza !== 'todas' && (
                  <Block
                    title={
                      <>
                        Fuerza · {FORCE_TEXT[fuerza].es}{' '}
                        <span className="normal-case tracking-normal">({FORCE_TEXT[fuerza].en})</span>
                      </>
                    }
                  >
                    {FORCE_TEXT[fuerza].body}
                  </Block>
                )}
                <Block title={`Portador · ${carrier.nombre}`}>{CARRIER_WEIGHT_TEXT[portador]}</Block>
                <DraftTag />
              </div>
            )}
          </section>

          <section aria-label="Selectores" className="grid min-w-0 gap-4 sm:w-[24rem]">
            <Selector
              label="Fuerza"
              value={fuerza}
              onChange={(v: Fuerza) => ui.set({ fuerza: v })}
              options={[
                { id: 'todas' as Fuerza, label: 'todas' },
                ...FORCE_IDS.map((id) => ({ id, label: FORCE_TEXT[id].es, color: FORCE_COLOR[id] })),
              ]}
            />
            <Selector
              label="Fase de vuelo"
              value={String(fase)}
              onChange={(v: string) => goToPhase(Number(v))}
              options={PHASE_TEXT.map((p, i) => ({ id: String(i), label: p.es }))}
            />
            <Selector
              label="Configuración"
              value={config}
              onChange={(v: Configuracion) => ui.set({ configuracion: v })}
              options={(Object.keys(CONFIG_TEXT) as Configuracion[]).map((id) => ({ id, label: CONFIG_TEXT[id].es }))}
            />
            <Selector
              label="Portador de energía"
              value={portador}
              onChange={(v: PortadorId) => ui.set({ portador: v })}
              options={energyCarriers.map((c) => ({
                id: c.id,
                label: c.id === 'saf' ? 'SAF' : c.id === 'hibrido' ? 'híbrido' : c.nombre.toLowerCase(),
                color: CARRIER_COLOR[c.id],
              }))}
            />
          </section>
        </div>
      </Beat>

      <Beat scene="s3" from={TRAMOS3.mapa[0]} to={TRAMOS3.mapa[1]} fade={0.015} className={panel}>
        <div className={`${card} h-full sm:flex sm:flex-col sm:overflow-hidden`} data-lenis-prevent>
          <p className="eyebrow">03 — Mapa de tecnologías</p>
          <Headline className="display display-md mt-3">{S3_TEXT.mapa}</Headline>
          <p className="body-copy mt-3 max-w-3xl">{S3_TEXT.mapaCuerpo}</p>
          <p className="mt-2 text-[0.75rem] text-tenue">{S3_TEXT.mapaLeyenda}</p>
          <div className="mt-4 flex flex-col sm:min-h-0 sm:flex-1">
            <TechMap follow={fuerza} />
          </div>
        </div>
      </Beat>

      <Beat scene="s3" from={TRAMOS3.breguet[0]} to={TRAMOS3.breguet[1]} fade={0.015} className={panel}>
        <div className={`${card} max-w-4xl`}>
          <p className="eyebrow">03 — Breguet</p>
          <Headline className="display display-md mt-3">{S3_TEXT.breguet}</Headline>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_1.15fr] lg:items-center">
            <div className="space-y-3">
              {S3_TEXT.breguetCuerpo.map((t) => (
                <p key={t} className="body-copy">
                  {t}
                </p>
              ))}
              <p className="font-mono text-[0.75rem] leading-relaxed text-tenue">
                R = (V / (g·TSFC)) · (L/D) · ln(W₀/W₁)
                <br />R = E* · η · (1/g) · (L/D) · (m_bat / m_total)
              </p>
            </div>
            <BreguetChart />
          </div>
          <IllustrativeTag className="mt-4" detail={S3_TEXT.breguetNota} />
        </div>
      </Beat>

      <Beat scene="s3" from={TRAMOS3.celda[0]} to={2} fade={0.015} className={panel}>
        <div className={`${card} max-w-4xl`}>
          <p className="eyebrow">03 — Baterías</p>
          <Headline className="display display-md mt-3">{S3_TEXT.celda}</Headline>
          <div className="mt-4 space-y-3">
            {S3_TEXT.celdaCuerpo.map((t) => (
              <p key={t} className="body-copy">
                {t}
              </p>
            ))}
          </div>
          <CeldaPaquete />
        </div>
      </Beat>
    </div>
  )
}
