import { describe, expect, it } from 'vitest'
import { bladeGeometry, fuselageGeometry, fuselageRadius, nacaProfile, wingGeometry } from './geometry.ts'

describe('perfil NACA', () => {
  it('un 0012 tiene un espesor máximo de 12 % de la cuerda, cerca del 30 %', () => {
    const pts = nacaProfile(0.12, 0, 0.4, 200)
    const ys = pts.map((p) => p.y)
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(0.12, 2)
    const top = pts.reduce((a, b) => (b.y > a.y ? b : a))
    expect(top.x).toBeGreaterThan(0.25)
    expect(top.x).toBeLessThan(0.35)
  })
  it('es simétrico sin comba y se curva hacia arriba con comba', () => {
    const sym = nacaProfile(0.12)
    expect(Math.max(...sym.map((p) => p.y))).toBeCloseTo(-Math.min(...sym.map((p) => p.y)), 6)
    const cam = nacaProfile(0.12, 0.02, 0.4)
    expect(Math.max(...cam.map((p) => p.y))).toBeGreaterThan(-Math.min(...cam.map((p) => p.y)))
  })
})

describe('geometrías', () => {
  it('el ala respeta la envergadura y el estrechamiento', () => {
    const g = wingGeometry({ span: 6, rootChord: 1, tipChord: 0.5, thickness: 0.12 })
    g.computeBoundingBox()
    const b = g.boundingBox!
    expect(b.max.z - b.min.z).toBeCloseTo(6, 5)
    expect(b.max.x - b.min.x).toBeCloseTo(1, 2)
  })
  it('el fuselaje mide lo pedido y tiene la nariz en +x', () => {
    const f = { length: 4, radius: 0.5, nose: 0.25, tail: 0.35, tailUpsweep: 0.6, squash: 0.9 }
    const g = fuselageGeometry(f)
    g.computeBoundingBox()
    expect(g.boundingBox!.max.x - g.boundingBox!.min.x).toBeCloseTo(4, 5)
    expect(fuselageRadius(f, 0)).toBeCloseTo(0, 5)
    expect(fuselageRadius(f, 0.5)).toBe(0.5)
  })
  it('la pala llega al radio pedido', () => {
    const g = bladeGeometry({ radius: 1.2, rootChord: 0.2, tipChord: 0.1, twistRoot: 18, twistTip: 6, thickness: 0.1 })
    g.computeBoundingBox()
    expect(g.boundingBox!.max.x).toBeCloseTo(1.2, 5)
  })
})
