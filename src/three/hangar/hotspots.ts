import type { Hotspot } from '../../store.ts'

// Posición en pantalla (px) de cada punto del hangar; la escribe la escena 3D cada frame
// y la lee la capa HTML sin re-render.
export const HOTSPOTS: Hotspot[] = ['cabina', 'ala', 'rotor', 'energia', 'cola']
export const hotspotScreen: Record<Hotspot, { x: number; y: number; visible: boolean }> = {
  cabina: { x: 0, y: 0, visible: false },
  ala: { x: 0, y: 0, visible: false },
  rotor: { x: 0, y: 0, visible: false },
  energia: { x: 0, y: 0, visible: false },
  cola: { x: 0, y: 0, visible: false },
}
