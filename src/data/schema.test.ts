import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { dato, datoEstado, FILES } from './schema.ts'
import { resolveDato } from './resolve.ts'
import energy from '@data/energy_carriers.json'
import vehicles from '@data/vehicles.json'
import cities from '@data/cities.json'
import saf from '@data/saf.json'
import tecnologias from '@data/tecnologias.json'
import propulsion from '@data/propulsion.json'
import convivencia from '@data/convivencia.json'

const F = {
  titulo: 'Fuente de prueba',
  url: 'https://example.org/a',
  anio: 2026,
  consultado: '2026-10-24',
  tipo: 'primaria',
  verificacion: 'lectura',
}
const INFORME = { titulo: 'Aviacion2050_Prueba', version: 'v01', fecha: '2026-10-18', autor: 'Autor de prueba' }
const num = dato(z.number())
const ok = (s: z.ZodType, v: unknown) => s.safeParse(v).success

describe('reglas del Dato', () => {
  it('null sin tipo es válido y se resuelve como sin valor', () => {
    expect(ok(num, { valor: null })).toBe(true)
    expect(resolveDato(num.parse({ valor: null })).hasValue).toBe(false)
  })
  it('null con tipo es inválido', () => {
    expect(ok(num, { valor: null, tipo: 'verificado' })).toBe(false)
  })
  it('valor sin tipo es inválido', () => {
    expect(ok(num, { valor: 3 })).toBe(false)
  })
  it('verificado sin fuente es inválido', () => {
    expect(ok(num, { valor: 3, tipo: 'verificado' })).toBe(false)
    expect(ok(num, { valor: 3, tipo: 'verificado', fuentes: [F] })).toBe(true)
  })
  it('estimación sin informe ni fuente es inválida', () => {
    expect(ok(num, { valor: 3, tipo: 'estimacion' })).toBe(false)
    expect(ok(num, { valor: 3, tipo: 'estimacion', informe: INFORME })).toBe(true)
  })
  it('fuente con http, fecha mal escrita o sin forma de verificación es inválida', () => {
    expect(ok(num, { valor: 3, tipo: 'verificado', fuentes: [{ ...F, url: 'http://example.org' }] })).toBe(false)
    expect(ok(num, { valor: 3, tipo: 'verificado', fuentes: [{ ...F, consultado: '24/10/2026' }] })).toBe(false)
    const { verificacion: _, ...sinVerificacion } = F
    expect(ok(num, { valor: 3, tipo: 'verificado', fuentes: [sinVerificacion] })).toBe(false)
  })
  it('estado fuera del vocabulario es inválido', () => {
    expect(ok(datoEstado, { valor: 'lanzado', tipo: 'verificado', fuentes: [F] })).toBe(false)
    expect(ok(datoEstado, { valor: 'operando', tipo: 'verificado', fuentes: [F] })).toBe(true)
  })
  it('campos desconocidos son inválidos', () => {
    expect(ok(num, { valor: null, source_url: 'https://example.org' })).toBe(false)
  })
})

describe('archivos de data/', () => {
  it('cumplen el esquema', () => {
    expect(FILES['energy_carriers.json'].safeParse(energy).success).toBe(true)
    expect(FILES['vehicles.json'].safeParse(vehicles).success).toBe(true)
    expect(FILES['cities.json'].safeParse(cities).success).toBe(true)
    expect(FILES['saf.json'].safeParse(saf).success).toBe(true)
    expect(FILES['tecnologias.json'].safeParse(tecnologias).success).toBe(true)
    expect(FILES['propulsion.json'].safeParse(propulsion).success).toBe(true)
    expect(FILES['convivencia.json'].safeParse(convivencia).success).toBe(true)
  })
})
