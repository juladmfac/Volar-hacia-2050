import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { useState, type ComponentType } from 'react'
import * as THREE from 'three'
import Effects from './Effects.tsx'
import SafeBoundary from './SafeBoundary.tsx'
import StudioEnvironment from './StudioEnvironment.tsx'
import { ui, useUI, type SceneId } from '../store.ts'
import { LIGHT_PROFILE } from './webgl.ts'

export interface StageScene {
  id: SceneId
  Component: ComponentType<{ active: boolean }>
}

// Un único <Canvas> fijo detrás del scroll. Cada escena 3D se monta siempre
// y se oculta cuando no está activa, para que el cambio de escena sea inmediato.
// En celulares arranca en calidad baja (resolución 1x, sin AO ni SMAA); en el resto,
// si el rendimiento cae, baja la resolución y el postprocesado. Si el navegador pierde
// el contexto WebGL (falta de memoria), se pasa a la versión de texto.
export default function StageCanvas({ scenes }: { scenes: StageScene[] }) {
  const active = useUI((s) => s.activeScene)
  const [low, setLow] = useState(LIGHT_PROFILE)
  // Al explorar el hangar, el canvas pasa adelante del texto para recibir los gestos.
  const explorar = useUI((s) => s.explorar)
  return (
    <div className={`fixed inset-0 ${explorar ? 'z-20' : 'z-0'}`} aria-hidden={!explorar}>
      <Canvas
        dpr={low ? 1 : [1, 1.75]}
        gl={{ antialias: false, toneMapping: THREE.NoToneMapping, powerPreference: 'high-performance' }}
        camera={{ fov: 42, near: 0.5, far: 4000, position: [0, 3, 40] }}
        onCreated={({ gl }) =>
          gl.domElement.addEventListener('webglcontextlost', () => ui.set({ webgl: false, explorar: false }), { once: true })
        }
      >
        <PerformanceMonitor onDecline={() => setLow(true)} flipflops={2} onFallback={() => setLow(true)} />
        <StudioEnvironment />
        {scenes.map(({ id, Component }) => (
          <SafeBoundary key={id}>
            <Component active={active === id} />
          </SafeBoundary>
        ))}
        <SafeBoundary>
          <Effects low={low} ao={active === 's4'} />
        </SafeBoundary>
      </Canvas>
    </div>
  )
}
