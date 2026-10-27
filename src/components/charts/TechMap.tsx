import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { scaleLinear } from 'd3-scale'
import Selector from '../Selector.tsx'
import DataValue from '../DataValue.tsx'
import TipoBadge from '../TipoBadge.tsx'
import Footnotes, { useFootnotes } from '../Footnotes.tsx'
import { tecnologias, trlMin, type Tecnologia } from '../../data/load.ts'
import { TEMAS, type Tema } from '../../data/schema.ts'
import type { Field } from '../../data/resolve.ts'
import { TEMA_TEXT } from '../../content/es-AR.ts'
import { COLOR, FORCE_COLOR } from '../../theme.ts'

// Matriz de madurez: una fila por tecnología, una celda por año con su TRL.
// El color sigue el valor más bajo del rango (criterio de los informes Aviacion2050).
const color = scaleLinear<string>().domain([1, 5, 9]).range([COLOR.linea, '#3b6a8f', COLOR.acento]).clamp(true)
const ink = (trl: number) => (trl >= 7 ? COLOR.noche : COLOR.tinta)
const TEMA_COLOR: Partial<Record<Tema, string>> = FORCE_COLOR
const UMBRAL = 5
const ANIOS = tecnologias[0]?.proyeccion.map((p) => p.anio) ?? []
const ORDER = Object.fromEntries(TEMAS.map((t, i) => [t, i]))

function Cell({ field, proyectado }: { field: Field<string>; proyectado: boolean }) {
  const v = field.hasValue ? (field.value as string) : null
  const t = trlMin(v)
  if (t === null) return <span className="font-mono text-[0.6875rem] text-tenue">—</span>
  return (
    <span
      className="inline-flex h-7 w-12 items-center justify-center font-mono text-[0.75rem]"
      style={{
        background: color(t),
        color: ink(t),
        opacity: proyectado ? 0.82 : 1,
        outline: proyectado ? `1px dashed ${COLOR.tinta}55` : undefined,
        outlineOffset: -1,
      }}
      title={proyectado ? 'proyectado' : 'hoy'}
    >
      {v}
    </span>
  )
}

function Detail({ t }: { t: Tecnologia }) {
  const { notes, cite } = useFootnotes([t.hito])
  return (
    <div className="grid gap-4 py-3 text-[0.8125rem] sm:grid-cols-2">
      <div className="sm:col-span-2">
        <p className="eyebrow">Último hito verificado</p>
        <div className="mt-1">
          <DataValue field={t.hito} cite={cite} />
        </div>
      </div>
      <div>
        <p className="eyebrow">Mueve</p>
        <div className="mt-1">
          <DataValue field={t.mueve} context={false} />
        </div>
      </div>
      <div>
        <p className="eyebrow">Penaliza</p>
        <div className="mt-1">
          <DataValue field={t.penaliza} context={false} />
        </div>
      </div>
      <div className="sm:col-span-2">
        <p className="eyebrow">Ventana de TRL 9</p>
        <div className="mt-1">
          <DataValue field={t.ventana} context={false} />
          {t.ventana.incertidumbre && <span className="ml-2 text-tenue">incertidumbre {t.ventana.incertidumbre}</span>}
          {t.ventana.declarada && <span className="block text-tenue">Fecha que declara el desarrollador: {t.ventana.declarada}</span>}
        </div>
      </div>
      <Footnotes notes={notes} className="sm:col-span-2" />
    </div>
  )
}

// Marca de tipo de una columna: si todas las celdas comparten tipo, se muestra una vez en el encabezado.
function ColumnTipo({ fields }: { fields: Field[] }) {
  const tipos = [...new Set(fields.filter((f) => f.hasValue).map((f) => f.tipo))]
  return tipos.length === 1 && tipos[0] ? <TipoBadge tipo={tipos[0]} /> : null
}

// `follow`: el tema sigue al selector de fuerza del filtro cuando éste cambia.
export default function TechMap({ follow = 'todas' }: { follow?: Tema | 'todas' }) {
  const [tema, setTema] = useState<Tema | 'todas'>(follow)
  useEffect(() => setTema(follow), [follow])
  const [todas, setTodas] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const box = useRef<HTMLDivElement>(null)

  // La fila abierta sube al tope de la tabla para que se vea su detalle completo.
  useEffect(() => {
    const el = box.current
    const row = open && el?.querySelector<HTMLElement>(`[data-row="${open}"]`)
    if (!el || !row) return
    const head = el.querySelector('thead')?.getBoundingClientRect().height ?? 0
    if (el.scrollHeight > el.clientHeight + 1)
      el.scrollTop += row.getBoundingClientRect().top - el.getBoundingClientRect().top - head
  }, [open])

  const total = tecnologias.length
  const maduras = tecnologias.filter((t) => (trlMin(t.trlHoy.value as string | null) ?? 0) >= UMBRAL).length
  const rows = useMemo(
    () =>
      tecnologias
        .filter((t) => tema === 'todas' || t.tema === tema)
        .filter((t) => todas || (trlMin(t.trlHoy.value as string | null) ?? 0) >= UMBRAL)
        .sort(
          (a, b) =>
            (trlMin(b.trlHoy.value as string | null) ?? 0) - (trlMin(a.trlHoy.value as string | null) ?? 0) ||
            ORDER[a.tema] - ORDER[b.tema] ||
            a.nombre.localeCompare(b.nombre, 'es'),
        ),
    [tema, todas],
  )
  const cols = 3 + ANIOS.length + (tema === 'todas' ? 1 : 0)

  return (
    <div className="flex flex-col sm:min-h-0 sm:flex-1">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <Selector
          label="Tema"
          value={tema}
          onChange={(v) => {
            setTema(v)
            setOpen(null)
          }}
          options={[{ id: 'todas' as const, label: 'todos' }, ...TEMAS.map((id) => ({ id, label: TEMA_TEXT[id], color: TEMA_COLOR[id] }))]}
        />
        <label className="flex cursor-pointer items-center gap-2 text-[0.75rem] text-tenue">
          <input type="checkbox" checked={todas} onChange={(e) => setTodas(e.target.checked)} className="accent-[var(--color-acento)]" />
          incluir TRL menor a {UMBRAL}
        </label>
      </div>
      <p className="mt-3 font-mono text-[0.6875rem] text-tenue">
        {rows.length} en la tabla · {maduras} de {total} con TRL {UMBRAL} o más
      </p>

      <div ref={box} className="mt-3 overflow-x-auto border-t hairline sm:min-h-0 sm:flex-1 sm:overflow-auto" data-lenis-prevent>
        <table className="w-full min-w-[44rem] text-left text-[0.8125rem]">
          <thead className="sticky top-0 z-10 bg-noche">
            <tr className="border-b hairline">
              <th className="eyebrow py-2 pr-3 font-normal">Tecnología</th>
              {tema === 'todas' && <th className="eyebrow py-2 pr-3 font-normal">Tema</th>}
              <th className="eyebrow py-2 pr-2 font-normal">
                Hoy
                <ColumnTipo fields={rows.map((r) => r.trlHoy)} />
              </th>
              {ANIOS.map((a, i) => (
                <th key={a} className="eyebrow py-2 pr-2 font-normal">
                  {a}
                  <ColumnTipo fields={rows.map((r) => r.proyeccion[i].trl)} />
                </th>
              ))}
              <th className="eyebrow py-2 font-normal">
                TRL 9
                <ColumnTipo fields={rows.map((r) => r.ventana)} />
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => {
              const on = open === t.id
              return (
                <Fragment key={t.id}>
                  <tr data-row={t.id} className="cursor-pointer border-b hairline align-middle hover:bg-tinta/[0.03]" onClick={() => setOpen(on ? null : t.id)}>
                    <td className="py-2 pr-3">
                      <button type="button" aria-expanded={on} className="text-left leading-snug hover:text-tinta">
                        <span className="mr-1.5 font-mono text-tenue">{on ? '−' : '+'}</span>
                        {t.nombre}
                      </button>
                    </td>
                    {tema === 'todas' && (
                      <td className="py-2 pr-3 whitespace-nowrap text-tenue">
                        <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ background: TEMA_COLOR[t.tema] ?? COLOR.tenue }} aria-hidden />
                        {TEMA_TEXT[t.tema]}
                      </td>
                    )}
                    <td className="py-2 pr-2">
                      <Cell field={t.trlHoy as Field<string>} proyectado={false} />
                    </td>
                    {t.proyeccion.map((p) => (
                      <td key={p.anio} className="py-2 pr-2">
                        <Cell field={p.trl as Field<string>} proyectado />
                      </td>
                    ))}
                    <td className="py-2 whitespace-nowrap text-[0.75rem]">{t.ventana.hasValue ? String(t.ventana.value) : '—'}</td>
                  </tr>
                  {on && (
                    <tr className="border-b hairline">
                      <td colSpan={cols}>
                        <Detail t={t} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[0.625rem] text-tenue" aria-hidden>
        <span className="flex items-center gap-1">
          TRL
          {[1, 3, 5, 7, 9].map((n) => (
            <span key={n} className="inline-flex h-4 w-6 items-center justify-center" style={{ background: color(n), color: ink(n) }}>
              {n}
            </span>
          ))}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-4 w-6" style={{ background: color(6), opacity: 0.82, outline: `1px dashed ${COLOR.tinta}55`, outlineOffset: -1 }} />
          proyectado
        </span>
      </div>
    </div>
  )
}
