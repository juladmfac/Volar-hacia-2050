// Geometría paramétrica del eVTOL genérico. Funciones puras: se testean sin WebGL.
// Ejes del vehículo: +x adelante, +y arriba, +z a la izquierda (envergadura).
import * as THREE from 'three'

// Perfil NACA de 4 dígitos (fórmula pública). t: espesor relativo (0,12 = 12 %),
// m: comba máxima, p: posición de la comba. Devuelve un contorno cerrado en coordenadas
// de cuerda: x de 0 (borde de ataque) a 1 (borde de fuga), y hacia arriba.
export function nacaProfile(t: number, m = 0, p = 0.4, n = 36): THREE.Vector2[] {
  const xs = Array.from({ length: n + 1 }, (_, i) => 0.5 * (1 - Math.cos((Math.PI * i) / n))) // espaciado coseno
  const pts = xs.map((x) => {
    const yt = 5 * t * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1036 * x ** 4)
    let yc = 0
    let dyc = 0
    if (m > 0) {
      if (x < p) {
        yc = (m / (p * p)) * (2 * p * x - x * x)
        dyc = ((2 * m) / (p * p)) * (p - x)
      } else {
        yc = (m / (1 - p) ** 2) * (1 - 2 * p + 2 * p * x - x * x)
        dyc = ((2 * m) / (1 - p) ** 2) * (p - x)
      }
    }
    const th = Math.atan(dyc)
    return {
      upper: new THREE.Vector2(x - yt * Math.sin(th), yc + yt * Math.cos(th)),
      lower: new THREE.Vector2(x + yt * Math.sin(th), yc - yt * Math.cos(th)),
    }
  })
  // Borde de fuga → extradós → borde de ataque → intradós → borde de fuga.
  const upper = pts.map((q) => q.upper).reverse()
  const lower = pts.slice(1, -1).map((q) => q.lower)
  return [...upper, ...lower]
}

export interface WingSpec {
  span: number // envergadura total
  rootChord: number
  tipChord: number
  thickness: number // espesor relativo NACA
  camber?: number
  sweep?: number // retroceso del borde de ataque por unidad de semienvergadura
  dihedral?: number // subida por unidad de semienvergadura
}

// Ala extruida a partir del perfil, con estrechamiento, flecha y diedro.
// El cuarto de cuerda de la raíz queda en el origen.
export function wingGeometry(w: WingSpec): THREE.BufferGeometry {
  const shape = new THREE.Shape(nacaProfile(w.thickness, w.camber ?? 0))
  const g = new THREE.ExtrudeGeometry(shape, { depth: w.span, steps: 10, bevelEnabled: false, curveSegments: 1 })
  const pos = g.attributes.position as THREE.BufferAttribute
  const half = w.span / 2
  for (let i = 0; i < pos.count; i++) {
    const cx = pos.getX(i)
    const cy = pos.getY(i)
    const z = pos.getZ(i) - half
    const s = Math.abs(z) / half
    const chord = THREE.MathUtils.lerp(w.rootChord, w.tipChord, s)
    const x = -(cx - 0.25) * chord - (w.sweep ?? 0) * Math.abs(z)
    const y = cy * chord + (w.dihedral ?? 0) * Math.abs(z)
    pos.setXYZ(i, x, y, z)
  }
  g.computeVertexNormals()
  return g
}

export interface FuselageSpec {
  length: number
  radius: number
  nose: number // fracción del largo que ocupa la nariz
  tail: number // fracción del largo que ocupa el cono de cola
  tailUpsweep: number // cuánto sube la cola, en unidades de radio
  squash: number // achatamiento vertical de la sección (1 = circular)
}

// Radio del fuselaje a lo largo del eje, de 0 (nariz) a 1 (cola).
export function fuselageRadius(f: FuselageSpec, s: number): number {
  if (s < f.nose) return f.radius * Math.sqrt(1 - ((f.nose - s) / f.nose) ** 2) // ojiva elíptica
  if (s > 1 - f.tail) {
    const u = (s - (1 - f.tail)) / f.tail
    return f.radius * (1 - 0.82 * u ** 1.4) // cono que termina en un radio chico
  }
  return f.radius
}

// Fuselaje torneado (LatheGeometry) y alineado con +x, con la cola levantada.
export function fuselageGeometry(f: FuselageSpec, segments = 48): THREE.BufferGeometry {
  const n = 40
  const profile = Array.from({ length: n + 1 }, (_, i) => {
    const s = i / n
    return new THREE.Vector2(Math.max(0.001, fuselageRadius(f, s)), (0.5 - s) * f.length)
  })
  const g = new THREE.LatheGeometry(profile, segments)
  g.rotateZ(-Math.PI / 2) // eje del torno (y) → +x; la nariz queda en +x
  const pos = g.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const s = 0.5 - x / f.length
    const lift = s > 1 - f.tail ? ((s - (1 - f.tail)) / f.tail) ** 2 * f.tailUpsweep * f.radius : 0
    pos.setY(i, pos.getY(i) * f.squash + lift)
  }
  g.computeVertexNormals()
  return g
}

export interface BladeSpec {
  radius: number
  rootChord: number
  tipChord: number
  twistRoot: number // grados
  twistTip: number
  thickness: number
}

// Pala con estrechamiento y torsión, a lo largo de +x desde el eje del rotor.
export function bladeGeometry(b: BladeSpec): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(1, 1, 1, 14, 1, 1)
  g.translate(0.5, 0, 0)
  const pos = g.attributes.position as THREE.BufferAttribute
  const r0 = 0.12 // raíz cerca del cubo
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i)
    const r = r0 + u * (b.radius - r0)
    const chord = THREE.MathUtils.lerp(b.rootChord, b.tipChord, u)
    const tw = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(b.twistRoot, b.twistTip, u))
    const zc = pos.getZ(i) * chord
    const yc = pos.getY(i) * b.thickness * chord
    pos.setXYZ(i, r, yc * Math.cos(tw) + zc * Math.sin(tw), zc * Math.cos(tw) - yc * Math.sin(tw))
  }
  g.computeVertexNormals()
  return g
}
