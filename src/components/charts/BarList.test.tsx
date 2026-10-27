import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import BarList from './BarList.tsx'
import { resolveDato, type RawDato } from '../../data/resolve.ts'

afterEach(cleanup)

const F = {
  titulo: 'Fuente de prueba',
  url: 'https://www.example.org/a',
  anio: 2025,
  consultado: '2026-10-26',
  tipo: 'primaria' as const,
  verificacion: 'lectura' as const,
}
const v = (valor: number | null, unidad = 'Mt/año') =>
  resolveDato<number>({ valor, unidad, tipo: valor === null ? null : 'verificado', fuentes: valor === null ? [] : [F], conflicts: [] } as RawDato<number>)
const bars = (c: HTMLElement) => c.querySelectorAll('[aria-hidden] > div.h-3')

describe('BarList', () => {
  it('dibuja barras proporcionales cuando los valores comparten unidad', () => {
    const { container } = render(
      <BarList label="prueba" color="#f5a524" rows={[{ key: 'a', label: 'A', field: v(1) }, { key: 'b', label: 'B', field: v(4) }]} />,
    )
    const b = bars(container)
    expect(b).toHaveLength(2)
    expect((b[1] as HTMLElement).style.width).toContain('100%')
  })

  it('sin unidad común no dibuja barras', () => {
    const { container } = render(
      <BarList label="prueba" color="#f5a524" rows={[{ key: 'a', label: 'A', field: v(1, 'Mt') }, { key: 'b', label: 'B', field: v(4, '%') }]} />,
    )
    expect(bars(container)).toHaveLength(0)
  })

  it('un valor null no tiene barra y se muestra "sin verificar"', () => {
    const { container, getByText } = render(
      <BarList label="prueba" color="#f5a524" rows={[{ key: 'a', label: 'A', field: v(1) }, { key: 'b', label: 'B', field: v(2) }, { key: 'c', label: 'C', field: v(null) }]} />,
    )
    expect(bars(container)).toHaveLength(2)
    expect(getByText(/sin verificar/)).toBeTruthy()
  })

  it('lo proyectado se dibuja hueco, distinto de lo medido', () => {
    const { container } = render(
      <BarList label="prueba" color="#f5a524" rows={[{ key: 'a', label: 'A', field: v(1) }, { key: 'b', label: 'B', field: v(2), proyectado: true }]} />,
    )
    const [medido, proyectado] = Array.from(bars(container)) as HTMLElement[]
    expect(medido.style.border).toBe('')
    expect(proyectado.style.border).toContain('dashed')
  })
})
