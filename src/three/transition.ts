import { enter, type SceneId } from '../store.ts'

const ORDER: SceneId[] = ['s1', 's2', 's3', 's4', 's5', 's6']
const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const ease = (x: number) => x * x * (3 - 2 * x)

// Estado de transición de una escena:
// - fog: 0 = nítida, 1 = disuelta del todo (en el cambio de escena las dos están en 1).
// - arriving: 1 al empezar a entrar, 0 cuando ya quedó fija (para acercar la cámara).
// - leaving: 0 mientras está fija, 1 al terminar de irse.
export function transitionState(id: SceneId) {
  const i = ORDER.indexOf(id)
  const next = ORDER[i + 1]
  const e = i > 0 ? enter[id] : 1
  const l = next ? enter[next] : 0
  const closing = ease(clamp01(l / 0.5))
  const opening = i > 0 ? 1 - ease(clamp01((e - 0.5) / 0.5)) : 0
  return { fog: Math.max(closing, opening), arriving: 1 - ease(e), leaving: ease(l) }
}
