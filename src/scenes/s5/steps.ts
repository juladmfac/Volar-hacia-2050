// Tramos del progreso de la escena 5 (0 a 1).
export const TRAMOS5 = {
  intro: [0, 0.07],
  turbofan: [0.07, 0.27],
  hibrido: [0.27, 0.47],
  electrico: [0.47, 0.6],
  evtol: [0.6, 0.8],
  horizonte: [0.8, 0.9],
  segmentos: [0.9, 1],
} as const satisfies Record<string, readonly [number, number]>
export type Tramo5 = keyof typeof TRAMOS5

export const smooth = (p: number, a: number, b: number) => {
  const t = Math.min(1, Math.max(0, (p - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

// Dentro del tramo híbrido: primera mitad despegue, segunda mitad crucero.
export const hybridCruise = (p: number) => {
  const [a, b] = TRAMOS5.hibrido
  return smooth(p, a + (b - a) * 0.45, a + (b - a) * 0.6)
}
