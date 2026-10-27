import { useState, type ReactNode } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import Beat from '../../scroll/Beat.tsx'
import Headline from '../../scroll/Headline.tsx'
import DataValue from '../../components/DataValue.tsx'
import DraftTag from '../../components/DraftTag.tsx'
import Selector from '../../components/Selector.tsx'
import VehicleCards from '../../components/VehicleCards.tsx'
import ConvivenciaMatrix from '../../components/charts/ConvivenciaMatrix.tsx'
import Footnotes, { useFootnotes } from '../../components/Footnotes.tsx'
import { programas, tecnologias, trlMin, type Programa, type Tecnologia } from '../../data/load.ts'
import { CONFIG_TEXT, S5_TEXT } from '../../content/es-AR.ts'
import { CARRIER_COLOR } from '../../theme.ts'
import { progress, ui, useUI, type Configuracion } from '../../store.ts'
import { TRAMOS5, hybridCruise, type Tramo5 } from './steps.ts'

const FADE = 0.012
const column =
  'scrim-left absolute inset-x-0 bottom-10 max-h-[62vh] overflow-y-auto px-4 pb-6 pt-10 sm:bottom-0 sm:inset-y-0 sm:right-auto sm:flex sm:max-h-none sm:w-[min(40rem,50vw)] sm:flex-col sm:justify-center-safe sm:overflow-y-auto sm:px-10 sm:py-24'
const panel = 'absolute inset-0 flex items-center justify-center px-4 pb-14 pt-20 sm:px-10'
const card = 'w-full max-w-5xl max-h-full overflow-y-auto border hairline bg-noche/95 p-5 backdrop-blur-md sm:p-8'

function At({ t, className, children }: { t: Tramo5; className: string; children: ReactNode }) {
  const [from, to] = TRAMOS5[t]
  return (
    <Beat scene="s5" from={t === 'intro' ? -1 : from + 0.004} to={t === 'segmentos' ? 2 : to - 0.004} fade={FADE} className={className}>
      {children}
    </Beat>
  )
}

const prog = (id: string) => programas.find((p) => p.id === id)
const tec = (id: string) => tecnologias.find((t) => t.id === id)
const some = <T,>(xs: (T | undefined)[]) => xs.filter((x): x is T => !!x)

// Programa del relevamiento de propulsión: hito, próximo hito declarado y TRL.
function Programs({ items }: { items: Programa[] }) {
  const { notes, cite } = useFootnotes(items.flatMap((p) => [p.hito, p.proximo]))
  return (
    <div className="mt-6 space-y-4">
      {items.map((p) => (
        <div key={p.id} className="border-t hairline pt-3 text-[0.8125rem]">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-medium text-tinta">{p.nombre}</p>
            <span className="shrink-0 font-mono text-[0.75rem] text-tenue">
              TRL <DataValue field={p.trl} context={false} />
            </span>
          </div>
          <div className="mt-1 text-tenue">
            <DataValue field={p.hito} cite={cite} context={false} />
          </div>
          {p.proximo.hasValue && (
            <p className="mt-1 text-[0.75rem] text-tenue">
              Próximo, declarado por el desarrollador: <DataValue field={p.proximo} cite={cite} context={false} />
            </p>
          )}
        </div>
      ))}
      <Footnotes notes={notes} className="mt-2" />
    </div>
  )
}

// Tecnologías del mapa: TRL de hoy y último hito.
function Techs({ items }: { items: Tecnologia[] }) {
  const { notes, cite } = useFootnotes(items.map((t) => t.hito))
  return (
    <div className="mt-6 space-y-4">
      {items.map((t) => (
        <div key={t.id} className="border-t hairline pt-3 text-[0.8125rem]">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-medium text-tinta">{t.nombre}</p>
            <span className="shrink-0 font-mono text-[0.75rem] text-tenue">
              TRL <DataValue field={t.trlHoy} context={false} />
            </span>
          </div>
          <div className="mt-1 text-tenue">
            <DataValue field={t.hito} cite={cite} context={false} />
          </div>
        </div>
      ))}
      <Footnotes notes={notes} className="mt-2" />
    </div>
  )
}

// Esquema de la cadena de potencia en HTML (lo mismo que muestra el 3D).
function Chain({ gen, bat }: { gen: boolean; bat: boolean }) {
  const node = (label: string, on: boolean, color: string) => (
    <span
      className="inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-[0.6875rem] transition-opacity"
      style={{ borderColor: on ? color : 'var(--color-linea)', opacity: on ? 1 : 0.35 }}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: color }} aria-hidden />
      {label}
    </span>
  )
  const arrow = <span className="text-tenue" aria-hidden>→</span>
  return (
    <div className="mt-5 flex flex-wrap items-center gap-2" role="img" aria-label={`Cadena de potencia: ${[gen && 'turbogenerador', bat && 'batería'].filter(Boolean).join(' y ')} hacia inversor, motor y hélice`}>
      {node('turbogenerador', gen, CARRIER_COLOR.hibrido)}
      {node('batería', bat, CARRIER_COLOR.bateria)}
      {arrow}
      {node('inversor', true, '#7cc8ff')}
      {arrow}
      {node('motor eléctrico', true, '#e9edf3')}
      {arrow}
      {node('hélice o rotor', true, '#e9edf3')}
    </div>
  )
}

function HybridPhase() {
  const [cruise, setCruise] = useState(false)
  useGSAP(() => {
    const tick = () => {
      const c = hybridCruise(progress.s5) > 0.5
      setCruise((prev) => (prev === c ? prev : c))
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  })
  return (
    <>
      <p className="eyebrow mt-6" aria-live="polite">
        {cruise ? S5_TEXT.hibridoFase.crucero : S5_TEXT.hibridoFase.despegue}
      </p>
      <Chain gen bat={!cruise} />
    </>
  )
}

const turbofan = some([prog('pratt-whitney-gtf-advantage'), prog('rolls-royce-ultrafan-80')])
const hibridos = some([prog('ge-aerospace-nasa-epfd-saab-340b-hibrido'), prog('rtx-p-wc-dash-8-100-hibrido'), prog('heart-es-36-hibrido-en-serie-36-plazas'), prog('electra-el2-hibrido-despegue-ultracorto')])
const electricos = some([tec('motor-electrico-certificado-safran-engineus-100'), tec('avion-electrico-de-baterias-liviano-pipistrel-velis-elec'), tec('avion-electrico-de-baterias-utilitario-beta-alia-cx300'), tec('regional-electrico-de-baterias-eviation-alice')])
const regional = tec('hibrido-electrico-regional')
const horizonte = tecnologias
  .filter((t) => (t.tema === 'empuje' || t.tema === 'energia') && (trlMin(t.trlHoy.value as string | null) ?? 9) < 5)
  .sort((a, b) => (trlMin(b.trlHoy.value as string | null) ?? 0) - (trlMin(a.trlHoy.value as string | null) ?? 0))

export default function Overlay5() {
  const config = useUI((s) => s.configuracion)
  return (
    <div className="relative h-full">
      <At t="intro" className={column}>
        <p className="eyebrow">05 — Propulsión</p>
        <Headline className="display display-lg mt-4">{S5_TEXT.intro}</Headline>
        <p className="mt-2 font-mono text-[0.75rem] text-tenue">(powertrain)</p>
        <p className="lede mt-6">{S5_TEXT.introCuerpo}</p>
        <DraftTag className="mt-3" />
      </At>

      <At t="turbofan" className={column}>
        <p className="eyebrow">05 — Turbofán</p>
        <Headline className="display display-md mt-4">{S5_TEXT.turbofan}</Headline>
        <div className="mt-5 space-y-3">
          {S5_TEXT.turbofanCuerpo.map((t) => (
            <p key={t} className="body-copy">
              {t}
            </p>
          ))}
        </div>
        <Programs items={turbofan} />
      </At>

      <At t="hibrido" className={column}>
        <p className="eyebrow">05 — Híbrido-eléctrico</p>
        <Headline className="display display-md mt-4">{S5_TEXT.hibrido}</Headline>
        <p className="body-copy mt-5">{S5_TEXT.hibridoCuerpo}</p>
        {regional && (
          <p className="mt-3 text-[0.8125rem] text-tenue">
            Híbrido-eléctrico regional, TRL de hoy: <DataValue field={regional.trlHoy} context={false} />
          </p>
        )}
        <HybridPhase />
        <Programs items={hibridos} />
      </At>

      <At t="electrico" className={column}>
        <p className="eyebrow">05 — Eléctrico</p>
        <Headline className="display display-md mt-4">{S5_TEXT.electrico}</Headline>
        <p className="body-copy mt-5">{S5_TEXT.electricoCuerpo}</p>
        <Chain gen={false} bat />
        <Techs items={electricos} />
      </At>

      <At t="evtol" className={column}>
        <p className="eyebrow">05 — eVTOL</p>
        <Headline className="display display-md mt-4">{S5_TEXT.evtol}</Headline>
        <p className="body-copy mt-5">{S5_TEXT.evtolCuerpo}</p>
        <div className="mt-6">
          <Selector
            label="Configuración"
            value={config}
            onChange={(v: Configuracion) => ui.set({ configuracion: v })}
            options={(Object.keys(CONFIG_TEXT) as Configuracion[]).map((id) => ({ id, label: CONFIG_TEXT[id].es }))}
          />
        </div>
        <p className="body-copy mt-4">{CONFIG_TEXT[config].body}</p>
        <p className="eyebrow mt-5">Vehículos reales con esta configuración</p>
        <VehicleCards config={config} />
      </At>

      <At t="horizonte" className={panel}>
        <div className={card}>
          <p className="eyebrow">05 — En el horizonte · TRL menor a 5</p>
          <Headline className="display display-md mt-3">{S5_TEXT.horizonte}</Headline>
          <p className="body-copy mt-4 max-w-3xl">{S5_TEXT.horizonteCuerpo}</p>
          <Techs items={horizonte} />
        </div>
      </At>

      <At t="segmentos" className={panel}>
        <div className={card}>
          <p className="eyebrow">05 — Segmentos</p>
          <Headline className="display display-md mt-3">{S5_TEXT.segmentos}</Headline>
          <p className="body-copy mt-4 max-w-3xl">{S5_TEXT.segmentosCuerpo}</p>
          <div className="mt-6">
            <ConvivenciaMatrix />
          </div>
          <p className="mt-3 text-[0.75rem] text-tenue">Escenario base del Informe v04 (§3.6). Todo es proyectado: especulación prospectiva del autor.</p>
        </div>
      </At>
    </div>
  )
}
