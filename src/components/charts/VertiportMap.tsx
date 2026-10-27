import { lazy, Suspense, useState } from 'react'
import { scaleLinear } from 'd3-scale'
import DataValue from '../DataValue.tsx'
import Footnotes, { useFootnotes } from '../Footnotes.tsx'
import SinVerificar from '../SinVerificar.tsx'
import { ciudades, vehicles } from '../../data/load.ts'
import { centroid, distanceKm, toLocalKm, type LatLon } from '../../lib/geo.ts'
import { COLOR } from '../../theme.ts'

const Basemap = lazy(() => import('./Basemap.tsx'))

// Mapa esquemático de la red anunciada en São Paulo (escena 6): coordenadas reales sobre una
// grilla en kilómetros, sin mapa base. Funciona en cualquier navegador. El círculo es el alcance
// declarado del EH216-S como regla de medida; si ese dato falta, no se dibuja.
const W = 640
const H = 520
const sp = ciudades.find((c) => c.id === 'sao_paulo')
const sitios = sp?.sitios ?? []
const conCoord = sitios.filter((s) => s.coordenadas.hasValue).map((s) => ({ nombre: s.nombre, ll: s.coordenadas.value as LatLon, field: s.coordenadas }))
const sinCoord = sitios.filter((s) => !s.coordenadas.hasValue)
const ehang = vehicles.find((v) => v.id === 'ehang-eh216-s')
const radio = ehang?.alcance_km.hasValue ? (ehang.alcance_km.value as number) : null
const origin = conCoord.length ? centroid(conCoord.map((s) => s.ll)) : ([0, 0] as LatLon)
const reach = Math.max(10, ...conCoord.map((s) => distanceKm(origin, s.ll))) + (radio ?? 0) + 2
const k = Math.min(W, H) / 2 / reach
const sx = scaleLinear().domain([-reach, reach]).range([W / 2 - reach * k, W / 2 + reach * k])
const sy = scaleLinear().domain([-reach, reach]).range([H / 2 + reach * k, H / 2 - reach * k])
const pts = conCoord.map((s) => {
  const { x, y } = toLocalKm(s.ll, origin)
  return { ...s, px: sx(x), py: sy(y) }
})
const corto = (n: string) => n.replace(/^Heliporto /, '').replace(/ \(.*\)$/, '')
const grid = Array.from({ length: Math.floor(reach / 10) * 2 + 1 }, (_, i) => (i - Math.floor(reach / 10)) * 10)

export default function VertiportMap() {
  const [sel, setSel] = useState(0)
  const [base, setBase] = useState<'off' | 'on' | 'failed'>('off')
  const { notes, cite } = useFootnotes([...sitios.map((s) => s.coordenadas), ehang?.alcance_km])
  if (!pts.length) return <SinVerificar />
  const s = pts[sel]
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <div>
        {base === 'on' ? (
          <Suspense fallback={<p className="eyebrow">Cargando el mapa base…</p>}>
            <Basemap sitios={pts} selected={sel} radioKm={radio} onFail={() => setBase('failed')} />
          </Suspense>
        ) : (
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full border hairline" role="img" aria-label={`Esquema de la red anunciada: ${pts.length} sitios con coordenadas, sobre una grilla de 10 km.`}>
            {grid.map((g) => (
              <g key={g} stroke={COLOR.linea} strokeWidth={g === 0 ? 1 : 0.6}>
                <line x1={sx(g)} x2={sx(g)} y1={0} y2={H} />
                <line y1={sy(g)} y2={sy(g)} x1={0} x2={W} />
              </g>
            ))}
            {radio && (
              <g>
                <circle cx={s.px} cy={s.py} r={radio * k} fill={COLOR.acento} fillOpacity={0.05} stroke={COLOR.acento} strokeDasharray="6 4" />
                <text x={s.px} y={s.py - radio * k - 8} textAnchor="middle" fill={COLOR.acento} fontSize={15} fontFamily="var(--font-mono)">
                  {radio.toLocaleString('es-AR')} km · alcance declarado del EH216-S
                </text>
              </g>
            )}
            {pts.map((p, i) => (
              <g
                key={p.nombre}
                role="button"
                tabIndex={0}
                aria-pressed={i === sel}
                aria-label={p.nombre}
                onClick={() => setSel(i)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSel(i)}
                className="cursor-pointer outline-none"
              >
                <circle cx={p.px} cy={p.py} r={14} fill="transparent" />
                <circle cx={p.px} cy={p.py} r={i === sel ? 8 : 6} fill={i === sel ? COLOR.acento : COLOR.tinta} stroke={COLOR.noche} strokeWidth={2} />
                <text x={p.px + 11} y={p.py + 4} fill={i === sel ? COLOR.acento : COLOR.tinta} fontSize={17}>
                  {corto(p.nombre)}
                </text>
              </g>
            ))}
            <g transform={`translate(20 ${H - 24})`}>
              <line x1={0} x2={10 * k} y1={0} y2={0} stroke={COLOR.tinta} strokeWidth={2} />
              <text x={0} y={-8} fill={COLOR.tenue} fontSize={15} fontFamily="var(--font-mono)">
                10 km
              </text>
            </g>
            <text x={W - 20} y={28} textAnchor="end" fill={COLOR.tenue} fontSize={15} fontFamily="var(--font-mono)">
              N ↑
            </text>
          </svg>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.6875rem] text-tenue">
          <span>Grilla de 10 km, proyección local. Sin mapa base.</span>
          {base !== 'on' && (
            <button type="button" onClick={() => setBase('on')} className="underline decoration-linea underline-offset-4 hover:text-tinta">
              Ver sobre mapa base (OpenFreeMap)
            </button>
          )}
          {base === 'on' && (
            <button type="button" onClick={() => setBase('off')} className="underline decoration-linea underline-offset-4 hover:text-tinta">
              Volver al esquema
            </button>
          )}
          {base === 'failed' && <span role="status">No cargaron las teselas en este navegador: queda el esquema.</span>}
        </div>
      </div>
      <div>
        <ul className="space-y-3 text-[0.8125rem]">
          {pts.map((p, i) => (
            <li key={p.nombre} className="border-t hairline pt-2">
              <button type="button" onClick={() => setSel(i)} aria-pressed={i === sel} className={`text-left font-medium ${i === sel ? 'text-acento' : 'text-tinta hover:text-acento'}`}>
                {p.nombre}
              </button>
              <div className="mt-1 text-tenue">
                <DataValue field={p.field} cite={cite} />
              </div>
            </li>
          ))}
          {sinCoord.map((p) => (
            <li key={p.nombre} className="border-t hairline pt-2">
              <p className="font-medium text-tinta">{p.nombre}</p>
              <p className="mt-1 text-tenue">
                Coordenadas: <SinVerificar />. No aparece en el esquema.
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-4 border-t hairline pt-2 text-[0.8125rem] text-tenue">
          Radio del círculo, alcance declarado del EH216-S: <DataValue field={ehang?.alcance_km} cite={cite} context={false} />
        </p>
        <Footnotes notes={notes} className="mt-4" />
      </div>
    </div>
  )
}
