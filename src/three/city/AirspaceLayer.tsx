import { useMemo } from 'react'
import * as THREE from 'three'
import { CITY } from '../../illustrative/values.ts'
import { EXTENT } from './layout.ts'

// Capa translúcida que representa el "espacio aéreo bajo" (ilustrativo:
// la altura no es un dato regulatorio). uniforms.uOpacity se anima desde afuera.
const fragmentShader = /* glsl */ `
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    vec2 g = abs(fract(vUv * 40.0 - 0.5) - 0.5) / fwidth(vUv * 40.0);
    float line = 1.0 - min(min(g.x, g.y), 1.0);
    float edge = smoothstep(0.0, 0.25, min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)));
    float a = (0.05 + line * 0.35) * edge * uOpacity;
    gl_FragColor = vec4(0.11, 0.55, 1.0, a * 0.55); // lineal
  }
`
const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`

export function useAirspaceMaterial() {
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: { uOpacity: { value: 0 } },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [],
  )
}

export default function AirspaceLayer({ material }: { material: THREE.ShaderMaterial }) {
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={CITY.airspaceAltitude} material={material}>
      <planeGeometry args={[EXTENT * 0.9, EXTENT * 0.9]} />
    </mesh>
  )
}
