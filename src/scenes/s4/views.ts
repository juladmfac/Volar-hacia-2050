import type { HangarView } from '../../store.ts'

type V3 = [number, number, number]

// Vistas del hangar: posición de cámara y punto mirado. Proporciones ilustrativas.
export const VIEWS: Record<HangarView, { pos: V3; look: V3 }> = {
  tres_cuartos: { pos: [5.6, 1.9, 5.4], look: [0, 0.1, 0] },
  frente: { pos: [8.2, 0.6, 0.01], look: [0, 0.2, 0] },
  lateral: { pos: [0.01, 0.7, 8.6], look: [0, 0.2, 0] },
  superior: { pos: [0.01, 10.5, 0.02], look: [0, 0, 0] },
  inferior: { pos: [0.6, -6.5, 0.6], look: [0, 0, 0] },
}

// Recorrido guiado por el scroll: progreso de la escena 4 → vista.
export const INTRO_END = 0.08
export const GUIDED: { at: number; view: HangarView }[] = [
  { at: 0.0, view: 'tres_cuartos' },
  { at: 0.3, view: 'lateral' },
  { at: 0.55, view: 'superior' },
  { at: 0.8, view: 'tres_cuartos' },
]

export function guidedView(p: number): HangarView {
  let v: HangarView = GUIDED[0].view
  for (const g of GUIDED) if (p >= g.at) v = g.view
  return v
}
