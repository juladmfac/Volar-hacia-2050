import TipoBadge from '../TipoBadge.tsx'
import { convivencia } from '../../data/load.ts'
import { CARRIER_COLOR, COLOR } from '../../theme.ts'

// Matriz de convivencia (escenas 5 y 6): vector energético dominante por segmento y año.
// Todo es proyectado (especulación del autor): celdas con borde punteado.
const ANIOS = convivencia[0]?.celdas.map((c) => c.anio) ?? []

// Color según el vector que nombra la celda; el fósil queda neutro.
export function tint(v: string) {
  if (/SAF/.test(v)) return CARRIER_COLOR.saf
  if (/H₂/.test(v)) return CARRIER_COLOR.hidrogeno
  if (/[Hh]íbrido/.test(v)) return CARRIER_COLOR.hibrido
  if (/[Ee]léctric/.test(v)) return CARRIER_COLOR.bateria
  return COLOR.tenue
}

export default function ConvivenciaMatrix() {
  const tipos = [...new Set(convivencia.flatMap((s) => s.celdas.map((c) => c.valor.tipo)).filter(Boolean))]
  return (
    <div className="overflow-x-auto" data-lenis-prevent>
      <table className="w-full min-w-[38rem] text-left text-[0.8125rem]">
        <thead>
          <tr className="border-b hairline">
            <th className="eyebrow py-2 pr-3 font-normal">Segmento</th>
            {ANIOS.map((a) => (
              <th key={a} className="eyebrow py-2 pr-2 font-normal">
                {a}
                {tipos.length === 1 && tipos[0] && <TipoBadge tipo={tipos[0]} />}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {convivencia.map((s) => (
            <tr key={s.id} className="border-b hairline">
              <td className="py-2 pr-3 whitespace-nowrap">{s.nombre}</td>
              {s.celdas.map((c) => {
                const v = c.valor.hasValue ? String(c.valor.value) : null
                return (
                  <td key={c.anio} className="py-1.5 pr-2">
                    {v ? (
                      <span
                        className="inline-flex min-h-7 w-full items-center px-2 py-1 text-[0.75rem] leading-tight"
                        style={{ outline: `1px dashed ${tint(v)}88`, outlineOffset: -1, background: `color-mix(in srgb, ${tint(v)} 14%, transparent)` }}
                      >
                        {v}
                      </span>
                    ) : (
                      <span className="text-tenue">—</span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
