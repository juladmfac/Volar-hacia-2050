import { useEffect } from 'react'
import type { ComponentType } from 'react'
import { MotionConfig } from 'motion/react'
import StageCanvas, { type StageScene } from './three/StageCanvas.tsx'
import ReadingLegend from './components/ReadingLegend.tsx'
import Header from './components/Header.tsx'
import SceneSection from './scroll/SceneSection.tsx'
import Transitions from './scroll/Transitions.tsx'
import Closing from './components/Closing.tsx'
import ReviewPanel from './components/ReviewPanel.tsx'
import { hasWebGL } from './three/webgl.ts'
import SafeBoundary from './three/SafeBoundary.tsx'
import { setupMotionPreference } from './scroll/smoothScroll.ts'
import { ui, useUI } from './store.ts'
import Scene1 from './scenes/s1/Scene1.tsx'
import Overlay1 from './scenes/s1/Overlay1.tsx'
import Scene2 from './scenes/s2/Scene2.tsx'
import Overlay2 from './scenes/s2/Overlay2.tsx'
import Scene3 from './scenes/s3/Scene3.tsx'
import Overlay3 from './scenes/s3/Overlay3.tsx'
import Scene4 from './scenes/s4/Scene4.tsx'
import Overlay4 from './scenes/s4/Overlay4.tsx'
import Scene5 from './scenes/s5/Scene5.tsx'
import Overlay5 from './scenes/s5/Overlay5.tsx'
import Scene6 from './scenes/s6/Scene6.tsx'
import Overlay6 from './scenes/s6/Overlay6.tsx'

const SCENES: (StageScene & { label: string; heightVh: number; Overlay: ComponentType })[] = [
  { id: 's1', label: 'Escena 1: el carril de arriba', heightVh: 400, Component: Scene1, Overlay: Overlay1 },
  { id: 's2', label: 'Escena 2: SAF y portadores de energía', heightVh: 950, Component: Scene2, Overlay: Overlay2 },
  { id: 's3', label: 'Escena 3: el filtro de las 4 fuerzas', heightVh: 1000, Component: Scene3, Overlay: Overlay3 },
  { id: 's4', label: 'Escena 4: el hangar', heightVh: 500, Component: Scene4, Overlay: Overlay4 },
  { id: 's5', label: 'Escena 5: propulsión', heightVh: 1100, Component: Scene5, Overlay: Overlay5 },
  { id: 's6', label: 'Escena 6: ciudad y aeródromo', heightVh: 1200, Component: Scene6, Overlay: Overlay6 },
]

const REVIEW = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('revision') === '1'

export default function App() {
  const webgl = useUI((s) => s.webgl)

  useEffect(() => {
    if (!hasWebGL()) ui.set({ webgl: false })
  }, [])

  useEffect(() => setupMotionPreference(), [])

  return (
    <MotionConfig reducedMotion="user">
      {webgl && (
        <SafeBoundary onError={() => ui.set({ webgl: false, explorar: false })}>
          <StageCanvas scenes={SCENES} />
        </SafeBoundary>
      )}
      <Transitions sceneIds={SCENES.map((s) => s.id)} />
      <Header />
      <ReadingLegend />
      <main className="relative z-10">
        {!webgl && (
          <p className="mx-auto max-w-xl p-4 text-sm text-tenue">
            El 3D no está disponible en este navegador o dispositivo: se muestra la versión de texto, sin animaciones.
          </p>
        )}
        {SCENES.map(({ id, label, heightVh, Overlay }) => (
          <SceneSection key={id} id={id} label={label} heightVh={heightVh}>
            <Overlay />
          </SceneSection>
        ))}
        <Closing />
      </main>
      {REVIEW && <ReviewPanel />}
    </MotionConfig>
  )
}
