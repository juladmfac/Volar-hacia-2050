import DataValue from './DataValue.tsx'
import StatusBadge from './StatusBadge.tsx'
import Footnotes, { useFootnotes } from './Footnotes.tsx'
import { vehicles, type Vehicle } from '../data/load.ts'
import type { Configuracion } from '../store.ts'

function VehicleCard({ v }: { v: Vehicle }) {
  const { notes, cite } = useFootnotes([v.configuracion, v.estado, v.asientos, v.alcance_km, v.certificacion])
  return (
    <li className="border-t hairline pt-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-medium">{v.nombre}</p>
        <StatusBadge estado={v.estado} />
      </div>
      <dl className="mt-1.5 grid grid-cols-[6.5rem_1fr] gap-x-3 gap-y-1 text-[0.8125rem]">
        <dt className="text-tenue">Asientos</dt>
        <dd><DataValue field={v.asientos} cite={cite} /></dd>
        <dt className="text-tenue">Alcance</dt>
        <dd><DataValue field={v.alcance_km} cite={cite} /></dd>
        <dt className="text-tenue">Certificación</dt>
        <dd><DataValue field={v.certificacion} cite={cite} /></dd>
      </dl>
      <Footnotes notes={notes} className="mt-2" />
    </li>
  )
}

// Vehículos reales de una configuración: aparecen solo si su configuración tiene valor con fuente.
export default function VehicleCards({ config }: { config: Configuracion }) {
  const list = vehicles.filter((v) => v.configuracion.hasValue && v.configuracion.value === config)
  if (!list.length) {
    return <p className="mt-1 text-[0.8125rem] text-tenue">Todavía no hay vehículos con esta configuración cargada con fuente.</p>
  }
  return (
    <ul className="mt-1 space-y-3">
      {list.map((v) => (
        <VehicleCard key={v.id} v={v} />
      ))}
    </ul>
  )
}
