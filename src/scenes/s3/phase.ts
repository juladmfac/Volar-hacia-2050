// Tramos del progreso de la escena 3: introducción, filtro con tres fases de vuelo y, después,
// el mapa de tecnologías, Breguet y celda frente a paquete.
export const INTRO_END = 0.04
export const FILTER_END = 0.5
export const TRAMOS3 = {
  mapa: [0.5, 0.74],
  breguet: [0.74, 0.87],
  celda: [0.87, 1],
} as const

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const ease = (x: number) => x * x * (3 - 2 * x)

// Fase continua: 0 despegue vertical, 1 transición, 2 crucero.
export function phaseFromProgress(p: number): number {
  const u = clamp01((p - INTRO_END) / (FILTER_END - INTRO_END))
  if (u < 0.25) return 0
  if (u < 0.4) return ease((u - 0.25) / 0.15)
  if (u < 0.6) return 1
  if (u < 0.75) return 1 + ease((u - 0.6) / 0.15)
  return 2
}

// Progreso al que hay que llevar el scroll para ver cada fase.
const PHASE_U = [0.12, 0.5, 0.88]
export const progressForPhase = (i: number) => INTRO_END + PHASE_U[i] * (FILTER_END - INTRO_END)

// Interpola un arreglo [hover, transición, crucero] según la fase continua.
export function atPhase(arr: readonly number[], ph: number): number {
  const i = Math.min(1, Math.floor(ph))
  const f = ph - i
  return arr[i] + (arr[i + 1] - arr[i]) * f
}

// 0 en el filtro, 1 en los tramos de gráficos (el 3D queda de fondo).
export const pastFilter = (p: number) => ease(clamp01((p - FILTER_END + 0.01) / 0.04))
