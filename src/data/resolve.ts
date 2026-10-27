// Única puerta de entrada a los datos. Ningún componente lee campos crudos.
// El esquema (schema.ts) ya garantiza que todo valor no null tiene tipo y fuente o informe.
// Un valor null se muestra como "sin verificar"; nunca hay valores de respaldo.
import type { Estado, Fuente, Informe, TipoDato } from './schema.ts'

export { ESTADOS, type Estado, type Fuente, type Informe, type TipoDato } from './schema.ts'

export const ESTADO_LABEL: Record<Estado, string> = {
  operando: 'operando',
  en_preparacion: 'en preparación',
  proyectado: 'proyectado',
}

export const TIPO_LABEL: Record<TipoDato, { marca: string; texto: string }> = {
  verificado: { marca: 'V', texto: 'verificado con fuente' },
  estimacion: { marca: 'E', texto: 'estimación propia del autor' },
  especulacion: { marca: 'P', texto: 'especulación prospectiva' },
}

export interface RawDato<V = unknown> {
  valor: V | null
  unidad?: string
  tipo: TipoDato | null
  fuentes: Fuente[]
  informe?: Informe
  contexto?: string
  nota?: string
  conflicts: string[]
}

export interface Field<V = unknown> {
  value: V | null
  hasValue: boolean
  unidad: string | null
  tipo: TipoDato | null
  fuentes: Fuente[]
  informe: Informe | null
  contexto: string | null
  conflicts: string[]
}

export function resolveDato<V>(d: RawDato<V> | undefined): Field<V> {
  if (!d || d.valor === null || d.tipo === null) {
    return { value: null, hasValue: false, unidad: d?.unidad ?? null, tipo: null, fuentes: [], informe: null, contexto: null, conflicts: d?.conflicts ?? [] }
  }
  return {
    value: d.valor,
    hasValue: true,
    unidad: d.unidad ?? null,
    tipo: d.tipo,
    fuentes: d.fuentes,
    informe: d.informe ?? null,
    contexto: d.contexto ?? null,
    conflicts: d.conflicts,
  }
}

export const soloSecundarias = (f: Field) => f.fuentes.length > 0 && f.fuentes.every((x) => x.tipo === 'secundaria')
