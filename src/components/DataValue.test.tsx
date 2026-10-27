import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import DataValue from './DataValue.tsx'
import StatusBadge from './StatusBadge.tsx'
import VehicleCards from './VehicleCards.tsx'
import Footnotes, { useFootnotes } from './Footnotes.tsx'
import { resolveDato, type Estado, type RawDato } from '../data/resolve.ts'

afterEach(cleanup)

const F = {
  titulo: 'Fuente de prueba',
  url: 'https://www.example.org/a',
  anio: 2025,
  consultado: '2026-10-24',
  tipo: 'secundaria' as const,
  verificacion: 'buscador' as const,
}
const raw = <V,>(d: Partial<RawDato<V>>): RawDato<V> => ({ valor: null, tipo: null, fuentes: [], conflicts: [], ...d })

describe('DataValue', () => {
  it('sin valor muestra "sin verificar"', () => {
    const { container } = render(<DataValue field={resolveDato(raw({}))} />)
    expect(container.textContent).toContain('sin verificar')
    expect(container.textContent).not.toMatch(/\d/)
  })

  it('verificado muestra marca, valor, unidad, contexto y la fuente al pie', () => {
    const f = resolveDato(raw({ valor: 500, unidad: 'Wh/kg', tipo: 'verificado', fuentes: [F], contexto: 'celda' }))
    function Block() {
      const { notes, cite } = useFootnotes([f])
      return (
        <>
          <DataValue field={f} cite={cite} />
          <Footnotes notes={notes} />
        </>
      )
    }
    const { container } = render(<Block />)
    const t = container.textContent ?? ''
    expect(t).toContain('V')
    expect(t).toContain('500')
    expect(t).toContain('Wh/kg')
    expect(t).toContain('celda')
    expect(t).toContain('example.org · 2025')
    expect(t).toContain('secundaria')
    expect(t).toContain('a releer')
  })

  it('estimación muestra la marca E y el informe', () => {
    const informe = { titulo: 'Aviacion2050_Informe', version: 'v04', fecha: '2026-09-10', autor: 'Ruarte' }
    const { container } = render(<DataValue field={resolveDato(raw({ valor: 400, tipo: 'estimacion', informe }))} />)
    expect(container.textContent).toContain('E')
    expect(container.textContent).toContain('Aviacion2050_Informe v04')
  })
})

describe('StatusBadge', () => {
  it('sin valor muestra "sin verificar"', () => {
    const { container } = render(<StatusBadge estado={resolveDato(raw<Estado>({}))} />)
    expect(container.textContent).toContain('sin verificar')
  })
  it('con valor muestra el estado', () => {
    const { container } = render(<StatusBadge estado={resolveDato(raw<Estado>({ valor: 'en_preparacion', tipo: 'verificado', fuentes: [F] }))} />)
    expect(container.textContent).toContain('en preparación')
  })
})

describe('VehicleCards', () => {
  it('lista solo vehículos con esa configuración cargada', () => {
    const { container } = render(<VehicleCards config="sustentacion_crucero" />)
    expect(container.textContent).not.toContain('Joby')
  })
})
