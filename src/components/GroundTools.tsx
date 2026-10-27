import { useState } from 'react'
import DataValue from './DataValue.tsx'
import Footnotes, { useFootnotes } from './Footnotes.tsx'
import IllustrativeTag from './IllustrativeTag.tsx'
import SinVerificar from './SinVerificar.tsx'
import TipoBadge from './TipoBadge.tsx'
import { tint } from './charts/ConvivenciaMatrix.tsx'
import { aerodromo, convivencia, safData } from '../data/load.ts'
import { areaSeguridad, ciclosPorHora, fatoMinima, ocupacion, type EtapasPad } from '../lib/pad.ts'
import { D_INICIAL, PAD_INICIAL } from '../illustrative/values.ts'
import { S6_TEXT } from '../content/es-AR.ts'

// Herramientas de la escena 6: año (2030 → 2050), FATO según D y capacidad de un pad.
// En las dos calculadoras los valores de entrada los elige el usuario: no son datos.

const HOY = 2026
const num = (n: number, d = 1) => n.toLocaleString('es-AR', { maximumFractionDigits: d })

function Range({ id, label, value, min, max, step = 1, unit, onChange }: { id: string; label: string; value: number; min: number; max: number; step?: number; unit: string; onChange: (v: number) => void }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="flex items-baseline justify-between gap-3 text-[0.8125rem]">
        <span>{label}</span>
        <span className="font-mono text-ilustrativo">
          {num(value)} {unit}
        </span>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 w-full accent-[var(--color-ilustrativo)]" />
    </div>
  )
}

const Elegidos = ({ detail = 'los valores los elegís vos, no son datos' }: { detail?: string }) => <IllustrativeTag detail={detail} />

// ---- Año ----

const ANIOS = [2030, 2035, 2040, 2045, 2050]
const refuel = safData.mandatos.find((m) => m.id === 'refueleu')

export function YearPanel() {
  const [i, setI] = useState(0)
  const anio = ANIOS[i]
  const exigido = refuel?.saf.find((d) => d.anio === anio)?.valor
  const { notes, cite } = useFootnotes([exigido])
  const proyectado = anio > HOY
  return (
    <div>
      <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
        <div className="min-w-[14rem] flex-1">
          <label htmlFor="s6-anio" className="eyebrow block">
            Año
          </label>
          <input
            id="s6-anio"
            type="range"
            min={0}
            max={ANIOS.length - 1}
            step={1}
            value={i}
            onChange={(e) => setI(Number(e.target.value))}
            aria-valuetext={String(anio)}
            className="mt-2 w-full accent-[var(--color-acento)]"
          />
          <div className="mt-1 flex justify-between font-mono text-[0.6875rem] text-tenue">
            {ANIOS.map((a) => (
              <span key={a}>{a}</span>
            ))}
          </div>
        </div>
        <p className="spec text-[clamp(2rem,4.2vw,3.25rem)]" aria-live="polite">
          {anio}
          {proyectado && <span className="ml-3 align-middle font-mono text-[0.75rem] tracking-[0.14em] text-tenue uppercase">○ proyectado</span>}
        </p>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <div className="border-t hairline pt-3 text-[0.8125rem]">
          <p className="eyebrow">{S6_TEXT.safExigido}</p>
          <p className="mt-1 text-tenue">{refuel?.norma}</p>
          <div className="mt-3" style={proyectado ? { outline: '1px dashed var(--color-linea)', outlineOffset: 6 } : undefined}>
            {exigido ? <DataValue field={exigido} variant="spec" cite={cite} context={false} /> : <SinVerificar />}
          </div>
          {!exigido && <p className="mt-2 text-[0.75rem] text-tenue">Sin valor cargado para este año: no se interpola.</p>}
          <Footnotes notes={notes} className="mt-3" />
        </div>
        <div className="border-t hairline pt-3">
          <p className="eyebrow">Vector energético dominante, escenario base</p>
          <ul className="mt-2 space-y-1.5 text-[0.8125rem]">
            {convivencia.map((s) => {
              const c = s.celdas.find((x) => x.anio === anio)?.valor
              const v = c?.hasValue ? String(c.value) : null
              return (
                <li key={s.id} className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)] items-center gap-3">
                  <span className="text-tenue">{s.nombre}</span>
                  {v && c?.tipo ? (
                    <span className="px-2 py-1 text-[0.75rem]" style={{ outline: `1px dashed ${tint(v)}88`, outlineOffset: -1, background: `color-mix(in srgb, ${tint(v)} 14%, transparent)` }}>
                      {v}
                      <TipoBadge tipo={c.tipo} />
                    </span>
                  ) : (
                    <SinVerificar />
                  )}
                </li>
              )
            })}
          </ul>
          <p className="mt-3 text-[0.75rem] text-tenue">Escenario base del Informe v04 (§3.6): especulación prospectiva del autor.</p>
        </div>
      </div>
    </div>
  )
}

// ---- FATO según D ----

export function FatoCalculator() {
  const [d, setD] = useState(D_INICIAL)
  const vp = aerodromo.vertipuerto
  const { notes, cite } = useFootnotes([vp.fatoD, vp.seguridadM, vp.seguridadD])
  const f = vp.fatoD.hasValue ? (vp.fatoD.value as number) : null
  const sm = vp.seguridadM.hasValue ? (vp.seguridadM.value as number) : null
  const sd = vp.seguridadD.hasValue ? (vp.seguridadD.value as number) : null
  return (
    <div className="border hairline p-4">
      <p className="eyebrow">{S6_TEXT.vertipuertoD}</p>
      <div className="mt-3">
        <Range id="s6-d" label="D de la aeronave" value={d} min={4} max={20} step={0.5} unit="m" onChange={setD} />
      </div>
      <dl className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 text-[0.8125rem]">
        <dt className="text-tenue">
          FATO, lado o diámetro mínimo (<DataValue field={vp.fatoD} cite={cite} context={false} />)
        </dt>
        <dd className="text-right font-mono text-ilustrativo">{f ? `${num(fatoMinima(d, f))} m` : <SinVerificar />}</dd>
        <dt className="text-tenue">
          Área de seguridad, ancho mínimo: el mayor entre <DataValue field={vp.seguridadM} cite={cite} context={false} /> y <DataValue field={vp.seguridadD} cite={cite} context={false} />
        </dt>
        <dd className="text-right font-mono text-ilustrativo">{sm && sd ? `${num(areaSeguridad(d, sm, sd))} m` : <SinVerificar />}</dd>
      </dl>
      <p className="mt-3 text-[0.75rem] text-tenue">{S6_TEXT.vertipuertoNota}</p>
      <Elegidos detail="el D lo elegís vos, no es dato; los factores sí lo son" />
      <Footnotes notes={notes} className="mt-3" />
    </div>
  )
}

// ---- Capacidad del pad ----

type Etapa = keyof EtapasPad
const ETAPAS = Object.keys(S6_TEXT.padEtapas) as Etapa[]

export function PadCalculator() {
  const [e, setE] = useState<EtapasPad>({ aproximacion: PAD_INICIAL.aproximacion, desembarque: PAD_INICIAL.desembarque, carga: PAD_INICIAL.carga, embarque: PAD_INICIAL.embarque, salida: PAD_INICIAL.salida })
  const [pads, setPads] = useState(PAD_INICIAL.pads)
  const t = ocupacion(e)
  const c = ciclosPorHora(e, pads)
  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <div className="space-y-3">
        {ETAPAS.map((k) => (
          <Range key={k} id={`s6-${k}`} label={S6_TEXT.padEtapas[k]} value={e[k]} min={0} max={30} unit="min" onChange={(v) => setE((x) => ({ ...x, [k]: v }))} />
        ))}
        <Range id="s6-pads" label="Pads" value={pads} min={1} max={4} unit="" onChange={setPads} />
      </div>
      <div className="border-t hairline pt-3" aria-live="polite">
        <p className="eyebrow">Con tus valores</p>
        <p className="spec mt-2 text-[clamp(2rem,4.2vw,3.25rem)] text-ilustrativo">{Number.isFinite(c) ? num(c) : '—'}</p>
        <p className="text-[0.8125rem] text-tenue">llegadas con su salida por hora</p>
        <p className="mt-3 text-[0.8125rem] text-tenue">
          Cada vehículo ocupa el pad <span className="font-mono text-ilustrativo">{num(t)} min</span>. Las etapas van en serie, sin esperas, demoras
          ni reglas de separación: es una cota de arriba, no una capacidad real.
        </p>
        <div className="mt-3">
          <Elegidos />
        </div>
      </div>
    </div>
  )
}
