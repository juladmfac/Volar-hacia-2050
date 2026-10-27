import { TEXTOS_EN_REVISION } from '../content/es-AR.ts'

// Marca de texto conceptual en revisión (ver "Cómo leer"). Se apaga con TEXTOS_EN_REVISION.
export default function DraftTag({ className = '' }: { className?: string }) {
  if (!TEXTOS_EN_REVISION) return null
  return <p className={`eyebrow normal-case! tracking-[0.06em]! ${className}`}>✎ texto conceptual en revisión</p>
}
