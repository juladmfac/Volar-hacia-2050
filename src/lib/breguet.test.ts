import { describe, expect, it } from 'vitest'
import { alcanceBateria, alcanceCombustible, curvas } from './breguet.ts'

describe('Breguet normalizado', () => {
  it('sin energía a bordo no hay alcance', () => {
    expect(alcanceCombustible(0)).toBe(0)
    expect(alcanceBateria(0)).toBe(0)
  })

  it('para fracciones chicas las dos formas coinciden (ln[1/(1−f)] ≈ f)', () => {
    expect(alcanceCombustible(0.01)).toBeCloseTo(alcanceBateria(0.01), 3)
  })

  it('con combustible el alcance crece más rápido que con batería', () => {
    for (const f of [0.1, 0.3, 0.5]) expect(alcanceCombustible(f)).toBeGreaterThan(alcanceBateria(f))
    expect(alcanceCombustible(0.5)).toBeCloseTo(Math.LN2, 10)
  })

  it('la diferencia crece con la fracción másica', () => {
    const gap = (f: number) => alcanceCombustible(f) - alcanceBateria(f)
    expect(gap(0.4)).toBeGreaterThan(gap(0.2))
    expect(gap(0.6)).toBeGreaterThan(gap(0.4))
  })

  it('rechaza fracciones fuera de [0, 1)', () => {
    expect(() => alcanceCombustible(1)).toThrow(RangeError)
    expect(() => alcanceBateria(-0.1)).toThrow(RangeError)
  })

  it('curvas devuelve puntos crecientes desde 0', () => {
    const c = curvas(0.6, 7)
    expect(c).toHaveLength(7)
    expect(c[0]).toEqual({ f: 0, combustible: 0, bateria: 0 })
    expect(c.at(-1)!.f).toBeCloseTo(0.6)
  })
})
