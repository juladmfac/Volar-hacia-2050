import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js'
import { CARRIER_COLOR } from '../../theme.ts'
import { ui, useUI, type Configuracion, type Hotspot } from '../../store.ts'
import { hotspotScreen } from './hotspots.ts'

// VITE_MODEL_EXT=json usa la variante embebida de scripts/embed-models.ts: el GLB sin
// meshopt, en base64 dentro de un JSON. Sirve en hosts que no aceptan .glb, WebAssembly
// ni URIs data: (el visor de artifacts de Claude).
const EXT = import.meta.env.VITE_MODEL_EXT || 'glb'
export const modelUrl = (c: Configuracion) => `${import.meta.env.BASE_URL}models/evtol-${c}.${EXT}`

class EmbeddedGLBLoader extends THREE.Loader<GLTF> {
  load(url: string, onLoad: (g: GLTF) => void, _onProgress?: unknown, onError?: (e: unknown) => void) {
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`${url}: ${r.status}`)
        return r.json() as Promise<{ glb: string }>
      })
      .then(({ glb }) => {
        const bytes = Uint8Array.from(atob(glb), (c) => c.charCodeAt(0))
        new GLTFLoader().parse(bytes.buffer, '', onLoad, (e) => onError?.(e))
      })
      .catch((e) => onError?.(e))
  }
}

export const useModel: (url: string) => GLTF =
  EXT === 'json' ? (url) => useLoader(EmbeddedGLBLoader, url) : (url) => useGLTF(url, false, true) as unknown as GLTF

// Separación de cada grupo en el despiece (ilustrativa).
const EXPLODE: Record<string, [number, number, number]> = {
  g_ala: [0, 0.75, 0],
  g_rotores: [0, 1.45, 0],
  g_cola: [-1.1, 0.35, 0],
  g_energia: [0, -0.55, 0],
  g_tren: [0, -0.9, 0],
}

// Plano técnico: relleno casi transparente con contornos según el ángulo de la superficie
// (tipo radiografía) y las aristas vivas en línea fina.
const LINE = new THREE.LineBasicMaterial({ color: '#9fc3e8', transparent: true, opacity: 0.7 })
export const FILL = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  side: THREE.DoubleSide,
  uniforms: { uLine: { value: new THREE.Color('#9fc3e8') }, uFill: { value: new THREE.Color('#0a1424') } },
  vertexShader: /* glsl */ `
    varying vec3 vN;
    varying vec3 vV;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vN = normalize(normalMatrix * normal);
      vV = normalize(-mv.xyz);
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uLine;
    uniform vec3 uFill;
    varying vec3 vN;
    varying vec3 vV;
    void main() {
      float rim = 1.0 - abs(dot(normalize(vN), normalize(vV)));
      float line = smoothstep(0.62, 0.92, rim);
      gl_FragColor = vec4(mix(uFill, uLine, line), 0.18 + line * 0.8);
    }
  `,
})

interface Parts {
  spins: { node: THREE.Object3D; kind: string; dir: number }[]
  tilts: THREE.Object3D[]
  groups: { node: THREE.Object3D; base: THREE.Vector3; offset: THREE.Vector3 }[]
  hotspots: { id: Hotspot; node: THREE.Object3D }[]
  meshes: THREE.Mesh[]
  energia: THREE.MeshStandardMaterial[]
}

function collect(root: THREE.Object3D): Parts {
  const p: Parts = { spins: [], tilts: [], groups: [], hotspots: [], meshes: [], energia: [] }
  root.traverse((o) => {
    if (o.name.startsWith('spin_')) {
      let r: THREE.Object3D | null = o.parent
      while (r && !r.name.startsWith('rotor_')) r = r.parent
      const n = Number(o.name.split('_')[1])
      p.spins.push({ node: o, kind: String(r?.userData.kind ?? 'lift'), dir: n % 2 === 0 ? 1 : -1 })
    }
    if (o.name.startsWith('tilt_')) p.tilts.push(o)
    const g = o.name.match(/^(g_[a-z]+)/)?.[1]
    if (g && EXPLODE[g] && o.parent?.name === 'evtol')
      p.groups.push({ node: o, base: o.position.clone(), offset: new THREE.Vector3(...EXPLODE[g]) })
    const h = o.name.match(/^hs_([a-z]+)/)?.[1] as Hotspot | undefined
    if (h) p.hotspots.push({ id: h, node: o })
    if ((o as THREE.Mesh).isMesh) {
      const m = o as THREE.Mesh
      p.meshes.push(m)
      m.castShadow = true
      const mats = Array.isArray(m.material) ? m.material : [m.material]
      for (const mat of mats) if (mat.name === 'energia') p.energia.push(mat as THREE.MeshStandardMaterial)
    }
  })
  return p
}

interface Props {
  config: Configuracion
  running: boolean
  reduced: boolean
}

export default function HangarModel({ config, running, reduced }: Props) {
  const gltf = useModel(modelUrl(config))
  const scene = useMemo(() => gltf.scene.clone(true), [gltf])
  const parts = useMemo(() => collect(scene), [scene])
  const portador = useUI((s) => s.portador)
  const plano = useUI((s) => s.plano)
  const { camera, size } = useThree()
  const tilt = useRef(0)
  const explode = useRef(0)
  const v = useMemo(() => new THREE.Vector3(), [])

  // El paquete de energía toma el color del portador elegido.
  useEffect(() => {
    for (const m of parts.energia) {
      m.color.set(CARRIER_COLOR[portador])
      m.emissive.set(CARRIER_COLOR[portador])
      m.emissiveIntensity = 1.4
    }
  }, [parts, portador])

  // Plano técnico: relleno oscuro y aristas en línea fina.
  useEffect(() => {
    for (const m of parts.meshes) {
      if (plano) {
        m.userData.original ??= m.material
        m.material = FILL
        if (!m.userData.edges) {
          const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 40), LINE)
          e.name = 'aristas'
          m.add(e)
          m.userData.edges = e
        }
        m.userData.edges.visible = true
      } else if (m.userData.original) {
        m.material = m.userData.original
        if (m.userData.edges) m.userData.edges.visible = false
      }
    }
  }, [parts, plano])

  useFrame((_, dt) => {
    const s = ui.get()
    tilt.current = reduced ? s.basculado : THREE.MathUtils.damp(tilt.current, s.basculado, 5, dt)
    explode.current = reduced ? s.despiece : THREE.MathUtils.damp(explode.current, s.despiece, 6, dt)
    for (const t of parts.tilts) t.rotation.z = -tilt.current * (Math.PI / 2)
    for (const sp of parts.spins) {
      // Rotores de sustentación: se detienen en crucero. Hélice de empuje: arranca al avanzar.
      const on = running && (sp.kind === 'lift' ? tilt.current < 0.8 : sp.kind === 'pusher' ? tilt.current > 0.2 : true)
      if (on) sp.node.rotation.y += dt * 24 * sp.dir
    }
    for (const g of parts.groups) g.node.position.copy(g.base).addScaledVector(g.offset, explode.current)
    for (const h of parts.hotspots) {
      h.node.getWorldPosition(v)
      v.project(camera)
      const o = hotspotScreen[h.id]
      o.visible = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05
      o.x = (v.x * 0.5 + 0.5) * size.width
      o.y = (-v.y * 0.5 + 0.5) * size.height
    }
  })

  return <primitive object={scene} />
}

if (EXT !== 'json')
  for (const c of ['multicoptero', 'sustentacion_crucero', 'rotores_basculantes'] as const) useGLTF.preload(modelUrl(c), false, true)
