import { useMemo } from 'react'
import * as THREE from 'three'
import { COLOR } from '../theme.ts'

// Piso de plano técnico: grilla fina cada unidad y gruesa cada cinco, que se apaga hacia el borde.
// uniforms.uOffset desplaza la grilla para sugerir avance.
const vertexShader = /* glsl */ `
  varying vec3 vWorld;
  #include <fog_pars_vertex>
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    vec4 mvPosition = viewMatrix * wp;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`
const fragmentShader = /* glsl */ `
  uniform float uOffset;
  uniform float uRadius;
  uniform vec3 uBase;
  uniform vec3 uMinor;
  uniform vec3 uMajor;
  varying vec3 vWorld;
  #include <fog_pars_fragment>
  float grid(vec2 p) {
    vec2 g = abs(fract(p - 0.5) - 0.5) / fwidth(p);
    return 1.0 - min(min(g.x, g.y), 1.0);
  }
  void main() {
    vec2 p = vWorld.xz + vec2(uOffset, 0.0);
    float fade = 1.0 - smoothstep(uRadius * 0.25, uRadius, length(vWorld.xz));
    vec3 col = uBase;
    col = mix(col, uMinor, grid(p) * 0.55 * fade);
    col = mix(col, uMajor, grid(p / 5.0) * 0.9 * fade);
    gl_FragColor = vec4(col, 1.0);
    #include <fog_fragment>
  }
`

export function useTechFloorMaterial(radius = 18) {
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        fog: true,
        uniforms: {
          ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
          uOffset: { value: 0 },
          uRadius: { value: radius },
          uBase: { value: new THREE.Color(COLOR.noche) },
          uMinor: { value: new THREE.Color(COLOR.linea) },
          uMajor: { value: new THREE.Color('#33415a') },
        },
      }),
    [radius],
  )
}

export default function TechFloor({ material, y, size = 80 }: { material: THREE.ShaderMaterial; y: number; size?: number }) {
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={y} material={material}>
      <planeGeometry args={[size, size]} />
    </mesh>
  )
}
