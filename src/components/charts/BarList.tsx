import { scaleLinear } from 'd3-scale'
import DataValue from '../DataValue.tsx'
import SinVerificar from '../SinVerificar.tsx'
import type { Cite } from '../Footnotes.tsx'
import type { Field } from '../../data/resolve.ts'

export interface BarRow {
  key: string
  label: string
  field: Field
  // Año futuro o proyección de la fuente: barra hueca y rayada, nunca igual a un valor medido.
  proyectado?: boolean
  note?: string
}

interface BarListProps {
  rows: BarRow[]
  color: string
  cite?: Cite
  // Etiqueta accesible del gráfico; el contenido ya es texto HTML.
  label: string
}

const num = (f: Field): f is Field<number> => f.hasValue && typeof f.value === 'number'

// Barras horizontales en HTML. Solo se dibujan si al menos dos valores comparten unidad;
// si no, se listan los valores sin barras. Un valor null es "sin verificar" y no tiene barra.
export default function BarList({ rows, color, cite, label }: BarListProps) {
  const valued = rows.map((r) => r.field).filter(num)
  const comparable = valued.length >= 2 && valued.every((f) => f.unidad === valued[0].unidad)
  const x = scaleLinear()
    .domain([0, Math.max(...valued.map((f) => f.value as number), 0)])
    .range([0, 100])

  return (
    <div role="group" aria-label={label} className="space-y-3">
      {rows.map((r) => (
        <div key={r.key} className="grid grid-cols-[minmax(5.5rem,11rem)_1fr_auto] items-center gap-x-3 gap-y-1 text-[0.8125rem] sm:gap-x-4">
          <div className="leading-tight">
            <span>{r.label}</span>
            {r.proyectado && <span className="ml-1.5 font-mono text-[0.625rem] uppercase tracking-wider text-tenue">proyectado</span>}
            {r.note && <span className="block text-[0.6875rem] text-tenue">{r.note}</span>}
          </div>
          <div className="min-w-0" aria-hidden>
            {num(r.field) && comparable && (
              <div
                className="h-3"
                style={{
                  width: `max(2px, ${x(r.field.value as number)}%)`,
                  ...(r.proyectado
                    ? { border: `1px dashed ${color}`, background: `repeating-linear-gradient(135deg, transparent 0 4px, color-mix(in srgb, ${color} 35%, transparent) 4px 6px)` }
                    : { background: color }),
                }}
              />
            )}
          </div>
          <span className="whitespace-nowrap">{r.field.hasValue ? <DataValue field={r.field} cite={cite} context={false} /> : <SinVerificar />}</span>
        </div>
      ))}
    </div>
  )
}
