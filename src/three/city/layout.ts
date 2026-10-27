import { CITY } from '../../illustrative/values.ts'
import { rng } from '../rng.ts'

export const PITCH = CITY.lot + CITY.street
export const EXTENT = CITY.lots * PITCH

// Centro del lote i (las calles quedan en múltiplos de PITCH, incluida x = 0).
export const lotCenter = (i: number) => (i - (CITY.lots - 1) / 2) * PITCH

// Edificios: [x, z, ancho, alto, profundidad, semilla]
// [x, z, ancho, alto, profundidad, semilla]
export type Building = [number, number, number, number, number, number]

export function buildBuildings(): Building[] {
  const r = rng(CITY.seed)
  const out: Building[] = []
  const half = EXTENT / 2
  for (let i = 0; i < CITY.lots; i++) {
    for (let j = 0; j < CITY.lots; j++) {
      const cx = lotCenter(i)
      const cz = lotCenter(j)
      const d = Math.min(1, Math.hypot(cx, cz) / half)
      const height = () => {
        const tower = r() < 0.06 * (1 - d) ? 1.6 : 1
        const h = CITY.minHeight + (CITY.maxHeight - CITY.minHeight) * Math.pow(r(), 2.2) * (1 - 0.75 * d) * tower
        return Math.min(h, CITY.maxHeight)
      }
      if (r() < 0.45) {
        const s = CITY.lot / 2 - 0.4
        for (const [ox, oz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          out.push([cx + (ox * CITY.lot) / 4, cz + (oz * CITY.lot) / 4, s, height(), s, r()])
        }
      } else {
        const w = CITY.lot - 0.6 - r() * 2
        const dd = CITY.lot - 0.6 - r() * 2
        out.push([cx, cz, w, height(), dd, r()])
      }
    }
  }
  return out
}
