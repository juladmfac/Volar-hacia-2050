import * as THREE from 'three'

let tex: THREE.CanvasTexture | null = null

// Textura radial para luces (aditiva).
export function glowTexture() {
  if (tex) return tex
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.25, 'rgba(255,255,255,0.6)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 64, 64)
  tex = new THREE.CanvasTexture(c)
  return tex
}
