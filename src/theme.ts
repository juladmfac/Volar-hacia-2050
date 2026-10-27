// Paleta única de la app: la usan la interfaz (src/index.css, @theme) y el 3D.
// theme.test.ts verifica que los dos lugares coincidan.
import type { ForceId, PortadorId } from './store.ts'

export const COLOR = {
  noche: '#04060b', // fondo
  grafito: '#0b1018', // superficies
  linea: '#1d2635', // líneas finas
  tinta: '#e9edf3', // texto
  tenue: '#8d97aa', // texto secundario
  acento: '#7cc8ff', // señal
  ilustrativo: '#cdbf9d', // rótulo "ilustrativo, no es dato"
} as const

// Colores fijos por portador, en todas las escenas.
export const CARRIER_COLOR: Record<PortadorId, string> = {
  bateria: '#38bdf8',
  hidrogeno: '#c4b5fd',
  saf: '#f5a524',
  hibrido: '#a3e635',
}

export const FORCE_COLOR: Record<ForceId, string> = {
  peso: '#fb7185',
  sustentacion: '#7dd3fc',
  resistencia: '#f0abfc',
  empuje: '#86efac',
}
