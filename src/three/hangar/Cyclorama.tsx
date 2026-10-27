import { useMemo } from 'react'
import * as THREE from 'three'

// Fondo infinito de estudio fotográfico: piso que se curva hacia una pared, sin esquinas.
export function cycloramaGeometry(width = 70, front = 30, back = 9, radius = 7, height = 30, steps = 48) {
  // Perfil en el plano (z, y): piso desde z = front hasta z = -back, curva de radio `radius`, pared.
  const prof: [number, number][] = [[front, 0]]
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * (Math.PI / 2)
    prof.push([-back - Math.sin(a) * radius, radius - Math.cos(a) * radius])
  }
  prof.push([-back - radius, height])
  const g = new THREE.BufferGeometry()
  const pos: number[] = []
  const idx: number[] = []
  const cols = 2
  prof.forEach(([z, y]) => {
    for (let c = 0; c < cols; c++) pos.push((c / (cols - 1) - 0.5) * width, y, z)
  })
  for (let r = 0; r < prof.length - 1; r++) {
    const a = r * cols
    const b = (r + 1) * cols
    idx.push(a, b, a + 1, a + 1, b, b + 1)
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

export default function Cyclorama({ y, color }: { y: number; color: string }) {
  const geometry = useMemo(() => cycloramaGeometry(), [])
  return (
    <mesh geometry={geometry} position-y={y} receiveShadow>
      <meshStandardMaterial color={color} roughness={0.92} metalness={0} side={THREE.DoubleSide} />
    </mesh>
  )
}
