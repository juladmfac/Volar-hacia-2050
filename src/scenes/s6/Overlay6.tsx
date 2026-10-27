import type { ReactNode } from 'react'
import Beat from '../../scroll/Beat.tsx'
import Headline from '../../scroll/Headline.tsx'
import DataValue from '../../components/DataValue.tsx'
import DraftTag from '../../components/DraftTag.tsx'
import StatusBadge from '../../components/StatusBadge.tsx'
import SinVerificar from '../../components/SinVerificar.tsx'
import Footnotes, { useFootnotes } from '../../components/Footnotes.tsx'
import WingspanChart from '../../components/charts/WingspanChart.tsx'
import VertiportMap from '../../components/charts/VertiportMap.tsx'
import { FatoCalculator, PadCalculator, YearPanel } from '../../components/GroundTools.tsx'
import { aerodromo, ciudades, safData, tecnologias, type Tecnologia } from '../../data/load.ts'
import { S6_TEXT } from '../../content/es-AR.ts'
import { TRAMOS6, type Tramo6 } from './steps.ts'

const FADE = 0.01
const column =
  'scrim-left absolute inset-x-0 bottom-10 max-h-[62vh] overflow-y-auto px-4 pb-6 pt-10 sm:bottom-0 sm:inset-y-0 sm:right-auto sm:flex sm:max-h-none sm:w-[min(40rem,50vw)] sm:flex-col sm:justify-center-safe sm:overflow-y-auto sm:px-10 sm:py-24'
const panel = 'absolute inset-0 flex items-center justify-center px-4 pb-14 pt-20 sm:px-10'
const card = 'w-full max-w-5xl max-h-full overflow-y-auto border hairline bg-noche/95 p-5 backdrop-blur-md sm:p-8'

function At({ t, className, children }: { t: Tramo6; className: string; children: ReactNode }) {
  const [from, to] = TRAMOS6[t]
  return (
    <Beat scene="s6" from={t === 'intro' ? -1 : from + 0.004} to={t === 'argentina' ? 2 : to - 0.004} fade={FADE} className={className}>
      {children}
    </Beat>
  )
}

const tec = (id: string) => tecnologias.find((t) => t.id === id)
const some = <T,>(xs: (T | undefined)[]) => xs.filter((x): x is T => !!x)
const enTierra = some([tec('rodaje-con-remolcador-taxibot-hibrido-y-electrico'), tec('equipos-de-apoyo-en-tierra-electricos-egse')])
const refuel = safData.mandatos.find((m) => m.id === 'refueleu')

function Techs({ items }: { items: Tecnologia[] }) {
  const { notes, cite } = useFootnotes(items.map((t) => t.hito))
  return (
    <div className="mt-5 space-y-3">
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

function Mandato() {
  const exigido = refuel?.saf.find((d) => d.anio === 2025)?.valor
  const cumplido = refuel?.cumplimiento.find((d) => d.anio === 2025)?.valor
  const { notes, cite } = useFootnotes([exigido, cumplido])
  return (
    <div className="mt-5 grid grid-cols-2 gap-4 border-t hairline pt-3 text-[0.8125rem]">
      <div>
        <p className="eyebrow">{S6_TEXT.safExigido}, 2025</p>
        <div className="mt-1">
          <DataValue field={exigido} variant="spec" cite={cite} context={false} />
        </div>
      </div>
      <div>
        <p className="eyebrow">{S6_TEXT.safCumplido}, 2025</p>
        <div className="mt-1">
          <DataValue field={cumplido} variant="spec" cite={cite} context={false} />
        </div>
      </div>
      <Footnotes notes={notes} className="col-span-2" />
    </div>
  )
}

function Alas() {
  const a = aerodromo.ala
  const { notes, cite } = useFootnotes([a.vuelo, a.plegada, a.estado, a.norma, ...aerodromo.claves.flatMap((c) => [c.desde, c.hasta])])
  return (
    <>
      <div className="mt-5">
        <WingspanChart />
      </div>
      <div className="mt-3 space-y-3 text-[0.8125rem]">
        <p className="flex flex-wrap items-baseline gap-2">
          <span className="font-medium">{a.aeronave}</span>
          <StatusBadge estado={a.estado} />
        </p>
        <p className="text-tenue">{a.estado.contexto}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="eyebrow">Envergadura en vuelo</p>
            <div className="mt-1 text-tenue">
              <DataValue field={a.vuelo} cite={cite} />
            </div>
          </div>
          <div>
            <p className="eyebrow">Plegada</p>
            <div className="mt-1 text-tenue">
              <DataValue field={a.plegada} cite={cite} />
            </div>
          </div>
        </div>
        <div>
          <p className="eyebrow">{S6_TEXT.alasNorma}</p>
          <div className="mt-1 text-tenue">
            <DataValue field={a.norma} cite={cite} />
          </div>
        </div>
        <div>
          <p className="eyebrow">{S6_TEXT.alasAbierto}</p>
          <div className="mt-1 text-tenue">
            <DataValue field={a.abierto} cite={cite} />
          </div>
        </div>
      </div>
      <Footnotes notes={notes} className="mt-3" />
    </>
  )
}

function Normas() {
  const v = aerodromo.vertipuerto
  const { notes, cite } = useFootnotes([v.easa, v.faaMtow, v.faa, v.oaci])
  return (
    <div className="mt-5 space-y-3 text-[0.8125rem]">
      <div className="border-t hairline pt-3">
        <p className="font-medium">EASA · PTS-VPT-DSN</p>
        <div className="mt-1 text-tenue">
          <DataValue field={v.easa} cite={cite} />
        </div>
      </div>
      <div className="border-t hairline pt-3">
        <p className="font-medium">FAA · EB 105A</p>
        <div className="mt-1 text-tenue">
          <DataValue field={v.faa} cite={cite} />
        </div>
        <p className="mt-1 text-tenue">
          Peso máximo de despegue de la aeronave de referencia: <DataValue field={v.faaMtow} cite={cite} context={false} />
        </p>
      </div>
      <div className="border-t hairline pt-3">
        <p className="font-medium">OACI</p>
        <div className="mt-1 text-tenue">
          <DataValue field={v.oaci} cite={cite} />
        </div>
      </div>
      <Footnotes notes={notes} />
    </div>
  )
}

function OtrasCiudades() {
  const otras = ciudades.filter((c) => c.id !== 'sao_paulo')
  return (
    <div className="mt-8">
      <p className="eyebrow">{S6_TEXT.ciudadesOtras}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {otras.map((c) => (
          <div key={c.id} className="border hairline p-3 text-[0.8125rem]">
            <p className="font-medium">{c.nombre}</p>
            <p className="mt-1 text-tenue">
              Estado: <StatusBadge estado={c.estado} />
            </p>
            <p className="mt-1 text-tenue">
              Rol: {c.rol.hasValue ? String(c.rol.value) : <SinVerificar />}
            </p>
            <p className="mt-2 text-[0.75rem] text-tenue">Las fuentes consultadas se contradicen: queda sin verificar hasta contrastarlas.</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function Argentina() {
  const ar = aerodromo.argentina
  const { notes, cite } = useFootnotes([ar.anacRpas, ar.marcoEvtol])
  return (
    <>
      <div className="mt-6 grid gap-4 text-[0.8125rem] md:grid-cols-2">
        <div className="border-t hairline pt-3 text-tenue">
          <DataValue field={ar.anacRpas} cite={cite} />
        </div>
        <div className="border-t hairline pt-3 text-tenue">
          <DataValue field={ar.marcoEvtol} cite={cite} />
        </div>
      </div>
      <Footnotes notes={notes} className="mt-3" />
      <ol className="mt-6 list-decimal space-y-2 pl-5 text-[0.9375rem]">
        {S6_TEXT.preguntas.map((q) => (
          <li key={q}>{q}</li>
        ))}
      </ol>
    </>
  )
}

export default function Overlay6() {
  return (
    <div className="relative h-full">
      <At t="intro" className={column}>
        <p className="eyebrow">06 — Ciudad y aeródromo</p>
        <Headline className="display display-lg mt-4">{S6_TEXT.intro}</Headline>
        <p className="lede mt-6">{S6_TEXT.introCuerpo}</p>
        <DraftTag className="mt-3" />
      </At>

      <At t="saf" className={column}>
        <p className="eyebrow">06 — Nodo de SAF</p>
        <Headline className="display display-md mt-4">{S6_TEXT.saf}</Headline>
        <div className="mt-5 space-y-3">
          {S6_TEXT.safCuerpo.map((t) => (
            <p key={t} className="body-copy">
              {t}
            </p>
          ))}
        </div>
        <Mandato />
        <Techs items={enTierra} />
      </At>

      <At t="alas" className={column}>
        <p className="eyebrow">06 — Geometría</p>
        <Headline className="display display-md mt-4">{S6_TEXT.alas}</Headline>
        <p className="body-copy mt-5">{S6_TEXT.alasCuerpo}</p>
        <Alas />
      </At>

      <At t="vertipuerto" className={column}>
        <p className="eyebrow">06 — Vertipuerto</p>
        <Headline className="display display-md mt-4">{S6_TEXT.vertipuerto}</Headline>
        <p className="body-copy mt-5">{S6_TEXT.vertipuertoCuerpo}</p>
        <div className="mt-5">
          <FatoCalculator />
        </div>
        <Normas />
      </At>

      <At t="ciudades" className={panel}>
        <div className={card} data-lenis-prevent>
          <p className="eyebrow">06 — Ciudades</p>
          <Headline className="display display-md mt-3">{S6_TEXT.ciudades}</Headline>
          <p className="body-copy mt-4 max-w-3xl">{S6_TEXT.ciudadesCuerpo}</p>
          <p className="eyebrow mt-6">{S6_TEXT.ciudadesMapa}</p>
          <p className="mt-1 max-w-3xl text-[0.8125rem] text-tenue">{S6_TEXT.ciudadesCirculo}</p>
          <div className="mt-4">
            <VertiportMap />
          </div>
          <OtrasCiudades />
        </div>
      </At>

      <At t="anios" className={panel}>
        <div className={card} data-lenis-prevent>
          <p className="eyebrow">06 — Escenarios</p>
          <Headline className="display display-md mt-3">{S6_TEXT.anios}</Headline>
          <p className="body-copy mt-4 max-w-3xl">{S6_TEXT.aniosCuerpo}</p>
          <div className="mt-6">
            <YearPanel />
          </div>
        </div>
      </At>

      <At t="pad" className={panel}>
        <div className={card} data-lenis-prevent>
          <p className="eyebrow">06 — Capacidad de un pad</p>
          <Headline className="display display-md mt-3">{S6_TEXT.pad}</Headline>
          <p className="body-copy mt-4 max-w-3xl">{S6_TEXT.padCuerpo}</p>
          <div className="mt-6">
            <PadCalculator />
          </div>
        </div>
      </At>

      <At t="argentina" className={panel}>
        <div className={card} data-lenis-prevent>
          <p className="eyebrow">06 — Argentina</p>
          <Headline className="display display-md mt-3">{S6_TEXT.argentina}</Headline>
          <p className="body-copy mt-4 max-w-3xl">{S6_TEXT.argentinaCuerpo}</p>
          <Argentina />
        </div>
      </At>
    </div>
  )
}
