// Marca de texto conceptual en borrador (ver "Cómo leer").
export default function DraftTag({ className = '' }: { className?: string }) {
  return <p className={`eyebrow normal-case! tracking-[0.06em]! ${className}`}>✎ texto conceptual en revisión</p>
}
