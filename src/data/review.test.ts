import { describe, expect, it } from 'vitest'
import { reviewItems } from './review.ts'

const F = (tipo: string, verificacion: string) => ({ titulo: 't', url: 'https://a.b', anio: 2026, consultado: '2026-10-24', tipo, verificacion })

describe('reviewItems', () => {
  it('lista notas, pendientes, conflictos, fuentes secundarias o a releer y estimaciones', () => {
    const items = reviewItems({
      'x.json': {
        a: { valor: null, nota: 'n1' },
        b: { valor: 3, tipo: 'verificado', fuentes: [F('secundaria', 'buscador')], conflicts: ['c1'] },
        c: { valor: 4, tipo: 'estimacion', informe: { titulo: 'i' } },
        d: { valor: 5, tipo: 'verificado', fuentes: [F('primaria', 'lectura')] },
        pendientes: ['p1'],
      },
    })
    const tipos = items.map((i) => `${i.tipo}:${i.at}`)
    expect(tipos).toContain('nota:x.json/a')
    expect(tipos).toContain('pendiente:x.json')
    expect(tipos).toContain('conflicto:x.json/b')
    expect(tipos).toContain('solo fuente secundaria:x.json/b')
    expect(tipos).toContain('verificado vía buscador:x.json/b')
    expect(tipos).toContain('estimación o especulación:x.json/c')
    expect(tipos.some((t) => t.endsWith('x.json/d'))).toBe(false)
  })
})
