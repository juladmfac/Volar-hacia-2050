// Tramos del progreso de la escena 2 (0 a 1). El SAF ocupa casi todo el recorrido;
// las otras tres pasan al final, como comparación.
import type { PortadorId } from '../../store.ts'

export const TRAMOS = {
  intro: [0, 0.09],
  rutas: [0.09, 0.2],
  mezcla: [0.2, 0.3],
  pedido: [0.3, 0.38],
  produccion: [0.38, 0.46],
  mandato: [0.46, 0.54],
  costo: [0.54, 0.61],
  esaf: [0.61, 0.69],
  argentina: [0.69, 0.76],
  otras: [0.76, 0.88],
  tabla: [0.88, 1],
} as const satisfies Record<string, readonly [number, number]>
export type Tramo = keyof typeof TRAMOS

// Tramos en los que el 3D queda de fondo y los gráficos pasan adelante.
export const CHART_TRAMOS: Tramo[] = ['pedido', 'produccion', 'mandato', 'costo']

export const OTRAS: PortadorId[] = ['bateria', 'hidrogeno', 'hibrido']

export const smooth = (p: number, a: number, b: number) => {
  const t = Math.min(1, Math.max(0, (p - a) / (b - a)))
  return t * t * (3 - 2 * t)
}


export const otrasRange = (i: number): [number, number] => {
  const [a, b] = TRAMOS.otras
  const step = (b - a) / OTRAS.length
  return [a + i * step, a + (i + 1) * step]
}
