// Parámetros geométricos de los tres arquetipos. Genéricos e ilustrativos: no reproducen
// ningún modelo comercial ni son datos (proporciones elegidas para que se lean bien en pantalla).
import type { Configuracion } from '../../store.ts'
import type { BladeSpec, FuselageSpec, WingSpec } from './geometry.ts'

export type Vec3 = [number, number, number]

export interface RotorSpec {
  pos: Vec3
  kind: 'lift' | 'tilt' | 'pusher'
  blades: number
  blade: BladeSpec
  dir: 1 | -1 // sentido de giro
}

export interface EVTOLParams {
  fuselaje: FuselageSpec
  ala?: WingSpec & { pos: Vec3 }
  cola: { pos: Vec3; panel: WingSpec; angulo: number } // cola en V
  booms: { z: number; x0: number; x1: number; y: number }[]
  brazos: Vec3[] // brazos del fuselaje a cada rotor (multicóptero)
  rotores: RotorSpec[]
}

const FUSELAJE: FuselageSpec = { length: 3.8, radius: 0.52, nose: 0.24, tail: 0.38, tailUpsweep: 0.7, squash: 0.92 }
const PALA_GRANDE: BladeSpec = { radius: 1.0, rootChord: 0.16, tipChord: 0.08, twistRoot: 16, twistTip: 5, thickness: 0.12 }
const PALA_MEDIA: BladeSpec = { ...PALA_GRANDE, radius: 0.75, rootChord: 0.13, tipChord: 0.07 }
const PALA_CHICA: BladeSpec = { ...PALA_GRANDE, radius: 0.62, rootChord: 0.12, tipChord: 0.065, twistRoot: 28, twistTip: 12 }
const ALA: WingSpec & { pos: Vec3 } = { span: 6.6, rootChord: 1.05, tipChord: 0.62, thickness: 0.13, camber: 0.02, sweep: 0.04, dihedral: 0.03, pos: [0.15, 0.42, 0] }
const COLA = { pos: [-1.62, 0.55, 0] as Vec3, panel: { span: 1.5, rootChord: 0.6, tipChord: 0.32, thickness: 0.1, sweep: 0.25 }, angulo: 0.62 }

const alt = (i: number): 1 | -1 => (i % 2 === 0 ? 1 : -1)

export const CONFIGS: Record<Configuracion, EVTOLParams> = {
  multicoptero: {
    fuselaje: { ...FUSELAJE, length: 3.2, tail: 0.32, tailUpsweep: 0.4 },
    cola: { ...COLA, pos: [-1.35, 0.45, 0], panel: { ...COLA.panel, span: 1.0 } },
    booms: [],
    brazos: [
      [1.45, 0.62, 1.45],
      [1.45, 0.62, -1.45],
      [-1.45, 0.62, 1.45],
      [-1.45, 0.62, -1.45],
    ],
    rotores: [
      [1.45, 0.7, 1.45],
      [1.45, 0.7, -1.45],
      [-1.45, 0.7, -1.45],
      [-1.45, 0.7, 1.45],
    ].map((pos, i) => ({ pos: pos as Vec3, kind: 'lift' as const, blades: 3, blade: PALA_GRANDE, dir: alt(i) })),
  },
  sustentacion_crucero: {
    fuselaje: FUSELAJE,
    ala: ALA,
    cola: COLA,
    booms: [1.65, -1.65].map((z) => ({ z, x0: -2.35, x1: 2.05, y: 0.36 })),
    brazos: [],
    rotores: [
      ...[1.65, -1.65].flatMap((z) =>
        [1.85, -2.1].map((x) => ({ pos: [x, 0.52, z] as Vec3, kind: 'lift' as const, blades: 2, blade: PALA_MEDIA, dir: alt(Math.round(x + z)) })),
      ),
      { pos: [-2.0, 0.42, 0], kind: 'pusher', blades: 3, blade: PALA_CHICA, dir: 1 },
    ],
  },
  rotores_basculantes: {
    fuselaje: FUSELAJE,
    ala: ALA,
    cola: COLA,
    booms: [],
    brazos: [],
    rotores: [1.45, 2.85, -1.45, -2.85].map((z, i) => ({ pos: [0.78, 0.44, z] as Vec3, kind: 'tilt' as const, blades: 3, blade: PALA_CHICA, dir: alt(i) })),
  },
}
