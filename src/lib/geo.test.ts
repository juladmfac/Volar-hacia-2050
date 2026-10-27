import { describe, expect, it } from 'vitest'
import { centroid, circle, distanceKm, toLocalKm } from './geo.ts'

describe('geo', () => {
  it('un grado de latitud son unos 111 km', () => {
    expect(distanceKm([0, 0], [1, 0])).toBeCloseTo(111.19, 1)
    expect(toLocalKm([1, 0], [0, 0]).y).toBeCloseTo(111.19, 1)
  })
  it('la proyección local coincide con haversine a 30 km', () => {
    const o: [number, number] = [-23.55, -46.63]
    const p: [number, number] = [-23.4, -46.85]
    const { x, y } = toLocalKm(p, o)
    expect(Math.hypot(x, y)).toBeCloseTo(distanceKm(o, p), 0)
  })
  it('los puntos del círculo están a la distancia pedida', () => {
    const c: [number, number] = [-23.5, -46.6]
    for (const [lon, lat] of circle(c, 30, 12)) expect(distanceKm(c, [lat, lon])).toBeCloseTo(30, 6)
  })
  it('centroide', () => {
    expect(centroid([[0, 0], [2, 4]])).toEqual([1, 2])
  })
})
