import { describe, expect, it } from 'vitest'
import { areaSeguridad, ciclosPorHora, fatoMinima, ocupacion } from './pad.ts'

const e = { aproximacion: 2, desembarque: 3, carga: 10, embarque: 3, salida: 2 }

describe('pad', () => {
  it('suma las etapas en serie', () => {
    expect(ocupacion(e)).toBe(20)
  })
  it('60 min / ocupación × pads', () => {
    expect(ciclosPorHora(e)).toBe(3)
    expect(ciclosPorHora(e, 2)).toBe(6)
  })
  it('sin ocupación no hay límite', () => {
    expect(ciclosPorHora({ aproximacion: 0, desembarque: 0, carga: 0, embarque: 0, salida: 0 })).toBe(Infinity)
  })
  it('rechaza entradas inválidas', () => {
    expect(() => ocupacion({ ...e, carga: -1 })).toThrow(RangeError)
    expect(() => ocupacion({ ...e, carga: Number.NaN })).toThrow(RangeError)
    expect(() => ciclosPorHora(e, 0)).toThrow(RangeError)
    expect(() => ciclosPorHora(e, 1.5)).toThrow(RangeError)
  })
  it('área de seguridad: el mayor de los dos', () => {
    expect(areaSeguridad(10, 3, 0.25)).toBe(3)
    expect(areaSeguridad(16, 3, 0.25)).toBe(4)
    expect(() => areaSeguridad(0, 3, 0.25)).toThrow(RangeError)
  })
  it('FATO = D × factor', () => {
    expect(fatoMinima(12, 1.5)).toBe(18)
    expect(() => fatoMinima(0, 1.5)).toThrow(RangeError)
  })
})
