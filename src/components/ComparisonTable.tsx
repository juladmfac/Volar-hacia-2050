import DataValue from './DataValue.tsx'
import StatusBadge from './StatusBadge.tsx'
import Term from './Term.tsx'
import Footnotes, { useFootnotes } from './Footnotes.tsx'
import type { Field } from '../data/resolve.ts'
import type { EnergyCarrier } from '../data/load.ts'
import { CARRIER_COLOR } from '../theme.ts'

// Barra proporcional solo si hay al menos dos valores de la misma unidad en la columna.
function Bar({ field, column, color }: { field: Field; column: Field[]; color: string }) {
  const withValue = column.filter((f): f is Field<number> => f.hasValue && typeof f.value === 'number')
  const sameUnit = withValue.every((f) => f.unidad === withValue[0]?.unidad)
  if (!field.hasValue || typeof field.value !== 'number' || !sameUnit || withValue.length < 2) return null
  const max = Math.max(...withValue.map((f) => f.value as number))
  return <div className="mt-1.5 h-px" style={{ width: `${(field.value / max) * 100}%`, background: color }} />
}

export default function ComparisonTable({ carriers }: { carriers: EnergyCarrier[] }) {
  const esp = carriers.map((c) => c.energia_especifica)
  const vol = carriers.map((c) => c.densidad_energetica_volumetrica)
  const { notes, cite } = useFootnotes(carriers.flatMap((c) => [c.energia_especifica, c.densidad_energetica_volumetrica, c.estado_uso_evtol]))
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-[0.8125rem]">
          <thead>
            <tr className="border-b hairline">
              <th className="eyebrow py-2 pr-4 font-normal">Portador</th>
              <th className="eyebrow py-2 pr-4 font-normal">
                <Term es="Energía específica" en="specific energy" first />
              </th>
              <th className="eyebrow py-2 pr-4 font-normal">
                <Term es="Densidad volumétrica" en="volumetric energy density" first />
              </th>
              <th className="eyebrow py-2 font-normal">Uso en eVTOL</th>
            </tr>
          </thead>
          <tbody>
            {carriers.map((c) => (
              <tr key={c.id} className="border-b hairline align-top">
                <td className="py-3 pr-4">
                  <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: CARRIER_COLOR[c.id] }} aria-hidden />
                  {c.nombre}
                </td>
                <td className="py-3 pr-4">
                  <DataValue field={c.energia_especifica} cite={cite} context={false} />
                  <Bar field={c.energia_especifica} column={esp} color={CARRIER_COLOR[c.id]} />
                </td>
                <td className="py-3 pr-4">
                  <DataValue field={c.densidad_energetica_volumetrica} cite={cite} context={false} />
                  <Bar field={c.densidad_energetica_volumetrica} column={vol} color={CARRIER_COLOR[c.id]} />
                </td>
                <td className="py-3">
                  <StatusBadge estado={c.estado_uso_evtol} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Footnotes notes={notes} className="mt-3" />
    </div>
  )
}
