import { useSyncExternalStore } from 'react'

type Patch<T> = Partial<T> | ((s: T) => Partial<T>)

function createStore<T extends object>(initial: T) {
  let state = initial
  const subs = new Set<() => void>()
  return {
    get: () => state,
    set: (patch: Patch<T>) => {
      state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) }
      subs.forEach((f) => f())
    },
    subscribe: (f: () => void) => {
      subs.add(f)
      return () => {
        subs.delete(f)
      }
    },
  }
}

const reduced =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export type SceneId = 's1' | 's2' | 's3' | 's4' | 's5' | 's6'
export type HangarView = 'tres_cuartos' | 'frente' | 'lateral' | 'superior' | 'inferior'
export type Hotspot = 'cabina' | 'ala' | 'rotor' | 'energia' | 'cola'
export type Fuerza = 'todas' | 'peso' | 'sustentacion' | 'resistencia' | 'empuje'
export type ForceId = Exclude<Fuerza, 'todas'>
export type Configuracion = 'multicoptero' | 'sustentacion_crucero' | 'rotores_basculantes'
export type PortadorId = 'bateria' | 'hidrogeno' | 'saf' | 'hibrido'

export interface UIState {
  activeScene: SceneId
  webgl: boolean
  reducedMotion: boolean
  fase: 0 | 1 | 2 // 0 despegue vertical, 1 transición, 2 crucero
  fuerza: Fuerza
  configuracion: Configuracion
  portador: PortadorId
  // Escena 4 (hangar)
  explorar: boolean // cámara libre: el scroll de la página queda en pausa
  vista: HangarView
  despiece: number // 0..1
  basculado: number // 0 = rotores en vertical, 1 = en crucero
  plano: boolean // vista de plano técnico (solo líneas)
  hotspot: Hotspot | null
}

// Estado de interfaz (cambia poco; dispara re-render).
export const ui = createStore<UIState>({
  activeScene: 's1',
  webgl: true,
  reducedMotion: Boolean(reduced),
  fase: 0,
  fuerza: 'todas',
  configuracion: 'multicoptero',
  portador: 'bateria',
  explorar: false,
  vista: 'tres_cuartos',
  despiece: 0,
  basculado: 0,
  plano: false,
  hotspot: null,
})

export const useUI = <R,>(selector: (s: UIState) => R): R =>
  useSyncExternalStore(ui.subscribe, () => selector(ui.get()))

// Progreso de scroll por escena, 0..1 (cambia cada frame; se lee en useFrame, sin re-render).
export const progress: Record<SceneId, number> = { s1: 0, s2: 0, s3: 0, s4: 0, s5: 0, s6: 0 }

// Avance del tramo de transición que precede a cada escena, 0..1 (la escena 1 no tiene).
export const enter: Record<SceneId, number> = { s1: 1, s2: 0, s3: 0, s4: 0, s5: 0, s6: 0 }
