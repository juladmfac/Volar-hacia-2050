import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { buildBuildings, EXTENT } from './layout.ts'

// Ventanas calculadas en el shader a partir de la posición en el mundo:
// miles de edificios en una sola llamada de dibujo.
const vertexShader = /* glsl */ `
  attribute float aSeed;
  varying vec3 vWorld;
  varying vec3 vNormalW;
  varying float vSeed;
  #include <fog_pars_vertex>
  void main() {
    vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    vNormalW = normalize(mat3(modelMatrix * instanceMatrix) * normal);
    vSeed = aSeed;
    vec4 mvPosition = viewMatrix * wp;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`

const fragmentShader = /* glsl */ `
  varying vec3 vWorld;
  varying vec3 vNormalW;
  varying float vSeed;
  #include <fog_pars_fragment>
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  // Los colores se escriben en sRGB y se pasan a lineal: el postprocesado trabaja en lineal.
  vec3 lin(vec3 c) { return pow(c, vec3(2.2)); }
  void main() {
    vec3 col = lin(vec3(0.03, 0.035, 0.055));
    if (abs(vNormalW.y) < 0.5) {
      float u = abs(vNormalW.x) > 0.5 ? vWorld.z : vWorld.x;
      vec2 cell = vec2(u / 1.6, vWorld.y / 3.2);
      vec2 f = fract(cell);
      vec2 id = floor(cell) + vec2(vSeed * 97.0, vSeed * 13.0);
      float win = step(0.22, f.x) * step(f.x, 0.78) * step(0.28, f.y) * step(f.y, 0.78);
      float density = mix(0.2, 0.55, vSeed);
      float lit = step(1.0 - density, hash(id));
      vec3 warm = lin(mix(vec3(1.0, 0.7, 0.38), vec3(0.62, 0.8, 1.0), step(0.82, hash(id * 1.7))));
      float level = 0.55 + 0.45 * hash(id * 3.3);
      // Valores por encima de 1: el bloom del postprocesado toma las ventanas encendidas.
      vec3 detail = col + win * lit * warm * level * 2.6;
      vec3 average = col + warm * density * 0.28 * 1.1;
      float aa = clamp(1.0 - max(fwidth(cell.x), fwidth(cell.y)) * 1.5, 0.0, 1.0);
      col = mix(average, detail, aa);
      col *= smoothstep(-2.0, 10.0, vWorld.y) * 0.7 + 0.3;
    } else {
      col = lin(vec3(0.045, 0.05, 0.07));
    }
    gl_FragColor = vec4(col, 1.0);
    #include <fog_fragment>
  }
`

export default function ProceduralCity() {
  const ref = useRef<THREE.InstancedMesh>(null!)
  const buildings = useMemo(buildBuildings, [])

  const geometry = useMemo(() => {
    const g = new THREE.BoxGeometry(1, 1, 1)
    g.translate(0, 0.5, 0)
    g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(new Float32Array(buildings.map((b) => b[5])), 1))
    return g
  }, [buildings])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        fog: true,
        uniforms: THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
      }),
    [],
  )

  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    buildings.forEach(([x, z, w, h, d], i) => {
      m.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(w, h, d))
      ref.current.setMatrixAt(i, m)
    })
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [buildings])

  return (
    <group>
      <instancedMesh ref={ref} args={[geometry, material, buildings.length]} frustumCulled={false} />
      <mesh rotation-x={-Math.PI / 2} position-y={-0.05}>
        <planeGeometry args={[EXTENT * 3, EXTENT * 3]} />
        <meshBasicMaterial color="#06080f" />
      </mesh>
    </group>
  )
}
