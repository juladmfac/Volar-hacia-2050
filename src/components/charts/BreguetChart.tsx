import { scaleLinear } from 'd3-scale'
import { curvas } from '../../lib/breguet.ts'
import { CARRIER_COLOR, COLOR } from '../../theme.ts'

// Esquema conceptual: la forma de las dos curvas, sin números en los ejes (Informe v04, Figura 3).
const W = 640
const H = 320
const M = { l: 44, r: 20, t: 20, b: 44 }
const PTS = curvas(0.6, 61)
const x = scaleLinear().domain([0, 0.6]).range([M.l, W - M.r])
const y = scaleLinear()
  .domain([0, Math.max(...PTS.map((p) => p.combustible))])
  .range([H - M.b, M.t])
const line = (k: 'combustible' | 'bateria') => PTS.map((p, i) => `${i ? 'L' : 'M'}${x(p.f).toFixed(1)} ${y(p[k]).toFixed(1)}`).join('')
const gap = `${line('combustible')}${[...PTS].reverse().map((p) => `L${x(p.f).toFixed(1)} ${y(p.bateria).toFixed(1)}`).join('')}Z`
const last = PTS.at(-1)!

export default function BreguetChart() {
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Alcance relativo según Breguet: con combustible crece de forma logarítmica con la fracción de masa que es energía; con batería, en línea recta. La diferencia crece con la fracción.">
        <path d={gap} fill={CARRIER_COLOR.saf} opacity={0.08} />
        <line x1={M.l} x2={W - M.r} y1={H - M.b} y2={H - M.b} stroke={COLOR.linea} />
        <line x1={M.l} x2={M.l} y1={M.t} y2={H - M.b} stroke={COLOR.linea} />
        <path d={line('combustible')} fill="none" stroke={CARRIER_COLOR.saf} strokeWidth={2.5} />
        <path d={line('bateria')} fill="none" stroke={CARRIER_COLOR.bateria} strokeWidth={2.5} />
        <text x={x(last.f) - 6} y={y(last.combustible) - 10} textAnchor="end" fill={CARRIER_COLOR.saf} fontSize={13} fontFamily="var(--font-mono)">
          combustible · ln[1/(1−f)]
        </text>
        <text x={x(last.f) - 6} y={y(last.bateria) + 22} textAnchor="end" fill={CARRIER_COLOR.bateria} fontSize={13} fontFamily="var(--font-mono)">
          batería · f
        </text>
        <text x={W - M.r} y={H - 12} textAnchor="end" fill={COLOR.tenue} fontSize={12}>
          más masa en energía (f) →
        </text>
        <text x={14} y={M.t} transform={`rotate(-90 14 ${M.t})`} textAnchor="end" fill={COLOR.tenue} fontSize={12}>
          alcance relativo →
        </text>
      </svg>
      <figcaption className="sr-only">
        Con combustible, el alcance relativo es ln[1/(1−f)]; con batería, es f, donde f es la fracción de la masa total que es
        energía. Para fracciones chicas las dos coinciden; al crecer f, la curva del combustible se separa cada vez más.
      </figcaption>
    </figure>
  )
}
