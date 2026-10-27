import { scaleLinear } from 'd3-scale'
import { aerodromo } from '../../data/load.ts'
import { COLOR } from '../../theme.ts'

// Envergadura del avión de ala plegable frente a los rangos de las claves E y F (escena 6).
// Todo valor sale de data/aerodromo.json; si falta uno, esa marca no se dibuja.
const W = 640
const H = 170
const M = { l: 16, r: 16 }
const num = (f: { value: unknown }) => (typeof f.value === 'number' ? f.value : null)
const claves = aerodromo.claves.map((c) => ({ letra: c.letra, desde: num(c.desde), hasta: num(c.hasta) }))
const vuelo = num(aerodromo.ala.vuelo)
const plegada = num(aerodromo.ala.plegada)
const all = [...claves.flatMap((c) => [c.desde, c.hasta]), vuelo, plegada].filter((x): x is number => x !== null)
const x = scaleLinear()
  .domain([Math.min(...all) - 4, Math.max(...all) + 4])
  .range([M.l, W - M.r])
const fmt = (n: number) => n.toLocaleString('es-AR')

export default function WingspanChart() {
  if (all.length === 0) return null
  const marks = [
    { v: plegada, label: 'plegada', y: 112 },
    { v: vuelo, label: 'en vuelo', y: 146 },
  ]
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Envergadura del ${aerodromo.ala.aeronave}: ${vuelo ? fmt(vuelo) : 'sin verificar'} m en vuelo y ${plegada ? fmt(plegada) : 'sin verificar'} m plegada, frente a los rangos de las claves E y F.`}>
        {claves.map((c) =>
          c.desde !== null && c.hasta !== null ? (
            <g key={c.letra}>
              <rect x={x(c.desde)} y={20} width={x(c.hasta) - x(c.desde)} height={56} fill={c.letra === 'E' ? COLOR.acento : COLOR.tenue} opacity={0.1} />
              <line x1={x(c.desde)} x2={x(c.desde)} y1={20} y2={H - 8} stroke={COLOR.linea} />
              <text x={(x(c.desde) + x(c.hasta)) / 2} y={44} textAnchor="middle" fill={COLOR.tinta} fontSize={17} fontFamily="var(--font-mono)">
                clave {c.letra}
              </text>
              <text x={(x(c.desde) + x(c.hasta)) / 2} y={64} textAnchor="middle" fill={COLOR.tenue} fontSize={15} fontFamily="var(--font-mono)">
                {fmt(c.desde)} a menos de {fmt(c.hasta)} m
              </text>
            </g>
          ) : null,
        )}
        {marks.map((m) =>
          m.v !== null ? (
            <g key={m.label}>
              <line x1={x.range()[0]} x2={x(m.v)} y1={m.y} y2={m.y} stroke={m.label === 'plegada' ? COLOR.acento : COLOR.tinta} strokeWidth={3} />
              <circle cx={x(m.v)} cy={m.y} r={4} fill={m.label === 'plegada' ? COLOR.acento : COLOR.tinta} />
              <text x={x(m.v) + (m.label === 'plegada' ? -8 : 8)} y={m.y - 8} textAnchor={m.label === 'plegada' ? 'end' : 'start'} fill={COLOR.tinta} fontSize={15} fontFamily="var(--font-mono)">
                {m.label} · {fmt(m.v)} m
              </text>
            </g>
          ) : null,
        )}
      </svg>
      <figcaption className="sr-only">
        Las claves de aeródromo se asignan por envergadura. Con el ala en vuelo, el avión cae en la clave F; con las punteras
        plegadas, en la E.
      </figcaption>
    </figure>
  )
}
