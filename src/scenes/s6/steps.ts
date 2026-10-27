// Tramos del progreso de la escena 6 (0 a 1).
export const TRAMOS6 = {
  intro: [0, 0.07],
  saf: [0.07, 0.22],
  alas: [0.22, 0.36],
  vertipuerto: [0.36, 0.52],
  ciudades: [0.52, 0.68],
  anios: [0.68, 0.8],
  pad: [0.8, 0.91],
  argentina: [0.91, 1],
} as const satisfies Record<string, readonly [number, number]>
export type Tramo6 = keyof typeof TRAMOS6

export { smooth } from '../s5/steps.ts'
import { smooth } from '../s5/steps.ts'

// 0..1 dentro de un tramo (con margen para que la animación termine antes del cambio).
export const within = (p: number, t: Tramo6, a = 0.1, b = 0.75) => {
  const [from, to] = TRAMOS6[t]
  return smooth(p, from + (to - from) * a, from + (to - from) * b)
}
