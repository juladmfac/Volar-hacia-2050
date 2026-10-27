import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLOR } from '../../theme.ts'

// Cielo nocturno en un shader: resplandor urbano cálido en el horizonte, azul profundo arriba
// y estrellas tenues. Sigue a la cámara (la esfera se dibuja detrás de todo).
const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = p.xyww;
  }
`
const fragmentShader = /* glsl */ `
  varying vec3 vDir;
  uniform float uFade;
  uniform vec3 uFadeColor;
  float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
  void main() {
    float h = clamp(vDir.y, -0.2, 1.0);
    // Colores en lineal (equivalen a sRGB #0d1426, #18203a y #352629).
    vec3 zenith = vec3(0.004, 0.007, 0.020);
    vec3 mid = vec3(0.009, 0.015, 0.042);
    vec3 glow = vec3(0.034, 0.018, 0.020);
    vec3 col = mix(glow, mid, smoothstep(-0.02, 0.18, h));
    col = mix(col, zenith, smoothstep(0.18, 0.85, h));
    vec3 cell = floor(vDir * 420.0);
    float s = step(0.9975, hash(cell)) * smoothstep(0.12, 0.5, h);
    col += vec3(0.6, 0.65, 0.9) * s * (0.3 + 0.7 * hash(cell + 3.1));
    gl_FragColor = vec4(mix(col, uFadeColor, uFade), 1.0);
  }
`

// uniforms.uFade lleva el cielo al color de fondo durante la transición a la escena 2.
export function useSkyMaterial() {
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { uFade: { value: 0 }, uFadeColor: { value: new THREE.Color(COLOR.noche) } },
      }),
    [],
  )
}

export default function SkyDome({ material }: { material: THREE.ShaderMaterial }) {
  const ref = useRef<THREE.Mesh>(null!)
  useFrame(({ camera }) => ref.current.position.copy(camera.position))
  return (
    <mesh ref={ref} material={material} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[1500, 48, 24]} />
    </mesh>
  )
}
