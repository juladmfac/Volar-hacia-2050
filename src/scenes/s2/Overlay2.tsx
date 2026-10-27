import type { ReactNode } from 'react'
import Beat from '../../scroll/Beat.tsx'
import Headline from '../../scroll/Headline.tsx'
import DataValue from '../../components/DataValue.tsx'
import StatusBadge from '../../components/StatusBadge.tsx'
import ConflictNote from '../../components/ConflictNote.tsx'
import DraftTag from '../../components/DraftTag.tsx'
import IllustrativeTag from '../../components/IllustrativeTag.tsx'
import SinVerificar from '../../components/SinVerificar.tsx'
import ComparisonTable from '../../components/ComparisonTable.tsx'
import BarList, { type BarRow } from '../../components/charts/BarList.tsx'
import Footnotes, { useFootnotes } from '../../components/Footnotes.tsx'
import { energyCarriers, safData, type EnergyCarrier } from '../../data/load.ts'
import type { Field } from '../../data/resolve.ts'
import { CARRIER_TEXT, SAF_RUTAS, SAF_TEXT } from '../../content/es-AR.ts'
import { CARRIER_COLOR } from '../../theme.ts'
import { OTRAS, TRAMOS, otrasRange, type Tramo } from './steps.ts'

const SAF = CARRIER_COLOR.saf
// Tramos cortos: fundido breve para que cada bloque llegue a verse entero.
const FADE = 0.012

const column =
  'scrim-left absolute inset-x-0 bottom-10 max-h-[62vh] overflow-y-auto px-4 pb-6 pt-10 sm:bottom-0 sm:inset-y-0 sm:right-auto sm:flex sm:max-h-none sm:w-[min(44rem,58vw)] sm:flex-col sm:justify-center sm:overflow-visible sm:px-10 sm:pb-0'
const panel = 'absolute inset-0 flex items-center justify-center px-4 pb-16 pt-24 sm:px-10'
const card = 'w-full max-w-3xl max-h-full overflow-y-auto border hairline bg-noche/95 p-5 backdrop-blur-md sm:p-8'

function At({ t, className, children }: { t: Tramo; className: string; children: ReactNode }) {
  const [from, to] = TRAMOS[t]
  return (
    <Beat scene="s2" from={t === 'intro' ? -1 : from + 0.004} to={t === 'tabla' ? 2 : to - 0.004} fade={FADE} className={className}>
      {children}
    </Beat>
  )
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="eyebrow flex items-center gap-2">
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: SAF }} aria-hidden />
      {children}
    </p>
  )
}

function Spec({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 border-t hairline pt-3">
      <p className="eyebrow">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  )
}

// Bloque con sus propias notas de fuente.
function Sourced({ fields, children }: { fields: (Field | undefined)[]; children: (cite: ReturnType<typeof useFootnotes>['cite']) => ReactNode }) {
  const { notes, cite } = useFootnotes(fields)
  return (
    <>
      {children(cite)}
      <Footnotes notes={notes} className="mt-5" />
    </>
  )
}

const { produccion, capacidad, sobrecosto, precioRelativo, limiteMezcla, trl, eSaf, mandatos, metas, argentina } = safData
const p2026 = produccion.find((r) => r.anio === 2026)
const ultimoAnio = Math.max(...produccion.map((r) => r.anio))
const refuel = mandatos.find((m) => m.id === 'refueleu')

function Rutas() {
  return (
    <Sourced fields={[safData.rutasCertificadas, trl.maduras, trl.e_saf]}>
      {(cite) => (
        <>
          <ol className="mt-6 space-y-3">
            {SAF_RUTAS.map((r, i) => (
              <li key={r.id} className="grid grid-cols-[1.5rem_1fr] gap-x-2 text-[0.875rem]">
                <span className="font-mono text-tenue">{i + 1}</span>
                <span>
                  {r.nombre} <span className="font-mono text-[0.75rem] text-tenue">({r.nombre_en})</span>
                  <span className="block text-[0.8125rem] text-tenue">{r.insumo}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4">
            <Spec label="TRL, rutas maduras">
              <DataValue field={trl.maduras} cite={cite} variant="spec" />
            </Spec>
            <Spec label="TRL, e-SAF">
              <DataValue field={trl.e_saf} cite={cite} variant="spec" />
            </Spec>
            <Spec label="Rutas certificadas por ASTM">
              <DataValue field={safData.rutasCertificadas} cite={cite} variant="spec" />
            </Spec>
          </div>
        </>
      )}
    </Sourced>
  )
}

function Mezcla() {
  return (
    <Sourced fields={[limiteMezcla, trl.sin_mezcla]}>
      {(cite) => (
        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4">
          <Spec label="Tope de mezcla">
            <DataValue field={limiteMezcla} cite={cite} variant="spec" />
          </Spec>
          <Spec label="TRL, SAF sin mezcla">
            <DataValue field={trl.sin_mezcla} cite={cite} variant="spec" />
          </Spec>
        </div>
      )}
    </Sourced>
  )
}

function Pedido() {
  return (
    <Sourced fields={[...metas.map((m) => m.combustibles), p2026?.participacion]}>
      {(cite) => (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="border-t pt-3" style={{ borderColor: SAF }}>
            <p className="eyebrow">Lo que se le pide a los combustibles</p>
            <div className="mt-3 space-y-4">
              {metas.map((m) => (
                <div key={m.id}>
                  <p className="text-[0.8125rem] text-tenue">
                    {m.organismo} · {m.escenario}
                  </p>
                  <div className="mt-1">
                    <DataValue field={m.combustibles} cite={cite} variant="spec" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t hairline pt-3">
            <p className="eyebrow">Lo que hay: SAF en el combustible de aviación, {p2026?.anio ?? ultimoAnio} (proyección de IATA)</p>
            <div className="mt-3">
              <DataValue field={p2026?.participacion} cite={cite} variant="spec" />
            </div>
          </div>
        </div>
      )}
    </Sourced>
  )
}

function Produccion() {
  const rows = [
    ...produccion.map((r) => ({
      key: String(r.anio),
      label: String(r.anio),
      field: r.toneladas,
      proyectado: r.anio >= ultimoAnio,
      note: r.anio >= ultimoAnio ? 'proyección de IATA' : undefined,
    })),
    { key: 'capacidad', label: 'Capacidad instalada', field: capacidad, proyectado: true, note: 'proyectada a fin de año' },
  ]
  const shares = produccion.filter((r) => r.participacion.hasValue)
  return (
    <Sourced fields={[...produccion.flatMap((r) => [r.toneladas, r.participacion]), capacidad]}>
      {(cite) => (
        <>
          <div className="mt-6">
            <BarList rows={rows} color={SAF} cite={cite} label="Producción mundial de SAF por año y capacidad instalada" />
          </div>
          {shares.length > 0 && (
            <p className="mt-5 text-[0.8125rem] text-tenue">
              Parte del combustible de aviación:{' '}
              {shares.map((r, i) => (
                <span key={r.anio}>
                  {i > 0 && ' · '}
                  {r.anio}: <DataValue field={r.participacion} cite={cite} context={false} />
                </span>
              ))}
            </p>
          )}
          <div className="mt-3 space-y-1">
            {[...produccion.flatMap((r) => [r.toneladas, r.participacion])].map((f, i) => (
              <ConflictNote key={i} conflicts={f.conflicts} />
            ))}
          </div>
        </>
      )}
    </Sourced>
  )
}

function Mandato() {
  if (!refuel) return <SinVerificar />
  const cumplido = new Map(refuel.cumplimiento.map((c) => [c.anio, c.valor]))
  const rows = refuel.saf.flatMap((m) => {
    const out: BarRow[] = [{ key: `m${m.anio}`, label: `${m.anio} · mínimo`, field: m.valor, proyectado: m.anio > ultimoAnio }]
    const c = cumplido.get(m.anio)
    if (c) out.push({ key: `c${m.anio}`, label: `${m.anio} · entregado`, field: c, proyectado: false, note: 'en aeropuertos de la UE' })
    return out
  })
  return (
    <Sourced fields={[...refuel.saf.map((m) => m.valor), ...refuel.cumplimiento.map((m) => m.valor), ...refuel.sintetico.map((m) => m.valor)]}>
      {(cite) => (
        <>
          <p className="mt-2 font-mono text-[0.75rem] text-tenue">{refuel.norma}</p>
          <div className="mt-6">
            <BarList rows={rows} color={SAF} cite={cite} label="Mínimo de SAF exigido por ReFuelEU y SAF entregado" />
          </div>
          <div className="mt-6 border-t hairline pt-3">
            <p className="eyebrow">Dentro de ese mínimo, combustibles sintéticos (e-SAF)</p>
            <div className="mt-2 space-y-2 text-[0.8125rem]">
              {refuel.sintetico.map((s) => (
                <div key={s.anio} className="flex flex-wrap items-baseline gap-x-3">
                  <span className="w-12 font-mono text-tenue">{s.anio}</span>
                  <DataValue field={s.valor} cite={cite} context={false} />
                  <ConflictNote conflicts={s.valor.conflicts} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </Sourced>
  )
}

function Costo() {
  const rows = sobrecosto.map((s) => ({
    key: String(s.anio),
    label: String(s.anio),
    field: s.valor,
    proyectado: s.anio >= ultimoAnio,
    note: s.anio >= ultimoAnio ? 'proyección de IATA' : undefined,
  }))
  return (
    <Sourced fields={[precioRelativo, ...sobrecosto.map((s) => s.valor)]}>
      {(cite) => (
        <div className="mt-6 grid gap-6">
          <Spec label="Precio frente al combustible fósil">
            <DataValue field={precioRelativo} cite={cite} />
          </Spec>
          <Spec label="Lo que pagaron de más las aerolíneas">
            <BarList rows={rows} color={SAF} cite={cite} label="Sobrecosto del SAF para las aerolíneas por año" />
          </Spec>
        </div>
      )}
    </Sourced>
  )
}

function ESaf() {
  const rows = [
    { key: 'total', label: 'Todo el SAF', field: capacidad, proyectado: true, note: 'capacidad instalada' },
    { key: 'esaf', label: 'e-SAF', field: eSaf.capacidad, note: 'en operación o en construcción' },
  ]
  return (
    <Sourced fields={[capacidad, eSaf.capacidad, eSaf.plantas, eSaf.exigido2030]}>
      {(cite) => (
        <>
          <div className="mt-6">
            <BarList rows={rows} color={SAF} cite={cite} label="Capacidad de SAF y de e-SAF" />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4">
            <Spec label="Plantas de e-SAF operando">
              <DataValue field={eSaf.plantas} cite={cite} variant="spec" />
            </Spec>
            <Spec label="e-SAF exigido para 2030 (UE y Reino Unido)">
              <DataValue field={eSaf.exigido2030} cite={cite} variant="spec" />
            </Spec>
          </div>
        </>
      )}
    </Sourced>
  )
}

function CarrierData({ c }: { c: EnergyCarrier }) {
  const { notes, cite } = useFootnotes([c.energia_especifica, c.densidad_energetica_volumetrica, c.estado_uso_evtol])
  return (
    <>
      <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5">
        <Spec label="Energía específica">
          <DataValue field={c.energia_especifica} cite={cite} variant="spec" />
        </Spec>
        <Spec label="Densidad volumétrica">
          <DataValue field={c.densidad_energetica_volumetrica} cite={cite} variant="spec" />
        </Spec>
        <Spec label="Uso en eVTOL">
          <StatusBadge estado={c.estado_uso_evtol} />
        </Spec>
      </div>
      <ConflictNote conflicts={c.conflicts} />
      <Footnotes notes={notes} className="mt-5" />
    </>
  )
}

const otras = OTRAS.map((id) => energyCarriers.find((c) => c.id === id)).filter((c): c is EnergyCarrier => !!c)

export default function Overlay2() {
  return (
    <div className="relative h-full">
      <At t="intro" className={column}>
        <Eyebrow>02 — Energía</Eyebrow>
        <Headline className="display display-lg mt-4">La palanca más grande</Headline>
        <p className="mt-2 font-mono text-[0.75rem] text-tenue">(sustainable aviation fuel, SAF)</p>
        <div className="mt-6 space-y-3">
          {SAF_TEXT.queEs.map((t) => (
            <p key={t} className="body-copy">
              {t}
            </p>
          ))}
        </div>
        <DraftTag className="mt-3" />
      </At>

      <At t="rutas" className={column}>
        <Eyebrow>02 — Rutas de producción</Eyebrow>
        <Headline className="display display-md mt-4">Cuatro rutas, un mismo combustible</Headline>
        <p className="body-copy mt-5">{SAF_TEXT.rutas}</p>
        <Rutas />
      </At>

      <At t="mezcla" className={column}>
        <Eyebrow>02 — Mezcla</Eyebrow>
        <Headline className="display display-md mt-4">Mezclado, hasta un tope</Headline>
        <div className="mt-5 space-y-3">
          {SAF_TEXT.mezcla.map((t) => (
            <p key={t} className="body-copy">
              {t}
            </p>
          ))}
        </div>
        <Mezcla />
        <IllustrativeTag className="mt-4" detail={SAF_TEXT.mezclaNota} />
      </At>

      <At t="pedido" className={panel}>
        <div className={card}>
          <Eyebrow>02 — La brecha</Eyebrow>
          <Headline className="display display-md mt-3">{SAF_TEXT.pedido}</Headline>
          <p className="body-copy mt-4">{SAF_TEXT.pedidoCuerpo}</p>
          <Pedido />
        </div>
      </At>

      <At t="produccion" className={panel}>
        <div className={card}>
          <Eyebrow>02 — La brecha · producción</Eyebrow>
          <Headline className="display display-md mt-3">{SAF_TEXT.produccion}</Headline>
          <p className="body-copy mt-4">{SAF_TEXT.produccionCuerpo}</p>
          <Produccion />
        </div>
      </At>

      <At t="mandato" className={panel}>
        <div className={card}>
          <Eyebrow>02 — La brecha · mandatos</Eyebrow>
          <Headline className="display display-md mt-3">{SAF_TEXT.mandato}</Headline>
          <p className="body-copy mt-4">{SAF_TEXT.mandatoCuerpo}</p>
          <Mandato />
        </div>
      </At>

      <At t="costo" className={panel}>
        <div className={card}>
          <Eyebrow>02 — La brecha · costo</Eyebrow>
          <Headline className="display display-md mt-3">{SAF_TEXT.costo}</Headline>
          <p className="body-copy mt-4">{SAF_TEXT.costoCuerpo}</p>
          <Costo />
        </div>
      </At>

      <At t="esaf" className={column}>
        <Eyebrow>02 — e-SAF</Eyebrow>
        <Headline className="display display-md mt-4">{SAF_TEXT.esaf}</Headline>
        <p className="body-copy mt-5">{SAF_TEXT.esafCuerpo}</p>
        <ESaf />
      </At>

      <At t="argentina" className={column}>
        <Eyebrow>02 — Argentina</Eyebrow>
        <Headline className="display display-md mt-4">{SAF_TEXT.argentina}</Headline>
        <p className="body-copy mt-5">{SAF_TEXT.argentinaCuerpo}</p>
        <div className="mt-6 border-t hairline pt-3 text-[0.9375rem]">
          <DataValue field={argentina} />
        </div>
      </At>

      {otras.map((c, i) => {
        const [from, to] = otrasRange(i)
        return (
          <Beat key={c.id} scene="s2" from={from + 0.004} to={to - 0.004} fade={FADE} className={column}>
            <p className="eyebrow flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: CARRIER_COLOR[c.id] }} aria-hidden />
              02 — {SAF_TEXT.otras} · {i + 1} de {otras.length}
            </p>
            <Headline className="display display-md mt-4">{c.nombre}</Headline>
            <p className="mt-2 font-mono text-[0.75rem] text-tenue">({c.nombre_en})</p>
            {i === 0 && <p className="body-copy mt-5">{SAF_TEXT.otrasCuerpo}</p>}
            <div className="mt-4 space-y-3">
              {CARRIER_TEXT[c.id].map((t) => (
                <p key={t} className="body-copy">
                  {t}
                </p>
              ))}
            </div>
            <DraftTag className="mt-3" />
            <CarrierData c={c} />
          </Beat>
        )
      })}

      <At t="tabla" className="scrim-bottom absolute inset-x-0 bottom-0 px-4 pb-20 pt-24 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <p className="eyebrow">02 — Comparación</p>
          <Headline className="display display-md mt-3">Por kilo y por litro</Headline>
          <p className="body-copy mt-3">
            Solo se muestran valores con fuente; el resto queda sin verificar. Dos valores de una misma columna se comparan
            solo si coinciden la unidad y el nivel (celda, paquete o sustancia sin tanque).
          </p>
          <div className="mt-6">
            <ComparisonTable carriers={energyCarriers} />
          </div>
        </div>
      </At>
    </div>
  )
}
